"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Upload, 
  Brain, 
  FileText, 
  CheckCircle, 
  Minimize2,
  X,
  Clock,
  Zap
} from "lucide-react"

interface ProcessingModalProps {
  isOpen: boolean
  stage: "uploading" | "processing" | "extracting" | null
  onClose?: () => void
  onMinimize?: () => void
  fileName?: string
}

const stageConfig = {
  uploading: {
    icon: Upload,
    title: "Загрузка документа",
    description: "Отправляем файл в Mistral API...",
    progress: 25,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  processing: {
    icon: Brain,
    title: "ИИ обработка",
    description: "Mistral анализирует содержимое...",
    progress: 65,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  extracting: {
    icon: FileText,
    title: "Извлечение данных",
    description: "Формируем результаты...",
    progress: 90,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  }
}

export function ProcessingModal({ 
  isOpen, 
  stage, 
  onClose, 
  onMinimize,
  fileName 
}: ProcessingModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (!isOpen || !stage) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, stage])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentStage = stage ? stageConfig[stage] : null
  const Icon = currentStage?.icon || Upload

  const handleMinimize = () => {
    setIsMinimized(true)
    onMinimize?.()
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-card border rounded-lg shadow-lg p-3 min-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full ${currentStage?.bgColor} flex items-center justify-center`}>
                <Icon className={`h-3 w-3 ${currentStage?.color}`} />
              </div>
              <span className="text-sm font-medium">{currentStage?.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Progress value={currentStage?.progress || 0} className="h-1" />
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>{currentStage?.progress || 0}%</span>
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Обработка документа
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Файл информация */}
          {fileName && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">PDF документ</p>
              </div>
            </div>
          )}

          {/* Текущий этап */}
          {currentStage && (
            <div className="text-center space-y-4">
              <motion.div
                key={stage}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex justify-center"
              >
                <div className={`w-16 h-16 rounded-full ${currentStage.bgColor} flex items-center justify-center`}>
                  <motion.div
                    animate={{ rotate: stage === "processing" ? 360 : 0 }}
                    transition={{ 
                      duration: 2, 
                      repeat: stage === "processing" ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <Icon className={`h-8 w-8 ${currentStage.color}`} />
                  </motion.div>
                </div>
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{currentStage.title}</h3>
                <p className="text-sm text-muted-foreground">{currentStage.description}</p>
              </div>

              {/* Прогресс бар */}
              <div className="space-y-2">
                <Progress value={currentStage.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{currentStage.progress}% завершено</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(elapsedTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Этапы процесса */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Этапы обработки:</h4>
            <div className="space-y-2">
              {Object.entries(stageConfig).map(([key, config], index) => {
                const isCompleted = stage && Object.keys(stageConfig).indexOf(stage) > index
                const isCurrent = stage === key
                const Icon = config.icon

                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isCurrent ? config.bgColor : isCompleted ? "bg-green-500/10" : "bg-muted/30"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted ? "bg-green-500/20" : isCurrent ? config.bgColor : "bg-muted"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Icon className={`h-4 w-4 ${
                          isCurrent ? config.color : "text-muted-foreground"
                        }`} />
                      )}
                    </div>
                    <span className={`text-sm ${
                      isCurrent ? "font-medium" : isCompleted ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    }`}>
                      {config.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Действия */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMinimize}
              className="flex items-center gap-2"
            >
              <Minimize2 className="h-4 w-4" />
              Свернуть
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground"
            >
              Отменить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
