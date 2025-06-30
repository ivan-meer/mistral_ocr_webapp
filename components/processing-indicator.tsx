"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Upload, Brain, FileText, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ProcessingIndicatorProps {
  stage?: "uploading" | "processing" | "extracting"
}

export function ProcessingIndicator({ stage = "uploading" }: ProcessingIndicatorProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Reset progress when stage changes
    setProgress(0)
    setCurrentStep(0)

    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // Different progress caps based on stage
        const cap = stage === "uploading" ? 90 : stage === "processing" ? 80 : 90

        // Slow down as we approach the cap
        if (prevProgress >= cap) {
          return prevProgress
        }

        // Different increment speeds based on stage
        const increment =
          stage === "uploading" ? Math.random() * 10 : stage === "processing" ? Math.random() * 3 : Math.random() * 5

        return Math.min(prevProgress + increment, cap)
      })
    }, 500)

    // Step animation - более медленная и видимая анимация
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % 3
        return nextStep
      })
    }, 2000) // Увеличили интервал до 2 секунд

    return () => {
      clearInterval(interval)
      clearInterval(stepInterval)
    }
  }, [stage])

  const stageConfig = {
    uploading: {
      icon: Upload,
      title: "Загрузка документа",
      message: "Отправляем PDF в Mistral API...",
      details: "Подготавливаем и загружаем ваш документ",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      steps: [
        "Валидация файла",
        "Создание signed URL",
        "Загрузка в облако"
      ]
    },
    processing: {
      icon: Brain,
      title: "OCR обработка",
      message: "Анализируем документ с помощью ИИ...",
      details: "OCR модель анализирует структуру и содержимое документа",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      steps: [
        "Анализ структуры",
        "Распознавание текста",
        "Обработка макета"
      ]
    },
    extracting: {
      icon: FileText,
      title: "Извлечение данных",
      message: "Извлекаем текст и изображения...",
      details: "Формируем markdown и определяем координаты изображений",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      steps: [
        "Извлечение текста",
        "Поиск изображений",
        "Сохранение ресурсов"
      ]
    }
  }

  const config = stageConfig[stage]
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with animated icon */}
      <div className="flex items-center gap-4">
        <motion.div
          className={`p-3 rounded-xl ${config.bgColor} relative overflow-hidden`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <IconComponent className={`h-6 w-6 ${config.color}`} />
          
          {/* Pulse effect */}
          <motion.div
            className={`absolute inset-0 rounded-xl ${config.bgColor}`}
            animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.message}</p>
        </div>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className={`h-5 w-5 ${config.color}`} />
        </motion.div>
      </div>

      {/* Progress bar with gradient */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Прогресс</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-3" />
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
            style={{ width: "20%" }}
            animate={{ x: ["0%", "400%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      {/* Processing steps */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Этапы обработки
        </h4>
        <div className="space-y-2">
          {config.steps.map((step, index) => (
            <motion.div
              key={step}
              className="flex items-center gap-3 p-2 rounded-lg transition-colors"
              animate={{
                backgroundColor: currentStep === index ? "hsl(var(--muted))" : "transparent"
              }}
            >
              <div className={`w-2 h-2 rounded-full transition-colors ${
                currentStep >= index ? config.color.replace('text-', 'bg-') : 'bg-muted'
              }`} />
              <span className={`text-sm transition-colors ${
                currentStep === index ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {step}
              </span>
              <AnimatePresence>
                {currentStep === index && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="ml-auto"
                  >
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Additional info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-muted/30 border"
      >
        <p className="text-xs text-muted-foreground text-center">
          {config.details}
        </p>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Время обработки зависит от размера и сложности документа
        </p>
      </motion.div>
    </motion.div>
  )
}
