"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, X, Upload, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CompactFileStatusProps {
  file: File | null
  isSample?: boolean
  onFileChange: (file: File | null) => void
  onReprocess?: () => void
  className?: string
}

export function CompactFileStatus({ 
  file, 
  isSample = false, 
  onFileChange, 
  onReprocess,
  className 
}: CompactFileStatusProps) {
  const [isHovered, setIsHovered] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = (e) => {
      const selectedFile = (e.target as HTMLInputElement).files?.[0]
      if (selectedFile) {
        onFileChange(selectedFile)
      }
    }
    input.click()
  }

  if (!file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center justify-center p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50",
          className
        )}
      >
        <Button
          variant="outline"
          onClick={handleFileSelect}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Выбрать PDF файл
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Информация о файле */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate">
              {file.name}
            </h3>
            {isSample && (
              <span className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full">
                Демо
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • PDF документ
          </p>
        </div>
      </div>

      {/* Действия */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-1"
          >
            {onReprocess && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReprocess}
                className="h-8 w-8 p-0"
                title="Обработать заново"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileSelect}
              className="h-8 w-8 p-0"
              title="Выбрать другой файл"
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileChange(null)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Удалить файл"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
