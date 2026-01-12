export type LanguageCode = 'en' | 'es' | 'fr' | 'ja' | 'de' | 'ko' | 'it' | 'zh' | 'pt' | 'hi';

export interface DictionaryEntry {
  id: string;
  tags: string[];
  translations: Record<LanguageCode, { text: string; pron?: string }>;
}

export const PHRASE_DICTIONARY: DictionaryEntry[] = [
  // --- GREETINGS (10) ---
  {
    id: 'greet_hello',
    tags: ['Greeting', 'Essential'],
    translations: {
      en: { text: "Hello", pron: "Hello" },
      es: { text: "Hola", pron: "Oh-la" },
      fr: { text: "Bonjour", pron: "Bon-zhoor" },
      ja: { text: "こんにちは", pron: "Konnichiwa" },
      de: { text: "Hallo", pron: "Ha-lo" },
      ko: { text: "안녕하세요", pron: "An-nyeong-ha-se-yo" },
      it: { text: "Ciao", pron: "Chow" },
      zh: { text: "你好", pron: "Nǐ hǎo" },
      pt: { text: "Olá", pron: "Oh-lah" },
      hi: { text: "नमस्ते", pron: "Namaste" }
    }
  },
  {
    id: 'greet_good_morning',
    tags: ['Greeting'],
    translations: {
      en: { text: "Good morning", pron: "Good morning" },
      es: { text: "Buenos días", pron: "Bweh-nos dee-as" },
      fr: { text: "Bonjour", pron: "Bon-zhoor" },
      ja: { text: "おはようございます", pron: "Ohayou gozaimasu" },
      de: { text: "Guten Morgen", pron: "Goo-ten Mor-gen" },
      ko: { text: "좋은 아침입니다", pron: "Jo-eun a-chim-im-ni-da" },
      it: { text: "Buongiorno", pron: "Bwon-jor-no" },
      zh: { text: "早上好", pron: "Zǎoshang hǎo" },
      pt: { text: "Bom dia", pron: "Bom dee-ah" },
      hi: { text: "수브라바트", pron: "Su-pra-bhat" }
    }
  },
  {
    id: 'greet_good_night',
    tags: ['Greeting'],
    translations: {
      en: { text: "Good night", pron: "Good night" },
      es: { text: "Buenas noches", pron: "Bweh-nas no-ches" },
      fr: { text: "Bonne nuit", pron: "Bon nwee" },
      ja: { text: "おやすみなさい", pron: "Oyasumi nasai" },
      de: { text: "Gute Nacht", pron: "Goo-te Nakht" },
      ko: { text: "안녕히 주무세요", pron: "An-nyeong-hi ju-mu-se-yo" },
      it: { text: "Buonanotte", pron: "Bwo-na-not-te" },
      zh: { text: "晚安", pron: "Wǎn'ān" },
      pt: { text: "Boa noite", pron: "Bo-ah noy-te" },
      hi: { text: "शुभ रात्रि", pron: "Shubh raatri" }
    }
  },
  {
    id: 'greet_how_are_you',
    tags: ['Greeting'],
    translations: {
      en: { text: "How are you?", pron: "How are you?" },
      es: { text: "¿Cómo estás?", pron: "Koh-mo es-tas" },
      fr: { text: "Comment allez-vous?", pron: "Kom-man ta-lay voo" },
      ja: { text: "お元気ですか", pron: "Ogenki desu ka" },
      de: { text: "Wie geht es Ihnen?", pron: "Vee gayt es ee-nen" },
      ko: { text: "잘 지내세요?", pron: "Jal ji-nae-se-yo?" },
      it: { text: "Come stai?", pron: "Ko-me sty" },
      zh: { text: "你好吗？", pron: "Nǐ hǎo ma?" },
      pt: { text: "Como vai?", pron: "Koh-mo vye" },
      hi: { text: "आप कैसे हैं?", pron: "Aap kaise hain?" }
    }
  },
  {
    id: 'greet_nice_meet',
    tags: ['Greeting'],
    translations: {
      en: { text: "Nice to meet you", pron: "Nice to meet you" },
      es: { text: "Mucho gusto", pron: "Moo-cho goos-to" },
      fr: { text: "Enchanté", pron: "On-shon-tay" },
      ja: { text: "はじめまして", pron: "Hajimemashite" },
      de: { text: "Freut mich", pron: "Froyt mikh" },
      ko: { text: "만나서 반갑습니다", pron: "Man-na-seo ban-gap-seum-ni-da" },
      it: { text: "Piacere", pron: "Pya-che-re" },
      zh: { text: "很高兴见到你", pron: "Hěn gāoxìng jiàndào nǐ" },
      pt: { text: "Prazer em conhecê-lo", pron: "Prah-zehr em kon-nyeh-seh-lo" },
      hi: { text: "आपसे मिलकर खुशी हुई", pron: "Aapse milkar khushi hui" }
    }
  },
  {
    id: 'greet_bye',
    tags: ['Greeting'],
    translations: {
      en: { text: "Goodbye", pron: "Goodbye" },
      es: { text: "Adiós", pron: "Ah-dyos" },
      fr: { text: "Au revoir", pron: "Oh rev-war" },
      ja: { text: "さようなら", pron: "Sayounara" },
      de: { text: "Auf Wiedersehen", pron: "Ow-f vee-der-zay-en" },
      ko: { text: "안녕히 가세요", pron: "An-nyeong-hi ga-se-yo" },
      it: { text: "Arrivederci", pron: "Ah-ree-ve-der-chee" },
      zh: { text: "再见", pron: "Zàijiàn" },
      pt: { text: "Adeus", pron: "Ah-deh-oos" },
      hi: { text: "नमस्ते", pron: "Namaste" } 
    }
  },
  {
    id: 'greet_see_you',
    tags: ['Greeting'],
    translations: {
      en: { text: "See you later", pron: "See you later" },
      es: { text: "Hasta luego", pron: "Ah-sta lweh-go" },
      fr: { text: "À plus tard", pron: "Ah ploo tar" },
      ja: { text: "また会いましょう", pron: "Mata aimashou" },
      de: { text: "Bis später", pron: "Bis shpay-ter" },
      ko: { text: "나중에 봐요", pron: "Na-jung-e bwa-yo" },
      it: { text: "A dopo", pron: "Ah doh-po" },
      zh: { text: "回头见", pron: "Huítóu jiàn" },
      pt: { text: "Até logo", pron: "Ah-teh loh-go" },
      hi: { text: "बाद में मिलते हैं", pron: "Baad mein milte hain" }
    }
  },
  {
    id: 'greet_name',
    tags: ['Greeting'],
    translations: {
      en: { text: "My name is...", pron: "My name is..." },
      es: { text: "Me llamo...", pron: "Meh ya-mo..." },
      fr: { text: "Je m'appelle...", pron: "Zhuh mah-pel..." },
      ja: { text: "私の名前は...です", pron: "Watashi no namae wa...desu" },
      de: { text: "Ich heiße...", pron: "Ikh high-se..." },
      ko: { text: "제 이름은 ...입니다", pron: "Je i-reum-eun ...im-ni-da" },
      it: { text: "Mi chiamo...", pron: "Mee kya-mo..." },
      zh: { text: "我叫...", pron: "Wǒ jiào..." },
      pt: { text: "Meu nome é...", pron: "Meh-oo no-meh eh..." },
      hi: { text: "मेरा नाम ... है", pron: "Mera naam ... hai" }
    }
  },
  {
    id: 'greet_from',
    tags: ['Greeting'],
    translations: {
      en: { text: "I am from...", pron: "I am from..." },
      es: { text: "Soy de...", pron: "Soy deh..." },
      fr: { text: "Je viens de...", pron: "Zhuh vee-en deh..." },
      ja: { text: "私は...出身です", pron: "Watashi wa...shusshin desu" },
      de: { text: "Ich komme aus...", pron: "Ikh ko-me ows..." },
      ko: { text: "저는 ...에서 왔습니다", pron: "Jeo-neun ...e-seo wat-seum-ni-da" },
      it: { text: "Vengo da...", pron: "Ven-go da..." },
      zh: { text: "我来自...", pron: "Wǒ láizì..." },
      pt: { text: "Eu sou de...", pron: "Eh-oo so deh..." },
      hi: { text: "मैं ... से हूँ", pron: "Main ... se hoon" }
    }
  },
  {
    id: 'greet_welcome',
    tags: ['Greeting'],
    translations: {
      en: { text: "Welcome", pron: "Welcome" },
      es: { text: "Bienvenido", pron: "Byen-veh-nee-do" },
      fr: { text: "Bienvenue", pron: "Byen-ven-oo" },
      ja: { text: "ようこそ", pron: "Youkoso" },
      de: { text: "Willkommen", pron: "Vil-ko-men" },
      ko: { text: "환영합니다", pron: "Hwan-yeong-ham-ni-da" },
      it: { text: "Benvenuto", pron: "Ben-ve-nu-to" },
      zh: { text: "欢迎", pron: "Huānyíng" },
      pt: { text: "Bem-vindo", pron: "Ben-veen-do" },
      hi: { text: "स्वागत हे", pron: "Swagat he" }
    }
  },

  // --- ESSENTIALS (15) ---
  {
    id: 'ess_yes',
    tags: ['Essential'],
    translations: {
      en: { text: "Yes", pron: "Yes" },
      es: { text: "Sí", pron: "See" },
      fr: { text: "Oui", pron: "Wee" },
      ja: { text: "はい", pron: "Hai" },
      de: { text: "Ja", pron: "Ya" },
      ko: { text: "네", pron: "Ne" },
      it: { text: "Sì", pron: "See" },
      zh: { text: "是", pron: "Shì" },
      pt: { text: "Sim", pron: "Seem" },
      hi: { text: "हाँ", pron: "Haan" }
    }
  },
  {
    id: 'ess_no',
    tags: ['Essential'],
    translations: {
      en: { text: "No", pron: "No" },
      es: { text: "No", pron: "No" },
      fr: { text: "Non", pron: "Non" },
      ja: { text: "いいえ", pron: "Iie" },
      de: { text: "Nein", pron: "Nine" },
      ko: { text: "아니요", pron: "A-ni-yo" },
      it: { text: "No", pron: "No" },
      zh: { text: "不", pron: "Bù" },
      pt: { text: "Não", pron: "Now" },
      hi: { text: "नहीं", pron: "Nahin" }
    }
  },
  {
    id: 'ess_thank_you',
    tags: ['Essential'],
    translations: {
      en: { text: "Thank you", pron: "Thank you" },
      es: { text: "Gracias", pron: "Gra-syas" },
      fr: { text: "Merci", pron: "Mehr-see" },
      ja: { text: "ありがとうございます", pron: "Arigatou gozaimasu" },
      de: { text: "Danke", pron: "Dan-ke" },
      ko: { text: "감사합니다", pron: "Gam-sa-ham-ni-da" },
      it: { text: "Grazie", pron: "Gra-tsye" },
      zh: { text: "谢谢", pron: "Xièxiè" },
      pt: { text: "Obrigado", pron: "Oh-bree-gah-do" },
      hi: { text: "धन्यवाद", pron: "Dhanyavaad" }
    }
  },
  {
    id: 'ess_please',
    tags: ['Essential'],
    translations: {
      en: { text: "Please", pron: "Please" },
      es: { text: "Por favor", pron: "Por fa-vor" },
      fr: { text: "S'il vous plaît", pron: "Seel voo play" },
      ja: { text: "お願いします", pron: "Onegaishimasu" },
      de: { text: "Bitte", pron: "Bi-te" },
      ko: { text: "부탁합니다", pron: "Bu-tak-ham-ni-da" },
      it: { text: "Per favore", pron: "Per fa-vo-re" },
      zh: { text: "请", pron: "Qǐng" },
      pt: { text: "Por favor", pron: "Por fa-vor" },
      hi: { text: "कृपया", pron: "Kripaya" }
    }
  },
  {
    id: 'ess_sorry',
    tags: ['Essential'],
    translations: {
      en: { text: "I am sorry", pron: "I am sorry" },
      es: { text: "Lo siento", pron: "Lo syen-to" },
      fr: { text: "Désolé", pron: "De-zo-lay" },
      ja: { text: "ごめんなさい", pron: "Gomen nasai" },
      de: { text: "Es tut mir leid", pron: "Es toot meer light" },
      ko: { text: "미안합니다", pron: "Mi-an-ham-ni-da" },
      it: { text: "Mi dispiace", pron: "Mee dis-pya-che" },
      zh: { text: "对不起", pron: "Duìbùqǐ" },
      pt: { text: "Desculpe", pron: "Des-kool-peh" },
      hi: { text: "क्षमा करें", pron: "Kshama karen" }
    }
  },
  {
    id: 'ess_excuse',
    tags: ['Essential'],
    translations: {
      en: { text: "Excuse me", pron: "Excuse me" },
      es: { text: "Disculpe", pron: "Dis-kool-peh" },
      fr: { text: "Excusez-moi", pron: "Ex-kew-zay mwa" },
      ja: { text: "すみません", pron: "Sumimasen" },
      de: { text: "Entschuldigung", pron: "Ent-shool-di-goong" },
      ko: { text: "실례합니다", pron: "Sil-lye-ham-ni-da" },
      it: { text: "Mi scusi", pron: "Mee skoo-zee" },
      zh: { text: "打扰一下", pron: "Dǎrǎo yīxià" },
      pt: { text: "Com licença", pron: "Kom lee-sen-sah" },
      hi: { text: "माफ़ कीजिये", pron: "Maaf kijiye" }
    }
  },
  {
    id: 'ess_help',
    tags: ['Essential', 'Emergency'],
    translations: {
      en: { text: "Help me", pron: "Help me" },
      es: { text: "Ayúdadme", pron: "Ah-yoo-dad-meh" },
      fr: { text: "Aidez-moi", pron: "Ay-day mwa" },
      ja: { text: "助けてください", pron: "Tasukete kudasai" },
      de: { text: "Hilf mir", pron: "Hilf meer" },
      ko: { text: "도와주세요", pron: "Do-wa-ju-se-yo" },
      it: { text: "Aiutami", pron: "Ah-yoo-ta-mee" },
      zh: { text: "救命", pron: "Jiùmìng" },
      pt: { text: "Ajude-me", pron: "Ah-joo-deh meh" },
      hi: { text: "मेरी मदद करो", pron: "Meri madad karo" }
    }
  },
  {
    id: 'ess_dont_know',
    tags: ['Essential'],
    translations: {
      en: { text: "I don't know", pron: "I don't know" },
      es: { text: "No lo sé", pron: "No lo seh" },
      fr: { text: "Je ne sais pas", pron: "Zhuh nuh say pah" },
      ja: { text: "わかりません", pron: "Wakarimasen" },
      de: { text: "Ich weiß nicht", pron: "Ikh vise nikht" },
      ko: { text: "모르겠습니다", pron: "Mo-reu-get-seum-ni-da" },
      it: { text: "Non lo so", pron: "Non lo so" },
      zh: { text: "我不知道", pron: "Wǒ bù zhīdào" },
      pt: { text: "Eu não sei", pron: "Eh-oo now say" },
      hi: { text: "मुझे नहीं पता", pron: "Mujhe nahin pata" }
    }
  },
  {
    id: 'ess_understand',
    tags: ['Essential'],
    translations: {
      en: { text: "I understand", pron: "I understand" },
      es: { text: "Entiendo", pron: "En-tyen-do" },
      fr: { text: "Je comprends", pron: "Zhuh kom-pron" },
      ja: { text: "わかります", pron: "Wakarimasu" },
      de: { text: "Ich verstehe", pron: "Ikh fer-shtay-e" },
      ko: { text: "알겠습니다", pron: "Al-get-seum-ni-da" },
      it: { text: "Capisco", pron: "Ka-pees-ko" },
      zh: { text: "我明白了", pron: "Wǒ míngbáile" },
      pt: { text: "Eu entendo", pron: "Eh-oo en-ten-do" },
      hi: { text: "मैं समझता हूँ", pron: "Main samajhta hoon" }
    }
  },
  {
    id: 'ess_no_understand',
    tags: ['Essential'],
    translations: {
      en: { text: "I don't understand", pron: "I don't understand" },
      es: { text: "No entiendo", pron: "No en-tyen-do" },
      fr: { text: "Je ne comprends pas", pron: "Zhuh nuh kom-pron pah" },
      ja: { text: "わかりません", pron: "Wakarimasen" },
      de: { text: "Ich verstehe nicht", pron: "Ikh fer-shtay-e nikht" },
      ko: { text: "이해가 안 됩니다", pron: "I-hae-ga an doem-ni-da" },
      it: { text: "Non capisco", pron: "Non ka-pees-ko" },
      zh: { text: "我不明白", pron: "Wǒ bù míngbái" },
      pt: { text: "Eu não entendo", pron: "Eh-oo now en-ten-do" },
      hi: { text: "मुझे समझ नहीं आया", pron: "Mujhe samajh nahin aaya" }
    }
  },
  {
    id: 'ess_speak_eng',
    tags: ['Essential'],
    translations: {
      en: { text: "Do you speak English?", pron: "Do you speak English?" },
      es: { text: "¿Hablas inglés?", pron: "Ah-blas in-gles" },
      fr: { text: "Parlez-vous anglais?", pron: "Par-lay voo ong-glay" },
      ja: { text: "英語を話せますか", pron: "Eigo o hanasemasu ka" },
      de: { text: "Sprechen Sie Englisch?", pron: "Shpre-khen zee eng-lish" },
      ko: { text: "영어를 할 수 있습니까?", pron: "Yeong-eo-reul hal su it-seum-ni-ka" },
      it: { text: "Parli inglese?", pron: "Par-lee in-gle-ze" },
      zh: { text: "你会说英语吗？", pron: "Nǐ huì shuō yīngyǔ ma?" },
      pt: { text: "Você fala inglês?", pron: "Vo-seh fa-la in-gles" },
      hi: { text: "क्या आप अंग्रेज़ी बोलते हैं?", pron: "Kya aap angrezi bolte hain?" }
    }
  },
  {
    id: 'ess_slowly',
    tags: ['Essential'],
    translations: {
      en: { text: "Please speak slowly", pron: "Please speak slowly" },
      es: { text: "Hable despacio, por favor", pron: "Ah-ble des-pa-syo, por fa-vor" },
      fr: { text: "Parlez lentement s'il vous plaît", pron: "Par-lay lon-te-mon seel voo play" },
      ja: { text: "ゆっくり話してください", pron: "Yukkuri hanashite kudasai" },
      de: { text: "Bitte sprechen Sie langsam", pron: "Bi-te shpre-khen zee lang-zam" },
      ko: { text: "천천히 말해주세요", pron: "Cheon-cheon-hi mal-hae-ju-se-yo" },
      it: { text: "Parli lentamente per favore", pron: "Par-lee len-ta-men-te per fa-vo-re" },
      zh: { text: "请说慢一点", pron: "Qǐng shuō màn yīdiǎn" },
      pt: { text: "Fale devagar, por favor", pron: "Fa-leh de-va-gar, por fa-vor" },
      hi: { text: "कृपया धीरे बोलें", pron: "Kripaya dheere bolen" }
    }
  },
  {
    id: 'ess_okay',
    tags: ['Essential'],
    translations: {
      en: { text: "Okay", pron: "Okay" },
      es: { text: "Está bien", pron: "Es-ta byen" },
      fr: { text: "D'accord", pron: "Da-kor" },
      ja: { text: "大丈夫です", pron: "Daijoubu desu" },
      de: { text: "In Ordnung", pron: "In ord-noong" },
      ko: { text: "좋습니다", pron: "Jo-seum-ni-da" },
      it: { text: "Va bene", pron: "Va be-ne" },
      zh: { text: "好的", pron: "Hǎo de" },
      pt: { text: "Está bem", pron: "Es-tah bem" },
      hi: { text: "ठीक है", pron: "Theek hai" }
    }
  },
  {
    id: 'ess_right',
    tags: ['Essential'],
    translations: {
      en: { text: "That is right", pron: "That is right" },
      es: { text: "Es correcto", pron: "Es ko-rek-to" },
      fr: { text: "C'est exact", pron: "Say eg-zakt" },
      ja: { text: "その通りです", pron: "Sono toori desu" },
      de: { text: "Das stimmt", pron: "Das shtimt" },
      ko: { text: "맞습니다", pron: "Mat-seum-ni-da" },
      it: { text: "È giusto", pron: "E jus-to" },
      zh: { text: "那是对的", pron: "Nà shì duì de" },
      pt: { text: "Está certo", pron: "Es-tah sehr-to" },
      hi: { text: "वह सही है", pron: "Vah sahi hai" }
    }
  },
  {
    id: 'ess_wrong',
    tags: ['Essential'],
    translations: {
      en: { text: "That is wrong", pron: "That is wrong" },
      es: { text: "Está mal", pron: "Es-ta mal" },
      fr: { text: "C'est faux", pron: "Say fo" },
      ja: { text: "違います", pron: "Chigaimasu" },
      de: { text: "Das ist falsch", pron: "Das ist falsh" },
      ko: { text: "틀렸습니다", pron: "Teul-lyeot-seum-ni-da" },
      it: { text: "È sbagliato", pron: "E zba-lya-to" },
      zh: { text: "那是错的", pron: "Nà shì cuò de" },
      pt: { text: "Está errado", pron: "Es-tah eh-rra-do" },
      hi: { text: "वह गलत है", pron: "Vah galat hai" }
    }
  },

  // --- TRAVEL & DIRECTIONS (15) ---
  {
    id: 'trv_where',
    tags: ['Travel'],
    translations: {
      en: { text: "Where is...?", pron: "Where is...?" },
      es: { text: "¿Dónde está...?", pron: "Don-deh es-ta..." },
      fr: { text: "Où est...?", pron: "Oo ay..." },
      ja: { text: "...はどこですか", pron: "...wa doko desu ka" },
      de: { text: "Wo ist...?", pron: "Vo ist..." },
      ko: { text: "...은(는) 어디에 있습니까?", pron: "...eun(neun) eo-di-e it-seum-ni-ka" },
      it: { text: "Dov'è...?", pron: "Doh-ve..." },
      zh: { text: "...在哪里？", pron: "...zài nǎlǐ?" },
      pt: { text: "Onde fica...?", pron: "On-deh fee-ka..." },
      hi: { text: "...कहाँ है?", pron: "...kahan hai?" }
    }
  },
  {
    id: 'trv_toilet',
    tags: ['Travel'],
    translations: {
      en: { text: "Where is the bathroom?", pron: "Where is the bathroom?" },
      es: { text: "¿Dónde está el baño?", pron: "Don-deh es-ta el ba-nyo" },
      fr: { text: "Où sont les toilettes?", pron: "Oo son lay twa-let" },
      ja: { text: "トイレはどこですか", pron: "Toire wa doko desu ka" },
      de: { text: "Wo ist die Toilette?", pron: "Vo ist dee toy-le-te" },
      ko: { text: "화장실은 어디입니까?", pron: "Hwa-jang-sil-eun eo-di-im-ni-ka" },
      it: { text: "Dov'è il bagno?", pron: "Doh-ve il ba-nyo" },
      zh: { text: "洗手间在哪里？", pron: "Xǐshǒujiān zài nǎlǐ?" },
      pt: { text: "Onde fica o banheiro?", pron: "On-deh fee-ka o ba-nyey-ro" },
      hi: { text: "शौचालय कहाँ है?", pron: "Shauchalay kahan hai?" }
    }
  },
  {
    id: 'trv_ticket',
    tags: ['Travel'],
    translations: {
      en: { text: "Ticket", pron: "Ticket" },
      es: { text: "Boleto", pron: "Bo-le-to" },
      fr: { text: "Billet", pron: "Bee-yay" },
      ja: { text: "切符", pron: "Kippu" },
      de: { text: "Fahrkarte", pron: "Far-kar-te" },
      ko: { text: "표", pron: "Pyo" },
      it: { text: "Biglietto", pron: "Bee-lyet-to" },
      zh: { text: "票", pron: "Piào" },
      pt: { text: "Bilhete", pron: "Bee-lye-teh" },
      hi: { text: "टिकट", pron: "Ticket" }
    }
  },
  {
    id: 'trv_station',
    tags: ['Travel'],
    translations: {
      en: { text: "Station", pron: "Station" },
      es: { text: "Estación", pron: "Es-ta-syon" },
      fr: { text: "Gare", pron: "Gar" },
      ja: { text: "駅", pron: "Eki" },
      de: { text: "Bahnhof", pron: "Ban-hof" },
      ko: { text: "역", pron: "Yeok" },
      it: { text: "Stazione", pron: "Sta-zyo-ne" },
      zh: { text: "车站", pron: "Chēzhàn" },
      pt: { text: "Estação", pron: "Es-ta-sow" },
      hi: { text: "स्टेशन", pron: "Station" }
    }
  },
  {
    id: 'trv_hotel',
    tags: ['Travel'],
    translations: {
      en: { text: "Hotel", pron: "Hotel" },
      es: { text: "Hotel", pron: "O-tel" },
      fr: { text: "Hôtel", pron: "O-tel" },
      ja: { text: "ホテル", pron: "Hoteru" },
      de: { text: "Hotel", pron: "Ho-tel" },
      ko: { text: "호텔", pron: "Ho-tel" },
      it: { text: "Albergo", pron: "Al-ber-go" },
      zh: { text: "酒店", pron: "Jiǔdiàn" },
      pt: { text: "Hotel", pron: "O-tel" },
      hi: { text: "होटल", pron: "Hotel" }
    }
  },
  {
    id: 'trv_taxi',
    tags: ['Travel'],
    translations: {
      en: { text: "Taxi", pron: "Taxi" },
      es: { text: "Taxi", pron: "Tak-see" },
      fr: { text: "Taxi", pron: "Tak-see" },
      ja: { text: "タクシー", pron: "Takushii" },
      de: { text: "Taxi", pron: "Tak-see" },
      ko: { text: "택시", pron: "Taek-si" },
      it: { text: "Taxi", pron: "Tak-see" },
      zh: { text: "出租车", pron: "Chūzū chē" },
      pt: { text: "Táxi", pron: "Tak-see" },
      hi: { text: "टैक्सी", pron: "Taxi" }
    }
  },
  {
    id: 'trv_bus',
    tags: ['Travel'],
    translations: {
      en: { text: "Bus", pron: "Bus" },
      es: { text: "Autobús", pron: "Ow-to-boos" },
      fr: { text: "Bus", pron: "Boos" },
      ja: { text: "バス", pron: "Basu" },
      de: { text: "Bus", pron: "Boos" },
      ko: { text: "버스", pron: "Beo-seu" },
      it: { text: "Autobus", pron: "Ow-to-boos" },
      zh: { text: "公共汽车", pron: "Gōnggòng qìchē" },
      pt: { text: "Ônibus", pron: "Oh-nee-boos" },
      hi: { text: "बस", pron: "Bus" }
    }
  },
  {
    id: 'trv_airport',
    tags: ['Travel'],
    translations: {
      en: { text: "Airport", pron: "Airport" },
      es: { text: "Aeropuerto", pron: "Ah-eh-ro-pwer-to" },
      fr: { text: "Aéroport", pron: "Ah-eh-ro-por" },
      ja: { text: "空港", pron: "Kuukou" },
      de: { text: "Flughafen", pron: "Floog-ha-fen" },
      ko: { text: "공항", pron: "Gong-hang" },
      it: { text: "Aeroporto", pron: "Ah-eh-ro-por-to" },
      zh: { text: "机场", pron: "Jīchǎng" },
      pt: { text: "Aeroporto", pron: "Ah-eh-ro-por-to" },
      hi: { text: "हवाई अड्डा", pron: "Havai adda" }
    }
  },
  {
    id: 'trv_left',
    tags: ['Travel', 'Direction'],
    translations: {
      en: { text: "Left", pron: "Left" },
      es: { text: "Izquierda", pron: "Iz-kyer-da" },
      fr: { text: "Gauche", pron: "Gosh" },
      ja: { text: "左", pron: "Hidari" },
      de: { text: "Links", pron: "Links" },
      ko: { text: "왼쪽", pron: "Oen-jjok" },
      it: { text: "Sinistra", pron: "See-nees-tra" },
      zh: { text: "左", pron: "Zuǒ" },
      pt: { text: "Esquerda", pron: "Es-kehr-da" },
      hi: { text: "बाएं", pron: "Baaen" }
    }
  },
  {
    id: 'trv_right',
    tags: ['Travel', 'Direction'],
    translations: {
      en: { text: "Right", pron: "Right" },
      es: { text: "Derecha", pron: "De-re-cha" },
      fr: { text: "Droite", pron: "Drwat" },
      ja: { text: "右", pron: "Migi" },
      de: { text: "Rechts", pron: "Rekhts" },
      ko: { text: "오른쪽", pron: "O-reun-jjok" },
      it: { text: "Destra", pron: "Des-tra" },
      zh: { text: "右", pron: "Yòu" },
      pt: { text: "Direita", pron: "Dee-rey-ta" },
      hi: { text: "दाएं", pron: "Daaen" }
    }
  },
  {
    id: 'trv_straight',
    tags: ['Travel', 'Direction'],
    translations: {
      en: { text: "Straight ahead", pron: "Straight ahead" },
      es: { text: "Todo recto", pron: "To-do rek-to" },
      fr: { text: "Tout droit", pron: "Too drwa" },
      ja: { text: "まっすぐ", pron: "Massugu" },
      de: { text: "Geradeaus", pron: "Ge-ra-de-ows" },
      ko: { text: "직진", pron: "Jik-jin" },
      it: { text: "Dritto", pron: "Dreet-to" },
      zh: { text: "直走", pron: "Zhí zǒu" },
      pt: { text: "Em frente", pron: "Em fren-te" },
      hi: { text: "सीधे", pron: "Seedhe" }
    }
  },
  {
    id: 'trv_stop',
    tags: ['Travel', 'Direction'],
    translations: {
      en: { text: "Stop here", pron: "Stop here" },
      es: { text: "Pare aquí", pron: "Pa-re ah-kee" },
      fr: { text: "Arrêtez-vous ici", pron: "Ah-reh-tay voo ee-see" },
      ja: { text: "ここで止まってください", pron: "Koko de tomatte kudasai" },
      de: { text: "Halten Sie hier", pron: "Hal-ten zee heer" },
      ko: { text: "여기서 멈춰주세요", pron: "Yeo-gi-seo meom-chwo-ju-se-yo" },
      it: { text: "Fermati qui", pron: "Fer-ma-tee kwee" },
      zh: { text: "停在这里", pron: "Tíng zài zhèlǐ" },
      pt: { text: "Pare aqui", pron: "Pa-re ah-kee" },
      hi: { text: "यहाँ रुको", pron: "Yahan ruko" }
    }
  },
  {
    id: 'trv_map',
    tags: ['Travel'],
    translations: {
      en: { text: "Map", pron: "Map" },
      es: { text: "Mapa", pron: "Ma-pa" },
      fr: { text: "Carte", pron: "Kart" },
      ja: { text: "地図", pron: "Chizu" },
      de: { text: "Karte", pron: "Kar-te" },
      ko: { text: "지도", pron: "Ji-do" },
      it: { text: "Mappa", pron: "Map-pa" },
      zh: { text: "地图", pron: "Dìtú" },
      pt: { text: "Mapa", pron: "Ma-pa" },
      hi: { text: "नक्शा", pron: "Naksha" }
    }
  },
  // --- SHOPPING (15) ---
  {
    id: 'shop_how_much',
    tags: ['Shopping'],
    translations: {
      en: { text: "How much is this?", pron: "How much is this?" },
      es: { text: "¿Cuánto cuesta esto?", pron: "Kwan-to kwes-ta es-to" },
      fr: { text: "Combien ça coûte?", pron: "Kom-byen sa koot" },
      ja: { text: "いくらですか", pron: "Ikura desu ka" },
      de: { text: "Wie viel kostet das?", pron: "Vee feel kos-tet das" },
      ko: { text: "얼마입니까?", pron: "Eol-ma-im-ni-ka" },
      it: { text: "Quanto costa?", pron: "Kwan-to kos-ta" },
      zh: { text: "多少钱？", pron: "Duōshǎo qián?" },
      pt: { text: "Quanto custa?", pron: "Kwan-to koos-ta" },
      hi: { text: "यह कितने का है?", pron: "Yeh kitne ka hai?" }
    }
  },
  {
    id: 'shop_expensive',
    tags: ['Shopping'],
    translations: {
      en: { text: "Too expensive", pron: "Too expensive" },
      es: { text: "Demasiado caro", pron: "De-ma-sya-do ka-ro" },
      fr: { text: "Trop cher", pron: "Tro sher" },
      ja: { text: "高すぎます", pron: "Takasugimasu" },
      de: { text: "Zu teuer", pron: "Tsoo toy-er" },
      ko: { text: "너무 비쌉니다", pron: "Neo-mu bi-ssam-ni-da" },
      it: { text: "Troppo caro", pron: "Trop-po ka-ro" },
      zh: { text: "太贵了", pron: "Tài guìle" },
      pt: { text: "Muito caro", pron: "Moo-ee-to ka-ro" },
      hi: { text: "बहुत महंगा", pron: "Bahut mehenga" }
    }
  },
  {
    id: 'shop_cheap',
    tags: ['Shopping'],
    translations: {
      en: { text: "Cheap", pron: "Cheap" },
      es: { text: "Barato", pron: "Ba-ra-to" },
      fr: { text: "Pas cher", pron: "Pa sher" },
      ja: { text: "安い", pron: "Yasui" },
      de: { text: "Billig", pron: "Bi-lig" },
      ko: { text: "쌉니다", pron: "Ssam-ni-da" },
      it: { text: "Economico", pron: "Eh-ko-no-mee-ko" },
      zh: { text: "便宜", pron: "Piányí" },
      pt: { text: "Barato", pron: "Ba-ra-to" },
      hi: { text: "सस्ता", pron: "Sasta" }
    }
  },
  {
    id: 'shop_card',
    tags: ['Shopping'],
    translations: {
      en: { text: "Can I use a credit card?", pron: "Can I use a credit card?" },
      es: { text: "¿Puedo pagar con tarjeta?", pron: "Pwe-do pa-gar kon tar-he-ta" },
      fr: { text: "Puis-je payer par carte?", pron: "Pwee zhuh pay-ay par kart" },
      ja: { text: "カードは使えますか", pron: "Kaado wa tsukaemasu ka" },
      de: { text: "Kann ich mit Karte bezahlen?", pron: "Kan ikh mit kar-te be-tsa-len" },
      ko: { text: "카드로 계산할 수 있습니까?", pron: "Ka-deu-ro gye-san-hal su it-seum-ni-ka" },
      it: { text: "Posso pagare con carta?", pron: "Pos-so pa-ga-re kon kar-ta" },
      zh: { text: "可以刷卡吗？", pron: "Kěyǐ shuākǎ ma?" },
      pt: { text: "Posso pagar com cartão?", pron: "Po-so pa-gar kom kar-tow" },
      hi: { text: "क्या मैं कार्ड का उपयोग कर सकता हूँ?", pron: "Kya main card ka upyog kar sakta hoon?" }
    }
  },
  {
    id: 'shop_cash',
    tags: ['Shopping'],
    translations: {
      en: { text: "Cash only", pron: "Cash only" },
      es: { text: "Solo efectivo", pron: "So-lo e-fek-tee-vo" },
      fr: { text: "Espèces seulement", pron: "Es-pes suhl-mon" },
      ja: { text: "現金のみ", pron: "Genkin nomi" },
      de: { text: "Nur Bargeld", pron: "Noor bar-gelt" },
      ko: { text: "현금만 가능합니다", pron: "Hyeon-geum-man ga-neung-ham-ni-da" },
      it: { text: "Solo contanti", pron: "So-lo kon-tan-tee" },
      zh: { text: "只收现金", pron: "Zhǐ shōu xiànjīn" },
      pt: { text: "Só dinheiro", pron: "So dee-nyey-ro" },
      hi: { text: "केवल नकद", pron: "Keval nakad" }
    }
  },
  {
    id: 'shop_look',
    tags: ['Shopping'],
    translations: {
      en: { text: "I am just looking", pron: "I am just looking" },
      es: { text: "Solo estoy mirando", pron: "So-lo es-toy mee-ran-do" },
      fr: { text: "Je regarde seulement", pron: "Zhuh re-gard suhl-mon" },
      ja: { text: "見ているだけです", pron: "Miteiru dake desu" },
      de: { text: "Ich schaue nur", pron: "Ikh show-e noor" },
      ko: { text: "그냥 구경하는 중입니다", pron: "Geu-nyang gu-gyeong-ha-neun jung-im-ni-da" },
      it: { text: "Sto solo guardando", pron: "Sto so-lo gwar-dan-do" },
      zh: { text: "我只是看看", pron: "Wǒ zhǐshì kàn kàn" },
      pt: { text: "Só estou olhando", pron: "So es-toh o-lyan-do" },
      hi: { text: "मैं सिर्फ देख रहा हूँ", pron: "Main sirf dekh raha hoon" }
    }
  },
  {
    id: 'shop_try',
    tags: ['Shopping'],
    translations: {
      en: { text: "Can I try this on?", pron: "Can I try this on?" },
      es: { text: "¿Puedo probármelo?", pron: "Pwe-do pro-bar-me-lo" },
      fr: { text: "Puis-je l'essayer?", pron: "Pwee zhuh le-say-ay" },
      ja: { text: "試着してもいいですか", pron: "Shichaku shitemo ii desu ka" },
      de: { text: "Kann ich das anprobieren?", pron: "Kan ikh das an-pro-bee-ren" },
      ko: { text: "입어봐도 됩니까?", pron: "I-beo-bwa-do doem-ni-ka" },
      it: { text: "Posso provarlo?", pron: "Pos-so pro-var-lo" },
      zh: { text: "我可以试穿吗？", pron: "Wǒ kěyǐ shìchuān ma?" },
      pt: { text: "Posso experimentar?", pron: "Po-so eks-pe-ree-men-tar" },
      hi: { text: "क्या मैं इसे पहन कर देख सकता हूँ?", pron: "Kya main ise pehan kar dekh sakta hoon?" }
    }
  },
  {
    id: 'shop_size',
    tags: ['Shopping'],
    translations: {
      en: { text: "Do you have a larger size?", pron: "Do you have a larger size?" },
      es: { text: "¿Tiene una talla más grande?", pron: "Tye-ne oo-na ta-ya mas gran-de" },
      fr: { text: "Avez-vous une plus grande taille?", pron: "Ah-vay voo oon ploo grand ty" },
      ja: { text: "もっと大きいサイズはありますか", pron: "Motto ookii saizu wa arimasu ka" },
      de: { text: "Haben Sie eine größere Größe?", pron: "Ha-ben zee i-ne gre-se-re gre-se" },
      ko: { text: "더 큰 사이즈 있습니까?", pron: "Deo keun sa-i-zeu it-seum-ni-ka" },
      it: { text: "Ha una taglia più grande?", pron: "Ah oo-na ta-lya pyoo gran-de" },
      zh: { text: "有大一点的吗？", pron: "Yǒu dà yīdiǎn de ma?" },
      pt: { text: "Tem um tamanho maior?", pron: "Tem oom ta-ma-nyo my-or" },
      hi: { text: "क्या आपके पास बड़ा आकार है?", pron: "Kya aapke paas bada aakaar hai?" }
    }
  },
  {
    id: 'shop_small',
    tags: ['Shopping'],
    translations: {
      en: { text: "Do you have a smaller size?", pron: "Do you have a smaller size?" },
      es: { text: "¿Tiene una talla más pequeña?", pron: "Tye-ne oo-na ta-ya mas pe-ke-nya" },
      fr: { text: "Avez-vous une plus petite taille?", pron: "Ah-vay voo oon ploo p-teet ty" },
      ja: { text: "もっと小さいサイズはありますか", pron: "Motto chiisai saizu wa arimasu ka" },
      de: { text: "Haben Sie eine kleinere Größe?", pron: "Ha-ben zee i-ne klay-ne-re gre-se" },
      ko: { text: "더 작은 사이즈 있습니까?", pron: "Deo ja-geun sa-i-zeu it-seum-ni-ka" },
      it: { text: "Ha una taglia più piccola?", pron: "Ah oo-na ta-lya pyoo pee-ko-la" },
      zh: { text: "有小一点的吗？", pron: "Yǒu xiǎo yīdiǎn de ma?" },
      pt: { text: "Tem um tamanho menor?", pron: "Tem oom ta-ma-nyo me-nor" },
      hi: { text: "क्या आपके पास छोटा आकार है?", pron: "Kya aapke paas chhota aakaar hai?" }
    }
  },
  {
    id: 'shop_open',
    tags: ['Shopping'],
    translations: {
      en: { text: "Open", pron: "Open" },
      es: { text: "Abierto", pron: "Ah-byer-to" },
      fr: { text: "Ouvert", pron: "Oo-ver" },
      ja: { text: "営業中", pron: "Eigyouchuu" },
      de: { text: "Offen", pron: "O-fen" },
      ko: { text: "영업 중", pron: "Yeong-eop jung" },
      it: { text: "Aperto", pron: "Ah-per-to" },
      zh: { text: "营业中", pron: "Yíngyè zhōng" },
      pt: { text: "Aberto", pron: "Ah-ber-to" },
      hi: { text: "खुला है", pron: "Khula hai" }
    }
  },
  {
    id: 'shop_closed',
    tags: ['Shopping'],
    translations: {
      en: { text: "Closed", pron: "Closed" },
      es: { text: "Cerrado", pron: "Se-rra-do" },
      fr: { text: "Fermé", pron: "Fer-may" },
      ja: { text: "閉店", pron: "Heiten" },
      de: { text: "Geschlossen", pron: "Ge-shlo-sen" },
      ko: { text: "문 닫음", pron: "Mun da-deum" },
      it: { text: "Chiuso", pron: "Kyu-zo" },
      zh: { text: "已关门", pron: "Yǐ guānmén" },
      pt: { text: "Fechado", pron: "Fe-sha-do" },
      hi: { text: "बंद है", pron: "Band hai" }
    }
  },
  {
    id: 'shop_bag',
    tags: ['Shopping'],
    translations: {
      en: { text: "Bag please", pron: "Bag please" },
      es: { text: "Una bolsa, por favor", pron: "Oo-na bol-sa por fa-vor" },
      fr: { text: "Un sac s'il vous plaît", pron: "Un sak seel voo play" },
      ja: { text: "袋をください", pron: "Fukuro o kudasai" },
      de: { text: "Eine Tüte bitte", pron: "I-ne tew-te bi-te" },
      ko: { text: "봉투 주세요", pron: "Bong-tu ju-se-yo" },
      it: { text: "Una busta per favore", pron: "Oo-na boos-ta per fa-vo-re" },
      zh: { text: "请给我袋子", pron: "Qǐng gěi wǒ dàizi" },
      pt: { text: "Uma sacola, por favor", pron: "Oo-ma sa-ko-la por fa-vor" },
      hi: { text: "थैला दीजिये", pron: "Thaila dijiye" }
    }
  },
  {
    id: 'shop_receipt',
    tags: ['Shopping'],
    translations: {
      en: { text: "Receipt please", pron: "Receipt please" },
      es: { text: "El recibo, por favor", pron: "El re-see-bo por fa-vor" },
      fr: { text: "Le ticket s'il vous plaît", pron: "Luh tee-kay seel voo play" },
      ja: { text: "レシートをください", pron: "Reshiito o kudasai" },
      de: { text: "Die Quittung bitte", pron: "Dee kvi-toong bi-te" },
      ko: { text: "영수증 주세요", pron: "Yeong-su-jeung ju-se-yo" },
      it: { text: "Lo scontrino per favore", pron: "Lo skon-tree-no per fa-vo-re" },
      zh: { text: "请给我发票", pron: "Qǐng gěi wǒ fāpiào" },
      pt: { text: "O recibo, por favor", pron: "O re-see-bo por fa-vor" },
      hi: { text: "रसीद दीजिये", pron: "Raseed dijiye" }
    }
  },
  {
    id: 'shop_discount',
    tags: ['Shopping'],
    translations: {
      en: { text: "Can you give me a discount?", pron: "Can you give me a discount?" },
      es: { text: "¿Me puede hacer un descuento?", pron: "Meh pwe-de ah-ser oon des-kwen-to" },
      fr: { text: "Pouvez-vous me faire un rabais?", pron: "Poo-vay voo muh fair un ra-bay" },
      ja: { text: "まけてもらえませんか", pron: "Makete moraemasen ka" },
      de: { text: "Können Sie mir einen Rabatt geben?", pron: "Ke-nen zee meer i-nen ra-bat gay-ben" },
      ko: { text: "할인해 주실 수 있나요?", pron: "Ha-rin-hae ju-sil su in-na-yo" },
      it: { text: "Mi può fare uno sconto?", pron: "Mee pwo fa-re oo-no skon-to" },
      zh: { text: "可以打折吗？", pron: "Kěyǐ dǎzhé ma?" },
      pt: { text: "Pode me dar um desconto?", pron: "Po-deh meh dar oom des-kon-to" },
      hi: { text: "क्या आप मुझे छूट दे सकते हैं?", pron: "Kya aap mujhe choot de sakte hain?" }
    }
  },
  {
    id: 'shop_buy',
    tags: ['Shopping'],
    translations: {
      en: { text: "I will buy this", pron: "I will buy this" },
      es: { text: "Me llevo esto", pron: "Meh yeh-vo es-to" },
      fr: { text: "Je vais prendre ça", pron: "Zhuh vay prondr sa" },
      ja: { text: "これを買います", pron: "Kore o kaimasu" },
      de: { text: "Ich kaufe das", pron: "Ikh kow-fe das" },
      ko: { text: "이것으로 하겠습니다", pron: "I-geo-seu-ro ha-get-seum-ni-da" },
      it: { text: "Prendo questo", pron: "Pren-do kwes-to" },
      zh: { text: "我要买这个", pron: "Wǒ yāomǎi zhège" },
      pt: { text: "Vou levar este", pron: "Vo le-var es-te" },
      hi: { text: "मैं इसे खरीदूंगा", pron: "Main ise khareedoonga" }
    }
  },

  // --- DINING (15) ---
  {
    id: 'food_menu',
    tags: ['Dining'],
    translations: {
      en: { text: "Menu please", pron: "Menu please" },
      es: { text: "El menú, por favor", pron: "El me-noo por fa-vor" },
      fr: { text: "Le menu s'il vous plaît", pron: "Luh me-noo seel voo play" },
      ja: { text: "メニューをください", pron: "Menyuu o kudasai" },
      de: { text: "Die Speisekarte bitte", pron: "Dee shpy-ze-kar-te bi-te" },
      ko: { text: "메뉴판 주세요", pron: "Me-nyu-pan ju-se-yo" },
      it: { text: "Il menù per favore", pron: "Il me-noo per fa-vo-re" },
      zh: { text: "请给我菜单", pron: "Qǐng gěi wǒ càidān" },
      pt: { text: "O cardápio, por favor", pron: "O car-da-pyo por fa-vor" },
      hi: { text: "मेनू दीजिये", pron: "Menu dijiye" }
    }
  },
  {
    id: 'food_water',
    tags: ['Dining'],
    translations: {
      en: { text: "Water please", pron: "Water please" },
      es: { text: "Agua, por favor", pron: "Ah-gwa por fa-vor" },
      fr: { text: "De l'eau s'il vous plaît", pron: "Duh lo seel voo play" },
      ja: { text: "お水をください", pron: "Omizu o kudasai" },
      de: { text: "Wasser bitte", pron: "Va-ser bi-te" },
      ko: { text: "물 좀 주세요", pron: "Mul jom ju-se-yo" },
      it: { text: "Acqua per favore", pron: "Ak-kwa per fa-vo-re" },
      zh: { text: "请给我水", pron: "Qǐng gěi wǒ shuǐ" },
      pt: { text: "Água, por favor", pron: "Ah-gwa por fa-vor" },
      hi: { text: "पानी दीजिये", pron: "Paani dijiye" }
    }
  },
  {
    id: 'food_delicious',
    tags: ['Dining'],
    translations: {
      en: { text: "It is delicious", pron: "It is delicious" },
      es: { text: "Está delicioso", pron: "Es-ta de-lee-syo-so" },
      fr: { text: "C'est délicieux", pron: "Say de-lee-syuh" },
      ja: { text: "美味しいです", pron: "Oishii desu" },
      de: { text: "Es ist lecker", pron: "Es ist le-ker" },
      ko: { text: "맛있습니다", pron: "Ma-sit-seum-ni-da" },
      it: { text: "È delizioso", pron: "E de-lee-zyo-zo" },
      zh: { text: "很好吃", pron: "Hěn hào chī" },
      pt: { text: "Está delicioso", pron: "Es-tah de-lee-syo-zo" },
      hi: { text: "यह स्वादिष्ट है", pron: "Yeh swadisht hai" }
    }
  },
  {
    id: 'food_bill',
    tags: ['Dining'],
    translations: {
      en: { text: "The bill please", pron: "The bill please" },
      es: { text: "La cuenta, por favor", pron: "La kwen-ta por fa-vor" },
      fr: { text: "L'addition s'il vous plaît", pron: "La-dee-syon seel voo play" },
      ja: { text: "お会計をお願いします", pron: "Okaikei o onegaishimasu" },
      de: { text: "Die Rechnung bitte", pron: "Dee rekh-noong bi-te" },
      ko: { text: "계산서 주세요", pron: "Gye-san-seo ju-se-yo" },
      it: { text: "Il conto per favore", pron: "Il kon-to per fa-vo-re" },
      zh: { text: "买单", pron: "Mǎidān" },
      pt: { text: "A conta, por favor", pron: "A kon-ta por fa-vor" },
      hi: { text: "बिल दीजिये", pron: "Bill dijiye" }
    }
  },
  {
    id: 'food_vegetarian',
    tags: ['Dining'],
    translations: {
      en: { text: "I am vegetarian", pron: "I am vegetarian" },
      es: { text: "Soy vegetariano", pron: "Soy ve-he-ta-rya-no" },
      fr: { text: "Je suis végétarien", pron: "Zhuh swee ve-zhe-ta-ryen" },
      ja: { text: "私はベジタリアンです", pron: "Watashi wa bejitarian desu" },
      de: { text: "Ich bin Vegetarier", pron: "Ikh bin ve-ge-ta-ryer" },
      ko: { text: "저는 채식주의자입니다", pron: "Jeo-neun chae-sik-ju-ui-ja-im-ni-da" },
      it: { text: "Sono vegetariano", pron: "So-no ve-je-ta-rya-no" },
      zh: { text: "我是素食者", pron: "Wǒ shì sùshí zhě" },
      pt: { text: "Eu sou vegetariano", pron: "Eh-oo so ve-zhe-ta-rya-no" },
      hi: { text: "मैं शाकाहारी हूँ", pron: "Main shakahari hoon" }
    }
  },
  {
    id: 'food_spicy',
    tags: ['Dining'],
    translations: {
      en: { text: "Is it spicy?", pron: "Is it spicy?" },
      es: { text: "¿Es picante?", pron: "Es pee-kan-te" },
      fr: { text: "Est-ce épicé?", pron: "Es eh-pee-say" },
      ja: { text: "辛いですか", pron: "Karai desu ka" },
      de: { text: "Ist es scharf?", pron: "Ist es sharf" },
      ko: { text: "맵습니까?", pron: "Map-seum-ni-ka" },
      it: { text: "È piccante?", pron: "E pik-kan-te" },
      zh: { text: "这个辣吗？", pron: "Zhège là ma?" },
      pt: { text: "É picante?", pron: "Eh pee-kan-teh" },
      hi: { text: "क्या यह तीखा है?", pron: "Kya yeh teekha hai?" }
    }
  },
  {
    id: 'food_recommend',
    tags: ['Dining'],
    translations: {
      en: { text: "What do you recommend?", pron: "What do you recommend?" },
      es: { text: "¿Qué recomienda?", pron: "Ke re-ko-myen-da" },
      fr: { text: "Que recommandez-vous?", pron: "Kuh re-ko-man-day voo" },
      ja: { text: "おすすめは何ですか", pron: "Osusume wa nan desu ka" },
      de: { text: "Was empfehlen Sie?", pron: "Vas em-pfe-len zee" },
      ko: { text: "추천 메뉴가 무엇입니까?", pron: "Chu-cheon me-nyu-ga mu-eo-sim-ni-ka" },
      it: { text: "Cosa consiglia?", pron: "Ko-za kon-see-lya" },
      zh: { text: "你有什么推荐吗？", pron: "Nǐ yǒu shé me tuījiàn ma?" },
      pt: { text: "O que você recomenda?", pron: "O keh vo-seh re-ko-men-da" },
      hi: { text: "आप क्या सलाह देंगे?", pron: "Aap kya salaah denge?" }
    }
  },
  {
    id: 'food_cheers',
    tags: ['Dining', 'Social'],
    translations: {
      en: { text: "Cheers!", pron: "Cheers!" },
      es: { text: "¡Salud!", pron: "Sa-lood" },
      fr: { text: "Santé!", pron: "San-tay" },
      ja: { text: "乾杯！", pron: "Kanpai!" },
      de: { text: "Prost!", pron: "Prost" },
      ko: { text: "건배!", pron: "Geon-bae!" },
      it: { text: "Salute!", pron: "Sa-loo-te" },
      zh: { text: "干杯！", pron: "Gānbēi!" },
      pt: { text: "Saúde!", pron: "Sa-oo-deh" },
      hi: { text: "चियर्स!", pron: "Cheers!" }
    }
  },
  {
    id: 'food_allergy',
    tags: ['Dining', 'Health'],
    translations: {
      en: { text: "I have an allergy", pron: "I have an allergy" },
      es: { text: "Tengo alergia", pron: "Ten-go ah-ler-hya" },
      fr: { text: "J'ai une allergie", pron: "Zhay oon ah-ler-zhee" },
      ja: { text: "アレルギーがあります", pron: "Arerugii ga arimasu" },
      de: { text: "Ich habe eine Allergie", pron: "Ikh ha-be i-ne a-ler-gee" },
      ko: { text: "알레르기가 있습니다", pron: "Al-le-reu-gi-ga it-seum-ni-da" },
      it: { text: "Ho un'allergia", pron: "O oon-ah-ler-jee-ah" },
      zh: { text: "我有过敏", pron: "Wǒ yǒu guòmǐn" },
      pt: { text: "Tenho alergia", pron: "Ten-yo ah-ler-jee-ah" },
      hi: { text: "मुझे एलर्जी है", pron: "Mujhe allergy hai" }
    }
  },
  {
    id: 'food_no_meat',
    tags: ['Dining'],
    translations: {
      en: { text: "No meat please", pron: "No meat please" },
      es: { text: "Sin carne, por favor", pron: "Sin kar-ne por fa-vor" },
      fr: { text: "Sans viande s'il vous plaît", pron: "San vyand seel voo play" },
      ja: { text: "肉抜きでお願いします", pron: "Niku nuki de onegaishimasu" },
      de: { text: "Kein Fleisch bitte", pron: "Kine flysh bi-te" },
      ko: { text: "고기는 빼주세요", pron: "Go-gi-neun ppae-ju-se-yo" },
      it: { text: "Niente carne per favore", pron: "Nyen-te kar-ne per fa-vo-re" },
      zh: { text: "请不要放肉", pron: "Qǐng bùyào fàng ròu" },
      pt: { text: "Sem carne, por favor", pron: "Sem kar-neh por fa-vor" },
      hi: { text: "कृपया मांस न डालें", pron: "Kripaya maans na daalen" }
    }
  },
  {
    id: 'food_fork',
    tags: ['Dining'],
    translations: {
      en: { text: "Fork", pron: "Fork" },
      es: { text: "Tenedor", pron: "Te-ne-dor" },
      fr: { text: "Fourchette", pron: "Foor-shet" },
      ja: { text: "フォーク", pron: "Fooku" },
      de: { text: "Gabel", pron: "Ga-bel" },
      ko: { text: "포크", pron: "Po-keu" },
      it: { text: "Forchetta", pron: "For-ket-ta" },
      zh: { text: "叉子", pron: "Chāzi" },
      pt: { text: "Garfo", pron: "Gar-fo" },
      hi: { text: "कांटा", pron: "Kaanta" }
    }
  },
  {
    id: 'food_spoon',
    tags: ['Dining'],
    translations: {
      en: { text: "Spoon", pron: "Spoon" },
      es: { text: "Cuchara", pron: "Koo-cha-ra" },
      fr: { text: "Cuillère", pron: "Kwee-yer" },
      ja: { text: "スプーン", pron: "Supuun" },
      de: { text: "Löffel", pron: "Le-fel" },
      ko: { text: "숟가락", pron: "Sut-ga-rak" },
      it: { text: "Cucchiaio", pron: "Kuk-kya-yo" },
      zh: { text: "勺子", pron: "Sháozi" },
      pt: { text: "Colher", pron: "Ko-lyer" },
      hi: { text: "चम्मच", pron: "Chammach" }
    }
  },
  {
    id: 'food_knife',
    tags: ['Dining'],
    translations: {
      en: { text: "Knife", pron: "Knife" },
      es: { text: "Cuchillo", pron: "Koo-chee-yo" },
      fr: { text: "Couteau", pron: "Koo-to" },
      ja: { text: "ナイフ", pron: "Naifu" },
      de: { text: "Messer", pron: "Me-ser" },
      ko: { text: "나이프", pron: "Na-i-peu" },
      it: { text: "Coltello", pron: "Kol-tel-lo" },
      zh: { text: "刀", pron: "Dāo" },
      pt: { text: "Faca", pron: "Fa-ka" },
      hi: { text: "चाकू", pron: "Chaaku" }
    }
  },
  {
    id: 'food_napkin',
    tags: ['Dining'],
    translations: {
      en: { text: "Napkin", pron: "Napkin" },
      es: { text: "Servilleta", pron: "Ser-vi-yeh-ta" },
      fr: { text: "Serviette", pron: "Ser-vyet" },
      ja: { text: "ナプキン", pron: "Napukin" },
      de: { text: "Serviette", pron: "Zer-vyet-te" },
      ko: { text: "냅킨", pron: "Naep-kin" },
      it: { text: "Tovagliolo", pron: "To-va-lyo-lo" },
      zh: { text: "餐巾", pron: "Cānjīn" },
      pt: { text: "Guardanapo", pron: "Gwar-da-na-po" },
      hi: { text: "नैपकिन", pron: "Napkin" }
    }
  },
  {
    id: 'food_breakfast',
    tags: ['Dining'],
    translations: {
      en: { text: "Breakfast", pron: "Breakfast" },
      es: { text: "Desayuno", pron: "De-sa-yoo-no" },
      fr: { text: "Petit déjeuner", pron: "Puh-tee de-zhuh-nay" },
      ja: { text: "朝食", pron: "Choushoku" },
      de: { text: "Frühstück", pron: "Frew-shtuwk" },
      ko: { text: "아침 식사", pron: "A-chim sik-sa" },
      it: { text: "Colazione", pron: "Ko-la-zyo-ne" },
      zh: { text: "早餐", pron: "Zǎocān" },
      pt: { text: "Café da manhã", pron: "Ka-feh da ma-nyan" },
      hi: { text: "नाश्ता", pron: "Naashta" }
    }
  },
  // --- NUMBERS & TIME (15) ---
  {
    id: 'num_one',
    tags: ['Numbers'],
    translations: {
      en: { text: "One", pron: "One" },
      es: { text: "Uno", pron: "Oo-no" },
      fr: { text: "Un", pron: "Un" },
      ja: { text: "一 (いち)", pron: "Ichi" },
      de: { text: "Eins", pron: "Ines" },
      ko: { text: "일", pron: "Il" },
      it: { text: "Uno", pron: "Oo-no" },
      zh: { text: "一", pron: "Yī" },
      pt: { text: "Um", pron: "Oom" },
      hi: { text: "एक", pron: "Ek" }
    }
  },
  {
    id: 'num_two',
    tags: ['Numbers'],
    translations: {
      en: { text: "Two", pron: "Two" },
      es: { text: "Dos", pron: "Dos" },
      fr: { text: "Deux", pron: "Duh" },
      ja: { text: "二 (に)", pron: "Ni" },
      de: { text: "Zwei", pron: "Tsvy" },
      ko: { text: "이", pron: "I" },
      it: { text: "Due", pron: "Doo-eh" },
      zh: { text: "二", pron: "Èr" },
      pt: { text: "Dois", pron: "Do-ees" },
      hi: { text: "दो", pron: "Do" }
    }
  },
  {
    id: 'num_three',
    tags: ['Numbers'],
    translations: {
      en: { text: "Three", pron: "Three" },
      es: { text: "Tres", pron: "Tres" },
      fr: { text: "Trois", pron: "Trwa" },
      ja: { text: "三 (さん)", pron: "San" },
      de: { text: "Drei", pron: "Dry" },
      ko: { text: "삼", pron: "Sam" },
      it: { text: "Tre", pron: "Tre" },
      zh: { text: "三", pron: "Sān" },
      pt: { text: "Três", pron: "Tress" },
      hi: { text: "तीन", pron: "Teen" }
    }
  },
  {
    id: 'time_now',
    tags: ['Time'],
    translations: {
      en: { text: "What time is it?", pron: "What time is it?" },
      es: { text: "¿Qué hora es?", pron: "Ke o-ra es" },
      fr: { text: "Quelle heure est-il?", pron: "Kel ur eh-teel" },
      ja: { text: "何時ですか", pron: "Nanji desu ka" },
      de: { text: "Wie spät ist es?", pron: "Vee shpayt ist es" },
      ko: { text: "지금 몇 시입니까?", pron: "Ji-geum myeot si-im-ni-ka" },
      it: { text: "Che ore sono?", pron: "Ke o-re so-no" },
      zh: { text: "现在几点了？", pron: "Xiànzài jǐ diǎnle?" },
      pt: { text: "Que horas são?", pron: "Ke o-ras sow" },
      hi: { text: "क्या समय हुआ है?", pron: "Kya samay hua hai?" }
    }
  },
  {
    id: 'time_today',
    tags: ['Time'],
    translations: {
      en: { text: "Today", pron: "Today" },
      es: { text: "Hoy", pron: "Oy" },
      fr: { text: "Aujourd'hui", pron: "O-zhoor-dwee" },
      ja: { text: "今日", pron: "Kyou" },
      de: { text: "Heute", pron: "Hoy-te" },
      ko: { text: "오늘", pron: "O-neul" },
      it: { text: "Oggi", pron: "Od-jee" },
      zh: { text: "今天", pron: "Jīntiān" },
      pt: { text: "Hoje", pron: "O-zhe" },
      hi: { text: "आज", pron: "Aaj" }
    }
  },
  {
    id: 'time_tomorrow',
    tags: ['Time'],
    translations: {
      en: { text: "Tomorrow", pron: "Tomorrow" },
      es: { text: "Mañana", pron: "Ma-nya-na" },
      fr: { text: "Demain", pron: "De-man" },
      ja: { text: "明日", pron: "Ashita" },
      de: { text: "Morgen", pron: "Mor-gen" },
      ko: { text: "내일", pron: "Nae-il" },
      it: { text: "Domani", pron: "Do-ma-nee" },
      zh: { text: "明天", pron: "Míngtiān" },
      pt: { text: "Amanhã", pron: "Ah-ma-nyan" },
      hi: { text: "कल (आने वाला)", pron: "Kal" }
    }
  },
  {
    id: 'time_yesterday',
    tags: ['Time'],
    translations: {
      en: { text: "Yesterday", pron: "Yesterday" },
      es: { text: "Ayer", pron: "Ah-yer" },
      fr: { text: "Hier", pron: "Yer" },
      ja: { text: "昨日", pron: "Kinou" },
      de: { text: "Gestern", pron: "Ges-tern" },
      ko: { text: "어제", pron: "Eo-je" },
      it: { text: "Ieri", pron: "Yeh-ree" },
      zh: { text: "昨天", pron: "Zuótiān" },
      pt: { text: "Ontem", pron: "On-tem" },
      hi: { text: "कल (बीता हुआ)", pron: "Kal" }
    }
  },
  {
    id: 'time_morning',
    tags: ['Time'],
    translations: {
      en: { text: "Morning", pron: "Morning" },
      es: { text: "Mañana", pron: "Ma-nya-na" },
      fr: { text: "Matin", pron: "Ma-tan" },
      ja: { text: "朝", pron: "Asa" },
      de: { text: "Morgen", pron: "Mor-gen" },
      ko: { text: "아침", pron: "A-chim" },
      it: { text: "Mattina", pron: "Mat-tee-na" },
      zh: { text: "早上", pron: "Zǎoshang" },
      pt: { text: "Manhã", pron: "Ma-nyan" },
      hi: { text: "सुबह", pron: "Subah" }
    }
  },
  {
    id: 'time_night',
    tags: ['Time'],
    translations: {
      en: { text: "Night", pron: "Night" },
      es: { text: "Noche", pron: "No-che" },
      fr: { text: "Nuit", pron: "Nwee" },
      ja: { text: "夜", pron: "Yoru" },
      de: { text: "Nacht", pron: "Nakht" },
      ko: { text: "밤", pron: "Bam" },
      it: { text: "Notte", pron: "Not-te" },
      zh: { text: "晚上", pron: "Wǎnshàng" },
      pt: { text: "Noite", pron: "Noy-te" },
      hi: { text: "रात", pron: "Raat" }
    }
  },
  {
    id: 'time_week',
    tags: ['Time'],
    translations: {
      en: { text: "Week", pron: "Week" },
      es: { text: "Semana", pron: "Se-ma-na" },
      fr: { text: "Semaine", pron: "Se-men" },
      ja: { text: "週", pron: "Shuu" },
      de: { text: "Woche", pron: "Vo-khe" },
      ko: { text: "주", pron: "Ju" },
      it: { text: "Settimana", pron: "Set-tee-ma-na" },
      zh: { text: "周", pron: "Zhōu" },
      pt: { text: "Semana", pron: "Se-ma-na" },
      hi: { text: "सप्ताह", pron: "Saptah" }
    }
  },
  {
    id: 'time_year',
    tags: ['Time'],
    translations: {
      en: { text: "Year", pron: "Year" },
      es: { text: "Año", pron: "Ah-nyo" },
      fr: { text: "Année", pron: "Ah-nay" },
      ja: { text: "年", pron: "Nen" },
      de: { text: "Jahr", pron: "Yar" },
      ko: { text: "년", pron: "Nyeon" },
      it: { text: "Anno", pron: "An-no" },
      zh: { text: "年", pron: "Nián" },
      pt: { text: "Ano", pron: "Ah-no" },
      hi: { text: "साल", pron: "Saal" }
    }
  },
  {
    id: 'time_minute',
    tags: ['Time'],
    translations: {
      en: { text: "Minute", pron: "Minute" },
      es: { text: "Minuto", pron: "Me-noo-to" },
      fr: { text: "Minute", pron: "Me-noot" },
      ja: { text: "分", pron: "Fun" },
      de: { text: "Minute", pron: "Mi-noo-te" },
      ko: { text: "분", pron: "Bun" },
      it: { text: "Minuto", pron: "Me-noo-to" },
      zh: { text: "分钟", pron: "Fēnzhōng" },
      pt: { text: "Minuto", pron: "Me-noo-to" },
      hi: { text: "मिनट", pron: "Minute" }
    }
  },
  {
    id: 'time_hour',
    tags: ['Time'],
    translations: {
      en: { text: "Hour", pron: "Hour" },
      es: { text: "Hora", pron: "O-ra" },
      fr: { text: "Heure", pron: "Ur" },
      ja: { text: "時間", pron: "Jikan" },
      de: { text: "Stunde", pron: "Shtoon-de" },
      ko: { text: "시간", pron: "Si-gan" },
      it: { text: "Ora", pron: "O-ra" },
      zh: { text: "小时", pron: "Xiǎoshí" },
      pt: { text: "Hora", pron: "O-ra" },
      hi: { text: "घंटा", pron: "Ghanta" }
    }
  },
  {
    id: 'time_later',
    tags: ['Time'],
    translations: {
      en: { text: "Later", pron: "Later" },
      es: { text: "Más tarde", pron: "Mas tar-de" },
      fr: { text: "Plus tard", pron: "Ploo tar" },
      ja: { text: "後で", pron: "Atode" },
      de: { text: "Später", pron: "Shpay-ter" },
      ko: { text: "나중에", pron: "Na-jung-e" },
      it: { text: "Più tardi", pron: "Pyoo tar-dee" },
      zh: { text: "稍后", pron: "Shāohòu" },
      pt: { text: "Mais tarde", pron: "Mays tar-deh" },
      hi: { text: "बाद में", pron: "Baad mein" }
    }
  },
  {
    id: 'time_soon',
    tags: ['Time'],
    translations: {
      en: { text: "Soon", pron: "Soon" },
      es: { text: "Pronto", pron: "Pron-to" },
      fr: { text: "Bientôt", pron: "Byen-to" },
      ja: { text: "すぐに", pron: "Sugu ni" },
      de: { text: "Bald", pron: "Balt" },
      ko: { text: "곧", pron: "Got" },
      it: { text: "Presto", pron: "Pres-to" },
      zh: { text: "不久", pron: "Bùjiǔ" },
      pt: { text: "Em breve", pron: "Em bre-veh" },
      hi: { text: "जल्द ही", pron: "Jald hi" }
    }
  },

  // --- EMERGENCY & MISC (15) ---
  {
    id: 'emg_police',
    tags: ['Emergency'],
    translations: {
      en: { text: "Police", pron: "Police" },
      es: { text: "Policía", pron: "Po-lee-see-ah" },
      fr: { text: "Police", pron: "Po-lees" },
      ja: { text: "警察", pron: "Keisatsu" },
      de: { text: "Polizei", pron: "Po-lee-tsy" },
      ko: { text: "경찰", pron: "Gyeong-chal" },
      it: { text: "Polizia", pron: "Po-lee-tsya" },
      zh: { text: "警察", pron: "Jǐngchá" },
      pt: { text: "Polícia", pron: "Po-lee-sya" },
      hi: { text: "पुलिस", pron: "Police" }
    }
  },
  {
    id: 'emg_doctor',
    tags: ['Emergency', 'Health'],
    translations: {
      en: { text: "Doctor", pron: "Doctor" },
      es: { text: "Médico", pron: "Me-dee-ko" },
      fr: { text: "Médecin", pron: "Med-san" },
      ja: { text: "医者", pron: "Isha" },
      de: { text: "Arzt", pron: "Artst" },
      ko: { text: "의사", pron: "Ui-sa" },
      it: { text: "Dottore", pron: "Dot-to-re" },
      zh: { text: "医生", pron: "Yīshēng" },
      pt: { text: "Médico", pron: "Meh-dee-ko" },
      hi: { text: "डॉक्टर", pron: "Doctor" }
    }
  },
  {
    id: 'emg_hospital',
    tags: ['Emergency', 'Health'],
    translations: {
      en: { text: "Hospital", pron: "Hospital" },
      es: { text: "Hospital", pron: "Os-pee-tal" },
      fr: { text: "Hôpital", pron: "O-pee-tal" },
      ja: { text: "病院", pron: "Byouin" },
      de: { text: "Krankenhaus", pron: "Kran-ken-hows" },
      ko: { text: "병원", pron: "Byeong-won" },
      it: { text: "Ospedale", pron: "Os-pe-da-le" },
      zh: { text: "医院", pron: "Yīyuàn" },
      pt: { text: "Hospital", pron: "Os-pee-tal" },
      hi: { text: "अस्पताल", pron: "Aspataal" }
    }
  },
  {
    id: 'emg_pain',
    tags: ['Emergency', 'Health'],
    translations: {
      en: { text: "I am in pain", pron: "I am in pain" },
      es: { text: "Tengo dolor", pron: "Ten-go do-lor" },
      fr: { text: "J'ai mal", pron: "Zhay mal" },
      ja: { text: "痛いです", pron: "Itai desu" },
      de: { text: "Ich habe Schmerzen", pron: "Ikh ha-be shmer-tsen" },
      ko: { text: "아픕니다", pron: "A-peum-ni-da" },
      it: { text: "Ho dolore", pron: "O do-lo-re" },
      zh: { text: "我很痛", pron: "Wǒ hěn tòng" },
      pt: { text: "Estou com dor", pron: "Es-toh kom dor" },
      hi: { text: "मुझे दर्द हो रहा है", pron: "Mujhe dard ho raha hai" }
    }
  },
  {
    id: 'emg_pharmacy',
    tags: ['Health'],
    translations: {
      en: { text: "Pharmacy", pron: "Pharmacy" },
      es: { text: "Farmacia", pron: "Far-ma-sya" },
      fr: { text: "Pharmacie", pron: "Far-ma-see" },
      ja: { text: "薬局", pron: "Yakkyoku" },
      de: { text: "Apotheke", pron: "A-po-tay-ke" },
      ko: { text: "약국", pron: "Yak-guk" },
      it: { text: "Farmacia", pron: "Far-ma-cha" },
      zh: { text: "药房", pron: "Yàofáng" },
      pt: { text: "Farmácia", pron: "Far-ma-sya" },
      hi: { text: "दवा की दुकान", pron: "Dava ki dukan" }
    }
  },
  {
    id: 'emg_lost',
    tags: ['Emergency', 'Travel'],
    translations: {
      en: { text: "I am lost", pron: "I am lost" },
      es: { text: "Estoy perdido", pron: "Es-toy per-dee-do" },
      fr: { text: "Je suis perdu", pron: "Zhuh swee per-doo" },
      ja: { text: "迷子になりました", pron: "Maigo ni narimashita" },
      de: { text: "Ich habe mich verirrt", pron: "Ikh ha-be mikh fe-rirt" },
      ko: { text: "길을 잃었습니다", pron: "Gil-eul ir-eot-seum-ni-da" },
      it: { text: "Mi sono perso", pron: "Mee so-no per-so" },
      zh: { text: "我迷路了", pron: "Wǒ mílùle" },
      pt: { text: "Estou perdido", pron: "Es-toh per-dee-do" },
      hi: { text: "मैं खो गया हूँ", pron: "Main kho gaya hoon" }
    }
  },
  {
    id: 'emg_passport',
    tags: ['Travel', 'Emergency'],
    translations: {
      en: { text: "Passport", pron: "Passport" },
      es: { text: "Pasaporte", pron: "Pa-sa-por-te" },
      fr: { text: "Passeport", pron: "Pas-por" },
      ja: { text: "パスポート", pron: "Pasupooto" },
      de: { text: "Reisepass", pron: "Ry-ze-pas" },
      ko: { text: "여권", pron: "Yeo-gwon" },
      it: { text: "Passaporto", pron: "Pas-sa-por-to" },
      zh: { text: "护照", pron: "Hùzhào" },
      pt: { text: "Passaporte", pron: "Pa-sa-por-te" },
      hi: { text: "पासपोर्ट", pron: "Passport" }
    }
  },
  {
    id: 'emg_embassy',
    tags: ['Travel', 'Emergency'],
    translations: {
      en: { text: "Embassy", pron: "Embassy" },
      es: { text: "Embajada", pron: "Em-ba-ha-da" },
      fr: { text: "Ambassade", pron: "Om-ba-sad" },
      ja: { text: "大使館", pron: "Taishikan" },
      de: { text: "Botschaft", pron: "Bot-shaft" },
      ko: { text: "대사관", pron: "Dae-sa-gwan" },
      it: { text: "Ambasciata", pron: "Am-ba-sha-ta" },
      zh: { text: "大使馆", pron: "Dàshǐ guǎn" },
      pt: { text: "Embaixada", pron: "Em-by-sha-da" },
      hi: { text: "दूतावास", pron: "Dootaavaas" }
    }
  },
  {
    id: 'misc_wifi',
    tags: ['Travel', 'Misc'],
    translations: {
      en: { text: "Do you have Wi-Fi?", pron: "Do you have Wi-Fi?" },
      es: { text: "¿Tiene Wi-Fi?", pron: "Tye-ne Wi-Fi" },
      fr: { text: "Avez-vous le Wi-Fi?", pron: "Ah-vay voo luh Wi-Fi" },
      ja: { text: "Wi-Fiはありますか", pron: "Wi-Fi wa arimasu ka" },
      de: { text: "Haben Sie WLAN?", pron: "Ha-ben zee WLAN" },
      ko: { text: "와이파이 있습니까?", pron: "Wi-Fi it-seum-ni-ka" },
      it: { text: "Avete il Wi-Fi?", pron: "Ah-ve-te il Wi-Fi" },
      zh: { text: "有Wi-Fi吗？", pron: "Yǒu Wi-Fi ma?" },
      pt: { text: "Tem Wi-Fi?", pron: "Tem Wi-Fi" },
      hi: { text: "क्या आपके पास वाई-फाई है?", pron: "Kya aapke paas Wi-Fi hai?" }
    }
  },
  {
    id: 'misc_password',
    tags: ['Misc'],
    translations: {
      en: { text: "What is the password?", pron: "What is the password?" },
      es: { text: "¿Cuál es la contraseña?", pron: "Kwal es la kon-tra-se-nya" },
      fr: { text: "Quel est le mot de passe?", pron: "Kel ay luh mo duh pas" },
      ja: { text: "パスワードは何ですか", pron: "Pasuwaado wa nan desu ka" },
      de: { text: "Wie ist das Passwort?", pron: "Vee ist das pas-vort" },
      ko: { text: "비밀번호가 무엇입니까?", pron: "Bi-mil-beon-ho-ga mu-eo-sim-ni-ka" },
      it: { text: "Qual è la password?", pron: "Kwal e la pas-word" },
      zh: { text: "密码是什么？", pron: "Mìmǎ shì shénme?" },
      pt: { text: "Qual é a senha?", pron: "Kwal eh a se-nya" },
      hi: { text: "पासवर्ड क्या है?", pron: "Password kya hai?" }
    }
  },
  {
    id: 'misc_charge',
    tags: ['Misc'],
    translations: {
      en: { text: "Can I charge my phone?", pron: "Can I charge my phone?" },
      es: { text: "¿Puedo cargar mi teléfono?", pron: "Pwe-do kar-gar mee te-le-fo-no" },
      fr: { text: "Puis-je charger mon téléphone?", pron: "Pwee zhuh shar-zhay mon te-le-fon" },
      ja: { text: "携帯を充電してもいいですか", pron: "Keitai o juuden shitemo ii desu ka" },
      de: { text: "Kann ich mein Handy aufladen?", pron: "Kan ikh mine hen-dee owf-la-den" },
      ko: { text: "휴대폰 충전할 수 있습니까?", pron: "Hyu-dae-pon chung-jeon-hal su it-seum-ni-ka" },
      it: { text: "Posso caricare il telefono?", pron: "Pos-so ka-ree-ka-re il te-le-fo-no" },
      zh: { text: "我可以给手机充电吗？", pron: "Wǒ kěyǐ gěi shǒujī chōngdiàn ma?" },
      pt: { text: "Posso carregar meu celular?", pron: "Po-so ka-rre-gar meh-oo se-loo-lar" },
      hi: { text: "क्या मैं अपना फोन चार्ज कर सकता हूँ?", pron: "Kya main apna phone charge kar sakta hoon?" }
    }
  },
  {
    id: 'misc_photo',
    tags: ['Misc'],
    translations: {
      en: { text: "Can you take a photo?", pron: "Can you take a photo?" },
      es: { text: "¿Puede tomar una foto?", pron: "Pwe-de to-mar oo-na fo-to" },
      fr: { text: "Pouvez-vous prendre une photo?", pron: "Poo-vay voo prondr oon fo-to" },
      ja: { text: "写真を撮ってもらえませんか", pron: "Shashin o totte moraemasen ka" },
      de: { text: "Können Sie ein Foto machen?", pron: "Ke-nen zee ine fo-to ma-khen" },
      ko: { text: "사진 좀 찍어주시겠습니까?", pron: "Sa-jin jom jji-geo-ju-si-get-seum-ni-ka" },
      it: { text: "Può fare una foto?", pron: "Pwo fa-re oo-na fo-to" },
      zh: { text: "能帮我拍张照吗？", pron: "Néng bāng wǒ pāi zhāng zhào ma?" },
      pt: { text: "Pode tirar uma foto?", pron: "Po-deh tee-rar oo-ma fo-to" },
      hi: { text: "क्या आप एक फोटो ले सकते हैं?", pron: "Kya aap ek photo le sakte hain?" }
    }
  },
  {
    id: 'misc_good',
    tags: ['Misc', 'Opinion'],
    translations: {
      en: { text: "Good", pron: "Good" },
      es: { text: "Bueno", pron: "Bweh-no" },
      fr: { text: "Bien", pron: "Byen" },
      ja: { text: "良い", pron: "Yoi" },
      de: { text: "Gut", pron: "Goot" },
      ko: { text: "좋아요", pron: "Jo-a-yo" },
      it: { text: "Bene", pron: "Be-ne" },
      zh: { text: "好", pron: "Hǎo" },
      pt: { text: "Bom", pron: "Bom" },
      hi: { text: "अच्छा", pron: "Achha" }
    }
  },
  {
    id: 'misc_bad',
    tags: ['Misc', 'Opinion'],
    translations: {
      en: { text: "Bad", pron: "Bad" },
      es: { text: "Malo", pron: "Ma-lo" },
      fr: { text: "Mauvais", pron: "Mo-vay" },
      ja: { text: "悪い", pron: "Warui" },
      de: { text: "Schlecht", pron: "Shlekht" },
      ko: { text: "나빠요", pron: "Na-ppa-yo" },
      it: { text: "Male", pron: "Ma-le" },
      zh: { text: "坏", pron: "Huài" },
      pt: { text: "Ruim", pron: "Roo-eem" },
      hi: { text: "बुरा", pron: "Bura" }
    }
  },
  {
    id: 'misc_love',
    tags: ['Misc', 'Social'],
    translations: {
      en: { text: "I love you", pron: "I love you" },
      es: { text: "Te quiero", pron: "Te kye-ro" },
      fr: { text: "Je t'aime", pron: "Zhuh tem" },
      ja: { text: "愛しています", pron: "Aishiteimasu" },
      de: { text: "Ich liebe dich", pron: "Ikh lee-be dikh" },
      ko: { text: "사랑합니다", pron: "Sa-rang-ham-ni-da" },
      it: { text: "Ti amo", pron: "Tee ah-mo" },
      zh: { text: "我爱你", pron: "Wǒ ài nǐ" },
      pt: { text: "Eu te amo", pron: "Eh-oo teh ah-mo" },
      hi: { text: "मैं तुमसे प्यार करता हूँ", pron: "Main tumse pyaar karta hoon" }
    }
  }
];
