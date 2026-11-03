import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Search } from 'lucide-react';
import { deleteNote, fetchNotes, ApiError } from '../api';
import type { AnalysisResult } from '../types/analysis';
import { errorCategoryLabel, formatDate } from '../utils/format';
import './NotesHistory.css';

type LoadState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; notes: AnalysisResult[] };

function toMessage(err: unknown): string {
    return err instanceof ApiError ? err.message : 'Unexpected error.';
}

export default function NotesHistory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [state, setState] = useState<LoadState>({ status: 'loading' });
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetchNotes()
            .then((notes) => {
                if (!cancelled) setState({ status: 'success', notes });
            })
            .catch((err: unknown) => {
                if (!cancelled) setState({ status: 'error', message: toMessage(err) });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const removeFromList = (id: string) => {
        setState((prev) =>
            prev.status === 'success'
                ? { status: 'success', notes: prev.notes.filter((n) => n.id !== id) }
                : prev,
        );
    };

    const handleDelete = async (id: string) => {
        if (deletingId) return;
        if (!window.confirm('Delete this wrong note? This cannot be undone.')) return;

        setDeleteError(null);
        setDeletingId(id);
        try {
            await deleteNote(id);
            removeFromList(id);
        } catch (err) {
            if (err instanceof ApiError && err.isNotFound) {
                // Already gone on the server — keep the list in sync.
                removeFromList(id);
            } else {
                setDeleteError(`Failed to delete the note: ${toMessage(err)}`);
            }
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="notes-page">
            <h1>Wrong Note History</h1>

            {/* Filters are not wired up yet (planned together with the stats API). */}
            <div className="filters-section">
                <input type="date" className="form-control filter-input" />
                <select className="form-control filter-input">
                    <option value="">All Parts</option>
                    <option value="5">Part 5</option>
                    <option value="6">Part 6</option>
                    <option value="7">Part 7</option>
                </select>
                <select className="form-control filter-input">
                    <option value="">All Categories</option>
                    <option value="part_of_speech">Part of Speech</option>
                    <option value="vocabulary">Vocabulary</option>
                </select>
                <div className="search-box">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="form-control filter-input search-input"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {deleteError && <div className="alert alert-error" role="alert">{deleteError}</div>}

            {state.status === 'loading' && <p className="status-message">Loading notes...</p>}

            {state.status === 'error' && (
                <div className="alert alert-error" role="alert">
                    Failed to load notes: {state.message}
                </div>
            )}

            {state.status === 'success' && state.notes.length === 0 && (
                <Card className="empty-notes">
                    <p className="status-message">No wrong notes yet.</p>
                    <Link to="/analyze">
                        <Button>Analyze your first question</Button>
                    </Link>
                </Card>
            )}

            {state.status === 'success' && state.notes.length > 0 && (
                <div className="notes-list">
                    {state.notes.map((note) => (
                        <Card key={note.id} className="note-item-card">
                            <div className="note-meta">
                                <span className="note-date">{formatDate(note.createdAt)}</span>
                                {note.part != null && <span className="badge badge-blue">Part {note.part}</span>}
                                <span className="badge badge-orange">
                                    {errorCategoryLabel(note.errorCategory.primary)}
                                </span>
                            </div>
                            <div className="note-content" title={note.translation.question}>
                                {note.translation.question}
                            </div>
                            <div className="note-actions">
                                <Link to={`/result/${note.id}`}>
                                    <Button variant="outline" size="sm">View</Button>
                                </Link>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(note.id)}
                                    disabled={deletingId !== null}
                                >
                                    {deletingId === note.id ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
