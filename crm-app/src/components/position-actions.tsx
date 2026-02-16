'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Trash2, Tag, X, Plus, Edit, Check, AlertTriangle 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Position {
  id: string
  title: string
  keywords?: string | null
  _count?: { applications: number }
}

interface PositionActionsProps {
  position: Position
  onDelete?: (id: string) => void
  onTagsUpdate?: (id: string, tags: string[]) => void
}

// 🏷️ ניהול תגיות למשרה
export function PositionTagsEditor({ 
  position, 
  onUpdate,
  className = ""
}: { 
  position: Position
  onUpdate?: (tags: string[]) => void
  className?: string 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tags, setTags] = useState<string[]>(() => {
    try {
      if (position.keywords) {
        const parsed = JSON.parse(position.keywords)
        return Array.isArray(parsed) ? parsed : []
      }
      return []
    } catch {
      return position.keywords?.split(',').map(t => t.trim()).filter(Boolean) || []
    }
  })
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/positions/${position.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: JSON.stringify(tags) })
      })
      
      if (response.ok) {
        setIsEditing(false)
        onUpdate?.(tags)
      }
    } catch (error) {
      console.error('Error saving tags:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isEditing) {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          <Tag className="h-4 w-4 ml-1" />
          ניהול תגיות ({tags.length})
        </Button>
      </div>
    )
  }

  return (
    <Card className={`p-4 border-blue-200 bg-blue-50/50 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-blue-800">עריכת תגיות</span>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* תגיות קיימות */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <Badge 
              key={idx} 
              variant="secondary"
              className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer flex items-center gap-1 pr-1"
            >
              {tag}
              <X 
                className="h-3 w-3 hover:text-red-600" 
                onClick={() => handleRemoveTag(tag)}
              />
            </Badge>
          ))}
        </div>
        
        {/* הוספת תגית חדשה */}
        <div className="flex gap-2">
          <Input
            placeholder="הוסף תגית..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            className="flex-1"
          />
          <Button onClick={handleAddTag} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* כפתור שמירה */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>שומר...</>
            ) : (
              <>
                <Check className="h-4 w-4 ml-1" />
                שמור תגיות
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// 🗑️ כפתור מחיקת משרה
export function DeletePositionButton({ 
  position,
  onDeleted
}: { 
  position: Position
  onDeleted?: () => void 
}) {
  const [showDialog, setShowDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forceDelete, setForceDelete] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (forceDelete) {
        headers['x-force-delete'] = 'true'
      }
      
      const response = await fetch(`/api/positions/${position.id}`, {
        method: 'DELETE',
        headers
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 409) {
          // יש מועמדויות - שואל אם למחוק בכל זאת
          setError(`למשרה זו יש ${data.applicationsCount} מועמדויות. האם למחוק בכל זאת?`)
          setForceDelete(true)
        } else {
          setError(data.error || 'שגיאה במחיקה')
        }
        return
      }
      
      setShowDialog(false)
      onDeleted?.()
      // רענון הדף
      window.location.reload()
    } catch (err) {
      setError('שגיאה בתקשורת עם השרת')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="text-red-600 hover:text-red-800 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 ml-1" />
        מחק
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              מחיקת משרה
            </DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את המשרה:
              <br />
              <strong className="text-slate-800">{position.title}</strong>
              {position._count?.applications ? (
                <span className="block mt-2 text-amber-600">
                  ⚠️ למשרה זו יש {position._count.applications} מועמדויות
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              disabled={deleting}
            >
              ביטול
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'מוחק...' : forceDelete ? 'מחק כולל מועמדויות' : 'מחק משרה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// רכיב משולב לשורת משרה
export function PositionActions({ position, onDelete, onTagsUpdate }: PositionActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <PositionTagsEditor 
        position={position} 
        onUpdate={(tags) => onTagsUpdate?.(position.id, tags)} 
      />
      <DeletePositionButton 
        position={position}
        onDeleted={() => onDelete?.(position.id)}
      />
    </div>
  )
}
