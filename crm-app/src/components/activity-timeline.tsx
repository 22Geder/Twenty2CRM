'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Application {
  candidate: {
    id: string;
    name: string;
  };
  position: {
    id: string;
    title: string;
  };
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  metadata?: string;
  user?: User;
  application?: Application;
  createdAt: string;
}

interface ActivityTimelineProps {
  candidateId?: string;
  applicationId?: string;
  limit?: number;
}

export default function ActivityTimeline({
  candidateId,
  applicationId,
  limit = 20
}: ActivityTimelineProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [candidateId, applicationId, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (candidateId) params.append('candidateId', candidateId);
      if (applicationId) params.append('applicationId', applicationId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/activity-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string): string => {
    const icons: Record<string, string> = {
      CANDIDATE_APPLIED: '📝',
      STATUS_CHANGED: '🔄',
      STAGE_CHANGED: '🎯',
      INTERVIEW_SCHEDULED: '📅',
      INTERVIEW_COMPLETED: '✅',
      NOTE_ADDED: '📌',
      DOCUMENT_UPLOADED: '📎',
      EMAIL_SENT: '📧',
      SMS_SENT: '📱',
      OFFER_SENT: '💼'
    };
    return icons[type] || '•';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'כרגע';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">טוען היסטוריה...</div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">אין פעילות עדיין</div>
      </Card>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      {logs.map((log, index) => (
        <Card key={log.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="text-2xl flex-shrink-0">
              {getActivityIcon(log.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {log.description}
              </div>

              {log.user && (
                <div className="text-xs text-gray-600 mb-1">
                  👤 {log.user.name}
                </div>
              )}

              {log.application && (
                <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                  <Link
                    href={`/dashboard/candidates/${log.application.candidate.id}`}
                    className="hover:text-blue-600 underline"
                  >
                    {log.application.candidate.name}
                  </Link>
                  <span>•</span>
                  <Link
                    href={`/dashboard/positions/${log.application.position.id}`}
                    className="hover:text-blue-600 underline"
                  >
                    {log.application.position.title}
                  </Link>
                </div>
              )}

              <div className="text-xs text-gray-400 mt-2">
                🕐 {formatDate(log.createdAt)}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
