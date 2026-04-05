/**
 * Text-to-Speech service using browser Web Speech API (free, no API key needed)
 * Falls back gracefully if not supported
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;
let resolveCallback: (() => void) | null = null;

function getPortugueseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Prefer Brazilian Portuguese
  const ptBR = voices.find(v => v.lang === 'pt-BR');
  if (ptBR) return ptBR;
  // Fallback to any Portuguese
  const pt = voices.find(v => v.lang.startsWith('pt'));
  if (pt) return pt;
  // Fallback to first available
  return voices[0] || null;
}

// Ensure voices are loaded
function loadVoices(): Promise<void> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => resolve();
    // Timeout fallback
    setTimeout(resolve, 1000);
  });
}

export async function speakText(text: string, _voiceId?: string): Promise<null> {
  try {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return null;
    }

    await loadVoices();

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getPortugueseVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    currentUtterance = utterance;

    return new Promise((resolve) => {
      utterance.onend = () => {
        currentUtterance = null;
        resolve(null);
      };
      utterance.onerror = () => {
        currentUtterance = null;
        resolve(null);
      };
      window.speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}

// Play welcome message on login
export async function playWelcomeAudio(userName: string): Promise<null> {
  const text = `Opa ${userName}! Bem-vindo de volta à base. Bom trabalho!`;
  return speakText(text);
}

// Speak and track (waits for completion)
export async function speakAndTrack(text: string, _voiceId?: string): Promise<void> {
  stopCurrentAudio();
  await speakText(text);
}

export function stopCurrentAudio(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

// Clear TTS cache (on logout)
export function clearTTSCache(): void {
  stopCurrentAudio();
}
