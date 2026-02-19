'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, XCircle, Clock, User, Phone, Mail, MapPin, 
  Building2, Calendar, Edit3, Save, X, Loader2, RefreshCw,
  TrendingUp, Users, Target, Search
} from 'lucide-react';
import Link from 'next/link';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  currentTitle: string;
  employmentStatus: string | null;
  hiredAt: string | null;
  hiredToEmployerId: string | null;
  inProcessPositionId: string | null;
  inProcessAt: string | null;
  interviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  hiredToEmployer?: { id: string; name: string };
  inProcessPosition?: { 
    id: string;
    title: string; 
    employer?: { id: string; name: string } 
  };
  uploadedBy?: { id: string; name: string; email: string }; // 🆕 מי העלה את המועמד
}

interface Employer {
  id: string;
  name: string;
}

export default function MonthlyStatusPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'hired' | 'in-process' | 'rejected' | 'new'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch candidates with status
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      const response = await fetch(`/api/candidates?limit=500`);
      if (response.ok) {
        const data = await response.json();
        const allCandidates = data.candidates || data || [];
        
        // Filter by month - candidates updated in this month OR hired in this month
        const filtered = allCandidates.filter((c: Candidate) => {
          const updatedDate = new Date(c.updatedAt);
          const hiredDate = c.hiredAt ? new Date(c.hiredAt) : null;
          
          // Include if updated in selected month OR hired in selected month
          const updatedInMonth = updatedDate >= startDate && updatedDate <= endDate;
          const hiredInMonth = hiredDate && hiredDate >= startDate && hiredDate <= endDate;
          
          // Also include if has status (EMPLOYED, REJECTED, IN_PROCESS)
          const hasStatus = c.employmentStatus && ['EMPLOYED', 'REJECTED', 'IN_PROCESS'].includes(c.employmentStatus);
          
          return updatedInMonth || hiredInMonth || hasStatus;
        });
        
        setCandidates(filtered);
      }

      // Fetch employers
      const empResponse = await fetch('/api/employers');
      if (empResponse.ok) {
        const empData = await empResponse.json();
        setEmployers(empData.employers || empData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (candidate: Candidate): 'hired' | 'in-process' | 'rejected' | 'new' => {
    if (candidate.hiredAt || candidate.employmentStatus === 'EMPLOYED') return 'hired';
    if (candidate.employmentStatus === 'REJECTED') return 'rejected';
    if (candidate.employmentStatus === 'IN_PROCESS' || candidate.inProcessPositionId) return 'in-process';
    return 'new';
  };

  const startEdit = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setEditData({
      [candidate.id]: {
        name: candidate.name,
        phone: candidate.phone,
        email: candidate.email,
        city: candidate.city,
        employmentStatus: candidate.employmentStatus,
        hiredToEmployerId: candidate.hiredToEmployerId,
        interviewDate: candidate.interviewDate ? candidate.interviewDate.split('T')[0] : '',
      }
    });
  };

  const saveEdit = async (candidateId: string) => {
    setSaving(true);
    try {
      const data = editData[candidateId];
      const updatePayload: any = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        city: data.city,
        employmentStatus: data.employmentStatus,
      };

      // If status is EMPLOYED, set hiredAt and hiredToEmployerId
      if (data.employmentStatus === 'EMPLOYED') {
        updatePayload.hiredAt = new Date().toISOString();
        if (data.hiredToEmployerId) {
          updatePayload.hiredToEmployerId = data.hiredToEmployerId;
        }
      } else if (data.employmentStatus === 'REJECTED' || data.employmentStatus === 'IN_PROCESS' || !data.employmentStatus) {
        updatePayload.hiredAt = null;
        updatePayload.hiredToEmployerId = null;
      }

      // Add interview date if set
      if (data.interviewDate) {
        updatePayload.interviewDate = new Date(data.interviewDate).toISOString();
      } else {
        updatePayload.interviewDate = null;
      }

      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const quickStatusUpdate = async (candidateId: string, newStatus: string) => {
    setSaving(true);
    try {
      const updatePayload: any = { employmentStatus: newStatus };
      
      if (newStatus === 'EMPLOYED') {
        updatePayload.hiredAt = new Date().toISOString();
      } else {
        updatePayload.hiredAt = null;
        updatePayload.hiredToEmployerId = null;
      }

      await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setSaving(false);
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const status = getStatus(c);
    const matchesFilter = filter === 'all' || status === filter;
    const matchesSearch = !searchQuery || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats
  const stats = {
    total: candidates.length,
    hired: candidates.filter(c => getStatus(c) === 'hired').length,
    inProcess: candidates.filter(c => getStatus(c) === 'in-process').length,
    rejected: candidates.filter(c => getStatus(c) === 'rejected').length,
    new: candidates.filter(c => getStatus(c) === 'new').length,
  };

  const statusColors = {
    hired: 'bg-green-100 text-green-700 border-green-300',
    'in-process': 'bg-blue-100 text-blue-700 border-blue-300',
    rejected: 'bg-red-100 text-red-700 border-red-300',
    new: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const statusLabels = {
    hired: '✅ התקבל',
    'in-process': '🔄 בתהליך',
    rejected: '❌ לא התקבל',
    new: '🆕 חדש',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">📊 סטטוס חודשי</h1>
          <p className="text-gray-600">מעקב אחר מועמדים לפי סטטוס - התקבלו, בתהליך, נדחו</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            רענון
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter('all')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">סך הכל</p>
                <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'hired' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter('hired')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">התקבלו</p>
                <p className="text-3xl font-bold text-green-600">{stats.hired}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'in-process' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter('in-process')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">בתהליך</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProcess}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'rejected' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter('rejected')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">לא התקבלו</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filter === 'new' ? 'ring-2 ring-gray-500' : 'hover:shadow-md'}`}
          onClick={() => setFilter('new')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">חדשים</p>
                <p className="text-3xl font-bold text-gray-600">{stats.new}</p>
              </div>
              <User className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="חיפוש לפי שם, טלפון או אימייל..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Candidates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            מועמדים ({filteredCandidates.length})
          </CardTitle>
          <CardDescription>
            {filter === 'all' ? 'כל המועמדים' : statusLabels[filter]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>לא נמצאו מועמדים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCandidates.map((candidate) => {
                const status = getStatus(candidate);
                const isEditing = editingId === candidate.id;

                return (
                  <div 
                    key={candidate.id} 
                    className={`border rounded-lg p-4 transition-all ${isEditing ? 'bg-yellow-50 border-yellow-300' : 'hover:bg-gray-50'}`}
                  >
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">שם</label>
                            <Input
                              value={editData[candidate.id]?.name || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                [candidate.id]: { ...editData[candidate.id], name: e.target.value }
                              })}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">טלפון</label>
                            <Input
                              value={editData[candidate.id]?.phone || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                [candidate.id]: { ...editData[candidate.id], phone: e.target.value }
                              })}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">אימייל</label>
                            <Input
                              value={editData[candidate.id]?.email || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                [candidate.id]: { ...editData[candidate.id], email: e.target.value }
                              })}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">עיר</label>
                            <Input
                              value={editData[candidate.id]?.city || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                [candidate.id]: { ...editData[candidate.id], city: e.target.value }
                              })}
                              className="h-9"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">סטטוס</label>
                            <select
                              value={editData[candidate.id]?.employmentStatus || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                [candidate.id]: { ...editData[candidate.id], employmentStatus: e.target.value }
                              })}
                              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="">חדש</option>
                              <option value="IN_PROCESS">בתהליך</option>
                              <option value="EMPLOYED">התקבל</option>
                              <option value="REJECTED">לא התקבל</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">📅 תאריך ראיון</label>
                            <Input
                              type="date"
                              value={editData[candidate.id]?.interviewDate || ''}
                              onChange={(e) => setEditData({
                                ...editData,
                                [candidate.id]: { ...editData[candidate.id], interviewDate: e.target.value }
                              })}
                              className="h-9"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {editData[candidate.id]?.employmentStatus === 'EMPLOYED' && (
                            <div>
                              <label className="text-xs text-gray-500">התקבל ל:</label>
                              <select
                                value={editData[candidate.id]?.hiredToEmployerId || ''}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  [candidate.id]: { ...editData[candidate.id], hiredToEmployerId: e.target.value }
                                })}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="">בחר מעסיק...</option>
                                {employers.map((emp) => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={saving}>
                            <X className="h-4 w-4 ml-1" />
                            ביטול
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(candidate.id)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                            {saving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                            שמור
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge className={`${statusColors[status]} border`}>
                              {statusLabels[status]}
                            </Badge>
                            <div>
                              <Link href={`/dashboard/candidates/${candidate.id}`} className="font-medium hover:text-blue-600">
                                {candidate.name}
                              </Link>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                                {candidate.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {candidate.phone}
                                  </span>
                                )}
                                {candidate.city && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {candidate.city}
                                  </span>
                                )}
                                {candidate.hiredToEmployer && (
                                  <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <Building2 className="h-3 w-3" />
                                    התקבל ל: {candidate.hiredToEmployer.name}
                                  </span>
                                )}
                                {candidate.inProcessPosition && (
                                  <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                                    <Target className="h-3 w-3" />
                                    נשלח ל: {candidate.inProcessPosition.title}
                                    {candidate.inProcessPosition.employer && (
                                      <span className="text-blue-500">({candidate.inProcessPosition.employer.name})</span>
                                    )}
                                  </span>
                                )}
                                {candidate.uploadedBy && (
                                  <span className="flex items-center gap-1 text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                                    <User className="h-3 w-3" />
                                    הועלה ע"י: {candidate.uploadedBy.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quick status buttons */}
                            <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant={status === 'in-process' ? 'default' : 'ghost'}
                              className={status === 'in-process' ? 'bg-blue-500 h-7 px-2' : 'h-7 px-2 hover:bg-blue-100'}
                              onClick={() => quickStatusUpdate(candidate.id, 'IN_PROCESS')}
                              disabled={saving}
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant={status === 'hired' ? 'default' : 'ghost'}
                              className={status === 'hired' ? 'bg-green-500 h-7 px-2' : 'h-7 px-2 hover:bg-green-100'}
                              onClick={() => quickStatusUpdate(candidate.id, 'EMPLOYED')}
                              disabled={saving}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant={status === 'rejected' ? 'default' : 'ghost'}
                              className={status === 'rejected' ? 'bg-red-500 h-7 px-2' : 'h-7 px-2 hover:bg-red-100'}
                              onClick={() => quickStatusUpdate(candidate.id, 'REJECTED')}
                              disabled={saving}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => startEdit(candidate)} className="h-7">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                        </div>
                        
                        {/* Dates row */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-2 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            הגיע: {new Date(candidate.createdAt).toLocaleDateString('he-IL')}
                          </span>
                          {candidate.inProcessAt && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Clock className="h-3 w-3" />
                              נכנס לתהליך: {new Date(candidate.inProcessAt).toLocaleDateString('he-IL')}
                            </span>
                          )}
                          {candidate.interviewDate && (
                            <span className="flex items-center gap-1 text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                              📅 ראיון: {new Date(candidate.interviewDate).toLocaleDateString('he-IL')}
                            </span>
                          )}
                          {status === 'in-process' && !candidate.interviewDate && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50"
                              onClick={() => startEdit(candidate)}
                            >
                              + קבע תאריך ראיון
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
