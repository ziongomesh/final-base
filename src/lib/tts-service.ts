/**
 * Text-to-Speech service using ElevenLabs via edge function
 */

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
const audioCache = new Map<string, string>();

export async function speakText(text: string, voiceId?: string): Promise<HTMLAudioElement | null> {
  try {
    const cacheKey = `${text}_${voiceId || 'default'}`;
    
    let audioUrl = audioCache.get(cacheKey);
    
    if (!audioUrl) {
      const response = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        console.error("TTS failed:", response.status);
        return null;
      }

      const audioBlob = await response.blob();
      audioUrl = URL.createObjectURL(audioBlob);
      audioCache.set(cacheKey, audioUrl);
    }

    const audio = new Audio(audioUrl);
    await audio.play();
    return audio;
  } catch (error) {
    console.error("TTS error:", error);
    return null;
  }
}

// Play welcome message on login
export async function playWelcomeAudio(userName: string): Promise<HTMLAudioElement | null> {
  const text = `Opa ${userName}! Bem-vindo de volta à base. Bom trabalho!`;
  return speakText(text, 'k3f7zOv6LF88v78QHCNh');
}

// Stop any playing audio
let currentAudio: HTMLAudioElement | null = null;

export async function speakAndTrack(text: string, voiceId?: string): Promise<void> {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = await speakText(text, voiceId);
}

export function stopCurrentAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// Clear TTS cache (on logout)
export function clearTTSCache(): void {
  audioCache.forEach((url) => URL.revokeObjectURL(url));
  audioCache.clear();
  stopCurrentAudio();
}
