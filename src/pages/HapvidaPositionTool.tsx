import { useEffect, useRef, useState, useCallback } from 'react';
import { loadWatermarkLogo, drawLogoWatermarks } from '@/lib/watermark-utils';
import { getUnidadesPorUF, UF_LABELS, UFS_DISPONIVEIS } from '@/lib/hapvida-unidades';
import logoHapvida from '@/assets/logo-hapvida.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Lista CID-10 — mais de 300 códigos mais usados em atestados médicos
const CID_LIST: { codigo: string; descricao: string }[] = [
  // ── INFECCIOSAS E PARASITÁRIAS ────────────────────────────────────────────
  { codigo: 'A00.0', descricao: 'Cólera pelo Vibrio cholerae biotipo clássico' },
  { codigo: 'A01.0', descricao: 'Febre tifoide' },
  { codigo: 'A02.0', descricao: 'Enterite por Salmonella' },
  { codigo: 'A04.9', descricao: 'Infecção intestinal bacteriana não especificada' },
  { codigo: 'A06.9', descricao: 'Amebíase não especificada' },
  { codigo: 'A09', descricao: 'Diarreia e gastroenterite de origem infecciosa presumível' },
  { codigo: 'A15.0', descricao: 'Tuberculose do pulmão confirmada por baciloscopia' },
  { codigo: 'A37.9', descricao: 'Coqueluche não especificada' },
  { codigo: 'A39.9', descricao: 'Meningococemia não especificada' },
  { codigo: 'A40.9', descricao: 'Septicemia estreptocócica não especificada' },
  { codigo: 'A41.9', descricao: 'Septicemia não especificada' },
  { codigo: 'A46', descricao: 'Erisipela' },
  { codigo: 'A49.9', descricao: 'Infecção bacteriana não especificada' },
  { codigo: 'A63.0', descricao: 'Condiloma acuminado (HPV)' },
  { codigo: 'A90', descricao: 'Dengue (dengue clássica)' },
  { codigo: 'A91', descricao: 'Febre hemorrágica pelo vírus do dengue' },
  { codigo: 'B00.1', descricao: 'Herpes simples - dermatite herpética' },
  { codigo: 'B00.9', descricao: 'Infecção pelo vírus herpes simples não especificada' },
  { codigo: 'B01.9', descricao: 'Varicela sem complicações (catapora)' },
  { codigo: 'B02.9', descricao: 'Herpes zoster sem complicações (cobreiro)' },
  { codigo: 'B05.9', descricao: 'Sarampo sem complicações' },
  { codigo: 'B06.9', descricao: 'Rubéola sem complicações' },
  { codigo: 'B08.1', descricao: 'Molusco contagioso' },
  { codigo: 'B15.9', descricao: 'Hepatite A sem coma hepático' },
  { codigo: 'B16.9', descricao: 'Hepatite B aguda sem agente Delta' },
  { codigo: 'B18.1', descricao: 'Hepatite B crônica sem agente Delta' },
  { codigo: 'B19.9', descricao: 'Hepatite viral não especificada' },
  { codigo: 'B34.9', descricao: 'Infecção viral não especificada' },
  { codigo: 'B35.1', descricao: 'Tinha da cabeça (tinea capitis)' },
  { codigo: 'B35.3', descricao: 'Tinha do corpo (tinea corporis)' },
  { codigo: 'B35.4', descricao: 'Tinha dos pés (frieira - tinea pedis)' },
  { codigo: 'B35.6', descricao: 'Tinha inguinal (tinea cruris)' },
  { codigo: 'B36.0', descricao: 'Pitiríase versicolor' },
  { codigo: 'B37.0', descricao: 'Candidíase oral (sapinho)' },
  { codigo: 'B37.3', descricao: 'Candidíase vulvovaginal' },
  { codigo: 'B37.9', descricao: 'Candidíase não especificada' },
  { codigo: 'B49', descricao: 'Micose não especificada' },
  { codigo: 'B54', descricao: 'Malária não especificada' },
  { codigo: 'B76.9', descricao: 'Ancilostomíase não especificada (verme)' },
  { codigo: 'B80', descricao: 'Oxiuríase (oxiúros / verme)' },
  { codigo: 'B82.9', descricao: 'Parasitose intestinal não especificada (verminose)' },
  { codigo: 'B99', descricao: 'Doenças infecciosas não especificadas' },
  // ── NEOPLASIAS ───────────────────────────────────────────────────────────
  { codigo: 'C16.9', descricao: 'Neoplasia maligna do estômago não especificada' },
  { codigo: 'C18.9', descricao: 'Neoplasia maligna do cólon não especificada' },
  { codigo: 'C20', descricao: 'Neoplasia maligna do reto' },
  { codigo: 'C34.9', descricao: 'Neoplasia maligna do pulmão não especificada' },
  { codigo: 'C44.9', descricao: 'Neoplasia maligna de pele não especificada' },
  { codigo: 'C50.9', descricao: 'Neoplasia maligna da mama não especificada' },
  { codigo: 'C53.9', descricao: 'Neoplasia maligna do colo do útero não especificada' },
  { codigo: 'C61', descricao: 'Neoplasia maligna da próstata' },
  { codigo: 'C64', descricao: 'Neoplasia maligna do rim' },
  { codigo: 'C80', descricao: 'Neoplasia maligna de localização não especificada' },
  { codigo: 'D25.9', descricao: 'Leiomioma do útero não especificado (mioma)' },
  { codigo: 'D50.9', descricao: 'Anemia por deficiência de ferro não especificada' },
  { codigo: 'D64.9', descricao: 'Anemia não especificada' },
  // ── ENDÓCRINAS E METABÓLICAS ─────────────────────────────────────────────
  { codigo: 'E03.9', descricao: 'Hipotireoidismo não especificado' },
  { codigo: 'E05.9', descricao: 'Hipertireoidismo (tireotoxicose) não especificada' },
  { codigo: 'E10.9', descricao: 'Diabetes mellitus tipo 1 sem complicações' },
  { codigo: 'E11.2', descricao: 'Diabetes mellitus tipo 2 com complicações renais' },
  { codigo: 'E11.5', descricao: 'Diabetes mellitus tipo 2 com complicações circulatórias' },
  { codigo: 'E11.9', descricao: 'Diabetes mellitus tipo 2 sem complicações' },
  { codigo: 'E14.9', descricao: 'Diabetes mellitus não especificado sem complicações' },
  { codigo: 'E16.0', descricao: 'Hipoglicemia induzida por insulina sem coma' },
  { codigo: 'E46', descricao: 'Desnutrição não especificada' },
  { codigo: 'E55.9', descricao: 'Deficiência de vitamina D não especificada' },
  { codigo: 'E56.9', descricao: 'Deficiência vitamínica não especificada' },
  { codigo: 'E66.9', descricao: 'Obesidade não especificada' },
  { codigo: 'E78.0', descricao: 'Hipercolesterolemia pura (colesterol alto)' },
  { codigo: 'E78.1', descricao: 'Hipertrigliceridemia pura (triglicérides alto)' },
  { codigo: 'E78.5', descricao: 'Hiperlipidemia mista (colesterol e triglicérides)' },
  // ── SAÚDE MENTAL ─────────────────────────────────────────────────────────
  { codigo: 'F10.1', descricao: 'Uso nocivo de álcool' },
  { codigo: 'F10.2', descricao: 'Síndrome de dependência ao álcool' },
  { codigo: 'F17.1', descricao: 'Uso nocivo de tabaco' },
  { codigo: 'F20.9', descricao: 'Esquizofrenia não especificada' },
  { codigo: 'F31.9', descricao: 'Transtorno afetivo bipolar não especificado' },
  { codigo: 'F32.0', descricao: 'Episódio depressivo leve' },
  { codigo: 'F32.1', descricao: 'Episódio depressivo moderado' },
  { codigo: 'F32.2', descricao: 'Episódio depressivo grave sem sintomas psicóticos' },
  { codigo: 'F32.9', descricao: 'Episódio depressivo não especificado' },
  { codigo: 'F33.0', descricao: 'Transtorno depressivo recorrente episódio atual leve' },
  { codigo: 'F33.1', descricao: 'Transtorno depressivo recorrente episódio atual moderado' },
  { codigo: 'F33.9', descricao: 'Transtorno depressivo recorrente não especificado' },
  { codigo: 'F40.1', descricao: 'Fobias sociais' },
  { codigo: 'F41.0', descricao: 'Transtorno do pânico (síndrome do pânico)' },
  { codigo: 'F41.1', descricao: 'Transtorno de ansiedade generalizada' },
  { codigo: 'F41.2', descricao: 'Transtorno misto ansioso e depressivo' },
  { codigo: 'F41.9', descricao: 'Transtorno de ansiedade não especificado' },
  { codigo: 'F43.1', descricao: 'Estado de estresse pós-traumático (PTSD)' },
  { codigo: 'F43.2', descricao: 'Transtorno de adaptação' },
  { codigo: 'F48.0', descricao: 'Neurastenia (esgotamento nervoso / burnout)' },
  { codigo: 'F51.0', descricao: 'Insônia não orgânica' },
  { codigo: 'F90.0', descricao: 'Distúrbio da atividade e da atenção (TDAH)' },
  // ── NEUROLÓGICAS ─────────────────────────────────────────────────────────
  { codigo: 'G20', descricao: 'Doença de Parkinson' },
  { codigo: 'G30.9', descricao: 'Doença de Alzheimer não especificada' },
  { codigo: 'G35', descricao: 'Esclerose múltipla' },
  { codigo: 'G40.9', descricao: 'Epilepsia não especificada' },
  { codigo: 'G43.0', descricao: 'Enxaqueca sem aura (enxaqueca comum)' },
  { codigo: 'G43.1', descricao: 'Enxaqueca com aura (enxaqueca clássica)' },
  { codigo: 'G43.9', descricao: 'Enxaqueca não especificada (dor de cabeça)' },
  { codigo: 'G44.0', descricao: 'Cefaleia em salvas (dor de cabeça em salvas)' },
  { codigo: 'G44.2', descricao: 'Cefaleia tensional (dor de cabeça tensional)' },
  { codigo: 'G44.3', descricao: 'Cefaleia crônica pós-traumática' },
  { codigo: 'G44.9', descricao: 'Cefaleia não especificada (dor de cabeça)' },
  { codigo: 'G45.9', descricao: 'Acidente isquêmico transitório não especificado (AIT)' },
  { codigo: 'G47.0', descricao: 'Insônia - distúrbio do início e manutenção do sono' },
  { codigo: 'G47.3', descricao: 'Apneia do sono' },
  { codigo: 'G51.0', descricao: 'Paralisia de Bell (paralisia facial periférica)' },
  { codigo: 'G54.2', descricao: 'Transtornos da raiz lombar não classificados em outro local' },
  { codigo: 'G56.0', descricao: 'Síndrome do túnel do carpo' },
  { codigo: 'G57.0', descricao: 'Lesão do nervo ciático' },
  { codigo: 'G62.9', descricao: 'Polineuropatia não especificada' },
  { codigo: 'G63.2', descricao: 'Polineuropatia diabética' },
  // ── OLHOS ────────────────────────────────────────────────────────────────
  { codigo: 'H10.0', descricao: 'Conjuntivite mucopurulenta' },
  { codigo: 'H10.1', descricao: 'Conjuntivite atópica aguda' },
  { codigo: 'H10.9', descricao: 'Conjuntivite não especificada' },
  { codigo: 'H16.9', descricao: 'Ceratite não especificada' },
  { codigo: 'H26.9', descricao: 'Catarata não especificada' },
  { codigo: 'H40.9', descricao: 'Glaucoma não especificado' },
  { codigo: 'H52.1', descricao: 'Miopia' },
  { codigo: 'H52.4', descricao: 'Presbiopia (vista cansada)' },
  // ── OUVIDOS ──────────────────────────────────────────────────────────────
  { codigo: 'H60.9', descricao: 'Otite externa não especificada' },
  { codigo: 'H65.9', descricao: 'Otite média não supurativa não especificada' },
  { codigo: 'H66.9', descricao: 'Otite média supurativa não especificada' },
  { codigo: 'H72.9', descricao: 'Perfuração da membrana do tímpano não especificada' },
  { codigo: 'H81.0', descricao: 'Doença de Ménière' },
  { codigo: 'H81.1', descricao: 'Vertigem paroxística benigna (tontura)' },
  { codigo: 'H91.9', descricao: 'Perda de audição não especificada' },
  { codigo: 'H93.1', descricao: 'Zumbido (tinido)' },
  // ── CIRCULATÓRIO ─────────────────────────────────────────────────────────
  { codigo: 'I10', descricao: 'Hipertensão essencial (pressão alta)' },
  { codigo: 'I11.0', descricao: 'Cardiopatia hipertensiva com insuficiência cardíaca' },
  { codigo: 'I11.9', descricao: 'Cardiopatia hipertensiva sem insuficiência cardíaca' },
  { codigo: 'I20.0', descricao: 'Angina instável' },
  { codigo: 'I20.9', descricao: 'Angina pectoris não especificada' },
  { codigo: 'I21.9', descricao: 'Infarto agudo do miocárdio não especificado' },
  { codigo: 'I25.9', descricao: 'Doença isquêmica crônica do coração não especificada' },
  { codigo: 'I26.9', descricao: 'Embolia pulmonar sem cor pulmonale agudo' },
  { codigo: 'I42.9', descricao: 'Cardiomiopatia não especificada' },
  { codigo: 'I47.1', descricao: 'Taquicardia supraventricular' },
  { codigo: 'I47.2', descricao: 'Taquicardia ventricular' },
  { codigo: 'I48', descricao: 'Fibrilação e flutter atrial (arritmia)' },
  { codigo: 'I49.9', descricao: 'Arritmia cardíaca não especificada' },
  { codigo: 'I50.0', descricao: 'Insuficiência cardíaca congestiva' },
  { codigo: 'I50.9', descricao: 'Insuficiência cardíaca não especificada' },
  { codigo: 'I63.9', descricao: 'AVC isquêmico - infarto cerebral não especificado' },
  { codigo: 'I64', descricao: 'Acidente vascular cerebral não especificado (AVC)' },
  { codigo: 'I73.9', descricao: 'Doença vascular periférica não especificada' },
  { codigo: 'I80.9', descricao: 'Flebite e tromboflebite não especificada' },
  { codigo: 'I83.9', descricao: 'Varizes dos membros inferiores não especificadas' },
  { codigo: 'I84.9', descricao: 'Hemorroidas não especificadas' },
  // ── RESPIRATÓRIO ─────────────────────────────────────────────────────────
  { codigo: 'J00', descricao: 'Rinofaringite aguda (resfriado comum / gripe)' },
  { codigo: 'J01.0', descricao: 'Sinusite maxilar aguda' },
  { codigo: 'J01.1', descricao: 'Sinusite frontal aguda' },
  { codigo: 'J01.9', descricao: 'Sinusite aguda não especificada' },
  { codigo: 'J02.0', descricao: 'Faringite estreptocócica' },
  { codigo: 'J02.9', descricao: 'Faringite aguda não especificada' },
  { codigo: 'J03.0', descricao: 'Amigdalite estreptocócica' },
  { codigo: 'J03.9', descricao: 'Amigdalite aguda não especificada' },
  { codigo: 'J06.9', descricao: 'Infecção aguda das vias aéreas superiores não especificada' },
  { codigo: 'J10.1', descricao: 'Influenza com manifestações respiratórias (gripe)' },
  { codigo: 'J11.1', descricao: 'Influenza com manifestações respiratórias vírus não identificado' },
  { codigo: 'J12.9', descricao: 'Pneumonia viral não especificada' },
  { codigo: 'J18.0', descricao: 'Broncopneumonia não especificada' },
  { codigo: 'J18.9', descricao: 'Pneumonia não especificada' },
  { codigo: 'J20.9', descricao: 'Bronquite aguda não especificada' },
  { codigo: 'J30.0', descricao: 'Rinite vasomotora' },
  { codigo: 'J30.1', descricao: 'Rinite alérgica por pólen' },
  { codigo: 'J30.4', descricao: 'Rinite alérgica não especificada' },
  { codigo: 'J32.0', descricao: 'Sinusite maxilar crônica' },
  { codigo: 'J32.9', descricao: 'Sinusite crônica não especificada' },
  { codigo: 'J35.0', descricao: 'Amigdalite crônica' },
  { codigo: 'J35.3', descricao: 'Hipertrofia das amígdalas com adenoides' },
  { codigo: 'J44.0', descricao: 'DPOC com infecção respiratória aguda' },
  { codigo: 'J44.1', descricao: 'DPOC com exacerbação aguda não especificada' },
  { codigo: 'J45.0', descricao: 'Asma predominantemente alérgica' },
  { codigo: 'J45.9', descricao: 'Asma não especificada' },
  { codigo: 'J46', descricao: 'Estado de mal asmático' },
  // ── DIGESTIVO ────────────────────────────────────────────────────────────
  { codigo: 'K00.6', descricao: 'Dente incluso / siso' },
  { codigo: 'K02.9', descricao: 'Cárie dentária não especificada' },
  { codigo: 'K21.0', descricao: 'Refluxo gastroesofágico com esofagite (DRGE)' },
  { codigo: 'K21.9', descricao: 'Refluxo gastroesofágico sem esofagite' },
  { codigo: 'K25.9', descricao: 'Úlcera gástrica não especificada' },
  { codigo: 'K26.9', descricao: 'Úlcera duodenal não especificada' },
  { codigo: 'K29.0', descricao: 'Gastrite aguda hemorrágica' },
  { codigo: 'K29.5', descricao: 'Gastrite crônica não especificada' },
  { codigo: 'K29.7', descricao: 'Gastrite não especificada' },
  { codigo: 'K30', descricao: 'Dispepsia (má digestão / azia / estômago)' },
  { codigo: 'K35.9', descricao: 'Apendicite aguda não especificada' },
  { codigo: 'K40.9', descricao: 'Hérnia inguinal sem obstrução nem gangrena' },
  { codigo: 'K42.9', descricao: 'Hérnia umbilical sem obstrução nem gangrena' },
  { codigo: 'K57.30', descricao: 'Doença diverticular do intestino grosso' },
  { codigo: 'K58.0', descricao: 'Síndrome do intestino irritável com diarreia' },
  { codigo: 'K58.9', descricao: 'Síndrome do intestino irritável sem diarreia' },
  { codigo: 'K59.0', descricao: 'Constipação intestinal (prisão de ventre)' },
  { codigo: 'K59.1', descricao: 'Diarreia funcional' },
  { codigo: 'K70.3', descricao: 'Cirrose hepática alcoólica' },
  { codigo: 'K74.6', descricao: 'Cirrose hepática não especificada' },
  { codigo: 'K76.0', descricao: 'Fígado gorduroso (esteatose hepática)' },
  { codigo: 'K80.2', descricao: 'Colelitíase (cálculo na vesícula) sem colecistite' },
  { codigo: 'K81.0', descricao: 'Colecistite aguda' },
  { codigo: 'K81.1', descricao: 'Colecistite crônica' },
  { codigo: 'K85.9', descricao: 'Pancreatite aguda não especificada' },
  { codigo: 'K86.1', descricao: 'Pancreatite crônica' },
  { codigo: 'K92.1', descricao: 'Melena (fezes escuras com sangue)' },
  // ── PELE ─────────────────────────────────────────────────────────────────
  { codigo: 'L01.0', descricao: 'Impetigo' },
  { codigo: 'L02.9', descricao: 'Abscesso cutâneo / furúnculo não especificado' },
  { codigo: 'L03.9', descricao: 'Celulite não especificada' },
  { codigo: 'L20.9', descricao: 'Dermatite atópica não especificada (eczema)' },
  { codigo: 'L23.9', descricao: 'Dermatite alérgica de contato não especificada' },
  { codigo: 'L29.9', descricao: 'Prurido não especificado (coceira)' },
  { codigo: 'L30.9', descricao: 'Dermatite não especificada' },
  { codigo: 'L40.9', descricao: 'Psoríase não especificada' },
  { codigo: 'L50.0', descricao: 'Urticária alérgica' },
  { codigo: 'L50.9', descricao: 'Urticária não especificada' },
  { codigo: 'L60.0', descricao: 'Unha encravada' },
  { codigo: 'L70.0', descricao: 'Acne vulgar' },
  { codigo: 'L73.9', descricao: 'Foliculite não especificada' },
  { codigo: 'L89.9', descricao: 'Úlcera de decúbito / escara não especificada' },
  // ── MÚSCULO-ESQUELÉTICO ───────────────────────────────────────────────────
  { codigo: 'M06.9', descricao: 'Artrite reumatoide não especificada' },
  { codigo: 'M10.0', descricao: 'Gota idiopática' },
  { codigo: 'M10.9', descricao: 'Gota não especificada' },
  { codigo: 'M13.9', descricao: 'Artrite não especificada' },
  { codigo: 'M17.9', descricao: 'Gonartrose não especificada (artrose do joelho)' },
  { codigo: 'M19.9', descricao: 'Artrose não especificada' },
  { codigo: 'M25.5', descricao: 'Dor articular' },
  { codigo: 'M41.9', descricao: 'Escoliose não especificada' },
  { codigo: 'M47.8', descricao: 'Outras espondiloartroses' },
  { codigo: 'M50.1', descricao: 'Transtorno de disco cervical com radiculopatia' },
  { codigo: 'M51.1', descricao: 'Hérnia de disco lombar com radiculopatia' },
  { codigo: 'M54.2', descricao: 'Cervicalgia (dor no pescoço)' },
  { codigo: 'M54.3', descricao: 'Ciática' },
  { codigo: 'M54.4', descricao: 'Lumbago com ciática' },
  { codigo: 'M54.5', descricao: 'Dor lombar baixa (lombalgia)' },
  { codigo: 'M54.6', descricao: 'Dor na coluna dorsal' },
  { codigo: 'M54.9', descricao: 'Dorsalgia não especificada (dor nas costas)' },
  { codigo: 'M62.9', descricao: 'Transtorno muscular não especificado' },
  { codigo: 'M65.9', descricao: 'Sinovite e tenossinovite não especificadas' },
  { codigo: 'M71.9', descricao: 'Bursite não especificada' },
  { codigo: 'M75.0', descricao: 'Capsulite adesiva do ombro (ombro congelado)' },
  { codigo: 'M75.1', descricao: 'Síndrome do manguito rotador' },
  { codigo: 'M77.0', descricao: 'Epicondilite medial (cotovelo de golfista)' },
  { codigo: 'M77.1', descricao: 'Epicondilite lateral (cotovelo de tenista)' },
  { codigo: 'M77.3', descricao: 'Fasciite plantar (esporão do calcanhar)' },
  { codigo: 'M79.1', descricao: 'Mialgia (dor muscular)' },
  { codigo: 'M79.3', descricao: 'Paniculite' },
  { codigo: 'M79.7', descricao: 'Fibromialgia' },
  { codigo: 'M81.9', descricao: 'Osteoporose não especificada' },
  // ── GÊNITO-URINÁRIO ───────────────────────────────────────────────────────
  { codigo: 'N10', descricao: 'Pielonefrite aguda (infecção renal)' },
  { codigo: 'N18.9', descricao: 'Insuficiência renal crônica não especificada' },
  { codigo: 'N20.0', descricao: 'Cálculo do rim (pedra no rim)' },
  { codigo: 'N20.1', descricao: 'Cálculo do ureter' },
  { codigo: 'N23', descricao: 'Cólica renal não especificada' },
  { codigo: 'N30.0', descricao: 'Cistite aguda (infecção urinária)' },
  { codigo: 'N30.1', descricao: 'Cistite intersticial crônica' },
  { codigo: 'N39.0', descricao: 'Infecção do trato urinário não especificada' },
  { codigo: 'N40', descricao: 'Hiperplasia da próstata' },
  { codigo: 'N41.0', descricao: 'Prostatite aguda' },
  { codigo: 'N41.1', descricao: 'Prostatite crônica' },
  { codigo: 'N70.9', descricao: 'Salpingite e ooforite não especificadas' },
  { codigo: 'N73.9', descricao: 'Doença inflamatória pélvica feminina (DIP)' },
  { codigo: 'N76.0', descricao: 'Vaginite aguda' },
  { codigo: 'N76.1', descricao: 'Vaginite subaguda e crônica' },
  { codigo: 'N91.2', descricao: 'Amenorreia não especificada (falta de menstruação)' },
  { codigo: 'N92.1', descricao: 'Menstruação irregular com sangramento excessivo' },
  { codigo: 'N92.6', descricao: 'Menstruação irregular não especificada' },
  { codigo: 'N93.9', descricao: 'Hemorragia uterina ou vaginal anormal não especificada' },
  { codigo: 'N94.1', descricao: 'Dispareunia (dor na relação sexual)' },
  { codigo: 'N94.3', descricao: 'Síndrome pré-menstrual (TPM)' },
  { codigo: 'N94.6', descricao: 'Dismenorreia (cólica menstrual) não especificada' },
  { codigo: 'N95.1', descricao: 'Menopausa e climatério feminino' },
  // ── GRAVIDEZ / PARTO ──────────────────────────────────────────────────────
  { codigo: 'O00.9', descricao: 'Gravidez ectópica não especificada' },
  { codigo: 'O03.9', descricao: 'Aborto espontâneo incompleto sem complicação' },
  { codigo: 'O20.0', descricao: 'Ameaça de aborto' },
  { codigo: 'O21.0', descricao: 'Hiperêmese gravídica leve (enjoo na gravidez)' },
  { codigo: 'O26.9', descricao: 'Gravidez complicada não especificada' },
  // ── SINTOMAS E SINAIS ─────────────────────────────────────────────────────
  { codigo: 'R00.0', descricao: 'Taquicardia não especificada' },
  { codigo: 'R00.1', descricao: 'Bradicardia não especificada' },
  { codigo: 'R05', descricao: 'Tosse' },
  { codigo: 'R06.0', descricao: 'Dispneia (falta de ar)' },
  { codigo: 'R06.2', descricao: 'Sibilância (chiado no peito)' },
  { codigo: 'R07.0', descricao: 'Dor de garganta' },
  { codigo: 'R07.4', descricao: 'Dor no peito não especificada' },
  { codigo: 'R10.0', descricao: 'Dor abdominal aguda' },
  { codigo: 'R10.4', descricao: 'Outras dores abdominais e as não especificadas' },
  { codigo: 'R11', descricao: 'Náusea e vômitos' },
  { codigo: 'R12', descricao: 'Pirose (azia / queimação)' },
  { codigo: 'R13', descricao: 'Disfagia (dificuldade para engolir)' },
  { codigo: 'R14', descricao: 'Flatulência e afecções correlatas (gases)' },
  { codigo: 'R19.7', descricao: 'Diarreia não especificada' },
  { codigo: 'R20.2', descricao: 'Parestesia cutânea (formigamento)' },
  { codigo: 'R25.2', descricao: 'Cãibra e espasmo muscular' },
  { codigo: 'R42', descricao: 'Tontura e vertigem' },
  { codigo: 'R50.9', descricao: 'Febre não especificada' },
  { codigo: 'R51', descricao: 'Cefaleia / dor de cabeça não especificada' },
  { codigo: 'R52.0', descricao: 'Dor aguda' },
  { codigo: 'R52.1', descricao: 'Dor crônica intratável' },
  { codigo: 'R52.9', descricao: 'Dor não especificada' },
  { codigo: 'R53', descricao: 'Mal-estar e fadiga (cansaço excessivo)' },
  { codigo: 'R55', descricao: 'Síncope e colapso (desmaio)' },
  { codigo: 'R56.8', descricao: 'Outras convulsões e não especificadas' },
  { codigo: 'R60.0', descricao: 'Edema localizado (inchaço)' },
  { codigo: 'R60.9', descricao: 'Edema não especificado' },
  { codigo: 'R63.0', descricao: 'Anorexia (falta de apetite)' },
  { codigo: 'R63.4', descricao: 'Perda de peso anormal' },
  // ── LESÕES E TRAUMATISMOS ─────────────────────────────────────────────────
  { codigo: 'S00.9', descricao: 'Traumatismo superficial da cabeça não especificado' },
  { codigo: 'S09.9', descricao: 'Traumatismo não especificado da cabeça' },
  { codigo: 'S13.4', descricao: 'Entorse do pescoço (chicotada / whiplash)' },
  { codigo: 'S20.9', descricao: 'Traumatismo superficial do tórax não especificado' },
  { codigo: 'S22.0', descricao: 'Fratura de vértebra torácica' },
  { codigo: 'S30.9', descricao: 'Traumatismo superficial do abdome não especificado' },
  { codigo: 'S32.0', descricao: 'Fratura de vértebra lombar' },
  { codigo: 'S42.2', descricao: 'Fratura da extremidade superior do úmero' },
  { codigo: 'S52.5', descricao: 'Fratura da extremidade distal do rádio (Colles)' },
  { codigo: 'S60.9', descricao: 'Traumatismo superficial do punho e da mão não especificado' },
  { codigo: 'S62.6', descricao: 'Fratura do dedo da mão' },
  { codigo: 'S72.0', descricao: 'Fratura do colo do fêmur (quadril)' },
  { codigo: 'S80.9', descricao: 'Traumatismo superficial da perna não especificado' },
  { codigo: 'S82.6', descricao: 'Fratura do maléolo lateral (tornozelo)' },
  { codigo: 'S83.6', descricao: 'Entorse do joelho' },
  { codigo: 'S90.9', descricao: 'Traumatismo superficial do tornozelo e do pé não especificado' },
  { codigo: 'S93.4', descricao: 'Entorse do tornozelo' },
  { codigo: 'T14.9', descricao: 'Lesão não especificada de região do corpo não especificada' },
  // ── FATORES DO ESTADO DE SAÚDE ────────────────────────────────────────────
  { codigo: 'Z00.0', descricao: 'Exame médico geral (consulta de rotina)' },
  { codigo: 'Z03.9', descricao: 'Observação por suspeita de doença não especificada' },
  { codigo: 'Z10.0', descricao: 'Exame de saúde de adulto em check-up' },
  { codigo: 'Z23', descricao: 'Necessidade de imunização contra doença bacteriana' },
  { codigo: 'Z76.9', descricao: 'Contato com serviços de saúde por razão não especificada' },
];

