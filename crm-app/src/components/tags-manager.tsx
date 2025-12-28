"use client"

import { useState, useEffect } from "react"
import { X, Plus, Search, Tag as TagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Tag {
  id: string
  name: string
  color: string
  category: string
}

interface TagsManagerProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  entity: "candidate" | "position"
}

export function TagsManager({ selectedTags, onTagsChange, entity }: TagsManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [search, setSearch] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [newTagName, setNewTagName] = useState("")

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const tags = await response.json()
        setAllTags(tags)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const createTag = async (name: string) => {
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          color: getRandomColor(),
          category: entity,
        }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setAllTags([...allTags, newTag])
        return newTag.id
      }
    } catch (error) {
      console.error("Error creating tag:", error)
    }
    return null
  }

  const handleAddTag = async (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId])
    }
    setSearch("")
    setShowSuggestions(false)
  }

  const handleCreateAndAdd = async () => {
    if (!newTagName.trim()) return

    const tagId = await createTag(newTagName.trim())
    if (tagId) {
      await handleAddTag(tagId)
    }
    setNewTagName("")
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId))
  }

  const getRandomColor = () => {
    const colors = [
      "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
      "#10B981", "#EF4444", "#06B6D4", "#6366F1"
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedTags.includes(tag.id)
  )

  const selectedTagObjects = allTags.filter((tag) =>
    selectedTags.includes(tag.id)
  )

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map((tag) => (
            <Badge
              key={tag.id}
              style={{ backgroundColor: tag.color }}
              className="text-white px-3 py-1 flex items-center gap-1"
            >
              {tag.name}
              <X
                className="h-3 w-3 cursor-pointer hover:opacity-70"
                onClick={() => handleRemoveTag(tag.id)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Search and Add */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="חפש או הוסף תגית חדשה..."
              className="pr-10"
            />
          </div>
          {search && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewTagName(search)
                handleCreateAndAdd()
              }}
            >
              <Plus className="h-4 w-4 ml-2" />
              צור תגית
            </Button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredTags.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                onClick={() => handleAddTag(tag.id)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span>{tag.name}</span>
                <span className="text-xs text-muted-foreground mr-auto">
                  ({tag.category})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Popular Tags */}
      {selectedTags.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">תגיות פופולריות:</span>
          {allTags.slice(0, 5).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleAddTag(tag.id)}
            >
              <Plus className="h-3 w-3 ml-1" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
