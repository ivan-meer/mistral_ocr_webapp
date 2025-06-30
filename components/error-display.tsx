"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface ErrorDisplayProps {
  message: string
  details?: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({ message, details, onRetry, className }: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Try to parse JSON details if they exist
  let parsedDetails = details
  try {
    if (details && details.startsWith("{")) {
      const parsed = JSON.parse(details)
      parsedDetails = JSON.stringify(parsed, null, 2)
    }
  } catch (e) {
    // If parsing fails, use the original details
    console.error("Failed to parse error details:", e)
  }

  const handleCopyDetails = async () => {
    if (!parsedDetails) return
    
    try {
      // Проверяем поддержку Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(parsedDetails)
      } else {
        // Fallback для старых браузеров или небезопасных контекстов
        const textArea = document.createElement('textarea')
        textArea.value = parsedDetails
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      setCopied(true)
      toast({
        title: "Скопировано!",
        description: "Детали ошибки скопированы в буфер обмена",
        variant: "success",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать детали ошибки",
        variant: "error",
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Alert variant="destructive" className="border-error/20 bg-error-subtle">
        <AlertCircle className="h-5 w-5 text-error" />
        <AlertTitle className="text-error-foreground font-semibold">
          Произошла ошибка
        </AlertTitle>
        <AlertDescription className="text-error-foreground/90">
          <p className="mb-4">{message}</p>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {onRetry && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="bg-error-foreground/10 border-error-foreground/20 text-error-foreground hover:bg-error-foreground/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Попробовать снова
                </Button>
              </motion.div>
            )}
            
            {parsedDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-error-foreground/70 hover:text-error-foreground hover:bg-error-foreground/10"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Скрыть детали
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Показать детали
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Technical details */}
          <AnimatePresence>
            {showDetails && parsedDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-error-foreground/70">
                      Технические детали:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyDetails}
                      className="h-6 px-2 text-error-foreground/70 hover:text-error-foreground hover:bg-error-foreground/10"
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="relative rounded-lg bg-error-foreground/5 border border-error-foreground/10 p-3">
                    <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40 text-error-foreground/80 font-mono">
                      {parsedDetails}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}
