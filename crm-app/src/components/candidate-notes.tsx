'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Note {
  id: string;
  content: string;
  type: string;
  isPrivate: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CandidateNotesProps {
  candidateId: string;
}

export default function CandidateNotes({ candidateId }: CandidateNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    type: 'GENERAL',
    isPrivate: false
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [candidateId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notes?candidateId=${candidateId}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          candidateId
        })
      });

      if (response.ok) {
        await fetchNotes();
        setFormData({ content: '', type: 'GENERAL', isPrivate: false });
        setShowForm(false);
      } else {
        alert('שגיאה בהוספת הערה');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('שגיאה בהוספת הערה');
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('האם למחוק הערה זו?')) return;

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const saveEdit = async (id: string) => {
    if (!editingContent.trim()) return;
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingContent.trim() })
      });
      if (response.ok) {
        await fetchNotes();
        cancelEditing();
      } else {
        alert('שגיאה בעדכון הערה');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('שגיאה בעדכון הערה');
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      GENERAL: '📝',
      INTERVIEW_FEEDBACK: '💼',
      PHONE_SCREEN: '📞',
      REFERENCE_CHECK: '✅'
    };
    return icons[type] || '📝';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      GENERAL: 'כללי',
      INTERVIEW_FEEDBACK: 'משוב ראיון',
      PHONE_SCREEN: 'שיחת טלפון',
      REFERENCE_CHECK: 'בדיקת ממליצים'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center text-gray-500 p-4">טוען הערות...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">📌 הערות פנימיות ({notes.length})</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? 'ביטול' : '+ הערה חדשה'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>תוכן ההערה *</Label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="כתוב את ההערה כאן..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>סוג</Label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="GENERAL">כללי</option>
                  <option value="INTERVIEW_FEEDBACK">משוב ראיון</option>
                  <option value="PHONE_SCREEN">שיחת טלפון</option>
                  <option value="REFERENCE_CHECK">בדיקת ממליצים</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={e => setFormData({...formData, isPrivate: e.target.checked})}
                  id="isPrivate"
                  className="w-4 h-4"
                />
                <Label htmlFor="isPrivate" className="cursor-pointer">
                  הערה פרטית 🔒
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                הוסף הערה
              </Button>
              <Button type="button" onClick={() => setShowForm(false)} variant="outline">
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      )}

      {notes.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          <div className="text-3xl mb-2">📝</div>
          <div>אין הערות עדיין</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <Card key={note.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(note.type)}</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {getTypeLabel(note.type)}
                  </span>
                  {note.isPrivate && (
                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                      🔒 פרטי
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {editingNoteId !== note.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(note)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      ✏️
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteNote(note.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>
              </div>

              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => saveEdit(note.id)}
                    >
                      שמור
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing}>
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {note.content}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-2">
                🕐 {new Date(note.createdAt).toLocaleString('he-IL')}
                {note.updatedAt !== note.createdAt && (
                  <span className="mr-2">(עודכן: {new Date(note.updatedAt).toLocaleString('he-IL')})</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
