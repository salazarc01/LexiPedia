
export interface Source {
  uri: string;
  title: string;
}

export interface Definition {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  meaning: string;
  examples: string[];
  synonyms: string[];
  etymology?: string;
  isCustom?: boolean;
  sources?: Source[];
}

export interface HomeContent {
  featuredArticle: {
    title: string;
    summary: string;
  };
  resourceOfDay: {
    title: string;
    description: string;
  };
  onThisDay: string[];
}

export interface UserMeta {
  location: string;
  time: string;
  date: string;
}

export interface AppState {
  searchQuery: string;
  definition: Definition | null;
  isLoading: boolean;
  error: string | null;
  history: string[];
  homeContent: HomeContent | null;
  userMeta: UserMeta;
}
