"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Info,
  Image,
  MessageSquare,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Markdown, type ImageRendererProps } from "@/components/markdown"
import { ChatInterface } from "@/components/chat-interface"
import { useWindowSize } from "@/hooks/use-window-size"

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

interface StoredAsset {
  id: string
  originalId: string
  publicPath: string
  mimeType: string
  width?: number
  height?: number
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

interface ResultsViewerProps {
  results: {
    text: string
    rawText: string
    sessionId?: string
    pages: PageData[]
    images: ImageData[]
    storedAssets?: StoredAsset[]
    usage?: {
      pages_processed: number
      doc_size_bytes: number
    }
    model?: string
  }
  originalFile: File | null
}

export function ResultsViewer({ results, originalFile }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState("reconstructed")
  const [copied, setCopied] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [assetZoomLevel, setAssetZoomLevel] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [showImageInfo, setShowImageInfo] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<StoredAsset | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { height } = useWindowSize()
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  // 선택된 에셋이 변경될 때 확대/축소 수준 초기화
  useEffect(() => {
    if (selectedAsset) {
      setAssetZoomLevel(1)
    }
  }, [selectedAsset])

  // 채팅창이 열리면 스크롤 방지 및 위치 저장
  useEffect(() => {
    if (isChatOpen) {
      // 현재 스크롤 위치 저장
      scrollPositionRef.current = window.scrollY

      // 스크롤 방지 코드 제거 - 페이지 스크롤을 허용하도록 함
    } else {
      // 스크롤 복원 코드도 제거 - 페이지 스크롤이 항상 가능하도록 함

      // 저장된 스크롤 위치로 복원 (이 부분은 유지)
      window.scrollTo(0, scrollPositionRef.current)
    }

    return () => {
      // 클린업 함수에서도 스크롤 관련 스타일 제거
      document.body.style.overflow = ""
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
    }
  }, [isChatOpen])

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(results.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${originalFile?.name.replace(".pdf", "") || "parsed"}_results.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Конвертация изображения в base64
  const imageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting image to base64:', error)
      return ''
    }
  }

