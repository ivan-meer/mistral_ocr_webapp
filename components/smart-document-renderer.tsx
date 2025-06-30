"use client"

import { useMemo } from "react"
import { Markdown } from "@/components/markdown"
import { ImageInserter } from "@/lib/image-inserter"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"

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
  
  // Мемоизируем обработанный markdown для производительности
  const processedMarkdown = useMemo(() => {
    if (!images || images.length === 0) {
      return markdown
    }
    
    return ImageInserter.insertImages(markdown, images, pageHeight, imageSize)
  }, [markdown, images, pageHeight, imageSize])

  return (
    <div className={`smart-document-renderer ${className}`}>
      {/* Стили для встроенных изображений */}
      <style jsx>{`
        .smart-document-renderer :global(.image-container) {
          margin: 1.5rem auto;
          text-align: center;
        }
        
        .smart-document-renderer :global(.image-container.max-w-xs) {
          max-width: 20rem;
        }
        
        .smart-document-renderer :global(.image-container.max-w-md) {
          max-width: 28rem;
        }
        
        .smart-document-renderer :global(.image-container.max-w-lg) {
          max-width: 32rem;
        }
        
        .smart-document-renderer :global(.image-container img) {
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .smart-document-renderer :global(.image-container img:hover) {
          transform: scale(1.02);
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
        }
        
        .smart-document-renderer :global(.image-container .text-xs) {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
          opacity: ${showImageInfo ? '1' : '0'};
          transition: opacity 0.2s ease;
        }
        
        /* Темная тема */
        .dark .smart-document-renderer :global(.image-container img) {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .dark .smart-document-renderer :global(.image-container .text-xs) {
          color: #9ca3af;
        }
      `}</style>
      
      <div 
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: processedMarkdown }}
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
