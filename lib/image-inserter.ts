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

interface InsertionPoint {
  lineIndex: number
  yPosition: number
  image: ImageData
}

export class ImageInserter {
  /**
   * Вставляет изображения в markdown в соответствии с их позицией на странице
   */
  static insertImages(
    markdown: string, 
    images: ImageData[], 
    pageHeight: number,
    imageSize: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    if (!images || images.length === 0) {
      return markdown
    }

    const lines = markdown.split('\n')
    const insertionPoints = this.calculateInsertionPoints(lines, images, pageHeight)
    
    // Сортируем точки вставки по убыванию индекса строки, чтобы вставлять снизу вверх
    insertionPoints.sort((a, b) => b.lineIndex - a.lineIndex)
    
    let result = [...lines]
    
    for (const point of insertionPoints) {
      const imageMarkdown = this.createImageMarkdown(point.image, imageSize)
      result.splice(point.lineIndex + 1, 0, '', imageMarkdown, '')
    }
    
    return result.join('\n')
  }

  /**
   * Вычисляет оптимальные точки для вставки изображений
   */
  private static calculateInsertionPoints(
    lines: string[],
    images: ImageData[],
    pageHeight: number // Unused
  ): InsertionPoint[] {
    // Sort images by their original y-coordinate to try and keep them in a sensible order.
    const sortedImages = [...images].sort(
      (a, b) => a.coordinates.y - b.coordinates.y
    )

    const insertionPoints: InsertionPoint[] = []
    const potentialInsertionLines: number[] = []

    // Find potential insertion points (after paragraphs, i.e., after a non-empty line followed by an empty one)
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].trim() !== "" && lines[i + 1].trim() === "") {
        potentialInsertionLines.push(i)
      }
    }
    // Also consider the end of the document as an insertion point
    if (lines.length > 0 && lines[lines.length - 1].trim() !== "") {
      potentialInsertionLines.push(lines.length - 1)
    }

    const numImages = sortedImages.length
    const numSpots = potentialInsertionLines.length

    if (numSpots === 0) {
      // No good spots, just append to the end.
      sortedImages.forEach(image => {
        insertionPoints.push({
          lineIndex: lines.length > 0 ? lines.length - 1 : 0,
          yPosition: image.coordinates.y,
          image,
        })
      })
      // Remove duplicates
      return insertionPoints.filter(
        (point, index, self) =>
          index === self.findIndex(p => p.lineIndex === point.lineIndex)
      )
    }

    // Distribute images among the available spots.
    for (let i = 0; i < numImages; i++) {
      const spotIndex = Math.floor(i * (numSpots / numImages))
      const lineIndex = potentialInsertionLines[spotIndex]
      insertionPoints.push({
        lineIndex: lineIndex,
        yPosition: sortedImages[i].coordinates.y,
        image: sortedImages[i],
      })
    }

    // Remove duplicate line indices to avoid inserting multiple images at the exact same line.
    // This can happen if there are more images than spots.
    const uniqueInsertionPoints = insertionPoints.filter(
      (point, index, self) =>
        index === self.findIndex(p => p.lineIndex === point.lineIndex)
    )

    return uniqueInsertionPoints
  }

  /**
   * Находит лучшую строку для вставки изображения
   */
  private static findBestInsertionLine(lines: string[], targetIndex: number): number {
    const maxIndex = lines.length - 1
    const clampedTarget = Math.max(0, Math.min(targetIndex, maxIndex))
    
    // Ищем ближайшую пустую строку или конец абзаца
    for (let offset = 0; offset <= 3; offset++) {
      // Проверяем строки выше целевой
      const upperIndex = clampedTarget - offset
      if (upperIndex >= 0 && this.isGoodInsertionPoint(lines, upperIndex)) {
        return upperIndex
      }
      
      // Проверяем строки ниже целевой
      const lowerIndex = clampedTarget + offset
      if (lowerIndex <= maxIndex && this.isGoodInsertionPoint(lines, lowerIndex)) {
        return lowerIndex
      }
    }
    
    // Если не нашли хорошую позицию, используем целевую
    return clampedTarget
  }

  /**
   * Проверяет, является ли строка хорошей точкой для вставки
   */
  private static isGoodInsertionPoint(lines: string[], index: number): boolean {
    const line = lines[index]?.trim() || ''
    const nextLine = lines[index + 1]?.trim() || ''
    
    // Хорошие точки для вставки:
    // 1. Пустые строки
    // 2. Конец абзаца (текущая строка не пустая, следующая пустая)
    // 3. После заголовков
    // 4. После списков
    
    if (line === '') return true
    if (line !== '' && nextLine === '') return true
    if (line.startsWith('#')) return true
    if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/)) return true
    
    return false
  }

  /**
   * Создает markdown для изображения
   */
  private static createImageMarkdown(image: ImageData, size: 'small' | 'medium' | 'large'): string {
    const sizeClasses = {
      small: 'max-w-xs',
      medium: 'max-w-md', 
      large: 'max-w-lg'
    }
    
    const sizeClass = sizeClasses[size]
    const altText = `Image ${image.id}`
    
    // Создаем HTML с классами для стилизации
    return `<div class="image-container ${sizeClass} mx-auto my-4">
  <img src="${image.url}" alt="${altText}" class="w-full h-auto rounded-lg shadow-sm border" />
  <div class="text-xs text-gray-500 mt-1 text-center">
    Position: ${Math.round(image.coordinates.x * 100)}%, ${Math.round(image.coordinates.y * 100)}% • 
    Size: ${Math.round(image.coordinates.width * 100)}% × ${Math.round(image.coordinates.height * 100)}%
  </div>
</div>`
  }

  /**
   * Создает простой markdown для изображения (без HTML)
   */
  static createSimpleImageMarkdown(image: ImageData): string {
    const altText = `Image ${image.id} (${Math.round(image.coordinates.x * 100)}%, ${Math.round(image.coordinates.y * 100)}%)`
    return `![${altText}](${image.url})`
  }

  /**
   * Удаляет все изображения из markdown
   */
  static removeImages(markdown: string): string {
    // Удаляем HTML блоки изображений
    const withoutHtmlImages = markdown.replace(
      /<div class="image-container[^>]*>[\s\S]*?<\/div>/g, 
      ''
    )
    
    // Удаляем markdown изображения
    const withoutMarkdownImages = withoutHtmlImages.replace(
      /!\[.*?\]\(.*?\)/g, 
      ''
    )
    
    // Очищаем лишние пустые строки
    return withoutMarkdownImages.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
  }

  /**
   * Анализирует структуру документа для лучшего размещения изображений
   */
  static analyzeDocumentStructure(markdown: string) {
    const lines = markdown.split('\n')
    const structure = {
      headers: [] as number[],
      paragraphs: [] as number[],
      lists: [] as number[],
      emptyLines: [] as number[]
    }
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed === '') {
        structure.emptyLines.push(index)
      } else if (trimmed.startsWith('#')) {
        structure.headers.push(index)
      } else if (trimmed.match(/^[\s]*[-*+]\s/) || trimmed.match(/^[\s]*\d+\.\s/)) {
        structure.lists.push(index)
      } else if (trimmed.length > 0) {
        structure.paragraphs.push(index)
      }
    })
    
    return structure
  }
}
