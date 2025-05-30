declare module '@nlpjs/core' {
  export function containerBootstrap(): Promise<any>;
}

declare module '@nlpjs/nlp' {
  export interface NlpManagerOptions {
    languages?: string[];
    forceNER?: boolean;
    nlu?: {
      log?: boolean | ((status: string, time: number) => void);
      useNoneFeature?: boolean;
    };
  }

  export interface ProcessResult {
    utterance: string;
    locale: string;
    languageGuessed: boolean;
    localeIso2: string;
    language: string;
    domain: string;
    classifications: Array<{
      label: string;
      value: number;
    }>;
    intent: string;
    score: number;
    entities: Array<{
      start: number;
      end: number;
      len: number;
      accuracy: number;
      sourceText: string;
      utteranceText: string;
      entity: string;
      option: string;
      resolution: any;
    }>;
    sentiment: {
      score: number;
      comparative: number;
      vote: string;
      numWords: number;
      numHits: number;
      type: string;
      language: string;
    };
    actions: any[];
    srcAnswer: string;
    answer: string;
  }

  export class NlpManager {
    constructor(settings?: NlpManagerOptions);
    addDocument(language: string, utterance: string, intent: string): void;
    addAnswer(language: string, intent: string, answer: string): void;
    train(): Promise<void>;
    save(): void;
    process(language: string, utterance: string): Promise<ProcessResult>;
  }

  export const Nlp: any;
}

declare module '@nlpjs/lang-en-min' {
  export const LangEn: any;
} 