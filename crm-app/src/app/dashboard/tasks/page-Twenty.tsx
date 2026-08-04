"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckSquare, Plus, Calendar, User, AlertCircle,
  Clock, CheckCircle2, Trash2
} from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: "high" | "medium" | "low"
  assignedTo: string
  candidateName?: string
  status: "pending" | "completed"
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "התקשר למועמד - דוד לוי",
      description: "לתאם ראיון טלפוני ראשוני",
      dueDate: "2025-12-24",
      priority: "high",
      assignedTo: "Admin",
      candidateName: "דוד לוי",
      status: "pending",
    },
    {
      id: "2",
      title: "שלח הצעת עבודה - שרה כהן",
      description: "הכן חוזה והצעת שכר",
      dueDate: "2025-12-25",
      priority: "high",
      assignedTo: "Admin",
      candidateName: "שרה כהן",
      status: "pending",
    },
    {
      id: "3",
      title: "עדכן סטטוס מועמד - מיכל אברהם",
      description: "עדכן לאחר ראיון שני",
      dueDate: "2025-12-26",
      priority: "medium",
      assignedTo: "Admin",
      candidateName: "מיכל אברהם",
      status: "pending",
    },
    {
      id: "4",
      title: "פרסם משרה חדשה - Backend Developer",
      description: "פרסום באתרי דרושים",
      dueDate: "2025-12-27",
      priority: "medium",
      assignedTo: "Admin",
      status: "pending",
    },
    {
      id: "5",
      title: "בדיקת רפרנסים - יוסי גולן",
      description: "התקשר ל-3 רפרנסים",
      dueDate: "2025-12-23",
      priority: "low",
      assignedTo: "Admin",
      candidateName: "יוסי גולן",
      status: "completed",
    },
  ])

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, status: task.status === "pending" ? "completed" : "pending" }
        : task
    ))
  }

  const deleteTask = (id: string) => {
    if (confirm("למחוק משימה זו?")) {
      setTasks(tasks.filter(task => task.id !== id))
    }
  }

  const priorityConfig = {
    high: { color: "bg-red-500", text: "דחוף", icon: AlertCircle },
    medium: { color: "bg-yellow-500", text: "בינוני", icon: Clock },
    low: { color: "bg-green-500", text: "נמוך", icon: CheckCircle2 },
  }

  const pendingTasks = tasks.filter(t => t.status === "pending")
  const completedTasks = tasks.filter(t => t.status === "completed")

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            משימות ותזכורות
          </h1>
          <p className="text-muted-foreground mt-1">
            {pendingTasks.length} משימות ממתינות • {completedTasks.length} הושלמו
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
          <Plus className="ml-2 h-4 w-4" />
          משימה חדשה
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-r-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">דחופות</p>
              <p className="text-3xl font-bold text-red-600">
                {tasks.filter(t => t.priority === "high" && t.status === "pending").length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">בינוניות</p>
              <p className="text-3xl font-bold text-yellow-600">
                {tasks.filter(t => t.priority === "medium" && t.status === "pending").length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">סה״כ פתוחות</p>
              <p className="text-3xl font-bold text-blue-600">{pendingTasks.length}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">הושלמו</p>
              <p className="text-3xl font-bold text-green-600">{completedTasks.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Pending Tasks */}
      <Card className="mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">משימות ממתינות</h2>
        </div>
        <div className="divide-y">
          {pendingTasks.map((task) => {
            const PriorityIcon = priorityConfig[task.priority].icon
            
            return (
              <div
                key={task.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4"
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    <Badge className={`${priorityConfig[task.priority].color} text-white flex items-center gap-1`}>
                      <PriorityIcon className="h-3 w-3" />
                      {priorityConfig[task.priority].text}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(task.dueDate).toLocaleDateString("he-IL")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{task.assignedTo}</span>
                    </div>
                    {task.candidateName && (
                      <Badge variant="outline">{task.candidateName}</Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            )
          })}

          {pendingTasks.length === 0 && (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">כל המשימות הושלמו! 🎉</p>
            </div>
          )}
        </div>
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">משימות שהושלמו</h2>
          </div>
          <div className="divide-y">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4 opacity-60"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold line-through">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {task.description}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
