'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MessageTemplate {
  id: string;
  name: string;
  subject?: string;
  body: string;
  type: string;
  category?: string;
  variables?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'SMS',
    category: 'GENERAL',
    active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingTemplate
        ? `/api/templates/${editingTemplate.id}`
        : '/api/templates';
      
      const method = editingTemplate ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTemplates();
        resetForm();
        alert(editingTemplate ? 'תבנית עודכנה בהצלחה!' : 'תבנית נוצרה בהצלחה!');
      } else {
        const error = await response.json();
        alert(error.error || 'שגיאה בשמירת תבנית');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('שגיאה בשמירת תבנית');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject || '',
      body: template.body,
      type: template.type,
      category: template.category || 'GENERAL',
      active: template.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם למחוק תבנית זו?')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTemplates();
        alert('תבנית נמחקה בהצלחה!');
      } else {
        alert('שגיאה במחיקת תבנית');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('שגיאה במחיקת תבנית');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      type: 'SMS',
      category: 'GENERAL',
      active: true
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + `{${variable}}`
    }));
  };

  if (loading) {
    return <div className="p-6 text-center">טוען תבניות...</div>;
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📝 תבניות הודעות</h1>
          <p className="text-gray-600 mt-2">
            נהל תבניות להודעות SMS, מיילים ווואטסאפ
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? 'ביטול' : '+ תבנית חדשה'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingTemplate ? 'עריכת תבנית' : 'תבנית חדשה'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>שם התבנית *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="לדוגמה: הזמנה לראיון"
                  required
                />
              </div>

              <div>
                <Label>סוג *</Label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">מייל</option>
                  <option value="WHATSAPP">וואטסאפ</option>
                </select>
              </div>

              {formData.type === 'EMAIL' && (
                <div className="md:col-span-2">
                  <Label>נושא המייל</Label>
                  <Input
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    placeholder="לדוגמה: הזמנה לראיון ב-{companyName}"
                  />
                </div>
              )}

              <div>
                <Label>קטגוריה</Label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="GENERAL">כללי</option>
                  <option value="INTERVIEW_INVITE">הזמנה לראיון</option>
                  <option value="REJECTION">דחייה</option>
                  <option value="OFFER">הצעת עבודה</option>
                  <option value="FOLLOW_UP">מעקב</option>
                </select>
              </div>

              <div>
                <Label>סטטוס</Label>
                <select
                  value={formData.active ? 'true' : 'false'}
                  onChange={e => setFormData({...formData, active: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="true">פעיל</option>
                  <option value="false">לא פעיל</option>
                </select>
              </div>
            </div>

            <div>
              <Label>תוכן ההודעה *</Label>
              <div className="mb-2 flex gap-2 flex-wrap">
                <span className="text-xs text-gray-600">הוסף משתנה:</span>
                {['name', 'positionTitle', 'companyName', 'date', 'time'].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    {`{${v}}`}
                  </button>
                ))}
              </div>
              <Textarea
                value={formData.body}
                onChange={e => setFormData({...formData, body: e.target.value})}
                placeholder="שלום {name}, אנו מזמינים אותך לראיון למשרת {positionTitle}..."
                rows={6}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                השתמש ב-{'{name}'}, {'{positionTitle}'}, {'{companyName}'} כמשתנים
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingTemplate ? 'עדכן תבנית' : 'צור תבנית'}
              </Button>
              <Button type="button" onClick={resetForm} variant="outline">
                ביטול
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{template.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    template.type === 'SMS' ? 'bg-blue-100 text-blue-800' :
                    template.type === 'EMAIL' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {template.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(template)} variant="outline">
                  ✏️
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                >
                  🗑️
                </Button>
              </div>
            </div>

            {template.subject && (
              <div className="text-sm text-gray-600 mb-2">
                <strong>נושא:</strong> {template.subject}
              </div>
            )}

            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {template.body.length > 150
                ? template.body.substring(0, 150) + '...'
                : template.body}
            </div>

            {template.category && (
              <div className="text-xs text-gray-500 mt-2">
                קטגוריה: {template.category}
              </div>
            )}
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <div>אין תבניות עדיין</div>
          <div className="text-sm mt-1">לחץ על "תבנית חדשה" כדי להתחיל</div>
        </Card>
      )}
    </div>
  );
}
