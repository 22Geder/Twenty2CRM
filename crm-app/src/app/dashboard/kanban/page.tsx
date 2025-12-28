'use client';

import { Suspense } from 'react';
import KanbanBoard from '@/components/kanban-board';
import { Card } from '@/components/ui/card';

export default function KanbanPage() {
  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🎯 פייפליין מועמדים (Kanban)</h1>
        <p className="text-gray-600 mt-2">
          גרור מועמדים בין השלבים לעדכון סטטוס
        </p>
      </div>

      <Card className="p-4">
        <Suspense fallback={<div className="text-center p-8">טוען...</div>}>
          <KanbanBoard />
        </Suspense>
      </Card>
    </div>
  );
}
