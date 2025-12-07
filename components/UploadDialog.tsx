'use client'

import type React from 'react'
import type { Puzzle } from '@/lib/types'
import { AlertCircle, CloudUpload } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'
import { parsePuzzle } from '@/lib/api'
import { cn } from '@/lib/utils'

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  onParsed: (puzzle: Puzzle) => void
}

export function UploadDialog({ open, onClose, onParsed }: UploadDialogProps) {
  // ==================== Refs ====================
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragCounterRef = useRef(0)

  // ==================== State ====================
  const [isDragging, setIsDragging] = useState(false)
  const [isDragInvalid, setIsDragInvalid] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // ==================== Constants ====================
  const isApple = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
  const isUploadDisabled = isParsing || Boolean(previewUrl)

  // ==================== State Management ====================
  const cleanupPreviewUrl = useCallback((url: string | null) => {
    if (url)
      URL.revokeObjectURL(url)
  }, [])

  const resetState = useCallback(() => {
    cleanupPreviewUrl(previewUrl)
    setPreviewUrl(null)
    setUploadProgress(0)
    setIsDragging(false)
    setIsDragInvalid(false)
    setIsParsing(false)
  }, [previewUrl, cleanupPreviewUrl])

  const handleClose = useCallback(() => {
    if (!isParsing) {
      resetState()
      onClose()
    }
  }, [isParsing, resetState, onClose])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => cleanupPreviewUrl(previewUrl)
  }, [previewUrl, cleanupPreviewUrl])

  // ==================== File Handling ====================
  const processFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片格式文件')
      return
    }

    // Setup preview
    cleanupPreviewUrl(previewUrl)
    const newPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(newPreviewUrl)

    // Start parsing
    setIsParsing(true)
    setUploadProgress(0)

    try {
      const puzzle = await parsePuzzle(file, {
        onProgress: setUploadProgress,
      })
      onParsed(puzzle)
      handleClose()
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解析失败'
      toast.error(errorMessage)
      setIsParsing(false)
      setUploadProgress(0)
    }
  }, [previewUrl, cleanupPreviewUrl, onParsed, handleClose])

  // ==================== File Input Handlers ====================
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file)
      void processFile(file)
    event.target.value = '' // Allow re-selecting the same file
  }, [processFile])

  const handleUploadAreaClick = useCallback(() => {
    if (!isUploadDisabled) {
      fileInputRef.current?.click()
    }
  }, [isUploadDisabled])

  const handleUploadAreaKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleUploadAreaClick()
    }
  }, [handleUploadAreaClick])

  // ==================== Paste Event Handler ====================
  useEffect(() => {
    if (!open || isUploadDisabled)
      return

    const handlePaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files?.[0]
      if (file) {
        event.preventDefault()
        void processFile(file)
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [open, isUploadDisabled, processFile])

  // ==================== Drag & Drop Handlers ====================
  const isDraggedFileValid = useCallback((event: React.DragEvent): boolean => {
    const items = event.dataTransfer.items
    if (!items || items.length === 0)
      return false

    const firstItem = items[0]
    return firstItem.kind === 'file' && firstItem.type.startsWith('image/')
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current++

    if (!isUploadDisabled && dragCounterRef.current === 1) {
      setIsDragging(true)
      setIsDragInvalid(!isDraggedFileValid(event))
    }
  }, [isUploadDisabled, isDraggedFileValid])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current--

    if (dragCounterRef.current === 0) {
      setIsDragging(false)
      setIsDragInvalid(false)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current = 0
    setIsDragging(false)
    setIsDragInvalid(false)

    if (isUploadDisabled)
      return

    const file = event.dataTransfer.files?.[0]
    if (file)
      void processFile(file)
  }, [isUploadDisabled, processFile])

  // ==================== Render Helpers ====================
  const getUploadAreaClassName = () => {
    const baseClasses = 'relative flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-dashed cursor-pointer transition-colors'

    if (isDragging && isDragInvalid) {
      return cn(baseClasses, 'border-destructive bg-destructive/5')
    }
    if (isDragging) {
      return cn(baseClasses, 'border-primary bg-primary/5')
    }
    return cn(baseClasses, 'border-muted-foreground/25 hover:border-primary/50')
  }

  const getOverlayHeight = () => {
    return uploadProgress >= 100 ? '100%' : `${100 - uploadProgress}%`
  }

  // ==================== Render ====================
  return (
    <Dialog open={open} onOpenChange={value => !value && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传截图解析</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="上传图片"
            onChange={handleInputChange}
          />

          {/* Preview or Upload Area */}
          <AspectRatio ratio={16 / 9}>
            {previewUrl
              ? (
                // Image Preview with Upload Progress
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="预览图片"
                      fill
                      className="object-cover"
                    />

                    {isParsing && (
                      <>
                        {/* Progress Overlay */}
                        <div
                          className={cn(
                            'absolute inset-x-0 bottom-0 bg-black/60 transition-all duration-300',
                            uploadProgress >= 100 && 'animate-pulse',
                          )}
                          style={{ height: getOverlayHeight() }}
                        />

                        {/* Loading Indicator */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Spinner className="size-8 text-white" />
                          <p className="mt-2 text-sm font-medium text-white">
                            {uploadProgress >= 100 ? '处理中...' : '上传中...'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )
              : (
                // Upload Drop Zone
                  <div
                    className={getUploadAreaClassName()}
                    role="button"
                    tabIndex={0}
                    onClick={handleUploadAreaClick}
                    onKeyDown={handleUploadAreaKeyDown}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isDragging
                      ? (
                        // Drag State
                          isDragInvalid
                            ? (
                              // Invalid File Type
                                <>
                                  <div className="rounded-full bg-destructive/10 p-4">
                                    <AlertCircle className="size-8 text-destructive" />
                                  </div>
                                  <p className="mt-4 text-sm font-medium text-destructive">
                                    不是图片格式，无法上传
                                  </p>
                                </>
                              )
                            : (
                              // Valid File Type
                                <>
                                  <div className="rounded-full bg-primary/10 p-4">
                                    <CloudUpload className="size-8 text-primary" />
                                  </div>
                                  <p className="mt-4 text-sm font-medium text-primary">
                                    松开鼠标上传图片
                                  </p>
                                </>
                              )
                        )
                      : (
                        // Default State
                          <>
                            <div className="rounded-full bg-muted p-4">
                              <CloudUpload className="size-8 text-muted-foreground" />
                            </div>
                            <p className="mt-4 text-sm font-medium">
                              点击或拖拽图片到此处上传
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              支持
                              <Kbd>
                                {`${isApple ? '⌘' : 'Ctrl'} + V`}
                              </Kbd>
                              粘贴图片
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              仅支持图片格式 (JPG, PNG 等)
                            </p>
                          </>
                        )}
                  </div>
                )}
          </AspectRatio>
        </div>
      </DialogContent>
    </Dialog>
  )
}
