'use client'

import { useState } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface Tag {
  name: string
  color: string
}

interface ProjectTagsProps {
  projectId: string
  tags: Tag[]
  editable?: boolean
}

const TAG_COLORS = [
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Gray', value: '#6b7280', bg: 'bg-gray-500' },
]

export default function ProjectTags({ projectId, tags, editable = true }: ProjectTagsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0].value)
  const queryClient = useQueryClient()

  const updateTagsMutation = useMutation({
    mutationFn: (newTags: Tag[]) => projectsApi.updateTags(projectId, newTags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Tags updated')
    },
    onError: () => {
      toast.error('Failed to update tags')
    },
  })

  const handleAddTag = () => {
    if (!newTagName.trim()) return

    const newTag: Tag = {
      name: newTagName.trim(),
      color: selectedColor,
    }

    updateTagsMutation.mutate([...tags, newTag])
    setNewTagName('')
    setIsAdding(false)
  }

  const handleRemoveTag = (tagName: string) => {
    updateTagsMutation.mutate(tags.filter((t) => t.name !== tagName))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((tag) => (
          <div
            key={tag.name}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            <TagIcon className="w-3 h-3" />
            <span>{tag.name}</span>
            {editable && (
              <button
                onClick={() => handleRemoveTag(tag.name)}
                className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {tags.length === 0 && !isAdding && (
          <p className="text-sm text-text-secondary">No tags yet</p>
        )}

        {editable && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-border hover:border-primary transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Tag</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 border border-border rounded-lg bg-background-secondary space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Tag Name</label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g., Client, Internal, High-Priority"
              className="input w-full"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag()
                if (e.key === 'Escape') setIsAdding(false)
              }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full ${color.bg} transition-all ${
                    selectedColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleAddTag} className="btn-primary text-sm" disabled={!newTagName.trim()}>
              Add Tag
            </button>
            <button onClick={() => setIsAdding(false)} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

