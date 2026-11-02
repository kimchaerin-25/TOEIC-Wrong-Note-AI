import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { fetchNote, ApiError } from '../api';
import type { AnalysisResult as AnalysisResultData, TranslationChoices } from '../types/analysis';
import { errorCategoryLabel, formatDateTime, formatPercent } from '../utils/format';
import './AnalysisResult.css';

type LoadState =
    | { status: 'loading' }
    | { status: 'not-found' }
    | { status: 'error'; message: string }
    | { status: 'success'; note: AnalysisResultData };

const TRANSLATION_CHOICE_KEYS: Array<keyof TranslationChoices> = ['a', 'b', 'c', 'd'];

export default function AnalysisResult() {
    const { id } = useParams();
    const [state, setState] = useState<LoadState>({ status: 'loading' });

    useEffect(() => {
        if (!id) {
            setState({ status: 'not-found' });
            return;
        }

        let cancelled = false;
        setState({ status: 'loading' });

        fetchNote(id)
            .then((note) => {
                if (!cancelled) setState({ status: 'success', note });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                // 422 is what FastAPI returns for a malformed (non-UUID) id,
                // which from the user's point of view is also "not found".
                if (err instanceof ApiError && (err.status === 404 || err.status === 422)) {
                    setState({ status: 'not-found' });
                } else {
                    setState({
                        status: 'error',
                        message: err instanceof ApiError ? err.message : 'Unexpected error.',
                    });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (state.status === 'loading') {
        return (
            <div className="analysis-result-page">
                <h1>Analysis Result</h1>
                <p className="status-message">Loading analysis...</p>
            </div>
        );
    }

    if (state.status === 'not-found' || state.status === 'error') {
        return (
            <div className="analysis-result-page">
                <h1>Analysis Result</h1>
                <Card>
                    <p className="mb-2">
                        {state.status === 'not-found'
                            ? 'This wrong note does not exist or has been deleted.'
                            : `Failed to load the analysis: ${state.message}`}
                    </p>
                    <div className="bottom-actions">
                        <Link to="/notes">
                            <Button variant="outline" fullWidth>Go to Notes</Button>
                        </Link>
                        <Link to="/analyze">
                            <Button fullWidth>Analyze a Question</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    const { note } = state;
    const {
        translation,
        correctAnswer,
        correctReason,
        wrongAnswerReason,
        errorCategory,
        learningPoint,
        vocabulary,
        confidence,
    } = note;

    return (
        <div className="analysis-result-page">
            <h1>
                Analysis Result{' '}
                <span className="subtitle">
                    {note.part != null && `Part ${note.part} · `}
                    {formatDateTime(note.createdAt)}
                </span>
            </h1>

            <div className="result-sections">
                <Card className="result-card translate-card">
                    <h3>Translation</h3>
                    <p className="mb-2">{translation.question}</p>
                    <ul className="translation-choices">
                        {TRANSLATION_CHOICE_KEYS.map((key) => (
                            <li key={key}>
                                <strong>({key.toUpperCase()})</strong> {translation.choices[key]}
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="result-card correct-card">
                    <h3>Correct Answer</h3>
                    <div className="answer-highlight green">
                        <span className="choice-badge">{correctAnswer.choice}</span>
                        <span className="choice-text">{correctAnswer.text}</span>
                    </div>
                    <p className="mb-2"><strong>{correctReason.summary}</strong></p>
                    <p className="explanation">{correctReason.detail}</p>
                    {correctReason.grammarRule && (
                        <p className="explanation grammar-rule">Grammar rule: {correctReason.grammarRule}</p>
                    )}
                </Card>

                <Card className="result-card wrong-card">
                    <h3>Why Your Answer is Wrong</h3>
                    <div className="answer-highlight orange">
                        <span className="choice-badge">{wrongAnswerReason.selectedChoice}</span>
                        <span className="choice-text">{wrongAnswerReason.selectedText}</span>
                    </div>
                    <p className="mb-2"><strong>{wrongAnswerReason.summary}</strong></p>
                    <p className="explanation">{wrongAnswerReason.detail}</p>
                </Card>

                <Card className="result-card error-type-card">
                    <h3>Error Category</h3>
                    <div className="category-badges mb-2">
                        <span className="badge badge-blue">{errorCategoryLabel(errorCategory.primary)}</span>
                        {errorCategory.secondary && (
                            <span className="badge badge-orange">{errorCategoryLabel(errorCategory.secondary)}</span>
                        )}
                    </div>
                    <p className="explanation">{errorCategory.description}</p>
                </Card>

                <Card className="result-card learning-card">
                    <h3>Key Learning Point</h3>
                    <p className="mb-2"><strong>{learningPoint.title}</strong></p>
                    <p className="explanation mb-2">{learningPoint.explanation}</p>
                    <div className="examples mb-2">
                        {learningPoint.examples.map((example, index) => (
                            <div className="example-item" key={index}>
                                <p className="en">{example.english}</p>
                                <p className="ko">{example.korean}</p>
                            </div>
                        ))}
                    </div>
                    <p className="explanation">Tip: {learningPoint.tip}</p>
                </Card>

                <Card className="result-card vocab-card">
                    <h3>Vocabulary</h3>
                    <table className="vocab-table">
                        <thead>
                            <tr>
                                <th>Word</th>
                                <th>Part of Speech</th>
                                <th>Meaning</th>
                                <th>Example</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vocabulary.map((item, index) => (
                                <tr key={`${item.word}-${index}`}>
                                    <td>{item.word}</td>
                                    <td>{item.partOfSpeech}</td>
                                    <td>{item.meaning}</td>
                                    <td>{item.exampleSentence}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>

            <div className="confidence-score">
                Confidence Score: <strong>{formatPercent(confidence.score)}</strong>
                <p className="explanation confidence-reason">{confidence.reason}</p>
            </div>

            <p className="disclaimer">{note.disclaimer}</p>

            <div className="bottom-actions">
                <Link to="/notes">
                    <Button size="lg" fullWidth>View All Notes</Button>
                </Link>
                <Link to="/analyze">
                    <Button variant="outline" size="lg" fullWidth>Analyze Another</Button>
                </Link>
            </div>
        </div>
    );
}
