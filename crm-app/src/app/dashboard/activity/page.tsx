'use client';

import { Suspense } from 'react';
import ActivityTimeline from '@/components/activity-timeline';
import { Card } from '@/components/ui/card';

export default function ActivityPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📋 היסטוריית פעילות</h1>
        <p className="text-gray-600 mt-2">
          מעקב אחר כל הפעולות במערכת
        </p>
      </div>

      <Suspense fallback={<div className="text-center p-8">טוען...</div>}>
        <ActivityTimeline limit={50} />
      </Suspense>
    </div>
  );
}
