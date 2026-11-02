// Backend contract types for /api/v1.
// Source of truth: src/domain/models.py — field names below were verified
// against real responses from the running FastAPI server (LLM_PROVIDER=fake).
//
// - Request (AnalyzeRequest) has NO alias generator  -> snake_case keys.
// - Response (AnalysisResult) uses alias_generator=to_camel -> camelCase keys.
//   Note: to_camel lowercases single-letter fields, so translation.choices
//   comes back as { a, b, c, d } (lowercase), unlike every other choice label.

export type TestType = 'LC' | 'RC';
export type ChoiceLabel = 'A' | 'B' | 'C' | 'D';

export type ErrorCategoryCode =
    | 'PART_OF_SPEECH'
    | 'TENSE_VOICE'
    | 'AGREEMENT_PRONOUN'
    | 'CONNECTOR'
    | 'SENTENCE_STRUCTURE'
    | 'VOCABULARY'
    | 'PREPOSITION_IDIOM'
    | 'EVIDENCE_FINDING'
    | 'PARAPHRASING'
    | 'LISTENING'
    | 'CARELESS_MISTAKE'
    | 'OTHER';

export type PartOfSpeech =
    | 'noun'
    | 'verb'
    | 'adjective'
    | 'adverb'
    | 'preposition'
    | 'conjunction'
    | 'phrase';

/** POST /api/v1/analyze request body (snake_case). */
export interface AnalyzeRequest {
    test_type: TestType;
    part: number; // 1-7
    question_text: string;
    choices: Partial<Record<ChoiceLabel, string>>;
    correct_answer: ChoiceLabel;
    user_answer: ChoiceLabel;
}

export interface TranslationChoices {
    a: string;
    b: string;
    c: string;
    d: string;
}

export interface Translation {
    question: string;
    choices: TranslationChoices;
}

export interface CorrectAnswer {
    choice: ChoiceLabel;
    text: string;
}

export interface CorrectReason {
    summary: string;
    detail: string;
    grammarRule: string | null;
}

export interface WrongAnswerReason {
    selectedChoice: ChoiceLabel;
    selectedText: string;
    summary: string;
    detail: string;
}

export interface ErrorCategory {
    primary: ErrorCategoryCode;
    secondary: ErrorCategoryCode | null;
    description: string;
}

export interface LearningPointExample {
    english: string;
    korean: string;
}

export interface LearningPoint {
    title: string;
    explanation: string;
    examples: LearningPointExample[];
    tip: string;
}

export interface VocabularyItem {
    word: string;
    partOfSpeech: PartOfSpeech;
    meaning: string;
    exampleSentence: string;
}

export interface Confidence {
    score: number; // 0.0 - 1.0
    reason: string;
}

/** Response of POST /analyze, GET /notes/{id}, items of GET /notes (camelCase). */
export interface AnalysisResult {
    id: string; // UUID
    createdAt: string; // ISO 8601 without timezone (server uses naive UTC)
    part: number | null;
    translation: Translation;
    correctAnswer: CorrectAnswer;
    correctReason: CorrectReason;
    wrongAnswerReason: WrongAnswerReason;
    errorCategory: ErrorCategory;
    learningPoint: LearningPoint;
    vocabulary: VocabularyItem[];
    confidence: Confidence;
    disclaimer: string;
}

/** FastAPI error body: string for HTTPException, array for 422 validation. */
export interface ApiErrorBody {
    detail?: string | Array<{ msg: string; loc?: Array<string | number> }>;
}
