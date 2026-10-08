'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle, XCircle, Clock, User, Phone, MapPin,
  Building2, Calendar, Edit3, Save, X, Loader2, RefreshCw,
  Users, Target, Search, ChevronRight, ChevronLeft, Sparkles, Banknote,
} from 'lucide-react';
import Link from 'next/link';
import { formatDateHe, isStatusPeriodCandidate } from '@/lib/candidate-hired-dates';

interface Application {
  id: string;
  status: string;
  stage?: string;
  position: {
    id: string;
    title: string;
    employer?: { id: string; name: string };
  };
}

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
  placementFeePaid: boolean | null;
  inProcessPositionId: string | null;
  inProcessPositionTitle?: string | null;
  inProcessEmployerName?: string | null;
  inProcessAt: string | null;
  interviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  hiredToEmployer?: { id: string; name: string };
  inProcessPosition?: {
    id: string;
    title: string;
    employer?: { id: string; name: string };
  };
  applications?: Application[];
  uploadedBy?: { id: string; name: string; email: string };
}

interface Employer {
  id: string;
  name: string;
}

type StatusKey = 'hired' | 'in-process' | 'rejected' | 'new';
type FilterKey = 'all' | StatusKey;

function toIsraelDateTimeInput(value: string | null): string {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function formatInterviewDate(value: string): string {
  return new Date(value).toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPeriodLabel(period: string, mode: 'month' | 'year'): string {
  if (mode === 'year') return `שנת ${period}`;
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString('he-IL', {
    month: 'long',
    year: 'numeric',
  });
}

function shiftMonth(period: string, delta: number): string {
  const [year, month] = period.split('-').map(Number);
  const next = new Date(year, (month - 1) + delta, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_META: Record<StatusKey, {
  short: string;
  chip: string;
  number: string;
  ring: string;
  tint: string;
  action: string;
}> = {
  hired: {
    short: 'התקבל',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    number: 'text-emerald-700',
    ring: 'ring-emerald-500',
    tint: 'bg-emerald-50/80',
    action: 'bg-emerald-600 text-white',
  },
  'in-process': {
    short: 'בתהליך',
    chip: 'bg-sky-50 text-sky-700 ring-sky-200',
    number: 'text-sky-700',
    ring: 'ring-sky-500',
    tint: 'bg-sky-50/80',
    action: 'bg-sky-600 text-white',
  },
  rejected: {
    short: 'לא התקבל',
    chip: 'bg-rose-50 text-rose-700 ring-rose-200',
    number: 'text-rose-700',
    ring: 'ring-rose-500',
    tint: 'bg-rose-50/80',
    action: 'bg-rose-600 text-white',
  },
  new: {
    short: 'חדש',
    chip: 'bg-slate-100 text-slate-700 ring-slate-200',
    number: 'text-slate-700',
    ring: 'ring-slate-500',
    tint: 'bg-slate-50',
    action: 'bg-slate-700 text-white',
  },
};

export default function MonthlyStatusPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [paymentSavingId, setPaymentSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodMode, setPeriodMode] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const selectedPeriod = periodMode === 'year' ? selectedYear : selectedMonth;
  const yearOptions = Array.from({ length: 8 }, (_, index) => String(new Date().getFullYear() - index));
  const periodLabel = formatPeriodLabel(selectedPeriod, periodMode);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const response = await fetch('/api/candidates?period=' + encodeURIComponent(selectedPeriod) + '&limit=5000');
      if (response.ok) {
        const data = await response.json();
        const allCandidates = data.candidates || data || [];
        setCandidates(allCandidates.filter((c: Candidate) => isStatusPeriodCandidate(c, selectedPeriod)));
      }

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

  const getStatus = (candidate: Candidate): StatusKey => {
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
        hiredAt: candidate.hiredAt ? candidate.hiredAt.split('T')[0] : '',
        interviewDate: toIsraelDateTimeInput(candidate.interviewDate),
      },
    });
  };

  const patchEdit = (candidateId: string, patch: Record<string, string>) => {
    setEditData({
      ...editData,
      [candidateId]: { ...editData[candidateId], ...patch },
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

      if (data.employmentStatus === 'EMPLOYED') {
        if (data.hiredAt) updatePayload.hiredAt = data.hiredAt;
        if (data.hiredToEmployerId) updatePayload.hiredToEmployerId = data.hiredToEmployerId;
        updatePayload.inProcessPositionId = null;
        updatePayload.inProcessAt = null;
      } else if (data.employmentStatus === 'REJECTED') {
        updatePayload.hiredAt = null;
        updatePayload.hiredToEmployerId = null;
        updatePayload.inProcessPositionId = null;
        updatePayload.inProcessAt = null;
      } else if (data.employmentStatus === 'IN_PROCESS' || !data.employmentStatus) {
        updatePayload.hiredAt = null;
        updatePayload.hiredToEmployerId = null;
      }

      updatePayload.interviewDate = data.interviewDate
        ? new Date(data.interviewDate).toISOString()
        : null;

      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        setEditingId(null);
        setCandidates(list => list.map(candidate => (
          candidate.id === candidateId ? { ...candidate, ...updatePayload } : candidate
        )));
        void fetchData({ silent: true });
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const quickStatusUpdate = async (candidateId: string, newStatus: string) => {
    const current = candidates.find(c => c.id === candidateId);
    if (!current) return;
    const previous = candidates;
    const now = new Date().toISOString();
    const updatePayload: any = { employmentStatus: newStatus };

    if (newStatus === 'EMPLOYED') {
      if (!current.hiredAt) updatePayload.hiredAt = now;
      updatePayload.inProcessPositionId = null;
      updatePayload.inProcessAt = null;
    } else if (newStatus === 'REJECTED') {
      updatePayload.hiredAt = null;
      updatePayload.hiredToEmployerId = null;
      updatePayload.inProcessPositionId = null;
      updatePayload.inProcessAt = null;
    } else {
      updatePayload.hiredAt = null;
      updatePayload.hiredToEmployerId = null;
      if (!current.inProcessAt) updatePayload.inProcessAt = now;
    }

    setSavingId(candidateId);
    setCandidates(list => list.map(candidate => (
      candidate.id === candidateId ? { ...candidate, ...updatePayload } : candidate
    )));

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        setCandidates(previous);
        return;
      }
      void fetchData({ silent: true });
    } catch (error) {
      console.error('Error updating status:', error);
      setCandidates(previous);
    } finally {
      setSavingId(null);
    }
  };

  const markPlacementFee = async (candidateId: string, paid: boolean | null) => {
    if (!isAdmin) return;
    const previous = candidates;
    setPaymentSavingId(candidateId);
    setCandidates(current => current.map(candidate => (
      candidate.id === candidateId ? { ...candidate, placementFeePaid: paid } : candidate
    )));
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementFeePaid: paid }),
      });
      if (!response.ok) setCandidates(previous);
    } catch (error) {
      console.error('Error saving payment status:', error);
      setCandidates(previous);
    } finally {
      setPaymentSavingId(null);
    }
  };

  const filteredCandidates = useMemo(() => candidates.filter(c => {
    const status = getStatus(c);
    const matchesFilter = filter === 'all' || status === filter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      c.name?.toLowerCase().includes(query) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [candidates, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: candidates.length,
    hired: candidates.filter(c => getStatus(c) === 'hired').length,
    inProcess: candidates.filter(c => getStatus(c) === 'in-process').length,
    rejected: candidates.filter(c => getStatus(c) === 'rejected').length,
    new: candidates.filter(c => getStatus(c) === 'new').length,
  }), [candidates]);

  const conversion = stats.total > 0 ? Math.round((stats.hired / stats.total) * 100) : null;
  const filterLabel = filter === 'all' ? 'כל הסטטוסים' : STATUS_META[filter].short;

  const metricCards: Array<{
    key: FilterKey;
    label: string;
    value: number;
    hint: string;
    icon: typeof Users;
    accent: string;
    ring: string;
    tint: string;
  }> = [
    { key: 'all', label: 'בצינור', value: stats.total, hint: 'בתקופה שנבחרה', icon: Users, accent: 'text-indigo-700', ring: 'ring-indigo-500', tint: 'bg-indigo-50/80' },
    { key: 'hired', label: 'התקבלו', value: stats.hired, hint: conversion === null ? 'אין בסיס להמרה' : `${conversion}% המרה`, icon: CheckCircle, accent: STATUS_META.hired.number, ring: STATUS_META.hired.ring, tint: STATUS_META.hired.tint },
    { key: 'in-process', label: 'בתהליך', value: stats.inProcess, hint: 'ממתינים להחלטה', icon: Clock, accent: STATUS_META['in-process'].number, ring: STATUS_META['in-process'].ring, tint: STATUS_META['in-process'].tint },
    { key: 'rejected', label: 'לא התקבלו', value: stats.rejected, hint: 'נסגרו בלי קבלה', icon: XCircle, accent: STATUS_META.rejected.number, ring: STATUS_META.rejected.ring, tint: STATUS_META.rejected.tint },
    { key: 'new', label: 'חדשים', value: stats.new, hint: 'עדיין בלי סטטוס', icon: Sparkles, accent: STATUS_META.new.number, ring: STATUS_META.new.ring, tint: STATUS_META.new.tint },
  ];

  return (
    <div className="min-h-full p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900">
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-7">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.18em] text-slate-500">PIPELINE</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">סטטוס גיוס</h1>
              <p className="max-w-xl text-sm text-slate-600">
                {periodLabel}. המספרים נספרים לפי תאריך העלאה, כניסה לתהליך או קבלה.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full bg-slate-100 p-1" role="group" aria-label="תקופת מעקב">
                {(['month', 'year'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPeriodMode(mode)}
                    aria-pressed={periodMode === mode}
                    className={`h-9 rounded-full px-4 text-sm transition ${periodMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {mode === 'month' ? 'חודש' : 'שנה'}
                  </button>
                ))}
              </div>

              {periodMode === 'year' ? (
                <label className="flex h-11 items-center gap-2 rounded-full bg-slate-100 px-3 text-sm">
                  <span className="text-slate-500">שנה</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent font-medium text-slate-900 outline-none"
                    aria-label="בחירת שנה"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year} className="text-slate-950">{year}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="flex h-11 items-center rounded-full bg-slate-100 px-1">
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-200" aria-label="חודש קודם" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <label className="relative min-w-36 px-2 text-center text-sm font-medium">
                    {formatPeriodLabel(selectedMonth, 'month')}
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="בחירת חודש"
                    />
                  </label>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-200" aria-label="חודש הבא" onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}

              <Button variant="secondary" onClick={() => { void fetchData(); }} disabled={loading} className="h-11 rounded-full bg-slate-900 text-white hover:bg-slate-800">
                <RefreshCw className={loading ? 'animate-spin' : ''} />
                רענון
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-slate-200 text-center text-xs text-slate-500">
            <div className="px-4 py-3">
              <span className="block text-lg font-semibold tabular-nums text-slate-900">{stats.total}</span>
              רשומות
            </div>
            <div className="border-x border-slate-200 px-4 py-3">
              <span className="block text-lg font-semibold tabular-nums text-slate-900">{conversion === null ? '—' : `${conversion}%`}</span>
              המרה לקבלה
            </div>
            <div className="px-4 py-3">
              <span className="block text-lg font-semibold text-slate-900">{periodMode === 'year' ? '12 חודשים' : 'חודש אחד'}</span>
              חלון זמן
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="סינון לפי סטטוס">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            const selected = filter === metric.key;
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => setFilter(metric.key)}
                aria-pressed={selected}
                className={`rounded-2xl border border-slate-200 p-4 text-right transition hover:-translate-y-0.5 ${selected ? `ring-2 ${metric.ring} ${metric.tint}` : 'bg-white'}`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{metric.label}</span>
                  <Icon className={`h-4 w-4 ${metric.accent}`} />
                </span>
                <span className={`mt-3 block text-3xl font-semibold tabular-nums ${metric.accent}`}>{metric.value}</span>
                <span className="mt-1 block text-xs text-slate-400">{metric.hint}</span>
              </button>
            );
          })}
        </section>

        <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-none">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between md:px-5">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <Target className="h-4 w-4 text-indigo-600" />
                מועמדים
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600">{filteredCandidates.length}</span>
              </h2>
              <p className="mt-1 text-xs text-slate-500">{filterLabel} · {periodLabel}</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="שם, טלפון או אימייל"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full border-slate-200 bg-slate-50 pr-9"
                aria-label="חיפוש מועמדים"
              />
            </div>
          </div>

          <CardContent className="p-3 md:p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">טוען את {periodLabel}</p>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">אין מועמדים בחתך הזה</p>
                <p className="mt-1 text-sm text-slate-400">{periodLabel} · {filterLabel}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredCandidates.map((candidate) => {
                  const status = getStatus(candidate);
                  const meta = STATUS_META[status];
                  const isEditing = editingId === candidate.id;
                  const initial = candidate.name?.trim()?.charAt(0) || 'מ';

                  return (
                    <article
                      key={candidate.id}
                      className={`rounded-2xl border p-4 transition ${isEditing ? 'border-amber-200 bg-amber-50/70' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                      {isEditing ? (
                        <EditPanel
                          candidate={candidate}
                          employers={employers}
                          data={editData[candidate.id]}
                          saving={saving}
                          onChange={(patch) => patchEdit(candidate.id, patch)}
                          onCancel={() => setEditingId(null)}
                          onSave={() => saveEdit(candidate.id)}
                        />
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-3">
                              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-semibold ring-1 ring-inset ${meta.chip}`}>
                                {initial}
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link href={`/dashboard/candidates/${candidate.id}`} className="font-semibold text-slate-950 hover:text-indigo-700">
                                    {candidate.name}
                                  </Link>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.chip}`}>
                                    {meta.short}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                                  {candidate.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{candidate.phone}</span>}
                                  {candidate.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{candidate.city}</span>}
                                  {candidate.uploadedBy && <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />הועלה ע״י {candidate.uploadedBy.name}</span>}
                                </div>
                                <PlacementTags candidate={candidate} />
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                              <QuickAction label="סמן בתהליך" active={status === 'in-process'} activeClass={STATUS_META['in-process'].action} disabled={saving || savingId === candidate.id} onClick={() => quickStatusUpdate(candidate.id, 'IN_PROCESS')}>
                                <Clock className="h-3.5 w-3.5" />
                              </QuickAction>
                              <QuickAction label="סמן התקבל" active={status === 'hired'} activeClass={STATUS_META.hired.action} disabled={saving || savingId === candidate.id} onClick={() => quickStatusUpdate(candidate.id, 'EMPLOYED')}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </QuickAction>
                              <QuickAction label="סמן לא התקבל" active={status === 'rejected'} activeClass={STATUS_META.rejected.action} disabled={saving || savingId === candidate.id} onClick={() => quickStatusUpdate(candidate.id, 'REJECTED')}>
                                <XCircle className="h-3.5 w-3.5" />
                              </QuickAction>
                              <Button size="sm" variant="outline" onClick={() => startEdit(candidate)} className="h-8 rounded-full px-3" aria-label={`עריכת ${candidate.name}`}>
                                <Edit3 className="h-3.5 w-3.5" />
                                עריכה
                              </Button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                            <DatePill icon={<Calendar className="h-3 w-3" />} label={`עלה ${formatDateHe(candidate.createdAt)}`} />
                            {candidate.hiredAt && <DatePill tone="emerald" icon={<CheckCircle className="h-3 w-3" />} label={`התקבל ${formatDateHe(candidate.hiredAt)}`} />}
                            {isAdmin && status === 'hired' && (
                              <PaymentMark
                                paid={candidate.placementFeePaid}
                                saving={paymentSavingId === candidate.id}
                                onChange={(paid) => markPlacementFee(candidate.id, paid)}
                              />
                            )}
                            {candidate.inProcessAt && <DatePill tone="sky" icon={<Clock className="h-3 w-3" />} label={`נכנס לתהליך ${formatDateHe(candidate.inProcessAt)}`} />}
                            {candidate.interviewDate && <DatePill tone="violet" icon={<Calendar className="h-3 w-3" />} label={`ראיון ${formatInterviewDate(candidate.interviewDate)}`} />}
                            {status === 'in-process' && !candidate.interviewDate && (
                              <button type="button" onClick={() => startEdit(candidate)} className="rounded-full px-2.5 py-1 font-medium text-violet-700 hover:bg-violet-50">
                                קביעת ראיון
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  label, active, activeClass, disabled, onClick, children,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-full transition disabled:opacity-50 ${active ? activeClass : 'text-slate-500 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}

function PaymentMark({
  paid, saving, onChange,
}: {
  paid: boolean | null;
  saving: boolean;
  onChange: (paid: boolean | null) => void;
}) {
  const options: Array<{ value: boolean; label: string; active: string }> = [
    { value: true, label: 'שולם', active: 'bg-emerald-600 text-white' },
    { value: false, label: 'לא שולם', active: 'bg-amber-500 text-white' },
  ];

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-1 py-1 ring-1 ring-slate-200" role="group" aria-label="סטטוס תשלום">
      <Banknote className="ms-1 h-3.5 w-3.5 text-slate-400" />
      {options.map((option) => {
        const selected = paid === option.value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={selected}
            disabled={saving}
            onClick={() => onChange(selected ? null : option.value)}
            className={`inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition disabled:opacity-50 ${selected ? option.active : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span className={`grid h-3.5 w-3.5 place-items-center rounded-[4px] border text-[10px] ${selected ? 'border-white/70' : 'border-slate-300'}`}>
              {selected ? 'V' : ''}
            </span>
            {option.label}
          </button>
        );
      })}
    </span>
  );
}

function DatePill({ icon, label, tone = 'slate' }: { icon: ReactNode; label: string; tone?: 'slate' | 'emerald' | 'sky' | 'violet' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${tones[tone]}`}>{icon}{label}</span>;
}

function PlacementTags({ candidate }: { candidate: Candidate }) {
  const inProcessApps = candidate.applications?.filter(
    app => app.status === 'IN_PROCESS' || app.stage === 'IN_PROCESS'
  ) || [];

  if (candidate.hiredToEmployer) {
    return (
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <Building2 className="h-3 w-3" />
        התקבל ל{candidate.hiredToEmployer.name}
      </p>
    );
  }

  if (inProcessApps.length > 0) {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {inProcessApps.map((app) => (
          <span key={app.id} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
            <Target className="h-3 w-3" />
            {app.position.title}
            {app.position.employer && <span className="text-sky-500">· {app.position.employer.name}</span>}
          </span>
        ))}
      </div>
    );
  }

  if (candidate.inProcessPosition) {
    return (
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
        <Target className="h-3 w-3" />
        {candidate.inProcessPosition.title}
        {candidate.inProcessPosition.employer && <span className="text-sky-500">· {candidate.inProcessPosition.employer.name}</span>}
      </p>
    );
  }

  if (candidate.inProcessPositionTitle) {
    return (
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
        <Target className="h-3 w-3" />
        {candidate.inProcessPositionTitle}
        <span className="text-amber-600">· המשרה נמחקה</span>
      </p>
    );
  }

  return null;
}

function EditPanel({
  candidate, employers, data, saving, onChange, onCancel, onSave,
}: {
  candidate: Candidate;
  employers: Employer[];
  data: Record<string, string>;
  saving: boolean;
  onChange: (patch: Record<string, string>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const field = 'space-y-1';
  const label = 'text-xs font-medium text-slate-500';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">עריכת {candidate.name}</p>
        <span className="text-xs text-amber-700">השינויים נשמרים רק אחרי אישור</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={field}><span className={label}>שם</span><Input value={data?.name || ''} onChange={(e) => onChange({ name: e.target.value })} className="h-9 bg-white" /></label>
        <label className={field}><span className={label}>טלפון</span><Input value={data?.phone || ''} onChange={(e) => onChange({ phone: e.target.value })} className="h-9 bg-white" /></label>
        <label className={field}><span className={label}>אימייל</span><Input value={data?.email || ''} onChange={(e) => onChange({ email: e.target.value })} className="h-9 bg-white" /></label>
        <label className={field}><span className={label}>עיר</span><Input value={data?.city || ''} onChange={(e) => onChange({ city: e.target.value })} className="h-9 bg-white" /></label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={field}>
          <span className={label}>סטטוס</span>
          <select value={data?.employmentStatus || ''} onChange={(e) => onChange({ employmentStatus: e.target.value })} className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
            <option value="">חדש</option>
            <option value="IN_PROCESS">בתהליך</option>
            <option value="EMPLOYED">התקבל</option>
            <option value="REJECTED">לא התקבל</option>
          </select>
        </label>
        <label className={field}>
          <span className={label}>תאריך ושעת ראיון</span>
          <Input type="datetime-local" value={data?.interviewDate || ''} onChange={(e) => onChange({ interviewDate: e.target.value })} className="h-9 bg-white" />
        </label>
        {data?.employmentStatus === 'EMPLOYED' && (
          <>
            <label className={field}>
              <span className={label}>תאריך התקבל</span>
              <Input type="date" value={data?.hiredAt || ''} onChange={(e) => onChange({ hiredAt: e.target.value })} className="h-9 bg-white" />
            </label>
            <label className={field}>
              <span className={label}>התקבל אל</span>
              <select value={data?.hiredToEmployerId || ''} onChange={(e) => onChange({ hiredToEmployerId: e.target.value })} className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
                <option value="">בחר מעסיק</option>
                {employers.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </label>
          </>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving} className="rounded-full">
          <X className="h-4 w-4" />
          ביטול
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving} className="rounded-full bg-slate-950 hover:bg-slate-800">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          שמירה
        </Button>
      </div>
    </div>
  );
}
