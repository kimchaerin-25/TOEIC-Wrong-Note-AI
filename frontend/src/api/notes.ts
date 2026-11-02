import { request } from './client';
import type { AnalysisResult, AnalyzeRequest } from '../types/analysis';

export function analyzeQuestion(payload: AnalyzeRequest): Promise<AnalysisResult> {
    return request<AnalysisResult>('/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function fetchNotes(): Promise<AnalysisResult[]> {
    return request<AnalysisResult[]>('/notes');
}

export function fetchNote(id: string): Promise<AnalysisResult> {
    return request<AnalysisResult>(`/notes/${encodeURIComponent(id)}`);
}

export function deleteNote(id: string): Promise<void> {
    return request<void>(`/notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
