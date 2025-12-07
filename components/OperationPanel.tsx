'use client'

import { Eraser, ImageUp, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface OperationPanelProps {
  isSolving: boolean
  isSolved: boolean
  onSolve: () => void
  onClearSolution: () => void
  onClear: () => void
  onUpload: () => void
}

export function OperationPanel({
  isSolving,
  isSolved,
  onSolve,
  onClearSolution,
  onClear,
  onUpload,
}: OperationPanelProps) {
  const [clearArmed, setClearArmed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleClearClick = () => {
    if (clearArmed) {
      onClear()
      setClearArmed(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
    else {
      setClearArmed(true)
      timeoutRef.current = setTimeout(() => {
        setClearArmed(false)
      }, 5000)
    }
  }

  const handleOutsideClick = () => {
    if (clearArmed) {
      setClearArmed(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }

  return (
    <div
      className="space-y-3 rounded-lg border bg-card p-4"
      onMouseLeave={handleOutsideClick}
    >
      {isSolved
        ? (
            <Button
              className="w-full"
              onClick={onClearSolution}
            >
              <RotateCcw className="size-4" />
              清除答案
            </Button>
          )
        : (
            <Button
              className="w-full"
              onClick={onSolve}
              disabled={isSolving}
            >
              <Sparkles className="size-4" />
              {isSolving ? '求解中...' : '解题'}
            </Button>
          )}
      <Button
        className="w-full"
        variant="outline"
        onClick={onUpload}
        disabled={isSolving || isSolved}
      >
        <ImageUp className="size-4" />
        上传截图解析
      </Button>
      <Button
        className="w-full"
        variant={clearArmed ? 'destructive' : 'outline'}
        onClick={handleClearClick}
      >
        <Eraser className="size-4" />
        {clearArmed ? '确认清空' : '清空'}
      </Button>
    </div>
  )
}
