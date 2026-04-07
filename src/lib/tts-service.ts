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

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Play welcome message on login
export async function playWelcomeAudio(userName: string): Promise<null> {
  const firstName = userName.split(' ')[0];
  const greeting = getTimeGreeting();
  const variations = [
    `${greeting}, ${firstName}! Bem-vindo de volta à base. Bom trabalho!`,
    `E aí ${firstName}! ${greeting}. Tudo certo por aí? Vamos trabalhar!`,
    `Opa ${firstName}! ${greeting}. Que bom te ver de volta!`,
    `${greeting}, ${firstName}! A base tava te esperando, chefe!`,
    `Fala ${firstName}! ${greeting}. Mais um dia de produção, bora!`,
    `${greeting} ${firstName}! Bem-vindo, parceiro. Vamos nessa!`,
    `Salve ${firstName}! ${greeting}. Pronto pra mais uma?`,
  ];
  return speakText(pickRandom(variations));
}

// Play goodbye message on logout
export async function playGoodbyeAudio(userName: string): Promise<null> {
  const firstName = userName.split(' ')[0];
  const variations = [
    `Até mais, ${firstName}! Volte sempre, chefe!`,
    `Falou ${firstName}! Até a próxima, parceiro!`,
    `Valeu ${firstName}! Descansa que você merece!`,
    `Até logo, ${firstName}! Foi bom te ver por aqui!`,
    `Tchau ${firstName}! Bom descanso e até breve!`,
    `Até mais, ${firstName}! A base vai ficar te esperando!`,
    `Falou, ${firstName}! Boa sorte e até a volta!`,
  ];
  return speakText(pickRandom(variations));
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
