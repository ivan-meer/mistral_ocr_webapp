"use client"

import { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDropzone } from "react-dropzone"
import { FileIcon as FilePdf, Upload, Check, X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onFileSelected: (file: File) => void
}

export function FileUploader({ onFileSelected }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        setUploadStatus('error')
        setTimeout(() => setUploadStatus('idle'), 3000)
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        if (file.type === "application/pdf") {
          setUploadStatus('success')
          onFileSelected(file)
          setTimeout(() => setUploadStatus('idle'), 2000)
        } else {
          setUploadStatus('error')
          setTimeout(() => setUploadStatus('idle'), 3000)
        }
      }
    },
    [onFileSelected],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-success"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            />
          </motion.div>
        )
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
              <X className="h-8 w-8 text-error" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-error"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            />
          </motion.div>
        )
      default:
        return (
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <FilePdf className="h-8 w-8 text-neutral-600 dark:text-neutral-400" />
            </div>
            {(isDragging || isDragActive) && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
          </div>
        )
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'success':
        return {
          title: "Файл загружен",
          subtitle: "Готов к обработке"
        }
      case 'error':
        return {
          title: "Ошибка загрузки",
          subtitle: "Только PDF файлы до 50MB"
        }
      default:
        return {
          title: isDragging || isDragActive ? "Отпустите файл" : "Выберите PDF файл",
          subtitle: isDragging || isDragActive ? "Загружаем документ" : "или перетащите сюда"
        }
    }
  }

  const statusText = getStatusText()
  const rootProps = getRootProps()
  
  return (
    <motion.div
      className={cn(
        "group relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isDragging || isDragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : uploadStatus === 'success'
          ? "border-success bg-success-subtle"
          : uploadStatus === 'error'
          ? "border-error bg-error-subtle"
          : "border-neutral-200 dark:border-neutral-700 hover:border-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
      )}
      whileHover={{ scale: uploadStatus === 'idle' ? 1.005 : 1 }}
      whileTap={{ scale: 0.995 }}
      onClick={rootProps.onClick}
      onKeyDown={rootProps.onKeyDown}
      tabIndex={rootProps.tabIndex}
      role={rootProps.role}
      style={rootProps.style}
    >
      <input {...getInputProps()} />
      
      {/* Premium background effects */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Drag overlay */}
      <AnimatePresence>
        {(isDragging || isDragActive) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        {/* Icon with premium animation */}
        <motion.div
          key={uploadStatus}
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20,
            delay: 0.1 
          }}
          className="relative"
        >
          {getStatusIcon()}
          
          {/* Floating sparkles for success */}
          <AnimatePresence>
            {uploadStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 -right-2"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="h-4 w-4 text-success" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload indicator for drag */}
          <AnimatePresence>
            {(isDragging || isDragActive) && uploadStatus === 'idle' && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
              >
                <Upload className="h-3 w-3 text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Text content with premium typography */}
        <motion.div
          key={`${uploadStatus}-${isDragActive}-text`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="space-y-3"
        >
          <h3 className={cn(
            "text-lg font-semibold transition-colors",
            uploadStatus === 'success' ? "text-success" :
            uploadStatus === 'error' ? "text-error" :
            "text-foreground"
          )}>
            {statusText.title}
          </h3>
          <p className={cn(
            "text-sm transition-colors",
            uploadStatus === 'success' ? "text-success/80" :
            uploadStatus === 'error' ? "text-error/80" :
            "text-muted-foreground"
          )}>
            {statusText.subtitle}
          </p>
        </motion.div>

        {/* Progress indicator for drag state */}
        <AnimatePresence>
          {(isDragging || isDragActive) && uploadStatus === 'idle' && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "80%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* File format indicators with premium styling */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <FilePdf className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">PDF</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-neutral-400" />
          <span className="text-xs text-muted-foreground">до 50MB</span>
        </div>
      </div>

      {/* Premium shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
      </div>
    </motion.div>
  )
}