  // Экспорт markdown с встроенными base64 изображениями для LLM
  const handleExportForLLM = async () => {
    let markdownContent = results.text
    
    // Получаем все изображения из результатов
    const images = results.images || []
    
    // Конвертируем изображения в base64 и заменяем ссылки
    for (const image of images) {
      if (image.url && !image.url.startsWith('data:')) {
        try {
          const base64Data = await imageToBase64(image.url)
          if (base64Data) {
            // Заменяем все вхождения URL изображения на base64
            const urlPattern = new RegExp(image.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
            markdownContent = markdownContent.replace(urlPattern, base64Data)
            
            // Также заменяем по ID изображения, если есть
            const idPattern = new RegExp(`!\\[${image.id}\\]\\([^)]+\\)`, 'g')
            markdownContent = markdownContent.replace(idPattern, `![${image.id}](${base64Data})`)
          }
        } catch (error) {
          console.error(`Error processing image ${image.id}:`, error)
        }
      }
    }

    // Добавляем метаинформацию для LLM
    const llmDocument = `# Документ: ${originalFile?.name || 'Неизвестный файл'}

## Метаинформация
- **Обработано страниц**: ${results.usage?.pages_processed || results.pages.length}
- **Размер документа**: ${results.usage?.doc_size_bytes ? formatBytes(results.usage.doc_size_bytes) : 'Неизвестно'}
- **Модель OCR**: ${results.model || 'mistral-ocr-latest'}
- **Количество изображений**: ${images.length}
- **Дата обработки**: ${new Date().toLocaleString('ru-RU')}

## Содержимое документа

${markdownContent}

---
*Этот документ был обработан с помощью Mistral OCR и подготовлен для анализа ИИ. Все изображения встроены в формате base64.*
`

    // Скачиваем готовый файл
    const blob = new Blob([llmDocument], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${originalFile?.name.replace('.pdf', '') || 'parsed'}_for_llm.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  // Экспорт JSON с base64 изображениями
  const handleExportJSONForLLM = async () => {
    const llmResults = { ...results }
    
    // Конвертируем все изображения в base64
    if (llmResults.images) {
      for (const image of llmResults.images) {
        if (image.url && !image.url.startsWith('data:')) {
          try {
            const base64Data = await imageToBase64(image.url)
            if (base64Data) {
              image.url = base64Data
            }
          } catch (error) {
            console.error(`Error processing image ${image.id}:`, error)
          }
        }
      }
    }

    // Обновляем изображения в страницах
    if (llmResults.pages) {
      for (const page of llmResults.pages) {
        if (page.images) {
          for (const image of page.images) {
            if (image.url && !image.url.startsWith('data:')) {
              try {
                const base64Data = await imageToBase64(image.url)
                if (base64Data) {
                  image.url = base64Data
                }
              } catch (error) {
                console.error(`Error processing image ${image.id}:`, error)
              }
            }
          }
        }
        
        // Также обновляем markdown в страницах
        let updatedMarkdown = page.markdown
        for (const image of page.images) {
          if (image.url && image.url.startsWith('data:')) {
            const urlPattern = new RegExp(`!\\[${image.id}\\]\\([^)]+\\)`, 'g')
            updatedMarkdown = updatedMarkdown.replace(urlPattern, `![${image.id}](${image.url})`)
          }
        }
        page.markdown = updatedMarkdown
      }
    }

    // Обновляем основной текст
    let updatedText = llmResults.text
    for (const image of llmResults.images || []) {
      if (image.url && image.url.startsWith('data:')) {
        const urlPattern = new RegExp(`!\\[${image.id}\\]\\([^)]+\\)`, 'g')
        updatedText = updatedText.replace(urlPattern, `![${image.id}](${image.url})`)
      }
    }
    llmResults.text = updatedText

    // Добавляем метаинформацию
    const llmDocument = {
      metadata: {
        original_filename: originalFile?.name || 'unknown',
        processed_at: new Date().toISOString(),
        pages_processed: results.usage?.pages_processed || results.pages.length,
        doc_size_bytes: results.usage?.doc_size_bytes || 0,
        model: results.model || 'mistral-ocr-latest',
        images_count: (results.images || []).length,
        export_type: 'llm_ready',
        note: 'Все изображения встроены в формате base64 для совместимости с LLM'
      },
      content: llmResults
    }

    const dataStr = JSON.stringify(llmDocument, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${originalFile?.name.replace('.pdf', '') || 'parsed'}_llm_ready.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2))
  }

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5))
  }

  const nextPage = () => {
    if (currentPage < results.pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const currentPageData = results.pages[currentPage]
  let llm_context_md = ""
  if (currentPageData) {
    const { markdown, rawMarkdown, images } = currentPageData
    llm_context_md += markdown
  }

  // Custom renderer for images - скрываем изображения в markdown чтобы избежать дублирования
  const imageRenderer = (props: ImageRendererProps) => {
    const { alt } = props
    // Возвращаем span вместо div чтобы избежать hydration error
    // Изображения будут отображаться только через абсолютное позиционирование
    return (
      <span className="sr-only">{alt || "Image"}</span>
    )
  }

  // 채팅 토글 핸들러
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      <h2 className="text-xl font-semibold mb-4">Results</h2>
      
      {/* Чат как модальное окно на мобильных устройствах */}
      {isChatOpen && (
        <>
          {/* Overlay для мобильных */}
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleChat} />
          
          {/* Чат контейнер */}
          <div className={`
            ${isChatOpen ? 'lg:block' : 'hidden'}
            fixed lg:static
            inset-0 lg:inset-auto
            z-50 lg:z-10
            lg:col-span-3
            bg-card rounded-lg shadow-sm overflow-hidden
            m-4 lg:m-0
          `}
            style={{
              height: height ? `calc(${height}px - 200px)` : "calc(100vh - 200px)",
              position: isChatOpen ? "fixed" : "static",
              top: isChatOpen ? "1rem" : "auto",
              left: isChatOpen ? "1rem" : "auto",
              right: isChatOpen ? "1rem" : "auto",
              bottom: isChatOpen ? "1rem" : "auto",
            }}
          >
            <ChatInterface onClose={toggleChat} documentTitle={originalFile?.name} rawText={llm_context_md} />
          </div>
        </>
      )}

      <div className={`grid grid-cols-1 gap-4 ${isChatOpen ? 'lg:grid-cols-7' : ''}`}>
        {/* Placeholder для чата на десктопе */}
        {isChatOpen && <div className="hidden lg:block lg:col-span-3" />}

        {/* Меин контент */}
        <div className={`${isChatOpen ? "lg:col-span-4" : "col-span-full"}`}>
          <Tabs defaultValue="reconstructed" value={activeTab} onValueChange={setActiveTab}>
            {/* Первая строка - Табы */}
            <div className="flex justify-center mb-4">
              <TabsList>
                <TabsTrigger value="reconstructed">Reconstructed View</TabsTrigger>
                {results.storedAssets && results.storedAssets.length > 0 && (
                  <TabsTrigger value="assets">Asset View</TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Вторая строка - Кнопки действий */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Button
                variant={isChatOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleChat}
                className="flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">ChatPDF</span>
              </Button>
              
              {activeTab === "reconstructed" && (
                <>
                  <Button variant="outline" size="sm" onClick={zoomIn} className="flex items-center gap-1">
                    <ZoomIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Zoom In</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomOut} className="flex items-center gap-1">
                    <ZoomOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Zoom Out</span>
                  </Button>
                </>
              )}
              
              <Button variant="outline" size="sm" onClick={handleCopyMarkdown} className="flex items-center gap-1">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleDownloadResults} className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleExportForLLM} className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export MD for LLM</span>
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleExportJSONForLLM} className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export JSON for LLM</span>
              </Button>
            </div>

            {results.pages.length > 1 && activeTab !== "assets" && (
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Page
                </Button>
                <span className="text-sm">
                  Page {currentPage + 1} of {results.pages.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === results.pages.length - 1}
                  className="flex items-center gap-1"
                >
                  Next Page
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <TabsContent value="reconstructed" className="mt-0">
              {currentPageData && (
                <div className="mb-2 text-xs text-muted-foreground">
                  <span>
                    Page dimensions: {currentPageData.dimensions.width} × {currentPageData.dimensions.height} pixels
                  </span>
                  {currentPageData.dimensions.dpi > 0 && (
                    <span className="ml-2">({currentPageData.dimensions.dpi} DPI)</span>
                  )}
                </div>
              )}

              <div
                className="relative bg-white dark:bg-gray-900 border rounded-md p-4 min-h-[400px] overflow-auto"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top left",
                  height: "600px",
                }}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown imageRenderer={imageRenderer}>{currentPageData?.markdown || ""}</Markdown>
                </div>

                <TooltipProvider>
                  {currentPageData?.images.map((image, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute border border-dashed border-primary/50 cursor-help z-10 pointer-events-none"
                          style={{
                            left: `${image.coordinates.x * 100}%`,
                            top: `${image.coordinates.y * 100}%`,
                            width: `${image.coordinates.width * 100}%`,
                            height: `${image.coordinates.height * 100}%`,
                          }}
                          onMouseEnter={() => setShowImageInfo(image.id)}
                          onMouseLeave={() => setShowImageInfo(null)}
                        >
                          <img
                            src={image.url || "/placeholder.svg?height=200&width=300"}
                            alt={`Extracted image ${index + 1}`}
                            className="w-full h-full object-contain pointer-events-auto"
                          />
                          {showImageInfo === image.id && (
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs p-1 rounded-bl pointer-events-auto">
                              <Info className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p>Image ID: {image.id}</p>
                          <p>
                            Top Left: ({image.originalCoordinates.top_left_x}, {image.originalCoordinates.top_left_y})
                          </p>
                          <p>
                            Bottom Right: ({image.originalCoordinates.bottom_right_x},{" "}
                            {image.originalCoordinates.bottom_right_y})
                          </p>
                          <p>
                            Size: {image.originalCoordinates.bottom_right_x - image.originalCoordinates.top_left_x} ×{" "}
                            {image.originalCoordinates.bottom_right_y - image.originalCoordinates.top_left_y} px
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="mt-0">
              {results.storedAssets && results.storedAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.storedAssets.map((asset, index) => (
                    <div
                      key={index}
                      className={`border rounded-md p-2 cursor-pointer transition-all ${selectedAsset?.id === asset.id ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="aspect-video bg-muted/30 rounded-md flex items-center justify-center overflow-hidden mb-2">
                        <img
                          src={asset.publicPath || "/placeholder.svg"}
                          alt={`Asset ${asset.originalId}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        <p className="font-medium text-foreground">{asset.originalId}</p>
                        <p>{asset.mimeType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Image className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No assets found</h3>
                  <p className="text-sm text-muted-foreground mt-1">No extracted images were found in this document</p>
                </div>
              )}

              {selectedAsset && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Selected Asset</h3>
                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex flex-col items-center mb-4">
                      <div className="overflow-auto border rounded-md p-1 mb-2" style={{ maxHeight: "400px" }}>
                        <div
                          style={{
                            transform: `scale(${assetZoomLevel})`,
                            transformOrigin: "top left",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          <img
                            src={selectedAsset.publicPath || "/placeholder.svg"}
                            alt={`Asset ${selectedAsset.originalId}`}
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssetZoomLevel((prev) => Math.max(prev - 0.2, 0.5))}
                          disabled={assetZoomLevel <= 0.5}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground">{Math.round(assetZoomLevel * 100)}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssetZoomLevel((prev) => Math.min(prev + 0.2, 3))}
                          disabled={assetZoomLevel >= 3}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssetZoomLevel(1)}
                          disabled={assetZoomLevel === 1}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">ID:</p>
                        <p>{selectedAsset.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Original ID:</p>
                        <p>{selectedAsset.originalId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">MIME Type:</p>
                        <p>{selectedAsset.mimeType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Path:</p>
                        <p className="truncate">{selectedAsset.publicPath}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = selectedAsset.publicPath
                          link.download = `${selectedAsset.originalId}.${selectedAsset.mimeType.split("/")[1]}`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Asset
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
