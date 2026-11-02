import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { analyzeQuestion, ApiError } from '../api';
import type { AnalyzeRequest, ChoiceLabel, TestType } from '../types/analysis';
import './InputForm.css';

const CHOICE_LABELS: ChoiceLabel[] = ['A', 'B', 'C', 'D'];

type Choices = Record<ChoiceLabel, string>;

export default function InputForm() {
    const navigate = useNavigate();
    const [testType, setTestType] = useState<TestType>('RC');
    const [part, setPart] = useState(5);
    const [questionText, setQuestionText] = useState('');
    const [choices, setChoices] = useState<Choices>({ A: '', B: '', C: '', D: '' });
    const [userAnswer, setUserAnswer] = useState<ChoiceLabel | ''>('');
    const [correctAnswer, setCorrectAnswer] = useState<ChoiceLabel | ''>('');
    const [reasoning, setReasoning] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateChoice = (label: ChoiceLabel, value: string) => {
        setChoices((prev) => ({ ...prev, [label]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !userAnswer || !correctAnswer) return;

        if (userAnswer === correctAnswer) {
            setError('Your answer and the correct answer are the same. Please select the answer you got wrong.');
            return;
        }

        const payload: AnalyzeRequest = {
            test_type: testType,
            part,
            question_text: questionText.trim(),
            choices: {
                A: choices.A.trim(),
                B: choices.B.trim(),
                C: choices.C.trim(),
                D: choices.D.trim(),
            },
            correct_answer: correctAnswer,
            user_answer: userAnswer,
        };

        setError(null);
        setIsSubmitting(true);
        try {
            const result = await analyzeQuestion(payload);
            navigate(`/result/${result.id}`);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Unexpected error. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="input-form-page">
            <h1>New Wrong Note Analysis</h1>

            <Card>
                <form onSubmit={handleSubmit}>
                    <fieldset className="form-fieldset" disabled={isSubmitting}>
                        <div className="form-group type-toggle">
                            <button
                                type="button"
                                className={`toggle-btn ${testType === 'LC' ? 'active' : ''}`}
                                onClick={() => setTestType('LC')}
                            >LC (Listening)</button>
                            <button
                                type="button"
                                className={`toggle-btn ${testType === 'RC' ? 'active' : ''}`}
                                onClick={() => setTestType('RC')}
                            >RC (Reading)</button>
                        </div>

                        <div className="form-group part-selector">
                            {[1, 2, 3, 4, 5, 6, 7].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`pill-btn ${part === p ? 'active' : ''}`}
                                    onClick={() => setPart(p)}
                                >
                                    Part {p}
                                </button>
                            ))}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="question-text">Question Text</label>
                            <textarea
                                id="question-text"
                                className="form-control"
                                placeholder="Enter the question here..."
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                required
                            ></textarea>
                        </div>

                        <div className="choices-grid">
                            {CHOICE_LABELS.map((label) => (
                                <div className="form-group" key={label}>
                                    <label className="form-label" htmlFor={`choice-${label}`}>Choice {label}</label>
                                    <input
                                        id={`choice-${label}`}
                                        type="text"
                                        className="form-control"
                                        placeholder={`Enter choice ${label}...`}
                                        value={choices[label]}
                                        onChange={(e) => updateChoice(label, e.target.value)}
                                        required
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="answers-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="user-answer">Your Answer</label>
                                <select
                                    id="user-answer"
                                    className="form-control"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value as ChoiceLabel | '')}
                                    required
                                >
                                    <option value="">Select choice...</option>
                                    {CHOICE_LABELS.map((label) => (
                                        <option key={label} value={label}>Choice {label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="correct-answer">Correct Answer</label>
                                <select
                                    id="correct-answer"
                                    className="form-control"
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(e.target.value as ChoiceLabel | '')}
                                    required
                                >
                                    <option value="">Select choice...</option>
                                    {CHOICE_LABELS.map((label) => (
                                        <option key={label} value={label}>Choice {label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="reasoning">
                                Why did you choose this answer? (optional — not yet used in the analysis)
                            </label>
                            <textarea
                                id="reasoning"
                                className="form-control"
                                placeholder="Describe your reasoning..."
                                style={{ minHeight: '80px' }}
                                value={reasoning}
                                onChange={(e) => setReasoning(e.target.value)}
                            ></textarea>
                        </div>
                    </fieldset>

                    {error && <div className="alert alert-error" role="alert">{error}</div>}

                    <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                        {isSubmitting ? 'Analyzing...' : 'Start Analysis'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
