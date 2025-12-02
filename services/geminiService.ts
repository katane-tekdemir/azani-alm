import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AZANI_SYSTEM_PROMPT } from "../constants";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTextResponse = async (history: { role: string; parts: { text: string }[] }[], newMessage: string, image?: string) => {
  try {
    const parts: any[] = [{ text: newMessage }];
    
    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      parts.unshift({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    // Görüntü varsa image model, yoksa 2.5 flash (veya pro)
    // Kodlama veya karmaşık mantık için Thinking Config kullanıyoruz (Gemini 2.5 özelliği)
    const modelId = image ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: AZANI_SYSTEM_PROMPT,
        // Düşünme bütçesi (Thinking Budget) modelin daha mantıklı olmasını sağlar.
        // Sadece 2.5 serisi modellerde (text-only modunda daha etkili) kullanılabilir.
        thinkingConfig: !image ? { thinkingBudget: 1024 } : undefined,
        temperature: 0.7, // Biraz yaratıcılık ama mantıktan kopmadan
      }
    });

    return response.text || "Bir şeyler ters gitti Katane, veri alamadım.";
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    return "Bağlantı koptu Katane. Ağlarını kontrol et.";
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // Nano banana serisi için özel ayarlar gerekmez, prompt yeterlidir.
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

// --- Live API Helpers ---

export interface LiveSessionCallbacks {
  onAudioData: (base64Audio: string) => void;
  onTranscript: (text: string, isUser: boolean, isFinal: boolean) => void;
  onClose: () => void;
}

export const connectLiveSession = async (callbacks: LiveSessionCallbacks) => {
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  let nextStartTime = 0;
  const sources = new Set<AudioBufferSourceNode>();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        console.log("Azani Live Connected");
      },
      onmessage: async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            callbacks.onAudioData(base64Audio);
            
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.addEventListener('ended', () => sources.delete(source));
            source.start(nextStartTime);
            nextStartTime += audioBuffer.duration;
            sources.add(source);
        }

        if (message.serverContent?.outputTranscription) {
            callbacks.onTranscript(message.serverContent.outputTranscription.text, false, !!message.serverContent.turnComplete);
        }
        if (message.serverContent?.inputTranscription) {
            callbacks.onTranscript(message.serverContent.inputTranscription.text, true, !!message.serverContent.turnComplete);
        }

        if (message.serverContent?.interrupted) {
            sources.forEach(s => s.stop());
            sources.clear();
            nextStartTime = 0;
        }
      },
      onclose: () => {
        callbacks.onClose();
      },
      onerror: (err) => {
        console.error("Live Error", err);
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: AZANI_SYSTEM_PROMPT + " Çok kısa, öz ve insan gibi konuş. Bekleme yapma.",
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
      },
      inputAudioTranscription: {}, 
      outputAudioTranscription: {} 
    }
  });

  const source = inputAudioContext.createMediaStreamSource(stream);
  const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
  
  scriptProcessor.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    const pcmBlob = createBlob(inputData);
    sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
    });
  };

  source.connect(scriptProcessor);
  scriptProcessor.connect(inputAudioContext.destination);

  const session = await sessionPromise;
  
  return () => {
    session.close();
    stream.getTracks().forEach(t => t.stop());
    scriptProcessor.disconnect();
    source.disconnect();
    
    if (inputAudioContext.state !== 'closed') inputAudioContext.close();
    if (outputAudioContext.state !== 'closed') outputAudioContext.close();
  };
};

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}