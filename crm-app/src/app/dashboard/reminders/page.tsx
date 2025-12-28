'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  priority: string;
  type: string;
  createdAt: string;
  completedAt?: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    type: 'GENERAL'
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reminders');
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchReminders();
        resetForm();
        alert('תזכורת נוצרה בהצלחה!');
      } else {
        alert('שגיאה ביצירת תזכורת');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('שגיאה ביצירת תזכורת');
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });

      if (response.ok) {
        await fetchReminders();
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!confirm('האם למחוק תזכורת זו?')) return;

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchReminders();
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'MEDIUM',
      type: 'GENERAL'
    });
    setShowForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      FOLLOW_UP: '📞',
      INTERVIEW: '💼',
      CALL: '☎️',
      EMAIL: '📧',
      GENERAL: '📌'
    };
    return icons[type] || '📌';
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return '🔴 באיחור';
    if (diffDays === 0) return '🟠 היום';
    if (diffDays === 1) return '🟡 מחר';
    if (diffDays <= 7) return `🟢 בעוד ${diffDays} ימים`;
    
    return date.toLocaleDateString('he-IL');
  };

  const activeReminders = reminders.filter(r => !r.completed);
  const completedReminders = reminders.filter(r => r.completed);

  if (loading) {
    return <div className="p-6 text-center">טוען תזכורות...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">⏰ תזכורות</h1>
          <p className="text-gray-600 mt-2">
            {activeReminders.length} תזכורות פעילות
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? 'ביטול' : '+ תזכורת חדשה'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">תזכורת חדשה</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>כותרת *</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="לדוגמה: להתקשר למועמד יוסי"
                  required
                />
              </div>

              <div>
                <Label>תאריך יעד *</Label>
                <Input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>עדיפות</Label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="LOW">נמוכה</option>
                  <option value="MEDIUM">בינונית</option>
                  <option value="HIGH">גבוהה</option>
                  <option value="URGENT">דחוף</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>סוג</Label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="GENERAL">כללי</option>
                  <option value="FOLLOW_UP">מעקב</option>
                  <option value="INTERVIEW">ראיון</option>
                  <option value="CALL">שיחה</option>
                  <option value="EMAIL">מייל</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>תיאור</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="פרטים נוספים..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                צור תזכורת
              </Button>
              <Button type="button" onClick={resetForm} variant="outline">
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Active Reminders */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3">📋 פעילות ({activeReminders.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeReminders.map(reminder => (
            <Card key={reminder.id} className="p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={reminder.completed}
                  onChange={() => toggleComplete(reminder.id, reminder.completed)}
                  className="mt-1 w-5 h-5 cursor-pointer"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {getTypeIcon(reminder.type)} {reminder.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatDueDate(reminder.dueDate)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      🗑️
                    </Button>
                  </div>

                  {reminder.description && (
                    <div className="text-sm text-gray-700 mb-2">
                      {reminder.description}
                    </div>
                  )}

                  <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(reminder.priority)}`}>
                    {reminder.priority === 'URGENT' ? 'דחוף' :
                     reminder.priority === 'HIGH' ? 'גבוהה' :
                     reminder.priority === 'MEDIUM' ? 'בינונית' : 'נמוכה'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {activeReminders.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div>אין תזכורות פעילות!</div>
          </Card>
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">✅ הושלמו ({completedReminders.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
            {completedReminders.slice(0, 5).map(reminder => (
              <Card key={reminder.id} className="p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={reminder.completed}
                    onChange={() => toggleComplete(reminder.id, reminder.completed)}
                    className="mt-1 w-5 h-5 cursor-pointer"
                  />
                  
                  <div className="flex-1">
                    <div className="font-bold line-through">
                      {getTypeIcon(reminder.type)} {reminder.title}
                    </div>
                    {reminder.description && (
                      <div className="text-sm text-gray-600 mt-1 line-through">
                        {reminder.description}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
