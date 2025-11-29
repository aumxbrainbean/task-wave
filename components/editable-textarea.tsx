'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface EditableTextareaProps {
  value: string
  onChange: (value: string) => void
  onSave: (value: string) => void
  placeholder?: string
  className?: string
  testId?: string
}

// Memoized to prevent unnecessary re-renders
export const EditableTextarea = memo(function EditableTextarea({
  value: initialValue,
  onChange,
  onSave,
  placeholder = '',
  className = '',
  testId,
}: EditableTextareaProps) {
  const [localValue, setLocalValue] = useState(initialValue)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isTypingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update local value when external value changes (only if not currently typing)
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(initialValue)
    }
  }, [initialValue])

  // Auto-resize textarea based on content
  const autoResize = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  // Auto-resize on mount and when value changes
  useEffect(() => {
    autoResize()
  }, [localValue])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    isTypingRef.current = true
    onChange(newValue) // Notify parent of change
    autoResize()

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Auto-save after 2 seconds of no typing
    saveTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      onSave(newValue)
    }, 2000)
  }

  const handleBlur = () => {
    // Clear timeout to prevent double save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    isTypingRef.current = false
    onSave(localValue)
  }

  return (
    <Textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`${className} overflow-hidden`}
      data-testid={testId}
      style={{ minHeight: '2.5rem' }}
    />
  )
})
