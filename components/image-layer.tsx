"use client"

import { useState } from "react"

interface ImageData {
  id: string
  url: string
  coordinates: { x: number; y: number; width: number; height: number }
}

interface ImageLayerProps {
  images: ImageData[]
  pageWidth: number
  pageHeight: number
}

export function ImageLayer({ images, pageWidth, pageHeight }: ImageLayerProps) {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null)

  return (
    <div
      className="absolute top-0 left-0 w-full h-full"
      style={{ width: pageWidth, height: pageHeight }}
    >
      {images.map(image => (
        <div
          key={image.id}
          className="absolute border-2 border-dashed border-blue-500"
          style={{
            left: `${image.coordinates.x * 100}%`,
            top: `${image.coordinates.y * 100}%`,
            width: `${image.coordinates.width * 100}%`,
            height: `${image.coordinates.height * 100}%`,
            zIndex: hoveredImage === image.id ? 10 : 1,
          }}
          onMouseEnter={() => setHoveredImage(image.id)}
          onMouseLeave={() => setHoveredImage(null)}
        >
          {hoveredImage === image.id && (
            <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2">
              {`Original position: (${Math.round(
                image.coordinates.x * pageWidth
              )}, ${Math.round(image.coordinates.y * pageHeight)})`}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
