
import type { PhraseItem } from "../types";
import { generateId } from "../lib/utils";

export const SAMPLE_DATA: PhraseItem[] = [
  { id: generateId("안녕하세요", "こんにちは"), meaning: "안녕하세요", sentence: "こんにちは", pronunciation: "Konnichiwa", tags: ["Greeting", "Japanese"] },
  { id: generateId("감사합니다", "Obrigado"), meaning: "감사합니다", sentence: "Obrigado", pronunciation: "Obrigado", tags: ["Greeting", "Portuguese"] },
  { id: generateId("이 노래는 시티팝입니다", "この歌はシティポップです"), meaning: "이 노래는 시티팝입니다", sentence: "この歌はシティポップです", pronunciation: "Kono uta wa City Pop desu", tags: ["Music", "Japanese"] },
  { id: generateId("저는 엔지니어입니다", "Eu sou engenheiro"), meaning: "저는 엔지니어입니다", sentence: "Eu sou engenheiro", pronunciation: "Eu sou engenheiro", tags: ["Job", "Portuguese"] },
  { id: generateId("재즈를 좋아합니다", "Jazzが好きです"), meaning: "재즈를 좋아합니다", sentence: "Jazzが好きです", pronunciation: "Jazz ga suki desu", tags: ["Music", "Japanese"] },
];
