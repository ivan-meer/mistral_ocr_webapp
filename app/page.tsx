"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileUploader } from "@/components/file-uploader"
import { ProcessingIndicator } from "@/components/processing-indicator"
import { ProcessingModal } from "@/components/processing-modal"
import { CompactFileStatus } from "@/components/compact-file-status"
import { ResultsViewer } from "@/components/results-viewer"
import { InfoPanel } from "@/components/info-panel"
import { ErrorDisplay } from "@/components/error-display"
import { SamplePdfOption } from "@/components/sample-pdf-option"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { School, Sparkles, FileText, MessageSquare, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

// ResultsViewer props와 일치하는 인터페이스 정의
interface ImageData {
  id: string
  url: string
  coordinates: { x: number; y: number; width: number; height: number }
  originalCoordinates: {
    top_left_x: number
    top_left_y: number
    bottom_right_x: number
    bottom_right_y: number
  }
}

interface PageData {
  index: number
  markdown: string
  rawMarkdown: string
  images: ImageData[]
  dimensions: {
    dpi: number
    height: number
    width: number
  }
}

interface ResultsData {
  text: string
  rawText: string
  pages: PageData[]
  images: ImageData[]
  usage?: {
    pages_processed: number
    doc_size_bytes: number
  }
  model?: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [isSample, setIsSample] = useState(false)
  const [processingStage, setProcessingStage] = useState<"uploading" | "processing" | "extracting" | null>(null)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [error, setError] = useState<{ message: string; details?: string } | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const { toast } = useToast()

  const handleFileSelected = (selectedFile: File, fileIsSample = false) => {
    setFile(selectedFile)
    setIsSample(fileIsSample)
    setResults(null)
    setError(null)
    
    // Toast уведомление о выборе файла
    toast({
      title: "Файл выбран",
      description: `${selectedFile.name} готов к обработке${fileIsSample ? " (демо файл)" : ""}`,
      variant: "success",
    })
  }

  const handleFileChange = (newFile: File | null) => {
    if (newFile) {
      handleFileSelected(newFile, false)
    } else {
      setFile(null)
      setResults(null)
      setError(null)
      setIsSample(false)
    }
  }

  const handleProcessFile = async () => {
    if (!file) return

    setError(null)
    setProcessingStage("uploading")
    setShowProcessingModal(true)

    const formData = new FormData()
    formData.append("pdf", file)
    formData.append("isSample", isSample.toString())

    try {
      // 업로드 단계 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setProcessingStage("processing")

      // 처리 단계 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setProcessingStage("extracting")

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to process PDF")
      }

      setResults(data)
      
      // Toast уведомление об успешной обработке
      toast({
        title: "Обработка завершена!",
        description: `Документ успешно обработан. Извлечено ${data.pages?.length || 0} страниц.`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error processing PDF:", error)

      // 더 자세한 오류 정보 추출
      let errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      let errorDetails = error instanceof Error ? error.stack : undefined

      // 오류가 API에서 발생했고 세부 정보가 있는 경우
      if (error instanceof Error && error.message.includes("Failed to process PDF")) {
        try {
          // 수정: 정규식에서 줄바꿈 문제 해결
          const errorStack = error.stack || ""
          const bodyMatch = errorStack.match(/body: (.+?)(?:\n|$)/)

          if (bodyMatch && bodyMatch[1]) {
            const errorBody = JSON.parse(bodyMatch[1])
            errorMessage = errorBody.message || errorBody.error || errorMessage
            errorDetails = errorBody.details || errorBody.stack || JSON.stringify(errorBody)
          }
        } catch (e) {
          console.error("Failed to parse error details:", e)
        }
      }

      setError({
        message: errorMessage,
        details: errorDetails,
      })
      
      // Toast уведомление об ошибке
      toast({
        title: "Ошибка обработки",
        description: errorMessage,
        variant: "error",
      })
    } finally {
      setProcessingStage(null)
      setShowProcessingModal(false)
    }
  }

  const toggleInfoPanel = () => {
    setShowInfo(!showInfo)
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/5 to-transparent rounded-full animate-pulse-slow" />
      </div>

      <main className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12"
          >
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gradient">
                Mistral OCR
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Превратите PDF в интерактивные документы с ИИ
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleInfoPanel}
                  aria-label="Show information"
                  className={`hover-lift ${showInfo ? "bg-accent text-accent-foreground" : ""}`}
                >
                  <School className="h-5 w-5" />
                </Button>
              </motion.div>
              <ThemeToggle />
            </div>
          </motion.header>

          {/* Features showcase */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border hover-lift">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">OCR обработка</h3>
                <p className="text-sm text-muted-foreground">Точное извлечение текста</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border hover-lift">
              <div className="p-2 rounded-lg bg-accent/10">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">ChatPDF</h3>
                <p className="text-sm text-muted-foreground">Общение с документом</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border hover-lift">
              <div className="p-2 rounded-lg bg-success/10">
                <Zap className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Быстрая обработка</h3>
                <p className="text-sm text-muted-foreground">Результат за секунды</p>
              </div>
            </div>
          </motion.section>

          {/* Info Panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <InfoPanel onClose={toggleInfoPanel} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content */}
          <div className={`transition-all duration-500 ${results ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8'}`}>
            {/* Компактная строка файла когда есть результаты */}
            {results && file && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect rounded-xl p-4"
              >
                <CompactFileStatus
                  file={file}
                  isSample={isSample}
                  onFileChange={handleFileChange}
                  onReprocess={handleProcessFile}
                />
              </motion.div>
            )}

            {/* Sidebar - только когда нет результатов */}
            {!results && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-5 xl:col-span-4 space-y-4 lg:space-y-6"
              >
                {/* Upload section */}
                <div className="glass-effect rounded-2xl p-6 hover-lift">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Документ</h2>
                  </div>
                  
                  {/* Компактный статус файла или загрузчик */}
                  {file ? (
                    <div className="space-y-4">
                      <CompactFileStatus
                        file={file}
                        isSample={isSample}
                        onFileChange={handleFileChange}
                        onReprocess={undefined}
                      />
                      
                      {!processingStage && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            onClick={handleProcessFile} 
                            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Обработать PDF
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileUploader onFileSelected={(file) => handleFileSelected(file, false)} />
                      <SamplePdfOption onSelect={handleFileSelected} />
                    </div>
                  )}
                </div>

                {/* Processing indicator */}
                <AnimatePresence>
                  {processingStage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-effect rounded-2xl p-6"
                    >
                      <ProcessingIndicator stage={processingStage} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-effect rounded-2xl p-6 border-error/20"
                    >
                      <ErrorDisplay message={error.message} details={error.details} onRetry={handleProcessFile} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.aside>
            )}

            {/* Main content area */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={results ? "w-full" : "lg:col-span-7 xl:col-span-8"}
            >
              <div className={`glass-effect rounded-2xl p-6 ${results ? 'min-h-[700px]' : 'min-h-[600px]'}`}>
                <AnimatePresence mode="wait">
                  {results ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <ResultsViewer results={results} originalFile={file} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full text-center py-20"
                    >
                      <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <FileText className="h-12 w-12 text-primary" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-accent" />
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-semibold mb-4">Результаты обработки</h2>
                      <p className="text-muted-foreground max-w-md">
                        Загрузите и обработайте PDF документ, чтобы увидеть извлеченный текст, 
                        изображения и начать интерактивное общение с документом
                      </p>
                      
                      <div className="mt-8 flex flex-wrap gap-2 justify-center">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">OCR</span>
                        <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">ChatPDF</span>
                        <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm">Анализ</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

            {/* Статистика обработки - отдельная секция */}
            <AnimatePresence>
              {results && results.usage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-effect rounded-xl p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-success/10 to-primary/10 border border-success/20">
                      <div className="p-2 rounded-lg bg-success/20">
                        <Sparkles className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Модель</p>
                        <p className="text-sm font-medium">{results.model || "mistral-ocr-latest"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Страниц обработано</p>
                        <p className="text-sm font-medium">{results.usage.pages_processed}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-accent/10 to-success/10 border border-accent/20">
                      <div className="p-2 rounded-lg bg-accent/20">
                        <Zap className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Размер документа</p>
                        <p className="text-sm font-medium">{formatBytes(results.usage.doc_size_bytes)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Processing Modal */}
      <ProcessingModal
        isOpen={showProcessingModal}
        stage={processingStage}
        fileName={file?.name}
        onClose={() => {
          setShowProcessingModal(false)
          setProcessingStage(null)
        }}
        onMinimize={() => setShowProcessingModal(false)}
      />
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