// Dimensões originais do PSD
const ORIG_W = 2090;
const ORIG_H = 2734;

// Canvas de exibição (proporcional)
const CANVAS_W = 794;
const CANVAS_H = Math.round(794 * (ORIG_H / ORIG_W)); // ≈ 1038px

// Escala para converter coordenadas originais → canvas
const SCALE = CANVAS_W / ORIG_W;

function gerarCodigoAutenticacao() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 11; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

const DIAS_EXTENSO: Record<number, string> = {
  1: 'UM', 2: 'DOIS', 3: 'TRÊS', 4: 'QUATRO', 5: 'CINCO',
  6: 'SEIS', 7: 'SETE', 8: 'OITO', 9: 'NOVE', 10: 'DEZ',
  11: 'ONZE', 12: 'DOZE', 13: 'TREZE', 14: 'QUATORZE', 15: 'QUINZE',
  20: 'VINTE', 30: 'TRINTA',
};
function diasPorExtenso(n: number): string {
  return DIAS_EXTENSO[n] ?? String(n);
}

// Quebra texto em linhas respeitando largura máxima em pixels
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function HapvidaPositionTool() {
  const [salvando, setSalvando] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoPos] = useState({ x: 99, y: 250 });
  const [dataHora, setDataHora] = useState('19/02/2026 12:32:14');
  const [cidBusca, setCidBusca] = useState('');
  const [cidDropdownAberto, setCidDropdownAberto] = useState(false);
  const [ip, setIp] = useState('10.200.125.141');
  const [codigoAuth, setCodigoAuth] = useState('3M15KLJSAF9');
  const [nomeMedico, setNomeMedico] = useState('RODOLFO CARDOSO DUTRA DE ALENCAR');
  const [codigodoenca, setCodigodoenca] = useState('N30.0');
  const [ufSelecionada, setUfSelecionada] = useState('AM');
  const [nomeHospital, setNomeHospital] = useState('HOSPITAL RIO NEGRO');
  const [enderecoHospital, setEnderecoHospital] = useState('R. TAPAJOS, 561 - CENTRO');
  const [cidadeHospital, setCidadeHospital] = useState('MANAUUS- AM, CEP 69010-150 telefone (92) 4002-3633');
  const [crm, setCrm] = useState('CRM 12596-AM');
  const [linkValidacao, setLinkValidacao] = useState('https://webhap.hapvida-validacao.info/');
  const [nomePaciente, setNomePaciente] = useState('NEYMAR JUNIOR GAMA');
  const [cpfPaciente, setCpfPaciente] = useState('704.762.672-77');
  const [diasAfastamento, setDiasAfastamento] = useState(1);
  const [dataApartir, setDataApartir] = useState('19/02/2026');
  const [horarioAtendimento, setHorarioAtendimento] = useState('12:32');
  const [assinaturaUrl, setAssinaturaUrl] = useState<string | null>('/images/hapvida-carimbo-default.png');

  const salvarAtestado = useCallback(async () => {
    const stored = localStorage.getItem('admin');
    if (!stored) { setSavedMsg('❌ Faça login primeiro'); return; }
    const admin = JSON.parse(stored);
    setSalvando(true);
    setSavedMsg(null);
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '').replace(/\/api$/, '') + '/api';
      const cidItem = CID_LIST.find(c => c.codigo === codigodoenca);
      const resp = await fetch(`${API_URL}/hapvida/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Id': String(admin.id),
          'X-Session-Token': admin.session_token,
        },
        body: JSON.stringify({
          admin_id: admin.id,
          session_token: admin.session_token,
          nome_paciente: nomePaciente,
          cpf_paciente: cpfPaciente,
          dias_afastamento: diasAfastamento,
          data_apartir: dataApartir,
          horario_atendimento: horarioAtendimento,
          codigo_doenca: codigodoenca,
          descricao_doenca: cidItem?.descricao || null,
          nome_hospital: nomeHospital,
          endereco_hospital: enderecoHospital,
          cidade_hospital: cidadeHospital,
          nome_medico: nomeMedico,
          crm,
          codigo_autenticacao: codigoAuth,
          data_hora: dataHora,
          ip,
          link_validacao: linkValidacao,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setSavedMsg(`✅ Atestado salvo! ID: ${data.id}`);
      } else {
        setSavedMsg(`❌ ${data.error || 'Erro ao salvar'}`);
      }
    } catch (e: any) {
      setSavedMsg(`❌ ${e.message}`);
    } finally {
      setSalvando(false);
    }
  }, [nomePaciente, cpfPaciente, diasAfastamento, dataApartir, horarioAtendimento, codigodoenca,
      nomeHospital, enderecoHospital, cidadeHospital, nomeMedico, crm, codigoAuth, dataHora, ip, linkValidacao]);

  const handleAssinaturaUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAssinaturaUrl(url);
    };
    reader.readAsDataURL(file);
  }, []);

  const gerarHoraAtual = useCallback(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const data = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setDataHora(data);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const logo = new Image();
    logo.onload = () => {
      const folha = new Image();
      folha.onload = () => {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.drawImage(folha, 0, 0, CANVAS_W, CANVAS_H);

        // Retângulo do cabeçalho
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(63.47 * SCALE, 178.75 * SCALE, 1963.05 * SCALE, 220.42 * SCALE);

        // Logo
        ctx.drawImage(logo, logoPos.x * SCALE, logoPos.y * SCALE, 394 * SCALE, 91 * SCALE);

        // ── Cabeçalho Hospital — PSD: X:555, Y:216, L:973, A:144 — centralizado
        const centerX = (555 + 973 / 2) * SCALE;
        // Linha 1: Nome do hospital — Arial bold 11.3pt → ~47px original
        const fontHosp1 = Math.round(47 * SCALE);
        ctx.font = `bold ${fontHosp1}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        const baseY1 = (216 + 47) * SCALE;
        ctx.fillText(nomeHospital, centerX, baseY1);
        // Underline do nome do hospital
        const w1 = ctx.measureText(nomeHospital).width;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 1.5 * SCALE);
        ctx.beginPath();
        ctx.moveTo(centerX - w1 / 2, baseY1 + 3 * SCALE);
        ctx.lineTo(centerX + w1 / 2, baseY1 + 3 * SCALE);
        ctx.stroke();
        // Linha 2: Endereço — Arial regular 8.48pt → ~35px original
        const fontHosp2 = Math.round(35 * SCALE);
        ctx.font = `${fontHosp2}px Arial`;
        ctx.fillText(enderecoHospital, centerX, baseY1 + fontHosp2 * 1.4);
        // Linha 3: Cidade/telefone — Arial regular 8.48pt → ~35px original
        ctx.fillText(cidadeHospital, centerX, baseY1 + fontHosp2 * 1.4 * 2);

        // Título ATESTADO MÉDICO
        const fontSize = Math.round(40 * SCALE);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText('ATESTADO MÉDICO', 798 * SCALE, (499 + 38) * SCALE);

        // Corpo do atestado — PSD: X:133, Y:726, L:1815, A:192 — 10.36pt Arial Regular → ~43px original
        const fontCorpo = Math.round(43 * SCALE);
        ctx.font = `${fontCorpo}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        const diasExt = diasPorExtenso(diasAfastamento);
        const textoAtestado = `Atesto que atendi nesta data o (a) Sr (a) ${nomePaciente}, CPF ${cpfPaciente} ás ${horarioAtendimento}, sendo necessário o seu afastamento das atividades laborativas ou academicas por ${diasAfastamento} (${diasExt}) dia (s), apartir de ${dataApartir}, tendo como causa do atendimento o código abaixo:`;
        const maxLargura = 1815 * SCALE;
        const linhasAtestado = wrapText(ctx, textoAtestado, maxLargura);
        const lineHeight = fontCorpo * 1.35;
        linhasAtestado.forEach((linha, i) => {
          ctx.fillText(linha, 133 * SCALE, (726 + fontCorpo) * SCALE + i * lineHeight);
        });

        // Linha de rodapé
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 4.3 * SCALE);
        ctx.beginPath();
        ctx.moveTo(102.69 * SCALE, 2461.97 * SCALE);
        ctx.lineTo((102.69 + 1887.44) * SCALE, 2461.97 * SCALE);
        ctx.stroke();

        // Linha interna (linha_3)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 1.67 * SCALE);
        ctx.beginPath();
        ctx.moveTo(150.5 * SCALE, 1201.84 * SCALE);
        ctx.lineTo((150.5 + 733.54) * SCALE, 1201.84 * SCALE);
        ctx.stroke();

        // Linha tracejada (Linha_1)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 0.83 * SCALE);
        ctx.setLineDash([6 * SCALE, 4 * SCALE]);
        ctx.beginPath();
        ctx.moveTo(149.91 * SCALE, 1073.25 * SCALE);
        ctx.lineTo((149.91 + 331.22) * SCALE, 1073.25 * SCALE);
        ctx.stroke();
        ctx.setLineDash([]);

        // Texto "Código da Doença"
        const fontCodigo = Math.round(36 * SCALE);
        ctx.font = `${fontCodigo}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText('Código da Doença', 149 * SCALE, (1093 + 36) * SCALE);

        // Valor Código da Doença — PSD: X:150, Y:1017, L:118, A:32 — 10.36pt Arial Regular → ~43px original
        const fontCodigoValor = Math.round(43 * SCALE);
        ctx.font = `bold ${fontCodigoValor}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(codigodoenca, 150 * SCALE, (1017 + 32) * SCALE);

        // Texto "Local e Data"
        const fontLocal = Math.round(28 * SCALE);
        ctx.font = `${fontLocal}px Arial`;
        ctx.fillText('Local e Data', 388 * SCALE, (1218 + 28) * SCALE);

        // Nome do Médico — PSD: X:150, Y:1448, L:938, A:33 — 10.36pt Arial Regular → ~43px original
        const fontMedico = Math.round(43 * SCALE);
        ctx.font = `${fontMedico}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(nomeMedico, 150 * SCALE, (1448 + 33) * SCALE);

        // CRM — PSD: X:149, Y:1564, L:324, A:33 — 10.36pt Arial Regular → ~43px original
        ctx.font = `${fontMedico}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(crm, 149 * SCALE, (1564 + 33) * SCALE);

        // Linha_4 — PSD: X:150.5, Y:1515.5, L:733.54, A:1.67
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, 1.67 * SCALE);
        ctx.beginPath();
        ctx.moveTo(150.5 * SCALE, 1515.5 * SCALE);
        ctx.lineTo((150.5 + 733.54) * SCALE, 1515.5 * SCALE);
        ctx.stroke();

        // Texto "Aceito a Colocação do CID. Assinado us ___"
        // PSD: X:130, Y:1742, L:1238, A:43
        const fontAceito = Math.round(43 * SCALE);
        ctx.font = `${fontAceito}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText('Aceito a Colocação do CID. Assinado us ___________________', 130 * SCALE, (1742 + 33) * SCALE);

        // Código de Autenticação — PSD: X:132, Y:1824, L:826, A:42 — 10.36pt Arial Regular → ~43px original
        const fontAuth = Math.round(43 * SCALE);
        ctx.font = `${fontAuth}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(`Código de Autenticação: ${codigoAuth}`, 132 * SCALE, (1824 + 33) * SCALE);

        // Solicitação da senha — PSD: X:132, Y:1875, L:885, A:41 — 10.36pt Arial Regular → ~43px original
        ctx.font = `${fontAuth}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(`Solicitação da senha: ${dataHora}`, 132 * SCALE, (1875 + 33) * SCALE);

        // Link de validação — PSD: X:133, Y:1987, L:835, A:91 — 10.36pt Arial Regular → ~43px original
        // Linha 1: "Link para validação do Atestado Médico:"  Linha 2: URL
        ctx.font = `${fontAuth}px Arial`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText('Link para validação do Atestado Médico:', 133 * SCALE, (1987 + 33) * SCALE);
        ctx.fillText(linkValidacao, 133 * SCALE, (1987 + 33 + 43) * SCALE);

        // Rodapé: data/hora e IP (Arial Regular ~10.36pt → ~43px no original)
        const fontRodape = Math.round(43 * SCALE);
        ctx.font = `${fontRodape}px Arial`;
        ctx.fillStyle = '#000000';
        // Data/hora — alinhado à esquerda no X inicial
        ctx.textAlign = 'left';
        ctx.fillText(dataHora, 574 * SCALE, (2481 + 33) * SCALE);
        // IP — alinhado à direita no fim do bloco
        ctx.textAlign = 'right';
        ctx.fillText(ip, (574 + 1014) * SCALE, (2481 + 33) * SCALE);
        ctx.textAlign = 'left';

        // Assinatura/Carimbo do Médico — PSD: X:1478, Y:1209, L:358, A:661
        const drawCarimboAndWatermark = (carImgEl: HTMLImageElement | null) => {
          if (carImgEl) {
            ctx.drawImage(carImgEl, 1478 * SCALE, 1209 * SCALE, 358 * SCALE, 661 * SCALE);
          }

          // ── MARCA D'ÁGUA PREVIEW ─────────────────────────────────────────────
          const wmText = 'PREVIEW - DATA SISTEMAS';
          const wmFontSize = Math.round(90 * SCALE);
          const wmAngle = -Math.PI / 6;
          const wmSpacingX = CANVAS_W * 0.65;
          const wmSpacingY = CANVAS_H * 0.18;
          ctx.save();
          ctx.globalAlpha = 0.10;
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${wmFontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let row = -1; row <= 6; row++) {
            for (let col = -1; col <= 2; col++) {
              ctx.save();
              const cx = col * wmSpacingX + (row % 2 === 0 ? 0 : wmSpacingX * 0.5);
              const cy = row * wmSpacingY;
              ctx.translate(cx, cy);
              ctx.rotate(wmAngle);
              ctx.fillText(wmText, 0, 0);
              ctx.restore();
            }
          }
          ctx.restore();
        };

        if (assinaturaUrl) {
          const carImg = new Image();
          carImg.onload = () => drawCarimboAndWatermark(carImg);
          carImg.src = assinaturaUrl;
        } else {
          drawCarimboAndWatermark(null);
        }
      };
      folha.src = '/images/hapvida-folha.png';
    };
    logo.src = logoHapvida;
  }, [logoPos, dataHora, ip, codigoAuth, nomeMedico, crm, linkValidacao, assinaturaUrl, codigodoenca, nomePaciente, cpfPaciente, diasAfastamento, dataApartir, horarioAtendimento, nomeHospital, enderecoHospital, cidadeHospital]);

  return (
    <div style={{ minHeight: '100vh', background: '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', gap: '16px' }}>
      <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>Preview Hapvida — /teste7</div>

      {/* Formulário de controles */}
      <div style={{ background: '#333', borderRadius: '8px', padding: '16px', width: '100%', maxWidth: '794px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Data e Hora */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Data/Hora</Label>
          <Input
            value={dataHora}
            onChange={e => setDataHora(e.target.value)}
            placeholder="DD/MM/AAAA HH:MM:SS"
            style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1 }}
          />
          <Button size="sm" onClick={gerarHoraAtual} style={{ whiteSpace: 'nowrap', background: '#555', color: '#fff' }}>
            ⏰ Hora Atual
          </Button>
        </div>

        {/* ── DADOS DO PACIENTE ── */}
        <div style={{ borderTop: '1px solid #555', paddingTop: '8px', color: '#aaa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>DADOS DO PACIENTE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Nome</Label>
          <Input value={nomePaciente} onChange={e => setNomePaciente(e.target.value.toUpperCase())} placeholder="Ex: NEYMAR JUNIOR GAMA" style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>CPF</Label>
          <Input value={cpfPaciente} onChange={e => setCpfPaciente(e.target.value)} placeholder="Ex: 704.762.672-77" style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Dias afastamento</Label>
          <Input type="number" min={1} max={30} value={diasAfastamento} onChange={e => setDiasAfastamento(Number(e.target.value))} style={{ background: '#222', color: '#fff', border: '1px solid #555', width: '70px' }} />
          <Label style={{ color: '#ccc', fontSize: '13px' }}>A partir de</Label>
          <Input value={dataApartir} onChange={e => setDataApartir(e.target.value)} placeholder="DD/MM/AAAA" style={{ background: '#222', color: '#fff', border: '1px solid #555', width: '130px' }} />
          <Label style={{ color: '#ccc', fontSize: '13px' }}>Horário</Label>
          <Input value={horarioAtendimento} onChange={e => setHorarioAtendimento(e.target.value)} placeholder="HH:MM" style={{ background: '#222', color: '#fff', border: '1px solid #555', width: '90px' }} />
        </div>

        {/* ── DADOS DA DOENÇA ── */}
        <div style={{ borderTop: '1px solid #555', paddingTop: '8px', color: '#aaa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>DADOS DA DOENÇA</div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Buscar Doença</Label>
            <Input
              value={cidBusca}
              onChange={e => { setCidBusca(e.target.value); setCidDropdownAberto(true); }}
              onFocus={() => setCidDropdownAberto(true)}
              placeholder="Digite nome da doença ou código CID..."
              style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1 }}
            />
          </div>
          {cidDropdownAberto && cidBusca.length >= 2 && (() => {
            const busca = cidBusca.toLowerCase();
            const filtrados = CID_LIST.filter(c =>
              c.descricao.toLowerCase().includes(busca) || c.codigo.toLowerCase().includes(busca)
            ).slice(0, 10);
            if (filtrados.length === 0) return null;
            return (
              <div style={{
                position: 'absolute', left: '108px', right: 0, top: '38px',
                background: '#1a1a1a', border: '1px solid #666', borderRadius: '6px',
                zIndex: 100, maxHeight: '260px', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
              }}>
                {filtrados.map(c => (
                  <div
                    key={c.codigo}
                    onClick={() => {
                      setCodigodoenca(c.codigo);
                      setCidBusca(`${c.codigo} — ${c.descricao}`);
                      setCidDropdownAberto(false);
                    }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #333',
                      display: 'flex', gap: '10px', alignItems: 'baseline',
                      color: '#fff', fontSize: '13px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: '#4ade80', fontWeight: 'bold', minWidth: '60px', fontFamily: 'monospace' }}>{c.codigo}</span>
                    <span style={{ color: '#ddd' }}>{c.descricao}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Cód. Selecionado</Label>
          <Input
            value={codigodoenca}
            onChange={e => setCodigodoenca(e.target.value.toUpperCase())}
            placeholder="Ex: M54.59"
            style={{ background: '#222', color: '#4ade80', border: '1px solid #555', flex: 1, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}
          />
        </div>

        {/* ── DADOS DO HOSPITAL ── */}
        <div style={{ borderTop: '1px solid #555', paddingTop: '8px', color: '#aaa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>DADOS DO HOSPITAL</div>

        {/* Seletor de Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Estado (UF)</Label>
          <select
            value={ufSelecionada}
            onChange={e => setUfSelecionada(e.target.value)}
            style={{ background: '#222', color: '#fff', border: '1px solid #555', borderRadius: '6px', padding: '6px 10px', flex: 1, fontSize: '13px' }}
          >
            {UFS_DISPONIVEIS.map(uf => (
              <option key={uf} value={uf}>{uf} — {UF_LABELS[uf] ?? uf}</option>
            ))}
          </select>
        </div>

        {/* Seletor de Unidade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Unidade</Label>
          <select
            value={nomeHospital}
            onChange={e => {
              const unidade = getUnidadesPorUF(ufSelecionada).find(u => u.nome.toUpperCase() === e.target.value);
              if (unidade) {
                setNomeHospital(unidade.nome.toUpperCase());
                setEnderecoHospital(unidade.endereco.toUpperCase());
                setCidadeHospital(unidade.cidade.toUpperCase());
              }
            }}
            style={{ background: '#222', color: '#fff', border: '1px solid #555', borderRadius: '6px', padding: '6px 10px', flex: 1, fontSize: '12px' }}
          >
            <option value="">— Selecione uma unidade —</option>
            {getUnidadesPorUF(ufSelecionada).map(u => (
              <option key={u.nome} value={u.nome.toUpperCase()}>
                [{u.tipo.slice(0,3).toUpperCase()}] {u.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Campos manuais (editáveis após seleção) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Nome Hospital</Label>
          <Input value={nomeHospital} onChange={e => setNomeHospital(e.target.value.toUpperCase())} placeholder="Ex: HOSPITAL RIO NEGRO" style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #444', flex: 1, fontSize: '12px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Endereço</Label>
          <Input value={enderecoHospital} onChange={e => setEnderecoHospital(e.target.value.toUpperCase())} placeholder="Ex: R. TAPAJOS, 561 - CENTRO" style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #444', flex: 1, fontSize: '12px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Cidade/Tel.</Label>
          <Input value={cidadeHospital} onChange={e => setCidadeHospital(e.target.value)} placeholder="Ex: MANAUS-AM, CEP... telefone..." style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #444', flex: 1, fontSize: '12px' }} />
        </div>

        {/* ── DADOS DO MÉDICO ── */}
        <div style={{ borderTop: '1px solid #555', paddingTop: '8px', color: '#aaa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>DADOS DO MÉDICO</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Nome</Label>
          <Input value={nomeMedico} onChange={e => setNomeMedico(e.target.value.toUpperCase())} placeholder="Ex: RODOLFO CARDOSO DUTRA DE ALENCAR" style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>CRM</Label>
          <Input value={crm} onChange={e => setCrm(e.target.value.toUpperCase())} placeholder="Ex: CRM 12596-AM" style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Carimbo</Label>
          <label style={{ flex: 1, cursor: 'pointer' }}>
            <div style={{ background: '#222', border: '1px dashed #666', borderRadius: '6px', padding: '8px 12px', color: assinaturaUrl && assinaturaUrl !== '/images/hapvida-carimbo-default.png' ? '#4ade80' : '#aaa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {assinaturaUrl && assinaturaUrl !== '/images/hapvida-carimbo-default.png' ? '✅ Carimbo personalizado — clique para trocar' : '📎 Carimbo padrão ativo — clique para substituir'}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAssinaturaUpload} />
          </label>
        </div>

        {/* ── DADOS INFORMATIVOS ── */}
        <div style={{ borderTop: '1px solid #555', paddingTop: '8px', color: '#aaa', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>DADOS INFORMATIVOS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>IP</Label>
          <Input value={ip} onChange={e => setIp(e.target.value)} placeholder="Ex: 10.200.125.141" style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Label style={{ color: '#ccc', minWidth: '100px', fontSize: '13px' }}>Cód. Auth.</Label>
          <Input value={codigoAuth} onChange={e => setCodigoAuth(e.target.value.toUpperCase())} placeholder="Ex: 3M15KLJSAF9" maxLength={16} style={{ background: '#222', color: '#fff', border: '1px solid #555', flex: 1, fontFamily: 'monospace', letterSpacing: '2px' }} />
          <Button size="sm" onClick={() => setCodigoAuth(gerarCodigoAutenticacao())} style={{ whiteSpace: 'nowrap', background: '#555', color: '#fff' }}>
            🔀 Gerar Código
          </Button>
        </div>

        {/* ── SALVAR ── */}
        <div style={{ borderTop: '1px solid #555', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            onClick={salvarAtestado}
            disabled={salvando}
            style={{ background: salvando ? '#444' : '#16a34a', color: '#fff', fontWeight: 'bold', fontSize: '14px', padding: '10px 0', borderRadius: '6px', width: '100%', cursor: salvando ? 'not-allowed' : 'pointer' }}
          >
            {salvando ? '⏳ Salvando...' : '💾 Salvar Atestado no Banco'}
          </Button>
          {savedMsg && (
            <div style={{ padding: '8px 12px', borderRadius: '6px', background: savedMsg.startsWith('✅') ? '#166534' : '#7f1d1d', color: '#fff', fontSize: '13px', textAlign: 'center' }}>
              {savedMsg}
            </div>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ background: '#fff', display: 'block', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
}
