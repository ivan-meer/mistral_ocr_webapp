"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Download, 
  Copy, 
  Check,
  MessageSquare,
  Layers,
  SplitSquareHorizontal,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ProfessionalToolbarProps {
  // Просмотр
  viewMode: "text" | "images" | "split" | "original"
  onViewModeChange: (mode: "text" | "images" | "split" | "original") => void
  showImages: boolean
  onToggleImages: () => void
  
  // Зум
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  
  // Навигация
  currentPage: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
  
  // Действия
  onCopy: () => void
  onDownload: () => void
  onToggleChat: () => void
  
  // Состояния
  copied: boolean
  isChatOpen: boolean
  
  className?: string
}

const viewModes = [
  { id: "text", label: "Только текст", icon: FileText },
  { id: "images", label: "Только изображения", icon: ImageIcon },
  { id: "split", label: "Разделенный вид", icon: SplitSquareHorizontal },
  { id: "original", label: "Оригинальный", icon: Layers },
] as const

export function ProfessionalToolbar({
  viewMode,
  onViewModeChange,
  showImages,
  onToggleImages,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onCopy,
  onDownload,
  onToggleChat,
  copied,
  isChatOpen,
  className
}: ProfessionalToolbarProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const currentViewMode = viewModes.find(mode => mode.id === viewMode)
  const CurrentViewIcon = currentViewMode?.icon || FileText

  return (
    <div className={cn(
      "flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm",
      className
    )}>
      {/* Левая группа - Просмотр */}
      <div className="flex items-center gap-2">
        {/* Режим просмотра */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 min-w-[120px] justify-start"
              onMouseEnter={() => setHoveredButton("view")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <CurrentViewIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{currentViewMode?.label}</span>
              <span className="sm:hidden">Вид</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {viewModes.map((mode) => {
              const Icon = mode.icon
              return (
                <DropdownMenuItem
                  key={mode.id}
                  onClick={() => onViewModeChange(mode.id as any)}
                  className={cn(
                    "flex items-center gap-2",
                    viewMode === mode.id && "bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {mode.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* Переключатель изображений */}
        <Button
          variant={showImages ? "default" : "outline"}
          size="sm"
          onClick={onToggleImages}
          className="flex items-center gap-2"
          onMouseEnter={() => setHoveredButton("images")}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {showImages ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {showImages ? "Скрыть изображения" : "Показать изображения"}
          </span>
          <span className="sm:hidden">Изображения</span>
        </Button>
      </div>

      {/* Центральная группа - Навигация */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <span className="text-sm font-medium">
              {currentPage + 1}
            </span>
            <span className="text-sm text-muted-foreground">из</span>
            <span className="text-sm font-medium">
              {totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Вперед</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Правая группа - Действия */}
      <div className="flex items-center gap-2">
        {/* Зум контролы */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.5}
            className="h-8 w-8 p-0"
            title="Уменьшить"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="px-2 py-1 text-xs font-medium bg-muted rounded min-w-[50px] text-center">
            {Math.round(zoomLevel * 100)}%
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onZoomIn}
            disabled={zoomLevel >= 2}
            className="h-8 w-8 p-0"
            title="Увеличить"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetZoom}
            disabled={zoomLevel === 1}
            className="h-8 w-8 p-0"
            title="Сбросить зум"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 hidden md:block" />

        {/* Основные действия */}
        <Button
          variant={isChatOpen ? "default" : "outline"}
          size="sm"
          onClick={onToggleChat}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">ChatPDF</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="flex items-center gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">{copied ? "Скопировано" : "Копировать"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Скачать</span>
        </Button>

        {/* Дополнительные действия на мобильных */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onZoomIn} disabled={zoomLevel >= 2}>
              <ZoomIn className="h-4 w-4 mr-2" />
              Увеличить
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onZoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Уменьшить
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onResetZoom} disabled={zoomLevel === 1}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Сбросить зум
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
