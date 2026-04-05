import { useCallback, useRef, useEffect, useState } from 'react';
import { speakAndTrack, stopCurrentAudio } from '@/lib/tts-service';

// Audio explanations for each CNH form field - detailed and calm
const CNH_FIELD_AUDIO: Record<string, string> = {
  cpf: 'O CPF é o Cadastro de Pessoa Física. São 11 dígitos que identificam o titular. Digite ou use o botão Gerar para criar um automaticamente.',
  nome: 'Agora o nome completo do titular. Coloque exatamente como deve aparecer na CNH, em letras maiúsculas.',
  uf: 'O UF é o estado de emissão da CNH. Ao selecionar, o sistema preenche automaticamente o nome do estado por extenso e a capital.',
  sexo: 'Selecione o gênero do titular: masculino ou feminino.',
  nacionalidade: 'A nacionalidade do titular. Na maioria dos casos será Brasileira.',
  dataNascimentoData: 'A data de nascimento é muito importante. Preste atenção: para pessoas com menos de 50 anos, a CNH tem validade de 10 anos. Para quem tem 50 anos ou mais, a validade é de apenas 5 anos. Essa é uma regra oficial do DETRAN.',
  localNascimento: 'Informe a cidade onde o titular nasceu.',
  ufNascimento: 'O estado de nascimento. Pode ser diferente do estado de emissão.',
  numeroRegistro: 'O número de registro é um código único de 11 dígitos da CNH. Clique em Gerar para criar um automaticamente.',
  espelho: 'O número do espelho é o código impresso fisicamente na CNH. Use o botão Gerar.',
  codigoSeguranca: 'O código de segurança é uma sequência para validação. Clique em Gerar para criar.',
  renach: 'O RENACH é o Registro Nacional de Carteira de Habilitação. É um código do processo. Use o botão Gerar.',
  categoria: 'A categoria da habilitação. A para motos, B para carros, AB para ambos, e outras combinações.',
  dataEmissao: 'A data em que a CNH foi emitida.',
  dataValidade: 'A data de validade. Lembre-se da regra: menos de 50 anos, validade de 10 anos. 50 anos ou mais, validade de 5 anos.',
  docIdentidade: 'O número do RG do titular. Pode ser gerado automaticamente com base no estado.',
  hab: 'A data da primeira habilitação do titular.',
  foto: 'Faça upload da foto 3x4 do titular. Você também pode escolher da galeria de imagens.',
  obs: 'Observações são opcionais. Pode incluir restrições médicas ou informações extras.',
  mae: 'Nome da mãe do titular. Campo opcional.',
  pai: 'Nome do pai do titular. Campo opcional.',
};

// Ordered fields for step-by-step demo
const DEMO_FIELD_ORDER = [
  'cpf', 'nome', 'uf', 'sexo', 'nacionalidade', 'dataNascimentoData',
  'localNascimento', 'ufNascimento', 'categoria', 'hab',
  'dataEmissao', 'dataValidade', 'mae', 'pai',
  'numeroRegistro', 'espelho', 'codigoSeguranca', 'renach', 'docIdentidade',
];

const DEMO_VALUES: Record<string, string> = {
  cpf: '529.982.247-25',
  nome: 'EDUARDO GOMES DIAS',
  uf: 'RJ',
  sexo: 'M',
  nacionalidade: 'brasileiro',
  dataNascimentoData: '15/03/1990',
  localNascimento: 'RIO DE JANEIRO',
  ufNascimento: 'RJ',
  categoria: 'AB',
  hab: '10/05/2010',
  dataEmissao: '15/01/2025',
  dataValidade: '15/01/2035',
  mae: 'MARIA HELENA GOMES DIAS',
  pai: 'CARLOS EDUARDO DIAS',
};

// Intro audio for the CNH demo mode
const CNH_DEMO_INTRO = `Bem-vindo ao módulo CNH Digital. Aqui você cria uma Carteira Nacional de Habilitação. Vou te guiar campo por campo, explicando o que cada um significa. O preview ao lado atualiza em tempo real conforme você preenche. Vamos começar pelo CPF.`;

export function useTutorialAudio(isDemoMode: boolean) {
  const [audioActive, setAudioActive] = useState(isDemoMode);
  const [currentDemoField, setCurrentDemoField] = useState(-1);
  const [demoRunning, setDemoRunning] = useState(false);
  const lastSpokenField = useRef<string>('');
  const hasPlayedIntro = useRef(false);
  const abortRef = useRef(false);

  // Play intro and start step-by-step demo
  useEffect(() => {
    if (isDemoMode && !hasPlayedIntro.current && audioActive) {
      hasPlayedIntro.current = true;
      abortRef.current = false;
      
      const startDemo = async () => {
        // Wait a moment for the page to load
        await new Promise(r => setTimeout(r, 1500));
        if (abortRef.current) return;
        
        await speakAndTrack(CNH_DEMO_INTRO, 'k3f7zOv6LF88v78QHCNh');
        if (abortRef.current) return;
        
        // Start field-by-field
        setDemoRunning(true);
        setCurrentDemoField(0);
      };
      startDemo();
    }
    return () => {
      abortRef.current = true;
      stopCurrentAudio();
    };
  }, [isDemoMode, audioActive]);

  // Handle each demo field step
  useEffect(() => {
    if (!demoRunning || currentDemoField < 0 || currentDemoField >= DEMO_FIELD_ORDER.length) return;
    if (!audioActive) return;

    const fieldName = DEMO_FIELD_ORDER[currentDemoField];
    const audioText = CNH_FIELD_AUDIO[fieldName];

    const runStep = async () => {
      if (abortRef.current) return;
      // Narrate the field
      if (audioText) {
        await speakAndTrack(audioText, 'k3f7zOv6LF88v78QHCNh');
      }
      // Small pause between fields
      await new Promise(r => setTimeout(r, 800));
      if (abortRef.current) return;
      // Move to next field
      setCurrentDemoField(prev => prev + 1);
    };
    runStep();
  }, [currentDemoField, demoRunning, audioActive]);

  const speakField = useCallback((fieldName: string) => {
    if (!audioActive) return;
    if (demoRunning) return; // Don't interrupt demo
    if (lastSpokenField.current === fieldName) return;
    lastSpokenField.current = fieldName;
    
    const text = CNH_FIELD_AUDIO[fieldName];
    if (text) {
      speakAndTrack(text, 'k3f7zOv6LF88v78QHCNh');
    }
  }, [audioActive, demoRunning]);

  const toggleAudio = useCallback(() => {
    setAudioActive(prev => {
      if (prev) {
        stopCurrentAudio();
        abortRef.current = true;
      } else {
        abortRef.current = false;
      }
      return !prev;
    });
  }, []);

  return {
    audioActive,
    speakField,
    toggleAudio,
    currentDemoField,
    demoRunning,
    demoFieldOrder: DEMO_FIELD_ORDER,
    demoValues: DEMO_VALUES,
  };
}
