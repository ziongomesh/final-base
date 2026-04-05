import { useCallback, useRef, useEffect, useState } from 'react';
import { speakAndTrack, stopCurrentAudio } from '@/lib/tts-service';

// Audio explanations for each CNH form field
const CNH_FIELD_AUDIO: Record<string, string> = {
  cpf: 'O CPF é o Cadastro de Pessoa Física. Digite os 11 números do CPF do titular. É o campo principal para identificar o documento.',
  nome: 'Aqui você coloca o nome completo do titular, exatamente como deve aparecer na CNH. Use letras maiúsculas.',
  uf: 'Esse é o UF de emissão, ou seja, o estado onde a CNH foi emitida. Ao selecionar, o sistema preenche automaticamente o nome por extenso e a capital.',
  sexo: 'Selecione o gênero: masculino ou feminino, conforme consta no documento.',
  nacionalidade: 'A nacionalidade do titular. Na maioria dos casos será Brasileira.',
  dataNascimentoData: 'A data de nascimento é muito importante. Fique atento: para pessoas com menos de 50 anos, a CNH tem validade de 10 anos. Para maiores de 50 anos, a validade é de apenas 5 anos. Essa é uma regra do DETRAN.',
  localNascimento: 'Informe a cidade de nascimento do titular.',
  ufNascimento: 'O estado de nascimento, pode ser diferente do UF de emissão.',
  numeroRegistro: 'O número de registro é um código único de 11 dígitos que identifica a CNH. Você pode usar o botão Gerar para criar um automaticamente.',
  espelho: 'O número do espelho é o código impresso fisicamente na CNH. Também pode ser gerado automaticamente.',
  codigoSeguranca: 'O código de segurança é uma sequência usada para validação. Clique em Gerar para criar um.',
  renach: 'O RENACH é o Registro Nacional de Carteira de Habilitação. É um código de identificação do processo. Use o botão Gerar.',
  categoria: 'A categoria da habilitação: A para motos, B para carros, AB para ambos, e assim por diante.',
  dataEmissao: 'A data em que a CNH foi emitida.',
  dataValidade: 'A data de validade. Lembre-se: menos de 50 anos é 10 anos de validade, mais de 50 anos é 5 anos.',
  docIdentidade: 'O número do RG do titular. Pode ser gerado automaticamente com base no estado.',
  hab: 'A data da primeira habilitação do titular.',
  foto: 'Faça upload da foto 3x4 do titular. Você também pode escolher da galeria de imagens.',
  obs: 'Observações opcionais, como restrições médicas ou informações complementares. Campo não obrigatório.',
  mae: 'Nome da mãe do titular. Campo opcional.',
  pai: 'Nome do pai do titular. Campo opcional.',
};

// Intro audio for the CNH demo mode
const CNH_DEMO_INTRO = `Bem-vindo ao módulo CNH Digital. Aqui você vai criar uma Carteira Nacional de Habilitação. Vou te explicar cada campo conforme você for preenchendo. Comece pelo CPF do titular. Você também pode usar o botão Gerar para preencher automaticamente alguns campos numéricos. O preview ao vivo aparece ao lado, e tudo que você preenche é visualizado em tempo real.`;

export function useTutorialAudio(isDemoMode: boolean) {
  const [audioActive, setAudioActive] = useState(isDemoMode);
  const lastSpokenField = useRef<string>('');
  const hasPlayedIntro = useRef(false);

  // Play intro once in demo mode
  useEffect(() => {
    if (isDemoMode && !hasPlayedIntro.current && audioActive) {
      hasPlayedIntro.current = true;
      setTimeout(() => {
        speakAndTrack(CNH_DEMO_INTRO, 'k3f7zOv6LF88v78QHCNh');
      }, 1000);
      }, 1000);
    }
    return () => {
      stopCurrentAudio();
    };
  }, [isDemoMode, audioActive]);

  const speakField = useCallback((fieldName: string) => {
    if (!audioActive) return;
    if (lastSpokenField.current === fieldName) return;
    lastSpokenField.current = fieldName;
    
    const text = CNH_FIELD_AUDIO[fieldName];
    if (text) {
      speakAndTrack(text, 'k3f7zOv6LF88v78QHCNh');
    }
  }, [audioActive]);

  const toggleAudio = useCallback(() => {
    setAudioActive(prev => {
      if (prev) stopCurrentAudio();
      return !prev;
    });
  }, []);

  return { audioActive, speakField, toggleAudio };
}
