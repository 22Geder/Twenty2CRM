'use client';

import { useState } from 'react';

interface CandidateScoreProps {
  candidateId: string;
  initialScore?: number;
  onScoreChange?: (score: number) => void;
}

export default function CandidateScore({
  candidateId,
  initialScore = 0,
  onScoreChange
}: CandidateScoreProps) {
  const [score, setScore] = useState(initialScore);
  const [isEditing, setIsEditing] = useState(false);
  const [tempScore, setTempScore] = useState(initialScore);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: tempScore })
      });

      if (response.ok) {
        setScore(tempScore);
        setIsEditing(false);
        if (onScoreChange) {
          onScoreChange(tempScore);
        }
      } else {
        alert('שגיאה בעדכון ציון');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      alert('שגיאה בעדכון ציון');
    }
  };

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return 'text-green-600 bg-green-50 border-green-300';
    if (scoreValue >= 60) return 'text-blue-600 bg-blue-50 border-blue-300';
    if (scoreValue >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    if (scoreValue >= 20) return 'text-orange-600 bg-orange-50 border-orange-300';
    return 'text-red-600 bg-red-50 border-red-300';
  };

  const getScoreLabel = (scoreValue: number) => {
    if (scoreValue >= 80) return 'מצוין';
    if (scoreValue >= 60) return 'טוב';
    if (scoreValue >= 40) return 'בינוני';
    if (scoreValue >= 20) return 'חלש';
    return 'לא מתאים';
  };

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">ציון מועמד:</span>
        
        {!isEditing ? (
          <>
            <div className={`px-3 py-1 rounded-lg border-2 font-bold text-lg ${getScoreColor(score)}`}>
              {score}/100
            </div>
            <span className={`text-sm ${getScoreColor(score).split(' ')[0]}`}>
              ({getScoreLabel(score)})
            </span>
            <button
              onClick={() => {
                setTempScore(score);
                setIsEditing(true);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              ✏️ ערוך
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={tempScore}
              onChange={e => setTempScore(parseInt(e.target.value))}
              className="w-32"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={tempScore}
              onChange={e => setTempScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 px-2 py-1 border rounded"
            />
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              💾 שמור
            </button>
            <button
              onClick={() => {
                setTempScore(score);
                setIsEditing(false);
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
            >
              ביטול
            </button>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              score >= 80 ? 'bg-green-500' :
              score >= 60 ? 'bg-teal-500' :
              score >= 40 ? 'bg-orange-400' :
              score >= 20 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
