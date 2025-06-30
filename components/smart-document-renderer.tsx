"use client"

import { useMemo } from "react"
import { ImageInserter } from "@/lib/image-inserter"
import { Markdown } from "@/components/markdown"
import { ImageLayer } from "./image-layer"

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

interface SmartDocumentRendererProps {
  markdown: string
  images: ImageData[]
  pageHeight: number
  pageWidth: number
  imageSize?: 'small' | 'medium' | 'large'
  showImageInfo?: boolean
  className?: string
}

export function SmartDocumentRenderer({
  markdown,
  images,
  pageHeight,
  pageWidth,
  imageSize = 'medium',
  showImageInfo = true,
  className = ""
}: SmartDocumentRendererProps) {
  
  const processedMarkdown = useMemo(() => {
    if (!images || images.length === 0) {
      return markdown
    }
    return ImageInserter.insertImages(markdown, images, pageHeight, imageSize)
  }, [markdown, images, pageHeight, imageSize])

  return (
    <div className={`smart-document-renderer relative ${className}`}>
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        style={{ width: pageWidth, height: pageHeight }}
      >
        <Markdown>{processedMarkdown}</Markdown>
      </div>
      <ImageLayer
        images={images}
        pageWidth={pageWidth}
        pageHeight={pageHeight}
      />
    </div>
  )
}

// Компонент для предварительного просмотра структуры документа
export function DocumentStructurePreview({ 
  markdown, 
  images 
}: { 
  markdown: string
  images: ImageData[] 
}) {
  const structure = ImageInserter.analyzeDocumentStructure(markdown)
  
  return (
    <div className="document-structure-preview p-4 bg-muted/30 rounded-lg">
      <h4 className="text-sm font-medium mb-2">Структура документа</h4>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground">Заголовки: {structure.headers.length}</p>
          <p className="text-muted-foreground">Абзацы: {structure.paragraphs.length}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Списки: {structure.lists.length}</p>
          <p className="text-muted-foreground">Изображения: {images.length}</p>
        </div>
      </div>
    </div>
  )
}

// Компонент для настроек отображения
export function SmartRenderingControls({
  imageSize,
  onImageSizeChange,
  showImageInfo,
  onShowImageInfoChange,
  className = ""
}: {
  imageSize: 'small' | 'medium' | 'large'
  onImageSizeChange: (size: 'small' | 'medium' | 'large') => void
  showImageInfo: boolean
  onShowImageInfoChange: (show: boolean) => void
  className?: string
}) {
  return (
    <div className={`smart-rendering-controls flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Размер изображений:</label>
        <select 
          value={imageSize} 
          onChange={(e) => onImageSizeChange(e.target.value as any)}
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          <option value="small">Маленький</option>
          <option value="medium">Средний</option>
          <option value="large">Большой</option>
        </select>
      </div>
      
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showImageInfo}
            onChange={(e) => onShowImageInfoChange(e.target.checked)}
            className="mr-1"
          />
          Показать информацию
        </label>
      </div>
    </div>
  )
}
