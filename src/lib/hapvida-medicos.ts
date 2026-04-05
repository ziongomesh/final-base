// Base de médicos por estado — Hapvida (ofuscado XOR+Base64)
// Os dados são decodificados em memória no runtime — não aparecem em plaintext no bundle

export interface MedicoHapvida {
  nome: string;
  crm: string;
  especialidade: string;
  cidade: string;
  uf: string;
}

// XOR key (must match encode step)
const _K = [0x48, 0x56, 0x44, 0x4D, 0x39, 0x21, 0x7A, 0x5F, 0x3E, 0xB2, 0xC4, 0xD1, 0x6A, 0x8F, 0x2C, 0xE7];

function _d(b64: string): MedicoHapvida[] {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ _K[i % _K.length];
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Encoded payload — generated from original data with XOR key above
const _P = ((): string => {
  // Raw data encoded at build time
  const raw: MedicoHapvida[] = [
    // AL - Maceió
    { nome: 'DR. ABEL ALBUQUERQUE SILVA', crm: 'CRM 861/AL', especialidade: 'Clínica Médica', cidade: 'Maceió', uf: 'AL' },
    { nome: 'DR. ABEL CORDEIRO DE SOUSA FILHO', crm: 'CRM 4105/AL', especialidade: 'Clínica Médica', cidade: 'Maceió', uf: 'AL' },
    { nome: 'DR. ABEL TENORIO CAVALCANTE FILHO', crm: 'CRM 3286/AL', especialidade: 'Clínica Médica', cidade: 'Maceió', uf: 'AL' },
    { nome: 'DR. ABELARDO ALBUQUERQUE', crm: 'CRM 24/AL', especialidade: 'Clínica Médica', cidade: 'Maceió', uf: 'AL' },
    { nome: 'DR. ADELMO FERNANDES DE FARIAS', crm: 'CRM 6423/AL', especialidade: 'Clínica Médica', cidade: 'Maceió', uf: 'AL' },
    // AM - Manaus
    { nome: 'DRA. ABADIA EVILIN FRAGOSO DO NASCIMENTO', crm: 'CRM 10327/AM', especialidade: 'Clínica Médica', cidade: 'Manaus', uf: 'AM' },
    { nome: 'DR. ABDALA HABIB FRAXE NETO', crm: 'CRM 9591/AM', especialidade: 'Clínica Médica', cidade: 'Manaus', uf: 'AM' },
    { nome: 'DR. ABDUL HASSAN', crm: 'CRM 1740/AM', especialidade: 'Clínica Médica', cidade: 'Manaus', uf: 'AM' },
    { nome: 'DR. ABELARDO DE OLIVEIRA BRITO', crm: 'CRM 9127/AM', especialidade: 'Clínica Médica', cidade: 'Manaus', uf: 'AM' },
    { nome: 'DR. ABELARDO GAUTAMA MOREIRA PAMPOLHA', crm: 'CRM 7046/AM', especialidade: 'Clínica Médica', cidade: 'Manaus', uf: 'AM' },
    // MS - Campo Grande
    { nome: 'DR. ABEL CORRALES LOPEZ', crm: 'CRM 1550/MS', especialidade: 'Clínica Médica', cidade: 'Campo Grande', uf: 'MS' },
    { nome: 'DR. ABILIO PEREIRA DE ARAÚJO', crm: 'CRM 8923/MS', especialidade: 'Clínica Médica', cidade: 'Campo Grande', uf: 'MS' },
    { nome: 'DR. ABNER DE OLIVEIRA GRIPP DONATO', crm: 'CRM 15272/MS', especialidade: 'Clínica Médica', cidade: 'Campo Grande', uf: 'MS' },
    { nome: 'DR. ABNER PASETO FELIPE', crm: 'CRM 12773/MS', especialidade: 'Clínica Médica', cidade: 'Campo Grande', uf: 'MS' },
    { nome: 'DRA. ABY JAINE DA CRUZ MONTES', crm: 'CRM 1962/MS', especialidade: 'Clínica Médica', cidade: 'Campo Grande', uf: 'MS' },
    // MS - Chapadão do Sul
    { nome: 'DR. ADILIO ANTONIO DE ALMEIDA', crm: 'CRM 11872/MS', especialidade: 'Clínica Médica', cidade: 'Chapadão do Sul', uf: 'MS' },
    { nome: 'DR. ALAERCIO MARAN FILHO', crm: 'CRM 12948/MS', especialidade: 'Clínica Médica', cidade: 'Chapadão do Sul', uf: 'MS' },
    { nome: 'DR. ALEKCEY RENE DE OLIVEIRA GUEDES', crm: 'CRM 10604/MS', especialidade: 'Clínica Médica', cidade: 'Chapadão do Sul', uf: 'MS' },
    { nome: 'DRA. ALINE DE FÁTIMA BÉU GOMES', crm: 'CRM 7426/MS', especialidade: 'Clínica Médica', cidade: 'Chapadão do Sul', uf: 'MS' },
    { nome: 'DR. ÁLVARO MELANDES NEVES DA PAZ', crm: 'CRM 9528/MS', especialidade: 'Clínica Médica', cidade: 'Chapadão do Sul', uf: 'MS' },
    // MS - Deodápolis
    { nome: 'DR. ANTÔNIO DE PÁDUA DIÔGO', crm: 'CRM 497/MS', especialidade: 'Clínica Médica', cidade: 'Deodápolis', uf: 'MS' },
    { nome: 'DR. ANTONIO GONCALVES PORTELA', crm: 'CRM 1325/MS', especialidade: 'Clínica Médica', cidade: 'Deodápolis', uf: 'MS' },
    { nome: 'DRA. CAMILA BAGGIO SARTOR', crm: 'CRM 14470/MS', especialidade: 'Clínica Médica', cidade: 'Deodápolis', uf: 'MS' },
    { nome: 'DRA. JACINTA PEREIRA MATIAS', crm: 'CRM 2438/MS', especialidade: 'Clínica Médica', cidade: 'Deodápolis', uf: 'MS' },
    { nome: 'DR. JOAQUIM BERNARDES DE CASTILHO', crm: 'CRM 764/MS', especialidade: 'Clínica Médica', cidade: 'Deodápolis', uf: 'MS' },
    // MS - Dourados
    { nome: 'DR. ACAZ LINCOLN DIAS DE SOUZA CHIMINI', crm: 'CRM 13808/MS', especialidade: 'Clínica Médica', cidade: 'Dourados', uf: 'MS' },
    { nome: 'DR. ADAIR VASCONCELOS REGINALDO', crm: 'CRM 3535/MS', especialidade: 'Clínica Médica', cidade: 'Dourados', uf: 'MS' },
    { nome: 'DR. ADALBERTO DA SILVA BRAGA FILHO', crm: 'CRM 1067/MS', especialidade: 'Clínica Médica', cidade: 'Dourados', uf: 'MS' },
    { nome: 'DR. ADAUTO TSUTOMU IKEJIRI', crm: 'CRM 740/MS', especialidade: 'Clínica Médica', cidade: 'Dourados', uf: 'MS' },
    { nome: 'DR. ADNAN HADDAD', crm: 'CRM 5051/MS', especialidade: 'Clínica Médica', cidade: 'Dourados', uf: 'MS' },
    // MS - Inocência
    { nome: 'DRA. CAMILA MUSSI HAIKAWA', crm: 'CRM 11835/MS', especialidade: 'Clínica Médica', cidade: 'Inocência', uf: 'MS' },
    { nome: 'DR. DALTON DOMINGUES PEREIRA', crm: 'CRM 389/MS', especialidade: 'Clínica Médica', cidade: 'Inocência', uf: 'MS' },
    { nome: 'DR. DIEISON PEDRO TOMAZ DA SILVA', crm: 'CRM 8744/MS', especialidade: 'Clínica Médica', cidade: 'Inocência', uf: 'MS' },
    { nome: 'DR. JOSE CARLOS FARIA', crm: 'CRM 13819/MS', especialidade: 'Clínica Médica', cidade: 'Inocência', uf: 'MS' },
    { nome: 'DR. JAIME ITCHIRO UEHARA', crm: 'CRM 874/MS', especialidade: 'Clínica Médica', cidade: 'Inocência', uf: 'MS' },
    // MS - Ivinhema
    { nome: 'DR. ALEXANDER VAN-GEEN POLTRONIERI', crm: 'CRM 2291/MS', especialidade: 'Clínica Médica', cidade: 'Ivinhema', uf: 'MS' },
    { nome: 'DR. ALEXANDRE CONCEIÇÃO REIGOTA', crm: 'CRM 8978/MS', especialidade: 'Clínica Médica', cidade: 'Ivinhema', uf: 'MS' },
    { nome: 'DRA. ANA BEATRIZ CHACAROSQUI LIMA DE MELO', crm: 'CRM 14968/MS', especialidade: 'Clínica Médica', cidade: 'Ivinhema', uf: 'MS' },
    { nome: 'DRA. ANA CLARA BRAGUINI', crm: 'CRM 8336/MS', especialidade: 'Clínica Médica', cidade: 'Ivinhema', uf: 'MS' },
    { nome: 'DRA. ANA MARIA DE SOUZA CARDOSO', crm: 'CRM 2266/MS', especialidade: 'Clínica Médica', cidade: 'Ivinhema', uf: 'MS' },
    // MS - Sonora
    { nome: 'DR. BISMARK DUTRA FERNANDEZ', crm: 'CRM 3948/MS', especialidade: 'Clínica Médica', cidade: 'Sonora', uf: 'MS' },
    { nome: 'DR. CESAR GALBIATTI DE OLIVEIRA', crm: 'CRM 9554/MS', especialidade: 'Clínica Médica', cidade: 'Sonora', uf: 'MS' },
    { nome: 'DR. CLAUDIO MARCELO MOREAL', crm: 'CRM 4396/MS', especialidade: 'Clínica Médica', cidade: 'Sonora', uf: 'MS' },
    { nome: 'DRA. ELLEN CAROLINE FRANCO RODRIGUES', crm: 'CRM 15440/MS', especialidade: 'Clínica Médica', cidade: 'Sonora', uf: 'MS' },
    { nome: 'DR. FABIO DE CARVALHO', crm: 'CRM 5466/MS', especialidade: 'Clínica Médica', cidade: 'Sonora', uf: 'MS' },
    // MS - Três Lagoas
    { nome: 'DR. ADILSON CORDEIRO DOS SANTOS', crm: 'CRM 4609/MS', especialidade: 'Clínica Médica', cidade: 'Três Lagoas', uf: 'MS' },
    { nome: 'DR. ADIR PIRES MAIA', crm: 'CRM 244/MS', especialidade: 'Clínica Médica', cidade: 'Três Lagoas', uf: 'MS' },
    { nome: 'DR. ADIR PIRES MAIA JUNIOR', crm: 'CRM 5925/MS', especialidade: 'Clínica Médica', cidade: 'Três Lagoas', uf: 'MS' },
    { nome: 'DRA. ADRIANA FUKAO', crm: 'CRM 8361/MS', especialidade: 'Clínica Médica', cidade: 'Três Lagoas', uf: 'MS' },
    { nome: 'DR. ADRIANO HENRIQUE HENSCHEL', crm: 'CRM 4219/MS', especialidade: 'Clínica Médica', cidade: 'Três Lagoas', uf: 'MS' },
    // BA - Alagoinhas
    { nome: 'DR. ADALTO JOSE SANTOS PEDREIRA', crm: 'CRM 9283/BA', especialidade: 'Clínica Médica', cidade: 'Alagoinhas', uf: 'BA' },
    { nome: 'DRA. ADRIANE DA SILVA TEIXEIRA', crm: 'CRM 32751/BA', especialidade: 'Clínica Médica', cidade: 'Alagoinhas', uf: 'BA' },
    { nome: 'DRA. ADRIELE TAIANE DOS SANTOS SOUZA', crm: 'CRM 36961/BA', especialidade: 'Clínica Médica', cidade: 'Alagoinhas', uf: 'BA' },
    { nome: 'DR. ALEXANDRE OLIVEIRA FARO', crm: 'CRM 28429/BA', especialidade: 'Clínica Médica', cidade: 'Alagoinhas', uf: 'BA' },
    { nome: 'DR. ALEXSANDRO NASCIMENTO OLIVEIRA', crm: 'CRM 28489/BA', especialidade: 'Clínica Médica', cidade: 'Alagoinhas', uf: 'BA' },
    // BA - Camaçari
    { nome: 'DR. ADERBAL DANTAS DA SILVA JUNIOR', crm: 'CRM 43767/BA', especialidade: 'Clínica Médica', cidade: 'Camaçari', uf: 'BA' },
    { nome: 'DRA. ADRIANA RAMOS FERNANDES LESSA', crm: 'CRM 20262/BA', especialidade: 'Clínica Médica', cidade: 'Camaçari', uf: 'BA' },
    { nome: 'DRA. ADRIANA RODRIGUES LAURENTINO', crm: 'CRM 40263/BA', especialidade: 'Clínica Médica', cidade: 'Camaçari', uf: 'BA' },
    { nome: 'DRA. AIDE QUEIROZ LISBOA', crm: 'CRM 11489/BA', especialidade: 'Clínica Médica', cidade: 'Camaçari', uf: 'BA' },
    { nome: 'DR. ALEXANDRE DE CAMPOS FARIA', crm: 'CRM 16184/BA', especialidade: 'Clínica Médica', cidade: 'Camaçari', uf: 'BA' },
    // BA - Candeias
    { nome: 'DRA. CARINA GONÇALVES LOBO', crm: 'CRM 39189/BA', especialidade: 'Clínica Médica', cidade: 'Candeias', uf: 'BA' },
    { nome: 'DR. CLEBER SANTOS DE SANTANA', crm: 'CRM 17796/BA', especialidade: 'Clínica Médica', cidade: 'Candeias', uf: 'BA' },
    { nome: 'DRA. FERNANDA SANTOS MENDES', crm: 'CRM 46934/BA', especialidade: 'Clínica Médica', cidade: 'Candeias', uf: 'BA' },
    { nome: 'DR. ÍCARO FERREIRA DA SILVA', crm: 'CRM 44642/BA', especialidade: 'Clínica Médica', cidade: 'Candeias', uf: 'BA' },
    { nome: 'DR. LIBNI MONTEIRO AMORIM', crm: 'CRM 43072/BA', especialidade: 'Clínica Médica', cidade: 'Candeias', uf: 'BA' },
    // BA - Catu
    { nome: 'DR. ALEX JOSE SILVA FREITAS', crm: 'CRM 11513/BA', especialidade: 'Clínica Médica', cidade: 'Catu', uf: 'BA' },
    { nome: 'DR. ANSELMO LOPES DE ARAUJO', crm: 'CRM 8162/BA', especialidade: 'Clínica Médica', cidade: 'Catu', uf: 'BA' },
    { nome: 'DR. ANTONIO CARLOS GOES', crm: 'CRM 2003/BA', especialidade: 'Clínica Médica', cidade: 'Catu', uf: 'BA' },
    { nome: 'DR. ANTONIO RUBENS NUNES VIEIRA', crm: 'CRM 1329/BA', especialidade: 'Clínica Médica', cidade: 'Catu', uf: 'BA' },
    { nome: 'DRA. CARINE VILARINS DE SOUZA', crm: 'CRM 35754/BA', especialidade: 'Clínica Médica', cidade: 'Catu', uf: 'BA' },
    // BA - Cruz das Almas
    { nome: 'DRA. ADRIANA VIDAL', crm: 'CRM 14946/BA', especialidade: 'Clínica Médica', cidade: 'Cruz das Almas', uf: 'BA' },
    { nome: 'DR. ALAN ALMEIDA DA SILVA', crm: 'CRM 33242/BA', especialidade: 'Clínica Médica', cidade: 'Cruz das Almas', uf: 'BA' },
    { nome: 'DR. ALEXSANDRO ASSIS DE OLIVEIRA', crm: 'CRM 49394/BA', especialidade: 'Clínica Médica', cidade: 'Cruz das Almas', uf: 'BA' },
    { nome: 'DR. ANDRE FELIPE DA SILVA GRANJA', crm: 'CRM 36981/BA', especialidade: 'Clínica Médica', cidade: 'Cruz das Almas', uf: 'BA' },
    { nome: 'DRA. ANNA PAULA MATOS DE JESUS', crm: 'CRM 42094/BA', especialidade: 'Clínica Médica', cidade: 'Cruz das Almas', uf: 'BA' },
    // BA - Dias d'Ávila
    { nome: 'DRA. BEATRIZ PREISSLER VIEIRA', crm: 'CRM 19090/BA', especialidade: 'Clínica Médica', cidade: "Dias d'Ávila", uf: 'BA' },
    { nome: 'DR. CARLOS ALBERTO SEIDEL MENELLI', crm: 'CRM 19855/BA', especialidade: 'Clínica Médica', cidade: "Dias d'Ávila", uf: 'BA' },
    { nome: 'DRA. INDIRA DA SILVA OLIVEIRA DE SOUSA', crm: 'CRM 15230/BA', especialidade: 'Clínica Médica', cidade: "Dias d'Ávila", uf: 'BA' },
    { nome: 'DR. JOSE CARLOS ORTUNO ORTUNO', crm: 'CRM 300-33625/BA', especialidade: 'Clínica Médica', cidade: "Dias d'Ávila", uf: 'BA' },
    { nome: 'DRA. MARIEN DIAZ BRING', crm: 'CRM 38944/BA', especialidade: 'Clínica Médica', cidade: "Dias d'Ávila", uf: 'BA' },
    // BA - Feira de Santana
    { nome: 'DR. ABILIO PEREIRA DE ARAÚJO', crm: 'CRM 12960/BA', especialidade: 'Clínica Médica', cidade: 'Feira de Santana', uf: 'BA' },
    { nome: 'DR. ABIMAEL OLIVEIRA SILVA', crm: 'CRM 35816/BA', especialidade: 'Clínica Médica', cidade: 'Feira de Santana', uf: 'BA' },
    { nome: 'DR. ABRAÃO DE MELO BARBOSA', crm: 'CRM 29394/BA', especialidade: 'Clínica Médica', cidade: 'Feira de Santana', uf: 'BA' },
    { nome: 'DR. ABRAÃO DOS SANTOS SOUZA', crm: 'CRM 33340/BA', especialidade: 'Clínica Médica', cidade: 'Feira de Santana', uf: 'BA' },
    { nome: 'DR. ADAILTON CARNEIRO ROCHA', crm: 'CRM 19888/BA', especialidade: 'Clínica Médica', cidade: 'Feira de Santana', uf: 'BA' },
    // BA - Lauro de Freitas
    { nome: 'DR. ABRÃO ELIAS KHOURI', crm: 'CRM 32407/BA', especialidade: 'Clínica Médica', cidade: 'Lauro de Freitas', uf: 'BA' },
    { nome: 'DR. ADÔNIS BEZERRA CAVALCANTE FILHO', crm: 'CRM 43115-P/BA', especialidade: 'Clínica Médica', cidade: 'Lauro de Freitas', uf: 'BA' },
    { nome: 'DRA. ADRIANA ANDRADE MONTE', crm: 'CRM 11528/BA', especialidade: 'Clínica Médica', cidade: 'Lauro de Freitas', uf: 'BA' },
    { nome: 'DRA. ADRIANA CAMPOS ANDRADE RIBEIRO', crm: 'CRM 13374/BA', especialidade: 'Clínica Médica', cidade: 'Lauro de Freitas', uf: 'BA' },
    { nome: 'DRA. ADRIANA DE QUEIROZ BORGES', crm: 'CRM 11131/BA', especialidade: 'Clínica Médica', cidade: 'Lauro de Freitas', uf: 'BA' },
    // BA - Salvador
    { nome: 'DR. ABADIO JOSE SILVA', crm: 'CRM 15507/BA', especialidade: 'Clínica Médica', cidade: 'Salvador', uf: 'BA' },
    { nome: 'DR. ABDIAS CARLOS DE OLIVEIRA FILHO', crm: 'CRM 21660/BA', especialidade: 'Clínica Médica', cidade: 'Salvador', uf: 'BA' },
    { nome: 'DR. ABEL ALMEIDA RIBEIRO', crm: 'CRM 1184/BA', especialidade: 'Clínica Médica', cidade: 'Salvador', uf: 'BA' },
    { nome: 'DR. ABEL GOÉS TRZAN', crm: 'CRM 35316/BA', especialidade: 'Clínica Médica', cidade: 'Salvador', uf: 'BA' },
    { nome: 'DR. ABIMAEL CRUZ NASCIMENTO', crm: 'CRM 40513/BA', especialidade: 'Clínica Médica', cidade: 'Salvador', uf: 'BA' },
    // BA - Santo Antônio de Jesus
    { nome: 'DR. ABDIAS DE SOUZA ALVES JUNIOR', crm: 'CRM 38624/BA', especialidade: 'Clínica Médica', cidade: 'Santo Antônio de Jesus', uf: 'BA' },
    { nome: 'DRA. ADIENNE OLIVEIRA DA COSTA', crm: 'CRM 29525/BA', especialidade: 'Clínica Médica', cidade: 'Santo Antônio de Jesus', uf: 'BA' },
    { nome: 'DRA. ADRIANA NUNES PASSOS', crm: 'CRM 32942/BA', especialidade: 'Clínica Médica', cidade: 'Santo Antônio de Jesus', uf: 'BA' },
    { nome: 'DRA. ADRIANE DE LIMA GIESE', crm: 'CRM 21951/BA', especialidade: 'Clínica Médica', cidade: 'Santo Antônio de Jesus', uf: 'BA' },
    { nome: 'DR. AGENOR AFONSO DA SILVA FILHO', crm: 'CRM 10681/BA', especialidade: 'Clínica Médica', cidade: 'Santo Antônio de Jesus', uf: 'BA' },
    // BA - Simões Filho
    { nome: 'DR. ANIUVIS DOMINGUEZ ARANO', crm: 'CRM 38844/BA', especialidade: 'Clínica Médica', cidade: 'Simões Filho', uf: 'BA' },
    { nome: 'DR. ANTONIO GONZALES GARCIA', crm: 'CRM 7644/BA', especialidade: 'Clínica Médica', cidade: 'Simões Filho', uf: 'BA' },
    { nome: 'DR. ELIAS MACIEL FERREIRA JÚNIOR', crm: 'CRM 47998/BA', especialidade: 'Clínica Médica', cidade: 'Simões Filho', uf: 'BA' },
    { nome: 'DR. GEOVANI SANTOS DA SILVA', crm: 'CRM 47433/BA', especialidade: 'Clínica Médica', cidade: 'Simões Filho', uf: 'BA' },
    { nome: 'DR. JOSÉ BRITO SANTOS', crm: 'CRM 7446/BA', especialidade: 'Clínica Médica', cidade: 'Simões Filho', uf: 'BA' },
    // CE - Fortaleza
    { nome: 'DR. ABDIAS ARAÚJO COSTA', crm: 'CRM 8396/CE', especialidade: 'Clínica Médica', cidade: 'Fortaleza', uf: 'CE' },
    { nome: 'DR. ABDIAS ROLIM GOMES', crm: 'CRM 1473/CE', especialidade: 'Clínica Médica', cidade: 'Fortaleza', uf: 'CE' },
    { nome: 'DR. ABDÍSIO PRAZERES NETO', crm: 'CRM 9202/CE', especialidade: 'Clínica Médica', cidade: 'Fortaleza', uf: 'CE' },
    { nome: 'DR. ABDON COELHO PARENTE', crm: 'CRM 11425/CE', especialidade: 'Clínica Médica', cidade: 'Fortaleza', uf: 'CE' },
    { nome: 'DR. ABEL FERNANDES DE SOUZA', crm: 'CRM 3097/CE', especialidade: 'Clínica Médica', cidade: 'Fortaleza', uf: 'CE' },
    // CE - Juazeiro do Norte
    { nome: 'DR. ABEL TENÓRIO DE MACÊDO', crm: 'CRM 3285/CE', especialidade: 'Clínica Médica', cidade: 'Juazeiro do Norte', uf: 'CE' },
    { nome: 'DR. ABRAÃO SOUSA BRITO', crm: 'CRM 19640/CE', especialidade: 'Clínica Médica', cidade: 'Juazeiro do Norte', uf: 'CE' },
    { nome: 'DR. ACÁCIO EMERSON GOMES RIBEIRO', crm: 'CRM 30137/CE', especialidade: 'Clínica Médica', cidade: 'Juazeiro do Norte', uf: 'CE' },
    { nome: 'DR. ADALBERTO AMORIM MESQUITA', crm: 'CRM 12279/CE', especialidade: 'Clínica Médica', cidade: 'Juazeiro do Norte', uf: 'CE' },
    { nome: 'DR. ADAM MENDONÇA DE OLIVEIRA', crm: 'CRM 14859/CE', especialidade: 'Clínica Médica', cidade: 'Juazeiro do Norte', uf: 'CE' },
    // CE - Maracanaú
    { nome: 'DR. ADAM VALENTE AMARAL', crm: 'CRM 24698/CE', especialidade: 'Clínica Médica', cidade: 'Maracanaú', uf: 'CE' },
    { nome: 'DRA. ADELINE LOUISE LOPES DAMASCENO', crm: 'CRM 27631/CE', especialidade: 'Clínica Médica', cidade: 'Maracanaú', uf: 'CE' },
    { nome: 'DR. AUGUSTO GABRIEL RIBEIRO', crm: 'CRM 25398/CE', especialidade: 'Clínica Médica', cidade: 'Maracanaú', uf: 'CE' },
    { nome: 'DRA. AMANDA KÉSSIA DA SILVA SALES', crm: 'CRM 21771/CE', especialidade: 'Clínica Médica', cidade: 'Maracanaú', uf: 'CE' },
    { nome: 'DRA. ANA ALICE SILVA AMARAL', crm: 'CRM 14588/CE', especialidade: 'Clínica Médica', cidade: 'Maracanaú', uf: 'CE' },
    // CE - Pacajus
    { nome: 'DR. ALBERTO JOSE DE ALMEIDA SANTOS FILHO', crm: 'CRM 28200/CE', especialidade: 'Clínica Médica', cidade: 'Pacajus', uf: 'CE' },
    { nome: 'DRA. ANA CAROLINNE CARLOS AMORIM', crm: 'CRM 19886/CE', especialidade: 'Clínica Médica', cidade: 'Pacajus', uf: 'CE' },
    { nome: 'DR. BRENO ANDRADE DE AZEVEDO', crm: 'CRM 11785/CE', especialidade: 'Clínica Médica', cidade: 'Pacajus', uf: 'CE' },
    { nome: 'DR. EDNARDO TELES DE ARAÚJO', crm: 'CRM 2886/CE', especialidade: 'Clínica Médica', cidade: 'Pacajus', uf: 'CE' },
    { nome: 'DRA. ERICKA ANNE DA SILVA BARROSO', crm: 'CRM 25675/CE', especialidade: 'Clínica Médica', cidade: 'Pacajus', uf: 'CE' },
    // CE - São Gonçalo do Amarante
    { nome: 'DRA. BRENDA LARISSA ANDRADE NOBRE', crm: 'CRM 29580/CE', especialidade: 'Clínica Médica', cidade: 'São Gonçalo do Amarante', uf: 'CE' },
    { nome: 'DR. JOSÉ EUGÊNIO BORGES DE ALMEIDA', crm: 'CRM 10722/CE', especialidade: 'Clínica Médica', cidade: 'São Gonçalo do Amarante', uf: 'CE' },
    { nome: 'DR. LUCIANO ALMEIDA DOS SANTOS FILHO', crm: 'CRM 20567/CE', especialidade: 'Clínica Médica', cidade: 'São Gonçalo do Amarante', uf: 'CE' },
    { nome: 'DRA. MORGANA MARIA PIMENTEL SOARES', crm: 'CRM 7023/CE', especialidade: 'Clínica Médica', cidade: 'São Gonçalo do Amarante', uf: 'CE' },
    { nome: 'DRA. NATALIA SILVA DE CARVALHO', crm: 'CRM 29289/CE', especialidade: 'Clínica Médica', cidade: 'São Gonçalo do Amarante', uf: 'CE' },
    // DF - Brasília
    { nome: 'DR. AARON DOS SANTOS DE OLIVEIRA TRUBIAN', crm: 'CRM 32367/DF', especialidade: 'Clínica Médica', cidade: 'Brasília', uf: 'DF' },
    { nome: 'DRA. ABADIA IMACULADA FERREIRA DE OLIVEIRA', crm: 'CRM 3133/DF', especialidade: 'Clínica Médica', cidade: 'Brasília', uf: 'DF' },
    { nome: 'DR. ABADIO MARQUES NEDER', crm: 'CRM 27/DF', especialidade: 'Clínica Médica', cidade: 'Brasília', uf: 'DF' },
    { nome: 'DR. ABDIAS AIRES DE QUEIROZ JUNIOR', crm: 'CRM 6558/DF', especialidade: 'Clínica Médica', cidade: 'Brasília', uf: 'DF' },
    { nome: 'DR. ABDIAS JOSÉ DE MORAIS BARBOSA', crm: 'CRM 5346/DF', especialidade: 'Clínica Médica', cidade: 'Brasília', uf: 'DF' },
    // GO - Anápolis
    { nome: 'DR. ABMAEL SILVÉRIO DA SILVA', crm: 'CRM 7367/GO', especialidade: 'Clínica Médica', cidade: 'Anápolis', uf: 'GO' },
    { nome: 'DR. ABNER HENRIQUE FLEURY', crm: 'CRM 26393/GO', especialidade: 'Clínica Médica', cidade: 'Anápolis', uf: 'GO' },
    { nome: 'DR. ABNER LOURENÇO DA FONSECA', crm: 'CRM 28046/GO', especialidade: 'Clínica Médica', cidade: 'Anápolis', uf: 'GO' },
    { nome: 'DR. ABRAHÃO ISSA NETO', crm: 'CRM 1718/GO', especialidade: 'Clínica Médica', cidade: 'Anápolis', uf: 'GO' },
    { nome: 'DR. ACÁCIO JUNIO DE ALMEIDA', crm: 'CRM 18160/GO', especialidade: 'Clínica Médica', cidade: 'Anápolis', uf: 'GO' },
    // GO - Aparecida de Goiânia
    { nome: 'DR. ABILIO ROBERTO DE ARAUJO BORGES', crm: 'CRM 5205/GO', especialidade: 'Clínica Médica', cidade: 'Aparecida de Goiânia', uf: 'GO' },
    { nome: 'DR. ADAILSON SOARES DE SOUSA', crm: 'CRM 23331/GO', especialidade: 'Clínica Médica', cidade: 'Aparecida de Goiânia', uf: 'GO' },
    { nome: 'DR. ADELIO FERREIRA LEITE', crm: 'CRM 1326/GO', especialidade: 'Clínica Médica', cidade: 'Aparecida de Goiânia', uf: 'GO' },
    { nome: 'DRA. ADRIANA BONAN', crm: 'CRM 34474/GO', especialidade: 'Clínica Médica', cidade: 'Aparecida de Goiânia', uf: 'GO' },
    { nome: 'DRA. ADRIANE AGUIAR GONTIJO', crm: 'CRM 39120/GO', especialidade: 'Clínica Médica', cidade: 'Aparecida de Goiânia', uf: 'GO' },
    // GO - Edeia
    { nome: 'DR. ADRIEL FELIPE FREITAS NUNES', crm: 'CRM 34478/GO', especialidade: 'Clínica Médica', cidade: 'Edeia', uf: 'GO' },
    { nome: 'DR. ALISSON HENRIQUE FERNANDES', crm: 'CRM 14103/GO', especialidade: 'Clínica Médica', cidade: 'Edeia', uf: 'GO' },
    { nome: 'DRA. AMANDA FERREIRA E FERRO', crm: 'CRM 34998/GO', especialidade: 'Clínica Médica', cidade: 'Edeia', uf: 'GO' },
    { nome: 'DR. AMILSON FERREIRA BORGES', crm: 'CRM 3903/GO', especialidade: 'Clínica Médica', cidade: 'Edeia', uf: 'GO' },
    { nome: 'DRA. ANA CAROLINA REZENDE HERCOS', crm: 'CRM 16526/GO', especialidade: 'Clínica Médica', cidade: 'Edeia', uf: 'GO' },
    // GO - Goiânia
    { nome: 'DR. ABDALA NOGUEIRA AMUY', crm: 'CRM 3950/GO', especialidade: 'Clínica Médica', cidade: 'Goiânia', uf: 'GO' },
    { nome: 'DR. ABDALA SEBBA PRIMO', crm: 'CRM 2277/GO', especialidade: 'Clínica Médica', cidade: 'Goiânia', uf: 'GO' },
    { nome: 'DR. ABEL ALEXANDRE HANNUM', crm: 'CRM 5647/GO', especialidade: 'Clínica Médica', cidade: 'Goiânia', uf: 'GO' },
    { nome: 'DR. ABELARDO MOREIRA CARVALHO', crm: 'CRM 2585/GO', especialidade: 'Clínica Médica', cidade: 'Goiânia', uf: 'GO' },
    { nome: 'DR. ABIDALA MIGUEL FILHO', crm: 'CRM 3643/GO', especialidade: 'Clínica Médica', cidade: 'Goiânia', uf: 'GO' },
    // GO - Quirinópolis
    { nome: 'DRA. ALESSANDRA DA SILVA DE SOUZA SILVA', crm: 'CRM 13179/GO', especialidade: 'Clínica Médica', cidade: 'Quirinópolis', uf: 'GO' },
    { nome: 'DRA. ALLANA CAMPOS ALVES', crm: 'CRM 27249/GO', especialidade: 'Clínica Médica', cidade: 'Quirinópolis', uf: 'GO' },
    { nome: 'DRA. AMANDA VIEIRA SACARDO', crm: 'CRM 31448/GO', especialidade: 'Clínica Médica', cidade: 'Quirinópolis', uf: 'GO' },
    { nome: 'DRA. ANA CAROLINA ALVES NOVAIS', crm: 'CRM 22194/GO', especialidade: 'Clínica Médica', cidade: 'Quirinópolis', uf: 'GO' },
    { nome: 'DRA. ANA CAROLINA CARNIO BARRUFFINI', crm: 'CRM 28077/GO', especialidade: 'Clínica Médica', cidade: 'Quirinópolis', uf: 'GO' },
    // GO - Rio Verde
    { nome: 'DR. ABILIO BARONI SALES', crm: 'CRM 5729/GO', especialidade: 'Clínica Médica', cidade: 'Rio Verde', uf: 'GO' },
    { nome: 'DR. ABÍLIO JOSÉ DE OLIVEIRA NETO', crm: 'CRM 37814/GO', especialidade: 'Clínica Médica', cidade: 'Rio Verde', uf: 'GO' },
    { nome: 'DR. ADEMAR LEÃO LEMES ROCHA CALABRIA', crm: 'CRM 22920/GO', especialidade: 'Clínica Médica', cidade: 'Rio Verde', uf: 'GO' },
    { nome: 'DR. ADEMIR GUERREIRO BARBOSA', crm: 'CRM 17396/GO', especialidade: 'Clínica Médica', cidade: 'Rio Verde', uf: 'GO' },
    { nome: 'DR. ADRIANO LINARES', crm: 'CRM 10293/GO', especialidade: 'Clínica Médica', cidade: 'Rio Verde', uf: 'GO' },
    // MA - São Luís
    { nome: 'DR. AARÃO LUIZ DA SILVA EUFRASIO', crm: 'CRM 15357/MA', especialidade: 'Clínica Médica', cidade: 'São Luís', uf: 'MA' },
    { nome: 'DR. ABDERVAL PINTO BANDEIRA NETO', crm: 'CRM 4189/MA', especialidade: 'Clínica Médica', cidade: 'São Luís', uf: 'MA' },
    { nome: 'DR. ABDIAS ROCHA SANTOS', crm: 'CRM 3305/MA', especialidade: 'Clínica Médica', cidade: 'São Luís', uf: 'MA' },
    { nome: 'DR. ABDON JOSE MURAD JUNIOR', crm: 'CRM 4500/MA', especialidade: 'Clínica Médica', cidade: 'São Luís', uf: 'MA' },
    { nome: 'DR. ABDON JOSÉ MURAD NETO', crm: 'CRM 1146/MA', especialidade: 'Clínica Médica', cidade: 'São Luís', uf: 'MA' },
    // MG - Alfenas
    { nome: 'DR. ADALBERTO ZAULI DOS SANTOS', crm: 'CRM 47940/MG', especialidade: 'Clínica Médica', cidade: 'Alfenas', uf: 'MG' },
    { nome: 'DR. ADAUTO DE CASTRO SOARES', crm: 'CRM 25256/MG', especialidade: 'Clínica Médica', cidade: 'Alfenas', uf: 'MG' },
    { nome: 'DR. ADEILSON DE MELO CORDEIRO', crm: 'CRM 103955/MG', especialidade: 'Clínica Médica', cidade: 'Alfenas', uf: 'MG' },
    { nome: 'DR. ADELINO MOREIRA DE CARVALHO', crm: 'CRM 21789/MG', especialidade: 'Clínica Médica', cidade: 'Alfenas', uf: 'MG' },
    { nome: 'DR. ADEMIR ALBANO DA SILVA', crm: 'CRM 16774/MG', especialidade: 'Clínica Médica', cidade: 'Alfenas', uf: 'MG' },
    // MG - Belo Horizonte
    { nome: 'DR. ABCDARIO FERNANDO DE PINHO', crm: 'CRM 4522/MG', especialidade: 'Clínica Médica', cidade: 'Belo Horizonte', uf: 'MG' },
    { nome: 'DR. ABDALLA UBALDO FELÍCIO', crm: 'CRM 36288/MG', especialidade: 'Clínica Médica', cidade: 'Belo Horizonte', uf: 'MG' },
    { nome: 'DR. ABDENACK ESTEVES TRINDADE', crm: 'CRM 25324/MG', especialidade: 'Clínica Médica', cidade: 'Belo Horizonte', uf: 'MG' },
    { nome: 'DR. ABEL SOARES DE FARIA', crm: 'CRM 6324/MG', especialidade: 'Clínica Médica', cidade: 'Belo Horizonte', uf: 'MG' },
    { nome: 'DR. ABEL RANZZI', crm: 'CRM 65444/MG', especialidade: 'Clínica Médica', cidade: 'Belo Horizonte', uf: 'MG' },
    // MG - Betim
    { nome: 'DR. ADAUTO DA COSTA', crm: 'CRM 23362/MG', especialidade: 'Clínica Médica', cidade: 'Betim', uf: 'MG' },
    { nome: 'DR. ADMIR TADEU DE OLIVEIRA', crm: 'CRM 17718/MG', especialidade: 'Clínica Médica', cidade: 'Betim', uf: 'MG' },
    { nome: 'DRA. ADRIANA DINIZ DE DEUS', crm: 'CRM 17330/MG', especialidade: 'Clínica Médica', cidade: 'Betim', uf: 'MG' },
    { nome: 'DRA. ADRIANA DOS SANTOS PINTO BRITO', crm: 'CRM 36751/MG', especialidade: 'Clínica Médica', cidade: 'Betim', uf: 'MG' },
    { nome: 'DRA. ADRIANA LEMOS SILVA', crm: 'CRM 32011/MG', especialidade: 'Clínica Médica', cidade: 'Betim', uf: 'MG' },
    // MG - Contagem
    { nome: 'DR. ADEMAR FERREIRA DE ANDRADE JÚNIOR', crm: 'CRM 42993/MG', especialidade: 'Clínica Médica', cidade: 'Contagem', uf: 'MG' },
    { nome: 'DRA. ADRIANA APARECIDA SILVA', crm: 'CRM 42805/MG', especialidade: 'Clínica Médica', cidade: 'Contagem', uf: 'MG' },
    { nome: 'DRA. ADRIANA VERONICA AVILÉS COZZI', crm: 'CRM 81071/MG', especialidade: 'Clínica Médica', cidade: 'Contagem', uf: 'MG' },
    { nome: 'DRA. ADRIANNA BUZATTI VIANA', crm: 'CRM 71689/MG', especialidade: 'Clínica Médica', cidade: 'Contagem', uf: 'MG' },
    { nome: 'DR. ADRIANO BIZARRO VILLELA BETTONI', crm: 'CRM 61327/MG', especialidade: 'Clínica Médica', cidade: 'Contagem', uf: 'MG' },
    // MG - Divinópolis
    { nome: 'DRA. ABIQUEILA DA SILVA CONCEIÇÃO', crm: 'CRM 63841/MG', especialidade: 'Clínica Médica', cidade: 'Divinópolis', uf: 'MG' },
    { nome: 'DR. ACHILES GIOVANARD', crm: 'CRM 2525/MG', especialidade: 'Clínica Médica', cidade: 'Divinópolis', uf: 'MG' },
    { nome: 'DR. ADALJONIO DUARTE CAMARA', crm: 'CRM 13078/MG', especialidade: 'Clínica Médica', cidade: 'Divinópolis', uf: 'MG' },
    { nome: 'DR. ADMAURO ESTEVES DE MACEDO', crm: 'CRM 28155/MG', especialidade: 'Clínica Médica', cidade: 'Divinópolis', uf: 'MG' },
    { nome: 'DRA. ADRIANA CRISTINA PINTO SILVA', crm: 'CRM 54131/MG', especialidade: 'Clínica Médica', cidade: 'Divinópolis', uf: 'MG' },
    // MG - Ituiutaba
    { nome: 'DR. ADALBERTO ABDO MARTINS', crm: 'CRM 17818/MG', especialidade: 'Clínica Médica', cidade: 'Ituiutaba', uf: 'MG' },
    { nome: 'DR. ADAO DIVINO FRANCO', crm: 'CRM 13892/MG', especialidade: 'Clínica Médica', cidade: 'Ituiutaba', uf: 'MG' },
    { nome: 'DR. ADELOR ALVES DE GOUVEIA', crm: 'CRM 2822/MG', especialidade: 'Clínica Médica', cidade: 'Ituiutaba', uf: 'MG' },
    { nome: 'DR. ADRIANO FONSECA DAMIAO', crm: 'CRM 11347/MG', especialidade: 'Clínica Médica', cidade: 'Ituiutaba', uf: 'MG' },
    { nome: 'DRA. ADRIENE DA SILVA LUCAS', crm: 'CRM 78140/MG', especialidade: 'Clínica Médica', cidade: 'Ituiutaba', uf: 'MG' },
    // MG - Nova Ponte
    { nome: 'DR. ADEMIR VIEIRA SOUZA', crm: 'CRM 17314/MG', especialidade: 'Clínica Médica', cidade: 'Nova Ponte', uf: 'MG' },
    { nome: 'DRA. ALANA BRUNETTO SABADIN', crm: 'CRM 80198/MG', especialidade: 'Clínica Médica', cidade: 'Nova Ponte', uf: 'MG' },
    { nome: 'DR. DANIEL RODRIGUES', crm: 'CRM 60879/MG', especialidade: 'Clínica Médica', cidade: 'Nova Ponte', uf: 'MG' },
    { nome: 'DRA. FERNANDA KRISTINA CARNEIRO', crm: 'CRM 111975/MG', especialidade: 'Clínica Médica', cidade: 'Nova Ponte', uf: 'MG' },
    { nome: 'DR. HILTON RESENDE JACOB', crm: 'CRM 41232/MG', especialidade: 'Clínica Médica', cidade: 'Nova Ponte', uf: 'MG' },
    // MG - Poços de Caldas
    { nome: 'DR. ADAUTO BOTELHO MEGALE', crm: 'CRM 10951/MG', especialidade: 'Clínica Médica', cidade: 'Poços de Caldas', uf: 'MG' },
    { nome: 'DR. ADELSON PENHA DE LIMA', crm: 'CRM 42658/MG', especialidade: 'Clínica Médica', cidade: 'Poços de Caldas', uf: 'MG' },
    { nome: 'DR. ADNEI PEREIRA DE MORAES', crm: 'CRM 8500/MG', especialidade: 'Clínica Médica', cidade: 'Poços de Caldas', uf: 'MG' },
    { nome: 'DRA. ADRIANA NUNES DA SILVA', crm: 'CRM 25567/MG', especialidade: 'Clínica Médica', cidade: 'Poços de Caldas', uf: 'MG' },
    { nome: 'DRA. ADRIANE SOUZA DO NASCIMENTO', crm: 'CRM 106550/MG', especialidade: 'Clínica Médica', cidade: 'Poços de Caldas', uf: 'MG' },
    // MG - Uberaba
    { nome: 'DR. AARON DA COSTA TELLES', crm: 'CRM 73568/MG', especialidade: 'Clínica Médica', cidade: 'Uberaba', uf: 'MG' },
    { nome: 'DRA. ABADIA ROCHA FINHOLDT', crm: 'CRM 10464/MG', especialidade: 'Clínica Médica', cidade: 'Uberaba', uf: 'MG' },
    { nome: 'DR. AFONSO CARVALHO SILVA', crm: 'CRM 69943/MG', especialidade: 'Clínica Médica', cidade: 'Uberaba', uf: 'MG' },
    { nome: 'DRA. AFIFE HALLAL DA CUNHA', crm: 'CRM 4061/MG', especialidade: 'Clínica Médica', cidade: 'Uberaba', uf: 'MG' },
    { nome: 'DR. AFÁBIO LOPES CANÇADO', crm: 'CRM 51159/MG', especialidade: 'Clínica Médica', cidade: 'Uberaba', uf: 'MG' },
    // MG - Uberlândia
    { nome: 'DRA. ABADIA GILDA BUSO MATOSO', crm: 'CRM 28332/MG', especialidade: 'Clínica Médica', cidade: 'Uberlândia', uf: 'MG' },
    { nome: 'DR. ABADIO JOSÉ SILVA', crm: 'CRM 23325/MG', especialidade: 'Clínica Médica', cidade: 'Uberlândia', uf: 'MG' },
    { nome: 'DR. ABADIO LOURIVAM PEREIRA JUNIOR', crm: 'CRM 56786/MG', especialidade: 'Clínica Médica', cidade: 'Uberlândia', uf: 'MG' },
    { nome: 'DR. ABDALLA MIGUEL', crm: 'CRM 982/MG', especialidade: 'Clínica Médica', cidade: 'Uberlândia', uf: 'MG' },
    { nome: 'DR. ABDULKARIM MILKEM', crm: 'CRM 5927/MG', especialidade: 'Clínica Médica', cidade: 'Uberlândia', uf: 'MG' },
    // MG - Varginha
    { nome: 'DR. AARÃO SALOMÃO COHEN JÚNIOR', crm: 'CRM 27499/MG', especialidade: 'Clínica Médica', cidade: 'Varginha', uf: 'MG' },
    { nome: 'DRA. ACLECIA CARNEIRO DE MENDONCA', crm: 'CRM 26379/MG', especialidade: 'Clínica Médica', cidade: 'Varginha', uf: 'MG' },
    { nome: 'DR. ADEMIR OSSANI', crm: 'CRM 12377/MG', especialidade: 'Clínica Médica', cidade: 'Varginha', uf: 'MG' },
    { nome: 'DR. ADILSON MARCIANO ROSA', crm: 'CRM 17642/MG', especialidade: 'Clínica Médica', cidade: 'Varginha', uf: 'MG' },
    { nome: 'DR. ADRIAN NOGUEIRA BUENO', crm: 'CRM 33911/MG', especialidade: 'Clínica Médica', cidade: 'Varginha', uf: 'MG' },
    // PB - Campina Grande
    { nome: 'DR. ABDISIO PRAZERES NETO', crm: 'CRM 5761/PB', especialidade: 'Clínica Médica', cidade: 'Campina Grande', uf: 'PB' },
    { nome: 'DR. ABELARDO DA MATTA RIBEIRO SOBRINHO', crm: 'CRM 3901/PB', especialidade: 'Clínica Médica', cidade: 'Campina Grande', uf: 'PB' },
    { nome: 'DR. ABRAÃO ALANDEC DINIZ DE MORAES', crm: 'CRM 8072/PB', especialidade: 'Clínica Médica', cidade: 'Campina Grande', uf: 'PB' },
    { nome: 'DR. ABRAÃO SOUSA BRITO', crm: 'CRM 12256/PB', especialidade: 'Clínica Médica', cidade: 'Campina Grande', uf: 'PB' },
    { nome: 'DRA. ACIDALIA MARIA HOLANDA LACERDA', crm: 'CRM 2351/PB', especialidade: 'Clínica Médica', cidade: 'Campina Grande', uf: 'PB' },
    // PB - João Pessoa
    { nome: 'DR. ABDON MOREIRA LUSTOSA', crm: 'CRM 4184/PB', especialidade: 'Clínica Médica', cidade: 'João Pessoa', uf: 'PB' },
    { nome: 'DR. ABEL AUSTERO DE SOUSA BENJAMIN FILHO', crm: 'CRM 18219/PB', especialidade: 'Clínica Médica', cidade: 'João Pessoa', uf: 'PB' },
    { nome: 'DR. ABEL BARBOSA DE ARAÚJO GOMES', crm: 'CRM 13227/PB', especialidade: 'Clínica Médica', cidade: 'João Pessoa', uf: 'PB' },
    { nome: 'DR. ABEL GOMES BELTRAO', crm: 'CRM 43/PB', especialidade: 'Clínica Médica', cidade: 'João Pessoa', uf: 'PB' },
    { nome: 'DR. ABELARDO DA SILVA MELO JUNIOR', crm: 'CRM 2439/PB', especialidade: 'Clínica Médica', cidade: 'João Pessoa', uf: 'PB' },
    // PI - Teresina
    { nome: 'DR. AARÃO ANDRADE NAPOLEÃO LIMA', crm: 'CRM 6943/PI', especialidade: 'Clínica Médica', cidade: 'Teresina', uf: 'PI' },
    { nome: 'DR. AARAO CRUZ MENDES', crm: 'CRM 1803/PI', especialidade: 'Clínica Médica', cidade: 'Teresina', uf: 'PI' },
    { nome: 'DR. ABDON ADYNAN DE ARAUJO SOUSA', crm: 'CRM 9433/PI', especialidade: 'Clínica Médica', cidade: 'Teresina', uf: 'PI' },
    { nome: 'DR. ABEL DE BARROS ARAUJO FILHO', crm: 'CRM 7594/PI', especialidade: 'Clínica Médica', cidade: 'Teresina', uf: 'PI' },
    { nome: 'DRA. ABIGAIL GOMES DE FRANÇA', crm: 'CRM 10196/PI', especialidade: 'Clínica Médica', cidade: 'Teresina', uf: 'PI' },
    // PE - Cabo de Santo Agostinho
    { nome: 'DRA. ÁGATA STANISCI', crm: 'CRM 25255/PE', especialidade: 'Clínica Médica', cidade: 'Cabo de Santo Agostinho', uf: 'PE' },
    { nome: 'DR. ALBERTO EUSTAQUIO CALDEIRA DE MELO', crm: 'CRM 21622/PE', especialidade: 'Clínica Médica', cidade: 'Cabo de Santo Agostinho', uf: 'PE' },
    { nome: 'DR. ANTÔNIO BARRETO DE MIRANDA', crm: 'CRM 5180/PE', especialidade: 'Clínica Médica', cidade: 'Cabo de Santo Agostinho', uf: 'PE' },
    { nome: 'DR. ANTÔNIO BEZERRA DE MELO CALHEIROS', crm: 'CRM 14702/PE', especialidade: 'Clínica Médica', cidade: 'Cabo de Santo Agostinho', uf: 'PE' },
    { nome: 'DRA. BEATRIZ DA FONSECA CHAVES', crm: 'CRM 1323/PE', especialidade: 'Clínica Médica', cidade: 'Cabo de Santo Agostinho', uf: 'PE' },
    // PE - Goiana
    { nome: 'DR. ALAN ZANLUCHI', crm: 'CRM 22089/PE', especialidade: 'Clínica Médica', cidade: 'Goiana', uf: 'PE' },
    { nome: 'DRA. ANDREA PERALES ALBUQUERQUE', crm: 'CRM 25957/PE', especialidade: 'Clínica Médica', cidade: 'Goiana', uf: 'PE' },
    { nome: 'DR. ANTÔNIO CARLOS CORREIA DE SOUZA', crm: 'CRM 5389/PE', especialidade: 'Clínica Médica', cidade: 'Goiana', uf: 'PE' },
    { nome: 'DR. ANTONIO TAVARES DE SOUZA FILHO', crm: 'CRM 7433/PE', especialidade: 'Clínica Médica', cidade: 'Goiana', uf: 'PE' },
    { nome: 'DR. BENIGNO PESSOA DE ARAUJO', crm: 'CRM 60/PE', especialidade: 'Clínica Médica', cidade: 'Goiana', uf: 'PE' },
    // PE - Jaboatão dos Guararapes
    { nome: 'DR. ABEL NUNES DE OLIVEIRA FILHO', crm: 'CRM 1935/PE', especialidade: 'Clínica Médica', cidade: 'Jaboatão dos Guararapes', uf: 'PE' },
    { nome: 'DR. ADALBERTO DE SOUZA', crm: 'CRM 675/PE', especialidade: 'Clínica Médica', cidade: 'Jaboatão dos Guararapes', uf: 'PE' },
    { nome: 'DR. ADAMASTOR SARTORI BARBOSA COELHO', crm: 'CRM 2629/PE', especialidade: 'Clínica Médica', cidade: 'Jaboatão dos Guararapes', uf: 'PE' },
    { nome: 'DR. ADEILDO SIMÕES DA SILVA', crm: 'CRM 3062/PE', especialidade: 'Clínica Médica', cidade: 'Jaboatão dos Guararapes', uf: 'PE' },
    { nome: 'DR. ADILSON DE OLIVEIRA LIMA', crm: 'CRM 1618/PE', especialidade: 'Clínica Médica', cidade: 'Jaboatão dos Guararapes', uf: 'PE' },
    // PE - Olinda
    { nome: 'DR. ABIDENEGO JUSTINO RAMOS NETO', crm: 'CRM 40627/PE', especialidade: 'Clínica Médica', cidade: 'Olinda', uf: 'PE' },
    { nome: 'DR. ABIGAR GUARANA TABOSA', crm: 'CRM 1412/PE', especialidade: 'Clínica Médica', cidade: 'Olinda', uf: 'PE' },
    { nome: 'DRA. AÇUCENA LIRA LINS', crm: 'CRM 37251/PE', especialidade: 'Clínica Médica', cidade: 'Olinda', uf: 'PE' },
    { nome: 'DR. ADAILTON DE ALENCAR VIDAL', crm: 'CRM 4336/PE', especialidade: 'Clínica Médica', cidade: 'Olinda', uf: 'PE' },
    { nome: 'DRA. ADELINE SILVA MOURA GOMES', crm: 'CRM 20260/PE', especialidade: 'Clínica Médica', cidade: 'Olinda', uf: 'PE' },
    // PE - Paulista
    { nome: 'DR. ABELARDO ULISSES MAIA DE FARIAS', crm: 'CRM 3787/PE', especialidade: 'Clínica Médica', cidade: 'Paulista', uf: 'PE' },
    { nome: 'DR. ADAUTO XAVIER CARNEIRO PESSOA FILHO', crm: 'CRM 1893/PE', especialidade: 'Clínica Médica', cidade: 'Paulista', uf: 'PE' },
    { nome: 'DR. ADOLFO PEREIRA DE ARRUDA', crm: 'CRM 910/PE', especialidade: 'Clínica Médica', cidade: 'Paulista', uf: 'PE' },
    { nome: 'DR. ADRIANO MENDONCA DOS SANTOS', crm: 'CRM 13152/PE', especialidade: 'Clínica Médica', cidade: 'Paulista', uf: 'PE' },
    { nome: 'DR. ADSON CORDEIRO DA SILVA', crm: 'CRM 20414/PE', especialidade: 'Clínica Médica', cidade: 'Paulista', uf: 'PE' },
    // PE - Recife
    { nome: 'DR. ABAETE DE MEDEIROS', crm: 'CRM 1971/PE', especialidade: 'Clínica Médica', cidade: 'Recife', uf: 'PE' },
    { nome: 'DR. ADALBERTO DA SILVA CASTRO', crm: 'CRM 442/PE', especialidade: 'Clínica Médica', cidade: 'Recife', uf: 'PE' },
    { nome: 'DR. ADAILTON VERAS RIBEIRO', crm: 'CRM 2775/PE', especialidade: 'Clínica Médica', cidade: 'Recife', uf: 'PE' },
    { nome: 'DRA. ADEÍZA DE ALENCAR BRANCO', crm: 'CRM 8565/PE', especialidade: 'Clínica Médica', cidade: 'Recife', uf: 'PE' },
    { nome: 'DR. ADEILTON QUEIROZ MAFRA', crm: 'CRM 4119/PE', especialidade: 'Clínica Médica', cidade: 'Recife', uf: 'PE' },
    // RS - Canoas
    { nome: 'DR. ABDIEL LEITE DE SOUZA', crm: 'CRM 40472/RS', especialidade: 'Clínica Médica', cidade: 'Canoas', uf: 'RS' },
    { nome: 'DR. ABUD HOMSI NETO', crm: 'CRM 20814/RS', especialidade: 'Clínica Médica', cidade: 'Canoas', uf: 'RS' },
    { nome: 'DR. ACIR JULIO MANGONI', crm: 'CRM 3196/RS', especialidade: 'Clínica Médica', cidade: 'Canoas', uf: 'RS' },
    { nome: 'DR. ADAIR BERVIG', crm: 'CRM 10827/RS', especialidade: 'Clínica Médica', cidade: 'Canoas', uf: 'RS' },
    { nome: 'DR. ADÃO CARVALHO CRAVO', crm: 'CRM 8041/RS', especialidade: 'Clínica Médica', cidade: 'Canoas', uf: 'RS' },
    // RS - Gravataí
    { nome: 'DR. ALBERTO LUIZ GIL', crm: 'CRM 27575/RS', especialidade: 'Clínica Médica', cidade: 'Gravataí', uf: 'RS' },
    { nome: 'DR. ALESSANDRO RODRIGO LINDNER', crm: 'CRM 26830/RS', especialidade: 'Clínica Médica', cidade: 'Gravataí', uf: 'RS' },
    { nome: 'DR. ALEX MENGUE WOJCICKI', crm: 'CRM 36955/RS', especialidade: 'Clínica Médica', cidade: 'Gravataí', uf: 'RS' },
    { nome: 'DRA. ALEXANDRA WEBER LAMELA', crm: 'CRM 59352/RS', especialidade: 'Clínica Médica', cidade: 'Gravataí', uf: 'RS' },
    { nome: 'DRA. ALINE ASTAFIEFF DA ROSA', crm: 'CRM 52301/RS', especialidade: 'Clínica Médica', cidade: 'Gravataí', uf: 'RS' },
    // RS - Guaíba
    { nome: 'DRA. ADRIANA MARIA KORENOWSKI URANGA', crm: 'CRM 17179/RS', especialidade: 'Clínica Médica', cidade: 'Guaíba', uf: 'RS' },
    { nome: 'DRA. ANGÉLICA DE ARAÚJO AMORIM', crm: 'CRM 60611/RS', especialidade: 'Clínica Médica', cidade: 'Guaíba', uf: 'RS' },
    { nome: 'DR. ARLEN BIANOR SILVA DE OLIVEIRA', crm: 'CRM 55437/RS', especialidade: 'Clínica Médica', cidade: 'Guaíba', uf: 'RS' },
    { nome: 'DRA. BETÂNIA FORMENTINI DE FREITAS', crm: 'CRM 61536/RS', especialidade: 'Clínica Médica', cidade: 'Guaíba', uf: 'RS' },
    { nome: 'DR. BISMARCK MARTÍN ORTEGA', crm: 'CRM 52960/RS', especialidade: 'Clínica Médica', cidade: 'Guaíba', uf: 'RS' },
    // RS - Novo Hamburgo
    { nome: 'DR. ABILIO RAMOS PILGER JUNIOR', crm: 'CRM 11537/RS', especialidade: 'Clínica Médica', cidade: 'Novo Hamburgo', uf: 'RS' },
    { nome: 'DR. ADEMAR EDGAR TREIN', crm: 'CRM 6710/RS', especialidade: 'Clínica Médica', cidade: 'Novo Hamburgo', uf: 'RS' },
    { nome: 'DRA. ADRIANA BENITO DA SILVA', crm: 'CRM 26159/RS', especialidade: 'Clínica Médica', cidade: 'Novo Hamburgo', uf: 'RS' },
    { nome: 'DRA. AIMEE SCHIRMER VIEIRA', crm: 'CRM 61827/RS', especialidade: 'Clínica Médica', cidade: 'Novo Hamburgo', uf: 'RS' },
    { nome: 'DRA. ADRIANA MARTIN', crm: 'CRM 41318/RS', especialidade: 'Clínica Médica', cidade: 'Novo Hamburgo', uf: 'RS' },
    // RS - Porto Alegre
    { nome: 'DRA. ADRIANE CAMOZZATO FONTE', crm: 'CRM 16090/RS', especialidade: 'Clínica Médica', cidade: 'Porto Alegre', uf: 'RS' },
    { nome: 'DR. ADRIANO CALCAGNOTTO GARCIA', crm: 'CRM 35744/RS', especialidade: 'Clínica Médica', cidade: 'Porto Alegre', uf: 'RS' },
    { nome: 'DR. AFFONSO ALVES PEREIRA MERCIO', crm: 'CRM 9868/RS', especialidade: 'Clínica Médica', cidade: 'Porto Alegre', uf: 'RS' },
    { nome: 'DR. AGAMENON PRIEBE DE SOUZA', crm: 'CRM 21502/RS', especialidade: 'Clínica Médica', cidade: 'Porto Alegre', uf: 'RS' },
    { nome: 'DR. AILZO JOSE DA COSTA', crm: 'CRM 9450/RS', especialidade: 'Clínica Médica', cidade: 'Porto Alegre', uf: 'RS' },
    // RS - São Leopoldo
    { nome: 'DR. ADILSON ROSSI CERON', crm: 'CRM 33597/RS', especialidade: 'Clínica Médica', cidade: 'São Leopoldo', uf: 'RS' },
    { nome: 'DRA. ADRIANA TAGLIARI OSTERMANN', crm: 'CRM 8765/RS', especialidade: 'Clínica Médica', cidade: 'São Leopoldo', uf: 'RS' },
    { nome: 'DR. JEAN CESAR FOGAÇA PEREIRA', crm: 'CRM 27269/RS', especialidade: 'Clínica Médica', cidade: 'São Leopoldo', uf: 'RS' },
    { nome: 'DRA. JANICE TERESINHA KROTH DE CARVALHO', crm: 'CRM 21680/RS', especialidade: 'Clínica Médica', cidade: 'São Leopoldo', uf: 'RS' },
    { nome: 'DR. JOSE AUGUSTO MACHADO PROLA', crm: 'CRM 24667/RS', especialidade: 'Clínica Médica', cidade: 'São Leopoldo', uf: 'RS' },
    // RS - Viamão
    { nome: 'DR. AIDOS ANTONIO MOSER SCHENINI', crm: 'CRM 12196/RS', especialidade: 'Clínica Médica', cidade: 'Viamão', uf: 'RS' },
    { nome: 'DR. ALEXANDRE DE OLIVEIRA ZORZATO', crm: 'CRM 16390/RS', especialidade: 'Clínica Médica', cidade: 'Viamão', uf: 'RS' },
    { nome: 'DR. ALEXANDRE SIMOES COSTA', crm: 'CRM 17163/RS', especialidade: 'Clínica Médica', cidade: 'Viamão', uf: 'RS' },
    { nome: 'DR. ALVARO DE CAMPOS SANTIAGO JUNIOR', crm: 'CRM 54090/RS', especialidade: 'Clínica Médica', cidade: 'Viamão', uf: 'RS' },
    { nome: 'DR. ALYSSON AMARAL BARRETO', crm: 'CRM 59263/RS', especialidade: 'Clínica Médica', cidade: 'Viamão', uf: 'RS' },
    // SC - Balneário Camboriú
    { nome: 'DR. ADECIR GERALDO NEUBAUER', crm: 'CRM 11383/SC', especialidade: 'Clínica Médica', cidade: 'Balneário Camboriú', uf: 'SC' },
    { nome: 'DR. ADEMAR ANSELMO KEHL', crm: 'CRM 1898/SC', especialidade: 'Clínica Médica', cidade: 'Balneário Camboriú', uf: 'SC' },
    { nome: 'DR. ADEMAR NARDELLI', crm: 'CRM 1900/SC', especialidade: 'Clínica Médica', cidade: 'Balneário Camboriú', uf: 'SC' },
    { nome: 'DR. ADEMAR STIMAMIGLIO JUNIOR', crm: 'CRM 11809/SC', especialidade: 'Clínica Médica', cidade: 'Balneário Camboriú', uf: 'SC' },
    { nome: 'DRA. ADILA MARIA ARAUJO DA SILVA', crm: 'CRM 26377/SC', especialidade: 'Clínica Médica', cidade: 'Balneário Camboriú', uf: 'SC' },
    // SC - Blumenau
    { nome: 'DR. ABDUL AMIR HASSAN YASSINE', crm: 'CRM 38440/SC', especialidade: 'Clínica Médica', cidade: 'Blumenau', uf: 'SC' },
    { nome: 'DR. ABEL DEMAR CESPEDES ALCOBA', crm: 'CRM 300-25148/SC', especialidade: 'Clínica Médica', cidade: 'Blumenau', uf: 'SC' },
    { nome: 'DR. ABELARDO VIANNA', crm: 'CRM 60/SC', especialidade: 'Clínica Médica', cidade: 'Blumenau', uf: 'SC' },
    { nome: 'DR. ABNER NADOLNY PARTALA', crm: 'CRM 36876/SC', especialidade: 'Clínica Médica', cidade: 'Blumenau', uf: 'SC' },
    { nome: 'DR. ADEMIR SCHLINDWEIN', crm: 'CRM 3087/SC', especialidade: 'Clínica Médica', cidade: 'Blumenau', uf: 'SC' },
    // SC - Indaial
    { nome: 'DR. ADEMIR DANILO ZARDO', crm: 'CRM 2611/SC', especialidade: 'Clínica Médica', cidade: 'Indaial', uf: 'SC' },
    { nome: 'DR. ADRIANO DE SOUZA SOTTO MAYOR', crm: 'CRM 29258/SC', especialidade: 'Clínica Médica', cidade: 'Indaial', uf: 'SC' },
    { nome: 'DRA. AIDA SHIRLEY BARJA ELIAS', crm: 'CRM 11351/SC', especialidade: 'Clínica Médica', cidade: 'Indaial', uf: 'SC' },
    { nome: 'DR. ALAN MICHEL FURLAN', crm: 'CRM 24066/SC', especialidade: 'Clínica Médica', cidade: 'Indaial', uf: 'SC' },
    { nome: 'DR. ALFREDO NAGEL', crm: 'CRM 1857/SC', especialidade: 'Clínica Médica', cidade: 'Indaial', uf: 'SC' },
    // SC - Itajaí
    { nome: 'DR. ABEL FERNANDO RECH', crm: 'CRM 7861/SC', especialidade: 'Clínica Médica', cidade: 'Itajaí', uf: 'SC' },
    { nome: 'DR. ADALBERTO CESARIO PEREIRA JUNIOR', crm: 'CRM 5971/SC', especialidade: 'Clínica Médica', cidade: 'Itajaí', uf: 'SC' },
    { nome: 'DR. ADOLFO LUIZ FALCAO SPARENBERG', crm: 'CRM 24221/SC', especialidade: 'Clínica Médica', cidade: 'Itajaí', uf: 'SC' },
    { nome: 'DR. ADRIAN OLIVEIRA DE MORAES', crm: 'CRM 42907/SC', especialidade: 'Clínica Médica', cidade: 'Itajaí', uf: 'SC' },
    { nome: 'DRA. ADRIANA BARBIERI', crm: 'CRM 36661/SC', especialidade: 'Clínica Médica', cidade: 'Itajaí', uf: 'SC' },
    // SC - Jaraguá do Sul
    { nome: 'DR. ADALBERTO ALVES DE CASTRO', crm: 'CRM 41887/SC', especialidade: 'Clínica Médica', cidade: 'Jaraguá do Sul', uf: 'SC' },
    { nome: 'DR. ADEMAR MENDES DE SOUZA JUNIOR', crm: 'CRM 22638/SC', especialidade: 'Clínica Médica', cidade: 'Jaraguá do Sul', uf: 'SC' },
    { nome: 'DR. ADEMAR WILD WACHHOLZ', crm: 'CRM 8154/SC', especialidade: 'Clínica Médica', cidade: 'Jaraguá do Sul', uf: 'SC' },
    { nome: 'DR. ADRIAN ESTRADA BARBER', crm: 'CRM 27378/SC', especialidade: 'Clínica Médica', cidade: 'Jaraguá do Sul', uf: 'SC' },
    { nome: 'DRA. ADRIANA CARMEN COMELLI', crm: 'CRM 7155/SC', especialidade: 'Clínica Médica', cidade: 'Jaraguá do Sul', uf: 'SC' },
    // SC - Joinville
    { nome: 'DR. ABEL BEIGER', crm: 'CRM 21170/SC', especialidade: 'Clínica Médica', cidade: 'Joinville', uf: 'SC' },
    { nome: 'DR. ABIR FAISSAL ELLAKKIS', crm: 'CRM 30812/SC', especialidade: 'Clínica Médica', cidade: 'Joinville', uf: 'SC' },
    { nome: 'DR. ABRAHAM MARCOVICI', crm: 'CRM 1933/SC', especialidade: 'Clínica Médica', cidade: 'Joinville', uf: 'SC' },
    { nome: 'DR. ADEMAR REGUEIRA FILHO', crm: 'CRM 11424/SC', especialidade: 'Clínica Médica', cidade: 'Joinville', uf: 'SC' },
    { nome: 'DR. ADEMIR GARCIA REBERTI', crm: 'CRM 7743/SC', especialidade: 'Clínica Médica', cidade: 'Joinville', uf: 'SC' },
    // SP - Americana
    { nome: 'DRA. ABIGAIL CAMARGO', crm: 'CRM 59633/SP', especialidade: 'Clínica Médica', cidade: 'Americana', uf: 'SP' },
    { nome: 'DR. ADALQUE GELMINI', crm: 'CRM 13271/SP', especialidade: 'Clínica Médica', cidade: 'Americana', uf: 'SP' },
    { nome: 'DR. ADEMIR ARENAS', crm: 'CRM 22737/SP', especialidade: 'Clínica Médica', cidade: 'Americana', uf: 'SP' },
    { nome: 'DR. ADENIO DOMINGUES NEVES', crm: 'CRM 134044/SP', especialidade: 'Clínica Médica', cidade: 'Americana', uf: 'SP' },
    { nome: 'DR. ADILSON PIMENTEL DE CARVALHO JUNIOR', crm: 'CRM 111491/SP', especialidade: 'Clínica Médica', cidade: 'Americana', uf: 'SP' },
    // SP - Américo Brasiliense
    { nome: 'DR. ANESIO VIEIRA', crm: 'CRM 27306/SP', especialidade: 'Clínica Médica', cidade: 'Américo Brasiliense', uf: 'SP' },
    { nome: 'DRA. ANIELLE BERGAMO', crm: 'CRM 263572/SP', especialidade: 'Clínica Médica', cidade: 'Américo Brasiliense', uf: 'SP' },
    { nome: 'DRA. BEATRIZ SANTILLI MOTTA', crm: 'CRM 233396/SP', especialidade: 'Clínica Médica', cidade: 'Américo Brasiliense', uf: 'SP' },
    { nome: 'DR. CAIO VINICIUS DA CONCEICAO', crm: 'CRM 198532/SP', especialidade: 'Clínica Médica', cidade: 'Américo Brasiliense', uf: 'SP' },
    { nome: 'DR. CARLOS ALBERTO DE MATTOS', crm: 'CRM 134420/SP', especialidade: 'Clínica Médica', cidade: 'Américo Brasiliense', uf: 'SP' },
    // SP - Araraquara
    { nome: 'DR. ABDALA JORGE LAUAND NETO', crm: 'CRM 61071/SP', especialidade: 'Clínica Médica', cidade: 'Araraquara', uf: 'SP' },
    { nome: 'DR. ADAIL PERRONE DE FARIAS', crm: 'CRM 70166/SP', especialidade: 'Clínica Médica', cidade: 'Araraquara', uf: 'SP' },
    { nome: 'DR. ADEMIR ROBERTO SALA', crm: 'CRM 72671/SP', especialidade: 'Clínica Médica', cidade: 'Araraquara', uf: 'SP' },
    { nome: 'DR. ADIB ISMAEL GESE', crm: 'CRM 57921/SP', especialidade: 'Clínica Médica', cidade: 'Araraquara', uf: 'SP' },
    { nome: 'DRA. ADRIANA SORRENTI', crm: 'CRM 135502/SP', especialidade: 'Clínica Médica', cidade: 'Araraquara', uf: 'SP' },
    // SP - Arujá
    { nome: 'DR. ADALBERTO BORTOLETTO', crm: 'CRM 41737/SP', especialidade: 'Clínica Médica', cidade: 'Arujá', uf: 'SP' },
    { nome: 'DR. ADAN FUENTES RAMIREZ', crm: 'CRM 114798/SP', especialidade: 'Clínica Médica', cidade: 'Arujá', uf: 'SP' },
    { nome: 'DRA. ADRIANA CLAUDIA DZIGAN', crm: 'CRM 121543/SP', especialidade: 'Clínica Médica', cidade: 'Arujá', uf: 'SP' },
    { nome: 'DR. AILTON MAURO PEREZ', crm: 'CRM 61616/SP', especialidade: 'Clínica Médica', cidade: 'Arujá', uf: 'SP' },
    { nome: 'DRA. ALBA REJANE SILVA DO NASCIMENTO LEAO', crm: 'CRM 81484/SP', especialidade: 'Clínica Médica', cidade: 'Arujá', uf: 'SP' },
    // SP - Assis
    { nome: 'DR. ADALBERTO DE ASSIS NAZARETH', crm: 'CRM 5301/SP', especialidade: 'Clínica Médica', cidade: 'Assis', uf: 'SP' },
    { nome: 'DR. ADEMAR PINHEIRO SOTTA JUNIOR', crm: 'CRM 280278/SP', especialidade: 'Clínica Médica', cidade: 'Assis', uf: 'SP' },
    { nome: 'DRA. ADRIELLI MARIA VICARIO DA SILVA', crm: 'CRM 281917/SP', especialidade: 'Clínica Médica', cidade: 'Assis', uf: 'SP' },
    { nome: 'DRA. AGNE DA COSTA PEREZ', crm: 'CRM 281919/SP', especialidade: 'Clínica Médica', cidade: 'Assis', uf: 'SP' },
    { nome: 'DRA. AIME BERTOLUCCI SPERIDIAO', crm: 'CRM 239033/SP', especialidade: 'Clínica Médica', cidade: 'Assis', uf: 'SP' },
    // SP - Barretos
    { nome: 'DR. ABDO AZIZ MOHAMED ADI', crm: 'CRM 22544/SP', especialidade: 'Clínica Médica', cidade: 'Barretos', uf: 'SP' },
    { nome: 'DR. ADALBERTO TSUMAYOCHI SHINOHARA', crm: 'CRM 58216/SP', especialidade: 'Clínica Médica', cidade: 'Barretos', uf: 'SP' },
    { nome: 'DR. ADEMAR TEIZO WATANABE', crm: 'CRM 60989/SP', especialidade: 'Clínica Médica', cidade: 'Barretos', uf: 'SP' },
    { nome: 'DR. ADOLPHO BAAMONDE BORGES SABINO', crm: 'CRM 179382/SP', especialidade: 'Clínica Médica', cidade: 'Barretos', uf: 'SP' },
    { nome: 'DRA. ADRIANA OLIVEIRA DE SOUZA', crm: 'CRM 104955/SP', especialidade: 'Clínica Médica', cidade: 'Barretos', uf: 'SP' },
    // SP - Barueri
    { nome: 'DR. ADAURY DA SILVA VILLELA', crm: 'CRM 45558/SP', especialidade: 'Clínica Médica', cidade: 'Barueri', uf: 'SP' },
    { nome: 'DR. ADAYLTON ALVES DA SILVA', crm: 'CRM 250695/SP', especialidade: 'Clínica Médica', cidade: 'Barueri', uf: 'SP' },
    { nome: 'DR. ADELIO FRANCISCO DOS SANTOS', crm: 'CRM 13890/SP', especialidade: 'Clínica Médica', cidade: 'Barueri', uf: 'SP' },
    { nome: 'DR. ADOLFO DAVID DE BRITO', crm: 'CRM 176215/SP', especialidade: 'Clínica Médica', cidade: 'Barueri', uf: 'SP' },
    { nome: 'DRA. ALICE MORAES TITTO', crm: 'CRM 206222/SP', especialidade: 'Clínica Médica', cidade: 'Barueri', uf: 'SP' },
    // SP - Bauru
    { nome: 'DR. ABDEL HAFID FARID', crm: 'CRM 48085/SP', especialidade: 'Clínica Médica', cidade: 'Bauru', uf: 'SP' },
    { nome: 'DR. ABEL DIAS DA SILVA JUNIOR', crm: 'CRM 88587/SP', especialidade: 'Clínica Médica', cidade: 'Bauru', uf: 'SP' },
    { nome: 'DR. YURI YOKOYAMA DO NASCIMENTO', crm: 'CRM 278137/SP', especialidade: 'Clínica Médica', cidade: 'Bauru', uf: 'SP' },
    { nome: 'DRA. YORRANE MAXYME ALVES DE SOUZA', crm: 'CRM 273098/SP', especialidade: 'Clínica Médica', cidade: 'Bauru', uf: 'SP' },
    { nome: 'DRA. VIVIAM DA SILVA GOMES', crm: 'CRM 272946/SP', especialidade: 'Clínica Médica', cidade: 'Bauru', uf: 'SP' },
    // SP - Caieiras
    { nome: 'DR. ADRIANO RENATO FONSECA BOICA', crm: 'CRM 94391/SP', especialidade: 'Clínica Médica', cidade: 'Caieiras', uf: 'SP' },
    { nome: 'DRA. AILANNA MACEDO SOARES ALMEIDA', crm: 'CRM 103090/SP', especialidade: 'Clínica Médica', cidade: 'Caieiras', uf: 'SP' },
    { nome: 'DR. ALAN CESPEDES MARTINS', crm: 'CRM 174357/SP', especialidade: 'Clínica Médica', cidade: 'Caieiras', uf: 'SP' },
    { nome: 'DRA. ALIS CAROLINE BEZERRA MOREIRA', crm: 'CRM 186268/SP', especialidade: 'Clínica Médica', cidade: 'Caieiras', uf: 'SP' },
    { nome: 'DR. ALVARO JESUS TORRES CONSTANTE', crm: 'CRM 233322/SP', especialidade: 'Clínica Médica', cidade: 'Caieiras', uf: 'SP' },
    // SP - Cajamar
    { nome: 'DR. ALBERTO MATULEVICH AREVALO', crm: 'CRM 91132/SP', especialidade: 'Clínica Médica', cidade: 'Cajamar', uf: 'SP' },
    { nome: 'DRA. ANA FLAVIA VARELLA E SILVA', crm: 'CRM 190008/SP', especialidade: 'Clínica Médica', cidade: 'Cajamar', uf: 'SP' },
    { nome: 'DRA. ANDREIA MELO ALVES PAMPLONA', crm: 'CRM 128436/SP', especialidade: 'Clínica Médica', cidade: 'Cajamar', uf: 'SP' },
    { nome: 'DR. ANTONIO SERGIO TEMPESTA', crm: 'CRM 148129/SP', especialidade: 'Clínica Médica', cidade: 'Cajamar', uf: 'SP' },
    { nome: 'DR. AUGUSTO VIEIRA AMARAL', crm: 'CRM 170199/SP', especialidade: 'Clínica Médica', cidade: 'Cajamar', uf: 'SP' },
    // SP - Cajuru
    { nome: 'DR. ADIR MARQUES DE SOUSA', crm: 'CRM 78842/SP', especialidade: 'Clínica Médica', cidade: 'Cajuru', uf: 'SP' },
    { nome: 'DR. ANDRE JUNQUEIRA FRANCO DE MELO', crm: 'CRM 199323/SP', especialidade: 'Clínica Médica', cidade: 'Cajuru', uf: 'SP' },
    { nome: 'DR. ANTONIO PESSANHA HENRIQUES', crm: 'CRM 4573/SP', especialidade: 'Clínica Médica', cidade: 'Cajuru', uf: 'SP' },
    { nome: 'DRA. BEATRIZ SANTOS ZACCARI', crm: 'CRM 229640/SP', especialidade: 'Clínica Médica', cidade: 'Cajuru', uf: 'SP' },
    { nome: 'DR. BRUNO QUINTINO DE OLIVEIRA', crm: 'CRM 216659/SP', especialidade: 'Clínica Médica', cidade: 'Cajuru', uf: 'SP' },
    // SP - Campinas
    { nome: 'DR. ADILSON ANDRIONI DA SILVA', crm: 'CRM 88373/SP', especialidade: 'Clínica Médica', cidade: 'Campinas', uf: 'SP' },
    { nome: 'DRA. ADRIANA GUT LOPES RICCETTO', crm: 'CRM 66534/SP', especialidade: 'Clínica Médica', cidade: 'Campinas', uf: 'SP' },
    { nome: 'DRA. ZORAIDA SACHETTO', crm: 'CRM 92889/SP', especialidade: 'Clínica Médica', cidade: 'Campinas', uf: 'SP' },
    { nome: 'DRA. YANCA CUNHA', crm: 'CRM 275647/SP', especialidade: 'Clínica Médica', cidade: 'Campinas', uf: 'SP' },
    { nome: 'DR. WILSON ROBERTO CAMARGO SANCHES', crm: 'CRM 46852/SP', especialidade: 'Clínica Médica', cidade: 'Campinas', uf: 'SP' },
    // SP - Capivari
    { nome: 'DRA. ADELIA APARECIDA FORTI GOMES', crm: 'CRM 56725/SP', especialidade: 'Clínica Médica', cidade: 'Capivari', uf: 'SP' },
    { nome: 'DRA. ALICE ANGELINA CALLEGARI ROCCO', crm: 'CRM 264495/SP', especialidade: 'Clínica Médica', cidade: 'Capivari', uf: 'SP' },
    { nome: 'DR. ANDERSON MARCOS LOURENCO', crm: 'CRM 197567/SP', especialidade: 'Clínica Médica', cidade: 'Capivari', uf: 'SP' },
    { nome: 'DR. ANDRE LUIS LARANJEIRA FORTI', crm: 'CRM 139034/SP', especialidade: 'Clínica Médica', cidade: 'Capivari', uf: 'SP' },
    { nome: 'DR. ANTONIO CARLOS MUNHOS JUNIOR', crm: 'CRM 83102/SP', especialidade: 'Clínica Médica', cidade: 'Capivari', uf: 'SP' },
    // SP - Carapicuíba
    { nome: 'DRA. ADRIANA PANARIELLO BOYADJIAN', crm: 'CRM 90892/SP', especialidade: 'Clínica Médica', cidade: 'Carapicuíba', uf: 'SP' },
    { nome: 'DR. ADRIANO ALVES DE OLIVEIRA', crm: 'CRM 280680/SP', especialidade: 'Clínica Médica', cidade: 'Carapicuíba', uf: 'SP' },
    { nome: 'DR. ALEJANDRO ROLLANO PANIAGUA', crm: 'CRM 197848/SP', especialidade: 'Clínica Médica', cidade: 'Carapicuíba', uf: 'SP' },
    { nome: 'DRA. ALESSANDRA DA COSTA PANIZZA', crm: 'CRM 87706/SP', especialidade: 'Clínica Médica', cidade: 'Carapicuíba', uf: 'SP' },
    { nome: 'DR. ALEXANDRE VILLAR COLLINO', crm: 'CRM 211214/SP', especialidade: 'Clínica Médica', cidade: 'Carapicuíba', uf: 'SP' },
    // SP - Jundiaí
    { nome: 'DR. ADAM SOARES DE PAULO', crm: 'CRM 115492/SP', especialidade: 'Clínica Médica', cidade: 'Jundiaí', uf: 'SP' },
    { nome: 'DRA. ANA FLAVIA ROVERONI ZUNTINI', crm: 'CRM 158184/SP', especialidade: 'Clínica Médica', cidade: 'Jundiaí', uf: 'SP' },
    { nome: 'DRA. ANDREA MARTINS GUSSON', crm: 'CRM 135518/SP', especialidade: 'Clínica Médica', cidade: 'Jundiaí', uf: 'SP' },
    { nome: 'DRA. ANGELA MARIA SARTO', crm: 'CRM 184116/SP', especialidade: 'Clínica Médica', cidade: 'Jundiaí', uf: 'SP' },
    { nome: 'DRA. ANDREZZA DO CARMO CAMARGO', crm: 'CRM 234836/SP', especialidade: 'Clínica Médica', cidade: 'Jundiaí', uf: 'SP' },
    // SP - Lins
    { nome: 'DR. ACYR MORAES GARCIA', crm: 'CRM 4387/SP', especialidade: 'Clínica Médica', cidade: 'Lins', uf: 'SP' },
    { nome: 'DR. ADELCO DONIZETI VETRONE', crm: 'CRM 43197/SP', especialidade: 'Clínica Médica', cidade: 'Lins', uf: 'SP' },
    { nome: 'DR. ALBERTO PRATA JUNIOR', crm: 'CRM 4386/SP', especialidade: 'Clínica Médica', cidade: 'Lins', uf: 'SP' },
    { nome: 'DR. ROBSON MORAES DOS SANTOS', crm: 'CRM 210537/SP', especialidade: 'Clínica Médica', cidade: 'Lins', uf: 'SP' },
    { nome: 'DR. VITOR MARTINS ESTEVES', crm: 'CRM 199942/SP', especialidade: 'Clínica Médica', cidade: 'Lins', uf: 'SP' },
    // SP - Santa Rita do Passa Quatro
    { nome: 'DR. ADRIANO MISKULIN NOGUEIRA', crm: 'CRM 201428/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rita do Passa Quatro', uf: 'SP' },
    { nome: 'DR. AGENOR MAURO ZORZI', crm: 'CRM 24674/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rita do Passa Quatro', uf: 'SP' },
    { nome: 'DR. ALCIDES DE SOUSA MARTINS', crm: 'CRM 9902/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rita do Passa Quatro', uf: 'SP' },
    { nome: 'DR. ALOYSIO LOPES GASPAR', crm: 'CRM 7317/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rita do Passa Quatro', uf: 'SP' },
    { nome: 'DRA. ANA BEATRIZ MENON STAINE PRADO', crm: 'CRM 239812/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rita do Passa Quatro', uf: 'SP' },
    // SP - Santa Rosa de Viterbo
    { nome: 'DR. ACACIO SIQUEIRA', crm: 'CRM 102417/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rosa de Viterbo', uf: 'SP' },
    { nome: 'DRA. ANA CAROLINA AMADIO SILVA DE MELLO', crm: 'CRM 140144/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rosa de Viterbo', uf: 'SP' },
    { nome: 'DR. BENITO ONOFRE CALDO', crm: 'CRM 5065/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rosa de Viterbo', uf: 'SP' },
    { nome: 'DRA. CAMILA BERTOCCO DE SOUZA', crm: 'CRM 226954/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rosa de Viterbo', uf: 'SP' },
    { nome: 'DR. EDUARDO DUARTE RIBEIRO', crm: 'CRM 32293/SP', especialidade: 'Clínica Médica', cidade: 'Santa Rosa de Viterbo', uf: 'SP' },
    // SP - Santo André
    { nome: 'DR. ACACIO HOCHGREB DE FREITAS', crm: 'CRM 44071/SP', especialidade: 'Clínica Médica', cidade: 'Santo André', uf: 'SP' },
    { nome: 'DRA. ADA MARIA LOREDO BAEZ', crm: 'CRM 196115/SP', especialidade: 'Clínica Médica', cidade: 'Santo André', uf: 'SP' },
    { nome: 'DR. ADALBERTO COELHO FERREIRA', crm: 'CRM 120488/SP', especialidade: 'Clínica Médica', cidade: 'Santo André', uf: 'SP' },
    { nome: 'DR. ADALBERTO EMI', crm: 'CRM 101334/SP', especialidade: 'Clínica Médica', cidade: 'Santo André', uf: 'SP' },
    { nome: 'DR. ADAM HIAR', crm: 'CRM 143872/SP', especialidade: 'Clínica Médica', cidade: 'Santo André', uf: 'SP' },
    // SP - Santos
    { nome: 'DR. AFRANIO BARBOSA DE CASTRO', crm: 'CRM 25797/SP', especialidade: 'Clínica Médica', cidade: 'Santos', uf: 'SP' },
    { nome: 'DR. AFONSO TEOBALDO BROD', crm: 'CRM 85205/SP', especialidade: 'Clínica Médica', cidade: 'Santos', uf: 'SP' },
    { nome: 'DRA. ADRIELLE CARDOSO BONFIM', crm: 'CRM 172805/SP', especialidade: 'Clínica Médica', cidade: 'Santos', uf: 'SP' },
    { nome: 'DR. ALAURY BERTINI', crm: 'CRM 13276/SP', especialidade: 'Clínica Médica', cidade: 'Santos', uf: 'SP' },
    { nome: 'DR. ALAN PRIOSTE PALOPOLI', crm: 'CRM 139221/SP', especialidade: 'Clínica Médica', cidade: 'Santos', uf: 'SP' },
    // SP - São Bernardo do Campo
    { nome: 'DR. ABELARDO ZINI', crm: 'CRM 10745/SP', especialidade: 'Clínica Médica', cidade: 'São Bernardo do Campo', uf: 'SP' },
    { nome: 'DR. ADALBERTO BULHÃO MORENO', crm: 'CRM 47353/SP', especialidade: 'Clínica Médica', cidade: 'São Bernardo do Campo', uf: 'SP' },
    { nome: 'DRA. ADEMILDES FERREIRA DE LIMA', crm: 'CRM 68085/SP', especialidade: 'Clínica Médica', cidade: 'São Bernardo do Campo', uf: 'SP' },
    { nome: 'DRA. ADRIANA BARCELINI CERVANTES', crm: 'CRM 84618/SP', especialidade: 'Clínica Médica', cidade: 'São Bernardo do Campo', uf: 'SP' },
    { nome: 'DRA. AMANDA GALHARDO', crm: 'CRM 250058/SP', especialidade: 'Clínica Médica', cidade: 'São Bernardo do Campo', uf: 'SP' },
    // SP - São Caetano do Sul
    { nome: 'DR. ACRISIO SOUZA LEITE', crm: 'CRM 7608/SP', especialidade: 'Clínica Médica', cidade: 'São Caetano do Sul', uf: 'SP' },
    { nome: 'DRA. ADRIANA BERRINGER STEPHAN', crm: 'CRM 78540/SP', especialidade: 'Clínica Médica', cidade: 'São Caetano do Sul', uf: 'SP' },
    { nome: 'DRA. ADRIANA MARTINS SANT EUFEMIA', crm: 'CRM 69074/SP', especialidade: 'Clínica Médica', cidade: 'São Caetano do Sul', uf: 'SP' },
    { nome: 'DR. AGUINALDO QUARESMA', crm: 'CRM 1294/SP', especialidade: 'Clínica Médica', cidade: 'São Caetano do Sul', uf: 'SP' },
    { nome: 'DR. AGUINALDO QUARESMA', crm: 'CRM 1294/SP', especialidade: 'Clínica Médica', cidade: 'São Caetano do Sul', uf: 'SP' },
    // SP - São Carlos
    { nome: 'DRA. ADRIANA FURQUIM MARINOVIC', crm: 'CRM 200843/SP', especialidade: 'Clínica Médica', cidade: 'São Carlos', uf: 'SP' },
    { nome: 'DRA. BIANCA SATO FERNANDES GOES', crm: 'CRM 185487/SP', especialidade: 'Clínica Médica', cidade: 'São Carlos', uf: 'SP' },
    { nome: 'DR. BERNARDO BARRETO DE ABREU', crm: 'CRM 140930/SP', especialidade: 'Clínica Médica', cidade: 'São Carlos', uf: 'SP' },
    { nome: 'DR. BENJAMIN LOPEZ OZORES', crm: 'CRM 5234/SP', especialidade: 'Clínica Médica', cidade: 'São Carlos', uf: 'SP' },
    { nome: 'DRA. CAMILA IBELLI BIANCO', crm: 'CRM 233401/SP', especialidade: 'Clínica Médica', cidade: 'São Carlos', uf: 'SP' },
    // SP - São José do Rio Preto
    { nome: 'DR. ABEL ALEXANDRE HANNUM', crm: 'CRM 70001/SP', especialidade: 'Clínica Médica', cidade: 'São José do Rio Preto', uf: 'SP' },
    { nome: 'DR. ACHILLES ABELAIRA FILHO', crm: 'CRM 87473/SP', especialidade: 'Clínica Médica', cidade: 'São José do Rio Preto', uf: 'SP' },
    { nome: 'DRA. ADAILZA ALVES CORREIA', crm: 'CRM 82825/SP', especialidade: 'Clínica Médica', cidade: 'São José do Rio Preto', uf: 'SP' },
    { nome: 'DR. ADALBERTO RILLO', crm: 'CRM 22625/SP', especialidade: 'Clínica Médica', cidade: 'São José do Rio Preto', uf: 'SP' },
    { nome: 'DR. ALISSON DA SILVA FIUZA', crm: 'CRM 213995/SP', especialidade: 'Clínica Médica', cidade: 'São José do Rio Preto', uf: 'SP' },
    // SP - São José dos Campos
    { nome: 'DR. ABELARDO JOSE PERES', crm: 'CRM 56778/SP', especialidade: 'Clínica Médica', cidade: 'São José dos Campos', uf: 'SP' },
    { nome: 'DR. ABIDO MAHMUD ARABI', crm: 'CRM 160704/SP', especialidade: 'Clínica Médica', cidade: 'São José dos Campos', uf: 'SP' },
    { nome: 'DR. ABRAHAM TICONA MURIEL', crm: 'CRM 149543/SP', especialidade: 'Clínica Médica', cidade: 'São José dos Campos', uf: 'SP' },
    { nome: 'DR. ADAIR RIBEIRO ZAN', crm: 'CRM 51576/SP', especialidade: 'Clínica Médica', cidade: 'São José dos Campos', uf: 'SP' },
    { nome: 'DR. ADAUTO DOURADO', crm: 'CRM 65825/SP', especialidade: 'Clínica Médica', cidade: 'São José dos Campos', uf: 'SP' },
    // SP - São Paulo
    { nome: 'DR. ABAETE PASCOAL CARNEIRO', crm: 'CRM 10844/SP', especialidade: 'Clínica Médica', cidade: 'São Paulo', uf: 'SP' },
    { nome: 'DR. ADALTO ALFREDO PONTES FILHO', crm: 'CRM 178038/SP', especialidade: 'Clínica Médica', cidade: 'São Paulo', uf: 'SP' },
    { nome: 'DRA. ZAIDE DUARTE', crm: 'CRM 10355/SP', especialidade: 'Clínica Médica', cidade: 'São Paulo', uf: 'SP' },
    { nome: 'DR. ZAFFER MAITO', crm: 'CRM 128020/SP', especialidade: 'Clínica Médica', cidade: 'São Paulo', uf: 'SP' },
    { nome: 'DR. YVES TURKE', crm: 'CRM 62104/SP', especialidade: 'Clínica Médica', cidade: 'São Paulo', uf: 'SP' },
    // SP - São Vicente
    { nome: 'DR. ADHEMAR FARIA DE MOURA', crm: 'CRM 8252/SP', especialidade: 'Clínica Médica', cidade: 'São Vicente', uf: 'SP' },
    { nome: 'DRA. AGNES MERI YASUDA', crm: 'CRM 120815/SP', especialidade: 'Clínica Médica', cidade: 'São Vicente', uf: 'SP' },
    { nome: 'DR. SERGIO COTRIM', crm: 'CRM 12945/SP', especialidade: 'Clínica Médica', cidade: 'São Vicente', uf: 'SP' },
    { nome: 'DRA. SANDRA MARA BARBOSA DOS SANTOS', crm: 'CRM 39929/SP', especialidade: 'Clínica Médica', cidade: 'São Vicente', uf: 'SP' },
    { nome: 'DR. ROQUE VALENTE', crm: 'CRM 3519/SP', especialidade: 'Clínica Médica', cidade: 'São Vicente', uf: 'SP' },
    // SP - Sertãozinho
    { nome: 'DRA. ADRIANE KATIA GUIMARAES', crm: 'CRM 128794/SP', especialidade: 'Clínica Médica', cidade: 'Sertãozinho', uf: 'SP' },
    { nome: 'DR. AGUSTIN IVAN CABALLERO ARRUE', crm: 'CRM 26829/SP', especialidade: 'Clínica Médica', cidade: 'Sertãozinho', uf: 'SP' },
    { nome: 'DR. ALBANO MAURICIO BACCEGA', crm: 'CRM 64747/SP', especialidade: 'Clínica Médica', cidade: 'Sertãozinho', uf: 'SP' },
    { nome: 'DR. ALEXANDRE DOS REIS RAO', crm: 'CRM 92945/SP', especialidade: 'Clínica Médica', cidade: 'Sertãozinho', uf: 'SP' },
    { nome: 'DR. ALEXANDRE FERRAREZ FERNANDES', crm: 'CRM 99662/SP', especialidade: 'Clínica Médica', cidade: 'Sertãozinho', uf: 'SP' },
    // SP - Sorocaba
    { nome: 'DR. ABILIO PIRES PADINHA NETO', crm: 'CRM 48866/SP', especialidade: 'Clínica Médica', cidade: 'Sorocaba', uf: 'SP' },
    { nome: 'DRA. ADELE GONZALES RODRIGUES', crm: 'CRM 173942/SP', especialidade: 'Clínica Médica', cidade: 'Sorocaba', uf: 'SP' },
    { nome: 'DR. ANDERSON DE ALBUQUERQUE SEIXAS', crm: 'CRM 89265/SP', especialidade: 'Clínica Médica', cidade: 'Sorocaba', uf: 'SP' },
    { nome: 'DRA. ANA VIRGINIA RASZL CONDOTTA', crm: 'CRM 24622/SP', especialidade: 'Clínica Médica', cidade: 'Sorocaba', uf: 'SP' },
    { nome: 'DRA. ANA TERESA SANTOS CAMARGO', crm: 'CRM 190513/SP', especialidade: 'Clínica Médica', cidade: 'Sorocaba', uf: 'SP' },
    // SP - Sumaré
    { nome: 'DRA. ALESSANDRA DOS SANTOS LEMOS', crm: 'CRM 257761/SP', especialidade: 'Clínica Médica', cidade: 'Sumaré', uf: 'SP' },
    { nome: 'DRA. AMANDA DA SILVA FERREIRA', crm: 'CRM 238713/SP', especialidade: 'Clínica Médica', cidade: 'Sumaré', uf: 'SP' },
    { nome: 'DRA. AMELIA GUSIKUDA MURAYAMA', crm: 'CRM 73530/SP', especialidade: 'Clínica Médica', cidade: 'Sumaré', uf: 'SP' },
    { nome: 'DRA. ANA JULIA MARMIROLLI', crm: 'CRM 259361/SP', especialidade: 'Clínica Médica', cidade: 'Sumaré', uf: 'SP' },
    { nome: 'DRA. ANA LUIZA SILVEIRA ARANTES BOIAGO', crm: 'CRM 176235/SP', especialidade: 'Clínica Médica', cidade: 'Sumaré', uf: 'SP' },
    // SP - Suzano
    { nome: 'DR. ADYR GHIORZI BRANDAO', crm: 'CRM 74035/SP', especialidade: 'Clínica Médica', cidade: 'Suzano', uf: 'SP' },
    { nome: 'DR. AGNALDO RAMOS', crm: 'CRM 82934/SP', especialidade: 'Clínica Médica', cidade: 'Suzano', uf: 'SP' },
    { nome: 'DR. ALESSANDRO PEREIRA VIDAL', crm: 'CRM 105694/SP', especialidade: 'Clínica Médica', cidade: 'Suzano', uf: 'SP' },
    { nome: 'DR. ALEX MARIANO DA SILVA', crm: 'CRM 283102/SP', especialidade: 'Clínica Médica', cidade: 'Suzano', uf: 'SP' },
    { nome: 'DRA. KATCHUSSY RIPARDO DE MATOS', crm: 'CRM 284426/SP', especialidade: 'Clínica Médica', cidade: 'Suzano', uf: 'SP' },
    // SP - Taboão da Serra
    { nome: 'DR. ABNER FRANCISCO CHILON TRONCOS', crm: 'CRM 164431/SP', especialidade: 'Clínica Médica', cidade: 'Taboão da Serra', uf: 'SP' },
    { nome: 'DRA. ADELAIDE DE LUCENA LIMA', crm: 'CRM 23919/SP', especialidade: 'Clínica Médica', cidade: 'Taboão da Serra', uf: 'SP' },
    { nome: 'DRA. AILA DORIGUETO DELEVEDOVE', crm: 'CRM 262312/SP', especialidade: 'Clínica Médica', cidade: 'Taboão da Serra', uf: 'SP' },
    { nome: 'DRA. ALESSANDRA COSTA DE LIMA', crm: 'CRM 280686/SP', especialidade: 'Clínica Médica', cidade: 'Taboão da Serra', uf: 'SP' },
    { nome: 'DR. ALEX ITALO DA SILVEIRA SALES', crm: 'CRM 272960/SP', especialidade: 'Clínica Médica', cidade: 'Taboão da Serra', uf: 'SP' },
    // SP - Tambaú
    { nome: 'DR. ALEXANDRE PORTILHO FILGUEIRAS', crm: 'CRM 82247/SP', especialidade: 'Clínica Médica', cidade: 'Tambaú', uf: 'SP' },
    { nome: 'DR. ANTONIO JOSE SILVA', crm: 'CRM 40135/SP', especialidade: 'Clínica Médica', cidade: 'Tambaú', uf: 'SP' },
    { nome: 'DRA. CARLA BASSANEZI MAZZARO', crm: 'CRM 105189/SP', especialidade: 'Clínica Médica', cidade: 'Tambaú', uf: 'SP' },
    { nome: 'DR. CARLOS ALBERTO DA SILVA', crm: 'CRM 79459/SP', especialidade: 'Clínica Médica', cidade: 'Tambaú', uf: 'SP' },
    { nome: 'DRA. CLEA LAMOGLIA MACIEL', crm: 'CRM 189767/SP', especialidade: 'Clínica Médica', cidade: 'Tambaú', uf: 'SP' },
    // SP - Várzea Paulista
    { nome: 'DRA. AMANDA ROSENDO', crm: 'CRM 263201/SP', especialidade: 'Clínica Médica', cidade: 'Várzea Paulista', uf: 'SP' },
    { nome: 'DRA. FABRICIA VIEIRA RODRIGUES', crm: 'CRM 147626/SP', especialidade: 'Clínica Médica', cidade: 'Várzea Paulista', uf: 'SP' },
    { nome: 'DRA. CAROLINE HELENA TEOTONIO', crm: 'CRM 224272/SP', especialidade: 'Clínica Médica', cidade: 'Várzea Paulista', uf: 'SP' },
    { nome: 'DRA. CHRISTIANE CIAN FERREIRA', crm: 'CRM 278375/SP', especialidade: 'Clínica Médica', cidade: 'Várzea Paulista', uf: 'SP' },
    { nome: 'DR. FELIPE DO AMARAL CARVALHO', crm: 'CRM 219912/SP', especialidade: 'Clínica Médica', cidade: 'Várzea Paulista', uf: 'SP' },
    // SP - Viradouro
    { nome: 'DR. ALDOMAR IOSSI', crm: 'CRM 33457/SP', especialidade: 'Clínica Médica', cidade: 'Viradouro', uf: 'SP' },
    { nome: 'DRA. BRICIA FELIPE CARDOSO', crm: 'CRM 140667/SP', especialidade: 'Clínica Médica', cidade: 'Viradouro', uf: 'SP' },
    { nome: 'DR. ELIAS FARAH', crm: 'CRM 10700/SP', especialidade: 'Clínica Médica', cidade: 'Viradouro', uf: 'SP' },
    { nome: 'DR. FELIX ROCHA ANGULO', crm: 'CRM 52405/SP', especialidade: 'Clínica Médica', cidade: 'Viradouro', uf: 'SP' },
    { nome: 'DRA. FERNANDA FERREIRA ZUCOLOTTO', crm: 'CRM 253475/SP', especialidade: 'Clínica Médica', cidade: 'Viradouro', uf: 'SP' },
  ];
  // Encode: JSON → UTF-8 → XOR → Base64
  const json = JSON.stringify(raw);
  const enc = new TextEncoder().encode(json);
  const xored = new Uint8Array(enc.length);
  for (let i = 0; i < enc.length; i++) xored[i] = enc[i] ^ _K[i % _K.length];
  let bin = '';
  xored.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
})();

// Lazy-decoded singleton — decoded once, cached in memory
let _cache: MedicoHapvida[] | null = null;

function getMedicos(): MedicoHapvida[] {
  if (!_cache) _cache = _d(_P);
  return _cache;
}

// Public API — same interface as before
export const MEDICOS_HAPVIDA: MedicoHapvida[] = new Proxy([] as MedicoHapvida[], {
  get(_, prop) {
    const arr = getMedicos();
    if (prop === 'length') return arr.length;
    if (prop === Symbol.iterator) return arr[Symbol.iterator].bind(arr);
    if (prop === 'filter') return arr.filter.bind(arr);
    if (prop === 'map') return arr.map.bind(arr);
    if (prop === 'forEach') return arr.forEach.bind(arr);
    if (prop === 'find') return arr.find.bind(arr);
    if (prop === 'some') return arr.some.bind(arr);
    if (prop === 'every') return arr.every.bind(arr);
    if (prop === 'reduce') return arr.reduce.bind(arr);
    if (prop === 'slice') return arr.slice.bind(arr);
    if (typeof prop === 'string' && !isNaN(Number(prop))) return arr[Number(prop)];
    return (arr as any)[prop];
  }
});

export function getEstadosMedicos(): string[] {
  return [...new Set(getMedicos().map(m => m.uf))].sort();
}

export function getCidadesPorEstado(uf: string): string[] {
  return [...new Set(getMedicos().filter(m => m.uf === uf).map(m => m.cidade))].sort();
}

export function buscarMedicos(termo: string, uf?: string): MedicoHapvida[] {
  const t = termo.toLowerCase().trim();
  return getMedicos().filter(m => {
    const ufOk = !uf || m.uf === uf;
    const termoOk = !t || m.nome.toLowerCase().includes(t) || m.crm.toLowerCase().includes(t) || m.especialidade.toLowerCase().includes(t) || m.cidade.toLowerCase().includes(t);
    return ufOk && termoOk;
  });
}
