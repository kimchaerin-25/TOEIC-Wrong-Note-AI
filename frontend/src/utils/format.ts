import type { ErrorCategoryCode } from '../types/analysis';

const ERROR_CATEGORY_LABELS: Record<ErrorCategoryCode, string> = {
    PART_OF_SPEECH: 'Part of Speech',
    TENSE_VOICE: 'Tense / Voice',
    AGREEMENT_PRONOUN: 'Agreement / Pronoun',
    CONNECTOR: 'Connector',
    SENTENCE_STRUCTURE: 'Sentence Structure',
    VOCABULARY: 'Vocabulary',
    PREPOSITION_IDIOM: 'Preposition / Idiom',
    EVIDENCE_FINDING: 'Evidence Finding',
    PARAPHRASING: 'Paraphrasing',
    LISTENING: 'Listening',
    CARELESS_MISTAKE: 'Careless Mistake',
    OTHER: 'Other',
};

export function errorCategoryLabel(code: ErrorCategoryCode): string {
    return ERROR_CATEGORY_LABELS[code] ?? code;
}

// The backend stores createdAt with datetime.utcnow() and serializes it
// without a timezone suffix. Treat a suffix-less timestamp as UTC so the
// browser converts it to the viewer's local time correctly.
function parseServerDate(value: string): Date {
    const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
    return new Date(hasTimezone ? value : `${value}Z`);
}

export function formatDate(value: string): string {
    const date = parseServerDate(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTime(value: string): string {
    const date = parseServerDate(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatPercent(score: number): string {
    return `${Math.round(score * 100)}%`;
}
