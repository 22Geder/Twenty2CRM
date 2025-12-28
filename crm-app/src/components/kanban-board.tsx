'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tags: Array<{ id: string; name: string; color?: string }>;
}

interface Position {
  id: string;
  title: string;
  tags: Array<{ id: string; name: string }>;
}

interface Application {
  id: string;
  stage: string;
  candidate: Candidate;
  position: Position;
  matchScore?: number;
  appliedAt: string;
}

interface StageData {
  NEW: Application[];
  SCREENING: Application[];
  INTERVIEW: Application[];
  OFFER: Application[];
  HIRED: Application[];
  REJECTED: Application[];
}

const STAGES = [
  { key: 'NEW', label: '📥 חדש', color: 'bg-blue-50 border-blue-200' },
  { key: 'SCREENING', label: '🔍 סינון', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'INTERVIEW', label: '💼 ראיון', color: 'bg-purple-50 border-purple-200' },
  { key: 'OFFER', label: '📝 הצעה', color: 'bg-orange-50 border-orange-200' },
  { key: 'HIRED', label: '✅ התקבל', color: 'bg-green-50 border-green-200' },
  { key: 'REJECTED', label: '❌ נדחה', color: 'bg-red-50 border-red-200' }
];

interface KanbanBoardProps {
  positionId?: string;
}

export default function KanbanBoard({ positionId }: KanbanBoardProps) {
  const [stages, setStages] = useState<StageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [positionId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = positionId
        ? `/api/applications/stages?positionId=${positionId}`
        : '/api/applications/stages';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStages(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // No change
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (!stages) return;

    const sourceStage = source.droppableId as keyof StageData;
    const destStage = destination.droppableId as keyof StageData;

    // Create new stages object
    const newStages = { ...stages };
    const sourceApps = Array.from(newStages[sourceStage]);
    const destApps = sourceStage === destStage ? sourceApps : Array.from(newStages[destStage]);

    // Remove from source
    const [movedApp] = sourceApps.splice(source.index, 1);

    // Add to destination
    destApps.splice(destination.index, 0, { ...movedApp, stage: destStage });

    // Update state
    newStages[sourceStage] = sourceApps;
    newStages[destStage] = destApps;
    setStages(newStages);

    // Update server
    try {
      setUpdating(true);
      const response = await fetch(`/api/applications/${draggableId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: destStage })
      });

      if (!response.ok) {
        // Revert on error
        await fetchApplications();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      await fetchApplications();
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">טוען מועמדים...</div>
      </div>
    );
  }

  if (!stages) {
    return <div className="text-center text-gray-500">אין נתונים להצגה</div>;
  }

  return (
    <div className="relative" dir="rtl">
      {updating && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
          <div className="text-sm text-gray-600">מעדכן...</div>
        </div>
      )}
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map((stage) => (
            <div key={stage.key} className="flex flex-col">
              <div className={`${stage.color} border-2 rounded-t-lg p-3 font-bold text-center`}>
                {stage.label}
                <span className="mr-2 text-sm font-normal text-gray-600">
                  ({stages[stage.key as keyof StageData].length})
                </span>
              </div>

              <Droppable droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 border-2 border-t-0 rounded-b-lg min-h-[500px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    {stages[stage.key as keyof StageData].map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <Card className="p-3 cursor-move hover:shadow-md transition-shadow bg-white">
                              <Link href={`/dashboard/candidates/${app.candidate.id}`}>
                                <div className="font-semibold text-sm mb-1 hover:text-blue-600">
                                  {app.candidate.name}
                                </div>
                              </Link>
                              
                              <div className="text-xs text-gray-600 mb-2">
                                {app.position.title}
                              </div>

                              {app.matchScore !== undefined && (
                                <div className="text-xs font-bold text-green-600 mb-2">
                                  התאמה: {app.matchScore}%
                                </div>
                              )}

                              {app.candidate.phone && (
                                <div className="text-xs text-gray-500 mb-1">
                                  📱 {app.candidate.phone}
                                </div>
                              )}

                              {app.candidate.email && (
                                <div className="text-xs text-gray-500 mb-2 truncate">
                                  📧 {app.candidate.email}
                                </div>
                              )}

                              {app.candidate.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {app.candidate.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag.id}
                                      className="text-xs px-2 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: tag.color || '#e5e7eb',
                                        color: '#1f2937'
                                      }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                  {app.candidate.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{app.candidate.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
