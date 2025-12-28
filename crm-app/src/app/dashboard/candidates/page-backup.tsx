'use client';

import { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, CheckCircle2, XCircle, Clock, FileText, Search, Filter, 
  Download, Upload, Mail, Phone, MessageSquare, Send, ChevronUp, ChevronDown,
  Tag, StickyNote, Users, CheckSquare, Square, Sparkles, ExternalLink, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status?: string;
  createdAt: string;
  resumeViewed?: boolean;
  resumeViewedAt?: string;
  resumeViewedBy?: string;
  handled?: boolean;
  handledAt?: string;
  handledBy?: string;
  tags?: string[];
  notes?: string;
  city?: string;
  currentTitle?: string;
  skills?: string[];
  _count?: {
    applications: number;
    interviews: number;
  };
}

type SortField = 'name' | 'email' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('הכל');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Email form
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  
  // WhatsApp/SMS form
  const [messageBody, setMessageBody] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  
  // Advanced filters
  const [dateFilter, setDateFilter] = useState('all');
  const [viewedFilter, setViewedFilter] = useState('all');
  const [handledFilter, setHandledFilter] = useState('all');
  
  // AI Smart Search
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);

  useEffect(() => {
    // Mock data - replace with actual API
    setTimeout(() => {
      const mockCandidates: Candidate[] = [
        {
          id: '1',
          name: 'יוסי כהן',
          email: 'yossi.cohen@example.com',
          phone: '050-1234567',
          status: 'NEW',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewed: false,
          handled: false,
          tags: ['מחסנאי', 'מנוסה'],
          notes: 'מועמד מעולה, ניסיון של 5 שנים',
          city: 'אשדוד',
          currentTitle: 'מחסנאי',
          skills: ['SAP', 'מלגזן', 'ניהול מלאי'],
          _count: { applications: 2, interviews: 0 }
        },
        {
          id: '2',
          name: 'שרה לוי',
          email: 'sara.levi@example.com',
          phone: '052-9876543',
          status: 'SCREENING',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewed: true,
          resumeViewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewedBy: 'אדמין',
          handled: true,
          handledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          handledBy: 'אדמין',
          tags: ['נהגת', 'רישיון C'],
          notes: 'קורות חיים מרשימים',
          city: 'תל אביב',
          currentTitle: 'נהגת משאית',
          skills: ['רישיון C', 'ניסיון 8 שנים'],
          _count: { applications: 1, interviews: 1 }
        },
        {
          id: '3',
          name: 'דוד מזרחי',
          email: 'david.mizrahi@example.com',
          phone: '053-5555555',
          status: 'INTERVIEW_SCHEDULED',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewed: true,
          resumeViewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewedBy: 'מנהל',
          handled: false,
          tags: ['טכנאי', 'חשמל'],
          city: 'חיפה',
          currentTitle: 'טכנאי חשמל',
          skills: ['חשמל', 'תקנות', 'תחזוקה'],
          _count: { applications: 3, interviews: 2 }
        },
        {
          id: '4',
          name: 'רחל אברהם',
          email: 'rachel.avraham@example.com',
          phone: '054-1112233',
          status: 'NEW',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewed: false,
          handled: false,
          tags: ['מחסנאית'],
          city: 'אשדוד',
          currentTitle: 'מחסנאית',
          skills: ['Excel', 'ניהול מלאי'],
          _count: { applications: 1, interviews: 0 }
        },
        {
          id: '5',
          name: 'אלי ששון',
          email: 'eli.sasson@example.com',
          phone: '055-9998877',
          status: 'HIRED',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewed: true,
          resumeViewedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
          resumeViewedBy: 'אדמין',
          handled: true,
          handledAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          handledBy: 'מנהל',
          tags: ['מחסנאי', 'SAP', 'מנוסה'],
          notes: 'התקבל! התחלה בחודש הבא',
          city: 'אשדוד',
          currentTitle: 'מנהל מחסן',
          skills: ['SAP', 'מלגזן', 'ניהול צוות'],
          _count: { applications: 2, interviews: 3 }
        }
      ];
      setCandidates(mockCandidates);
      setLoading(false);
    }, 500);
  }, []);

  const statusOptions = ['הכל', 'NEW', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED'];

  // Email templates
  const emailTemplates = {
    'welcome': {
      subject: 'ברוכים הבאים ל-Twenty2Jobs',
      body: 'שלום {{name}},\n\nתודה שפנית אלינו! קיבלנו את קורות החיים שלך ונבדוק אותם בקרוב.\n\nנציג מטעמנו ייצור איתך קשר בהקדם.\n\nבברכה,\nצוות Twenty2Jobs'
    },
    'interview': {
      subject: 'הזמנה לראיון - Twenty2Jobs',
      body: 'שלום {{name}},\n\nאנו שמחים להזמין אותך לראיון עבודה!\n\nמועד הראיון: [להוסיף תאריך]\nמיקום: [להוסיף כתובת]\n\nנשמח לראותך!\n\nבברכה,\nצוות Twenty2Jobs'
    },
    'status': {
      subject: 'עדכון סטטוס מועמדות',
      body: 'שלום {{name}},\n\nרצינו לעדכן אותך לגבי המועמדות שלך.\n\n[הוסף עדכון]\n\nבברכה,\nצוות Twenty2Jobs'
    }
  };

  // WhatsApp/SMS templates
  const messageTemplates = {
    'reminder': 'שלום {{name}}, רצינו להזכיר לך את הראיון המתוכנן שלך ב-Twenty2Jobs. נשמח לראותך!',
    'update': 'היי {{name}}, יש לנו עדכון לגבי המועמדות שלך. נשמח שתצור איתנו קשר.',
    'thanks': 'תודה {{name}} על הפנייה ל-Twenty2Jobs! נבדוק את קורות החיים שלך ונחזור אליך בהקדם.'
  };

  // Statistics
  const totalCandidates = candidates.length;
  const viewedResumes = candidates.filter(c => c.resumeViewed).length;
  const notViewedResumes = candidates.filter(c => !c.resumeViewed).length;
  const handledCandidates = candidates.filter(c => c.handled).length;
  const notHandledCandidates = candidates.filter(c => !c.handled).length;

  // Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue?.toLowerCase() || '';
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const filteredCandidates = sortedCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          candidate.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'הכל' || candidate.status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const candidateDate = new Date(candidate.createdAt);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = candidateDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = candidateDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = candidateDate >= monthAgo;
      }
    }
    
    // Viewed filter
    const matchesViewed = viewedFilter === 'all' || 
                          (viewedFilter === 'viewed' && candidate.resumeViewed) ||
                          (viewedFilter === 'not-viewed' && !candidate.resumeViewed);
    
    // Handled filter
    const matchesHandled = handledFilter === 'all' || 
                           (handledFilter === 'handled' && candidate.handled) ||
                           (handledFilter === 'not-handled' && !candidate.handled);
    
    return matchesSearch && matchesStatus && matchesDate && matchesViewed && matchesHandled;
  });

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  const toggleSelectCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const getSelectedCandidatesData = () => {
    return candidates.filter(c => selectedCandidates.has(c.id));
  };

  // Email handler
  const handleSendEmail = () => {
    const selected = getSelectedCandidatesData();
    if (selected.length === 0) {
      alert('נא לבחור לפחות מועמד אחד');
      return;
    }
    if (selected.length > 100) {
      alert('ניתן לשלוח מייל ל-100 מועמדים בלבד בפעם אחת');
      return;
    }
    
    // Here you would integrate with actual email service
    console.log('Sending email to:', selected.map(c => c.email));
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);
    
    alert(`מייל נשלח בהצלחה ל-${selected.length} מועמדים!`);
    setShowEmailModal(false);
    setEmailSubject('');
    setEmailBody('');
    setSelectedCandidates(new Set());
  };

  // WhatsApp/SMS handler
  const handleSendMessage = (type: 'whatsapp' | 'sms') => {
    const selected = getSelectedCandidatesData().filter(c => c.phone);
    if (selected.length === 0) {
      alert('נא לבחור מועמדים עם מספר טלפון');
      return;
    }
    
    // Here you would integrate with WhatsApp/SMS API
    console.log(`Sending ${type} to:`, selected.map(c => c.phone));
    console.log('Message:', messageBody);
    
    alert(`הודעת ${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} נשלחה בהצלחה ל-${selected.length} מועמדים!`);
    if (type === 'whatsapp') {
      setShowWhatsAppModal(false);
    } else {
      setShowSMSModal(false);
    }
    setMessageBody('');
    setSelectedCandidates(new Set());
  };

  // Export handler
  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    const selected = selectedCandidates.size > 0 ? getSelectedCandidatesData() : filteredCandidates;
    
    // Here you would integrate with export library
    console.log(`Exporting ${selected.length} candidates to ${format}`);
    
    alert(`${selected.length} מועמדים יוצאו ל-${format.toUpperCase()} בהצלחה!`);
    setShowExportModal(false);
  };
  
  // Mark as handled
  const handleMarkAsHandled = () => {
    const selected = getSelectedCandidatesData();
    if (selected.length === 0) {
      alert('נא לבחור מועמדים');
      return;
    }
    
    // Update candidates - in real app would call API
    alert(`${selected.length} מועמדים סומנו כטופלו!`);
    setSelectedCandidates(new Set());
  };
  
  // Delete selected
  const handleDeleteSelected = () => {
    const selected = getSelectedCandidatesData();
    if (selected.length === 0) {
      alert('נא לבחור מועמדים למחיקה');
      return;
    }
    
    if (confirm(`האם אתה בטוח שברצונך למחוק ${selected.length} מועמדים?`)) {
      // Delete candidates - in real app would call API
      alert(`${selected.length} מועמדים נמחקו!`);
      setSelectedCandidates(new Set());
    }
  };
  
  // Quick filter presets
  const applyQuickFilter = (type: string) => {
    switch(type) {
      case 'not-viewed':
        setViewedFilter('not-viewed');
        setHandledFilter('all');
        setDateFilter('all');
        break;
      case 'not-handled':
        setHandledFilter('not-handled');
        setViewedFilter('all');
        setDateFilter('all');
        break;
      case 'urgent':
        setDateFilter('today');
        setViewedFilter('not-viewed');
        setHandledFilter('not-handled');
        break;
      case 'reset':
        setDateFilter('all');
        setViewedFilter('all');
        setHandledFilter('all');
        setStatusFilter('הכל');
        setSearchTerm('');
        break;
    }
  };

  const applyEmailTemplate = (templateKey: string) => {
    const template = emailTemplates[templateKey as keyof typeof emailTemplates];
    if (template) {
      setEmailSubject(template.subject);
      setEmailBody(template.body);
      setEmailTemplate(templateKey);
    }
  };

  const applyMessageTemplate = (templateKey: string) => {
    const template = messageTemplates[templateKey as keyof typeof messageTemplates];
    if (template) {
      setMessageBody(template);
      setMessageTemplate(templateKey);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'NEW': { label: 'חדש', variant: 'default' },
      'SCREENING': { label: 'בסינון', variant: 'secondary' },
      'INTERVIEW_SCHEDULED': { label: 'ראיון מתוכנן', variant: 'outline' },
      'INTERVIEWED': { label: 'רואיין', variant: 'secondary' },
      'OFFER_EXTENDED': { label: 'הצעה נשלחה', variant: 'default' },
      'HIRED': { label: 'התקבל', variant: 'default' },
      'REJECTED': { label: 'נדחה', variant: 'destructive' },
    };
    const config = status ? statusMap[status] || { label: status, variant: 'outline' } : { label: 'לא ידוע', variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-3 w-3 text-blue-600" /> : 
      <ChevronDown className="h-3 w-3 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">טוען מועמדים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            מערכת ניהול מועמדים מתקדמת
          </h1>
          <p className="text-gray-500 mt-1">שליטה מלאה • מיונים • שליחת מיילים המונית • WhatsApp • SMS</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 ml-2" />
            ייצוא
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <Upload className="h-4 w-4 ml-2" />
            מועמד חדש
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-2 border-gray-200 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">סה"כ מועמדים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{totalCandidates}</div>
            <p className="text-xs text-gray-400 mt-1">כל המועמדים במערכת</p>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              קורות חיים נצפו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{viewedResumes}</div>
            <p className="text-xs text-green-600 mt-1">{totalCandidates > 0 ? Math.round((viewedResumes / totalCandidates) * 100) : 0}% מהמועמדים</p>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-red-300 bg-gradient-to-br from-red-50 to-pink-50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              לא נצפו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{notViewedResumes}</div>
            <p className="text-xs text-red-600 mt-1 font-semibold">דורש טיפול מיידי!</p>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              טופלו
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{handledCandidates}</div>
            <p className="text-xs text-blue-600 mt-1">{totalCandidates > 0 ? Math.round((handledCandidates / totalCandidates) * 100) : 0}% מהמועמדים</p>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              ממתינים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{notHandledCandidates}</div>
            <p className="text-xs text-orange-600 mt-1 font-semibold">דורש תשומת לב</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filter Buttons */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">סינון מהיר:</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => applyQuickFilter('not-viewed')}
              className="border-red-400 text-red-700 hover:bg-red-50"
            >
              <EyeOff className="h-3 w-3 ml-1" />
              לא נצפו
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => applyQuickFilter('not-handled')}
              className="border-orange-400 text-orange-700 hover:bg-orange-50"
            >
              <Clock className="h-3 w-3 ml-1" />
              לא טופלו
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => applyQuickFilter('urgent')}
              className="border-red-600 text-red-800 hover:bg-red-100 font-bold"
            >
              🚨 דחוף - היום
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => applyQuickFilter('reset')}
              className="border-gray-400 text-gray-700 hover:bg-gray-50"
            >
              🔄 נקה סינונים
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowFiltersModal(true)}
              className="border-blue-400 text-blue-700 hover:bg-blue-50"
            >
              <Filter className="h-3 w-3 ml-1" />
              פילטרים מתקדמים
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedCandidates.size > 0 && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-blue-900">
                  {selectedCandidates.size} מועמדים נבחרו
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowEmailModal(true)}
                  className="border-blue-500 text-blue-700 hover:bg-blue-100"
                >
                  <Mail className="h-4 w-4 ml-2" />
                  מייל ({selectedCandidates.size})
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="border-green-500 text-green-700 hover:bg-green-100"
                >
                  <MessageSquare className="h-4 w-4 ml-2" />
                  WhatsApp
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowSMSModal(true)}
                  className="border-purple-500 text-purple-700 hover:bg-purple-100"
                >
                  <Send className="h-4 w-4 ml-2" />
                  SMS
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleMarkAsHandled}
                  className="border-green-600 text-green-800 hover:bg-green-100"
                >
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  סמן כטופל
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDeleteSelected}
                  className="border-red-600 text-red-800 hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  מחק
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedCandidates(new Set())}
                  className="border-gray-500 text-gray-700 hover:bg-gray-100"
                >
                  ביטול
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="חיפוש לפי שם, אימייל או טלפון..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => setShowAISearch(!showAISearch)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="h-4 w-4 ml-2" />
              עוזר חכם AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Smart Search Modal */}
      {showAISearch && (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="h-5 w-5" />
              עוזר חכם - חיפוש מתקדם
            </CardTitle>
            <CardDescription>
              דבר באופן טבעי והמערכת תמצא את המועמדים המתאימים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-3">💡 דוגמאות:</p>
              <div className="space-y-2">
                <div className="text-sm bg-purple-50 p-2 rounded cursor-pointer hover:bg-purple-100" onClick={() => setAiQuery('מחסנאים באשדוד')}>
                  "מחסנאים באשדוד"
                </div>
                <div className="text-sm bg-purple-50 p-2 rounded cursor-pointer hover:bg-purple-100" onClick={() => setAiQuery('נהגים עם רישיון C בתל אביב')}>
                  "נהגים עם רישיון C בתל אביב"
                </div>
                <div className="text-sm bg-purple-50 p-2 rounded cursor-pointer hover:bg-purple-100" onClick={() => setAiQuery('מועמדים שלא נצפו מהשבוע האחרון')}>
                  "מועמדים שלא נצפו מהשבוע האחרון"
                </div>
              </div>
            </div>
            
            <Textarea
              placeholder="לדוגמה: תרכז לי את כל המחסנאים באשדוד עם ניסיון ב-SAP"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              rows={3}
              className="text-lg"
            />
            
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  setAiSearching(true);
                  // Simulate AI search
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  // Parse the query and filter
                  const query = aiQuery.toLowerCase();
                  let filtered = mockCandidates;
                  
                  // City detection
                  const cities = ['תל אביב', 'אשדוד', 'חיפה', 'באר שבע', 'ירושלים', 'רעננה'];
                  const foundCity = cities.find(city => query.includes(city.toLowerCase()));
                  if (foundCity) {
                    filtered = filtered.filter(c => c.city === foundCity);
                  }
                  
                  // Job title detection
                  const jobs = ['מחסנאי', 'נהג', 'טכנאי', 'מנהל'];
                  const foundJob = jobs.find(job => query.includes(job.toLowerCase()));
                  if (foundJob) {
                    filtered = filtered.filter(c => c.currentTitle.includes(foundJob));
                  }
                  
                  // Skills detection
                  if (query.includes('sap')) {
                    filtered = filtered.filter(c => c.skills?.includes('SAP'));
                  }
                  
                  // Status detection
                  if (query.includes('לא נצפ')) {
                    filtered = filtered.filter(c => !c.resumeViewed);
                  }
                  
                  setCandidates(filtered);
                  setAiSearching(false);
                  alert(`נמצאו ${filtered.length} מועמדים מתאימים!`);
                }}
                disabled={aiSearching || !aiQuery}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {aiSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    מחפש...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 ml-2" />
                    חפש כעת
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAISearch(false);
                  setAiQuery('');
                  setCandidates(mockCandidates);
                }}
              >
                ביטול
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidates Table */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-4 text-center">
                    <Checkbox
                      checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-white"
                    />
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      <span>מועמד</span>
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      <span>פרטי קשר</span>
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      <span>סטטוס</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    צפייה בקו"ח
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    סטטוס טיפול
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    תגיות
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      <span>תאריך</span>
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-blue-50 transition-all duration-200">
                    <td className="px-4 py-4 text-center">
                      <Checkbox
                        checked={selectedCandidates.has(candidate.id)}
                        onCheckedChange={() => toggleSelectCandidate(candidate.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/dashboard/candidates/${candidate.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                            {candidate.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <div className="text-xs text-gray-500">
                            {candidate._count?.applications || 0} מועמדויות • {candidate._count?.interviews || 0} ראיונות
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {candidate.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {candidate.phone || 'אין טלפון'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(candidate.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-center gap-2">
                        {candidate.resumeViewed ? (
                          <div className="w-full">
                            <div className="flex items-center justify-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                              <Eye className="h-5 w-5" />
                              <span className="text-sm font-bold">נצפה ✓</span>
                            </div>
                            {candidate.resumeViewedAt && (
                              <div className="text-xs text-gray-600 mt-1 text-center">
                                {new Date(candidate.resumeViewedAt).toLocaleDateString('he-IL')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-red-700 bg-red-100 px-3 py-2 rounded-lg w-full">
                            <EyeOff className="h-5 w-5" />
                            <span className="text-sm font-bold">לא נצפה ✗</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-center gap-2">
                        {candidate.handled ? (
                          <div className="w-full">
                            <div className="flex items-center justify-center gap-2 text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="text-sm font-bold">טופל ✓</span>
                            </div>
                            {candidate.handledAt && (
                              <div className="text-xs text-gray-600 mt-1 text-center">
                                {new Date(candidate.handledAt).toLocaleDateString('he-IL')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-orange-700 bg-orange-100 px-3 py-2 rounded-lg w-full">
                            <XCircle className="h-5 w-5" />
                            <span className="text-sm font-bold">לא טופל ✗</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {candidate.tags?.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 ml-1" />
                            {tag}
                          </Badge>
                        ))}
                        {candidate.notes && (
                          <Badge variant="outline" className="text-xs text-amber-700 border-amber-400">
                            <StickyNote className="h-3 w-3 ml-1" />
                            הערה
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(candidate.createdAt).toLocaleDateString('he-IL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredCandidates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">לא נמצאו מועמדים</h3>
          <p className="text-gray-500">נסה לשנות את הפילטרים או את מילות החיפוש</p>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                שליחת מייל ל-{selectedCandidates.size} מועמדים
              </CardTitle>
              <CardDescription>
                ניתן לשלוח עד 100 מועמדים בפעם אחת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">תבנית מוכנה (אופציונלי)</label>
                <select
                  value={emailTemplate}
                  onChange={(e) => applyEmailTemplate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">בחר תבנית...</option>
                  <option value="welcome">ברוכים הבאים</option>
                  <option value="interview">הזמנה לראיון</option>
                  <option value="status">עדכון סטטוס</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">נושא המייל *</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="הכנס נושא למייל..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">תוכן המייל *</label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="הכנס את תוכן המייל... (השתמש ב-{{name}} לשם המועמד)"
                  rows={10}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  טיפ: השתמש ב-{'{{name}}'} כדי להחליף אוטומטית בשם המועמד
                </p>
              </div>
              
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                  ביטול
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={!emailSubject || !emailBody}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <Send className="h-4 w-4 ml-2" />
                  שלח מייל ({selectedCandidates.size})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                שליחת WhatsApp ל-{selectedCandidates.size} מועמדים
              </CardTitle>
              <CardDescription>
                ההודעה תישלח למועמדים שיש להם מספר טלפון
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">תבנית מוכנה (אופציונלי)</label>
                <select
                  value={messageTemplate}
                  onChange={(e) => applyMessageTemplate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">בחר תבנית...</option>
                  <option value="reminder">תזכורת לראיון</option>
                  <option value="update">עדכון סטטוס</option>
                  <option value="thanks">תודה על הפנייה</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">תוכן ההודעה *</label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="הכנס את תוכן ההודעה... (השתמש ב-{{name}} לשם המועמד)"
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  מקסימום 1000 תווים • טיפ: השתמש ב-{'{{name}}'} לשם המועמד
                </p>
              </div>
              
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowWhatsAppModal(false)}>
                  ביטול
                </Button>
                <Button 
                  onClick={() => handleSendMessage('whatsapp')}
                  disabled={!messageBody}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="h-4 w-4 ml-2" />
                  שלח WhatsApp ({selectedCandidates.size})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" />
                שליחת SMS ל-{selectedCandidates.size} מועמדים
              </CardTitle>
              <CardDescription>
                ההודעה תישלח למועמדים שיש להם מספר טלפון
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">תבנית מוכנה (אופציונלי)</label>
                <select
                  value={messageTemplate}
                  onChange={(e) => applyMessageTemplate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">בחר תבנית...</option>
                  <option value="reminder">תזכורת לראיון</option>
                  <option value="update">עדכון סטטוס</option>
                  <option value="thanks">תודה על הפנייה</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">תוכן ה-SMS *</label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="הכנס את תוכן ה-SMS... (השתמש ב-{{name}} לשם המועמד)"
                  rows={4}
                  className="resize-none"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {messageBody.length}/160 תווים • טיפ: השתמש ב-{'{{name}}'} לשם המועמד
                </p>
              </div>
              
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowSMSModal(false)}>
                  ביטול
                </Button>
                <Button 
                  onClick={() => handleSendMessage('sms')}
                  disabled={!messageBody}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4 ml-2" />
                  שלח SMS ({selectedCandidates.size})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                פילטרים מתקדמים
              </CardTitle>
              <CardDescription>
                סנן מועמדים לפי קריטריונים מתקדמים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">תאריך הוספה</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">כל התאריכים</option>
                  <option value="today">היום</option>
                  <option value="week">השבוע האחרון</option>
                  <option value="month">החודש האחרון</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">צפייה בקורות חיים</label>
                <select
                  value={viewedFilter}
                  onChange={(e) => setViewedFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">הכל</option>
                  <option value="viewed">נצפו בלבד</option>
                  <option value="not-viewed">לא נצפו בלבד</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">סטטוס טיפול</label>
                <select
                  value={handledFilter}
                  onChange={(e) => setHandledFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">הכל</option>
                  <option value="handled">טופלו בלבד</option>
                  <option value="not-handled">לא טופלו בלבד</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setDateFilter('all');
                    setViewedFilter('all');
                    setHandledFilter('all');
                  }}
                >
                  אפס
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() => setShowFiltersModal(false)}
                >
                  החל פילטרים
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                ייצוא מועמדים
              </CardTitle>
              <CardDescription>
                {selectedCandidates.size > 0 
                  ? `ייצוא ${selectedCandidates.size} מועמדים נבחרים`
                  : `ייצוא כל ${filteredCandidates.length} המועמדים`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleExport('excel')}
              >
                <Download className="h-4 w-4 ml-2" />
                ייצוא ל-Excel (.xlsx)
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 ml-2" />
                ייצוא ל-CSV
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleExport('pdf')}
              >
                <Download className="h-4 w-4 ml-2" />
                ייצוא ל-PDF
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowExportModal(false)}
              >
                ביטול
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Scroll to Top Button */}
      {filteredCandidates.length > 5 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 left-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-40"
          title="חזור לראש הדף"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
