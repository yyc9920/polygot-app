import { v4 as uuidv4 } from 'uuid';
import type { PhraseEntity } from '../types/schema';

const now = new Date().toISOString();

export const SAMPLE_DATA: PhraseEntity[] = [
  { 
    id: uuidv4(),
    meaning: "안녕하세요", 
    sentence: "こんにちは", 
    pronunciation: "Konnichiwa", 
    tags: ["Greeting", "Japanese"],
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  },
  { 
    id: uuidv4(),
    meaning: "감사합니다", 
    sentence: "Obrigado", 
    pronunciation: "Obrigado", 
    tags: ["Greeting", "Portuguese"],
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  },
  { 
    id: uuidv4(),
    meaning: "이 노래는 시티팝입니다", 
    sentence: "この歌はシティポップです", 
    pronunciation: "Kono uta wa City Pop desu", 
    tags: ["Music", "Japanese"],
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  },
  { 
    id: uuidv4(),
    meaning: "저는 엔지니어입니다", 
    sentence: "Eu sou engenheiro", 
    pronunciation: "Eu sou engenheiro", 
    tags: ["Job", "Portuguese"],
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  },
  { 
    id: uuidv4(),
    meaning: "재즈를 좋아합니다", 
    sentence: "Jazzが好きです", 
    pronunciation: "Jazz ga suki desu", 
    tags: ["Music", "Japanese"],
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  },
];
