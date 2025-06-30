# Технические спецификации Mistral OCR PDF Parser

Этот документ содержит детальные технические спецификации для разработчиков.

## 📋 Содержание

- [API Спецификации](#api-спецификации)
- [Интерфейсы TypeScript](#интерфейсы-typescript)
- [Компоненты React](#компоненты-react)
- [Хуки и утилиты](#хуки-и-утилиты)
- [Конфигурации](#конфигурации)
- [Обработка ошибок](#обработка-ошибок)
- [Тестирование](#тестирование)

## 🔌 API Спецификации

### POST /api/parse-pdf

**Описание**: Обрабатывает PDF файл через Mistral OCR API и возвращает структурированные данные.

**Заголовки запроса**:
```http
Content-Type: multipart/form-data
```

**Параметры запроса**:
```typescript
interface ParsePDFRequest {
  pdf: File          // PDF файл (обязательно)
  isSample: string   // "true" для демо файла (опционально)
}
```

**Ответ**:
```typescript
interface ParsePDFResponse {
  text: string                    // Объединенный текст всех страниц
  rawText: string                 // Исходный текст без обработки ссылок
  sessionId?: string              // Уникальный ID сессии
  pages: PageData[]               // Массив данных по страницам
  images: ImageData[]             // Все извлеченные изображения
  storedAssets?: StoredAsset[]    // Сохраненные ресурсы
  usage?: UsageInfo               // Статистика использования
  model?: string                  // Модель OCR (по умолчанию: "mistral-ocr-latest")
}
```

**Коды ответов**:
- `200 OK` - Успешная обработка
- `400 Bad Request` - Отсутствует файл или неверный формат
- `500 Internal Server Error` - Ошибка обработки

**Пример использования**:
```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('isSample', 'false');

const response = await fetch('/api/parse-pdf', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

### POST /api/chat

**Описание**: Обеспечивает чат-интерфейс с документом используя AI модели.

**Заголовки запроса**:
```http
Content-Type: application/json
```

**Параметры запроса**:
```typescript
interface ChatRequest {
  messages: ChatMessage[]         // История сообщений
  documentContent?: string        // Контекст документа
}

interface ChatMessage {
  role: 'user' | 'assistant'     // Роль отправителя
  content: string                // Содержимое сообщения
}
```

**Ответ**: Server-Sent Events (SSE) stream

**Пример использования**:
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Что содержит этот документ?' }
    ],
    documentContent: extractedText
  }),
});

// Обработка streaming ответа
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Обработка chunk данных
}
```

## 🏷️ Интерфейсы TypeScript

### Основные типы данных

```typescript
// Данные страницы PDF
interface PageData {
  index: number                   // Номер страницы (начиная с 0)
  markdown: string                // Обработанный Markdown с корректными ссылками
  rawMarkdown: string             // Исходный Markdown от OCR
  images: ImageData[]             // Изображения на странице
  dimensions: PageDimensions      // Размеры страницы
}

// Размеры страницы
interface PageDimensions {
  dpi: number                     // Разрешение в точках на дюйм
  height: number                  // Высота в пикселях
  width: number                   // Ширина в пикселях
}

// Данные изображения
interface ImageData {
  id: string                      // Уникальный идентификатор
  url: string                     // Публичный URL изображения
  coordinates: RelativeCoordinates // Относительные координаты (0-1)
  originalCoordinates: AbsoluteCoordinates // Абсолютные координаты
}

// Относительные координаты (нормализованные 0-1)
interface RelativeCoordinates {
  x: number                       // Левый край (0-1)
  y: number                       // Верхний край (0-1)
  width: number                   // Ширина (0-1)
  height: number                  // Высота (0-1)
}

// Абсолютные координаты (в пикселях)
interface AbsoluteCoordinates {
  top_left_x: number              // X координата левого верхнего угла
  top_left_y: number              // Y координата левого верхнего угла
  bottom_right_x: number          // X координата правого нижнего угла
  bottom_right_y: number          // Y координата правого нижнего угла
}

// Сохраненный ресурс
interface StoredAsset {
  id: string                      // Сгенерированный ID
  originalId: string              // Исходный ID из OCR
  filePath?: string               // Локальный путь файла (только для FS)
  publicPath: string              // Публичный URL
  mimeType: string                // MIME тип (image/jpeg, image/png)
  width?: number                  // Ширина изображения
  height?: number                 // Высота изображения
}

// Информация об использовании
interface UsageInfo {
  pages_processed: number         // Количество обработанных страниц
  doc_size_bytes: number          // Размер документа в байтах
}
```

### OCR API типы

```typescript
// Ответ от Mistral OCR API
interface OCRResponse {
  pages: OCRPageObject[]          // Массив страниц
  model: string                   // Используемая модель
  usageInfo: OCRUsageInfo         // Информация об использовании
}

// Объект страницы от OCR
interface OCRPageObject {
  index: number                   // Номер страницы
  markdown: string                // Markdown контент
  images: OCRImageObject[]        // Изображения на странице
  dimensions: OCRPageDimensions | null // Размеры страницы
}

// Объект изображения от OCR
interface OCRImageObject {
  id: string                      // ID изображения
  topLeftX: number | null         // X координата левого верхнего угла
  topLeftY: number | null         // Y координата левого верхнего угла
  bottomRightX: number | null     // X координата правого нижнего угла
  bottomRightY: number | null     // Y координата правого нижнего угла
  imageBase64?: string | null     // Base64 строка изображения
}

// Размеры страницы от OCR
interface OCRPageDimensions {
  dpi: number                     // DPI
  height: number                  // Высота
  width: number                   // Ширина
}

// Информация об использовании OCR
interface OCRUsageInfo {
  pagesProcessed: number          // Обработанные страницы
  docSizeBytes?: number | null    // Размер документа
}
```

### Типы для хранения

```typescript
// Карта изображений (ID -> Base64 данные)
type ImageMap = Record<string, string>;

// Сохраненное изображение
interface SavedImageAsset {
  id: string                      // Уникальный ID
  originalId: string              // Исходный ID
  filePath?: string               // Путь к файлу (опционально)
  publicPath: string              // Публичный путь
  mimeType: string                // MIME тип
  width?: number                  // Ширина (опционально)
  height?: number                 // Высота (опционально)
}
```

## ⚛️ Компоненты React

### FileUploader

**Описание**: Компонент для загрузки PDF файлов с drag & drop функциональностью.

```typescript
interface FileUploaderProps {
  onFileSelected: (file: File, isSample?: boolean) => void;
}

// Использование
<FileUploader 
  onFileSelected={(file, isSample) => {
    console.log('Файл выбран:', file.name, 'Демо:', isSample);
  }} 
/>
```

**Особенности**:
- Поддержка drag & drop
- Валидация типа файла (только PDF)
- Визуальная обратная связь
- Ограничение размера файла

### ResultsViewer

**Описание**: Основной компонент для отображения результатов обработки PDF.

```typescript
interface ResultsViewerProps {
  results: ParsePDFResponse;      // Результаты обработки
  originalFile: File | null;      // Исходный файл
}

// Использование
<ResultsViewer 
  results={processingResults}
  originalFile={uploadedFile}
/>
```

**Функции**:
- Табы для разных видов (Reconstructed, Assets)
- Масштабирование контента
- Навигация по страницам
- Интеграция с чатом
- Копирование и скачивание результатов

### ChatInterface

**Описание**: Интерфейс чата с документом.

```typescript
interface ChatInterfaceProps {
  onClose: () => void;            // Функция закрытия
  documentTitle?: string;         // Название документа
  rawText: string;                // Текст документа для контекста
}

// Использование
<ChatInterface
  onClose={() => setIsChatOpen(false)}
  documentTitle="document.pdf"
  rawText={extractedText}
/>
```

**Возможности**:
- Streaming чат интерфейс
- Контекстная интеграция с документом
- Поддержка Markdown в ответах
- История сообщений

### ProcessingIndicator

**Описание**: Индикатор прогресса обработки.

```typescript
interface ProcessingIndicatorProps {
  stage: "uploading" | "processing" | "extracting";
}

// Использование
<ProcessingIndicator stage={currentStage} />
```

**Этапы**:
- `uploading` - Загрузка файла
- `processing` - Обработка OCR
- `extracting` - Извлечение изображений

### ErrorDisplay

**Описание**: Компонент для отображения ошибок.

```typescript
interface ErrorDisplayProps {
  message: string;                // Основное сообщение об ошибке
  details?: string;               // Детали ошибки
  onRetry?: () => void;           // Функция повторной попытки
}

// Использование
<ErrorDisplay
  message="Не удалось обработать PDF"
  details={errorDetails}
  onRetry={handleRetry}
/>
```

## 🎣 Хуки и утилиты

### useWindowSize

**Описание**: Хук для отслеживания размера окна.

```typescript
interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

function useWindowSize(): WindowSize;

// Использование
const { width, height } = useWindowSize();
```

### Утилиты форматирования

```typescript
// Форматирование размера файла
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Извлечение MIME типа из Base64
function getMimeTypeFromBase64(base64Data: string): string {
  const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
  return matches && matches.length > 1 ? matches[1] : "image/png";
}

// Извлечение данных из Base64
function extractBase64Data(base64Data: string): string {
  const matches = base64Data.match(/^data:image\/[a-zA-Z0-9-.+]+;base64,(.+)$/);
  return matches && matches.length > 1 ? matches[1] : base64Data;
}
```

## ⚙️ Конфигурации

### Next.js конфигурация

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@mistralai/mistralai'],
  },
  images: {
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Увеличение лимита размера тела запроса для больших PDF
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default nextConfig;
```

### Tailwind конфигурация

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
```

### TypeScript конфигурация

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🚨 Обработка ошибок

### Типы ошибок

```typescript
// Базовый тип ошибки
interface AppError {
  message: string;                // Пользовательское сообщение
  details?: string;               // Технические детали
  code?: string;                  // Код ошибки
  stack?: string;                 // Stack trace
}

// Ошибки валидации файлов
interface FileValidationError extends AppError {
  code: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE' | 'FILE_CORRUPTED';
  fileName: string;
  fileSize?: number;
  maxSize?: number;
}

// Ошибки API
interface APIError extends AppError {
  code: 'API_UNAVAILABLE' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_API_KEY';
  endpoint: string;
  statusCode: number;
}

// Ошибки обработки
interface ProcessingError extends AppError {
  code: 'OCR_FAILED' | 'IMAGE_EXTRACTION_FAILED' | 'STORAGE_FAILED';
  sessionId?: string;
  stage: 'uploading' | 'processing' | 'extracting';
}
```

### Обработчики ошибок

```typescript
// Обработчик ошибок API
function handleAPIError(error: unknown): APIError {
  if (error instanceof Error) {
    return {
      message: 'Ошибка API',
      details: error.message,
      code: 'API_UNAVAILABLE',
      endpoint: '/api/parse-pdf',
      statusCode: 500,
      stack: error.stack,
    };
  }
  
  return {
    message: 'Неизвестная ошибка API',
    code: 'API_UNAVAILABLE',
    endpoint: '/api/parse-pdf',
    statusCode: 500,
  };
}

// Обработчик ошибок валидации
function validatePDFFile(file: File): FileValidationError | null {
  if (file.type !== 'application/pdf') {
    return {
      message: 'Неподдерживаемый тип файла',
      details: `Ожидался PDF, получен ${file.type}`,
      code: 'INVALID_FILE_TYPE',
      fileName: file.name,
    };
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      message: 'Файл слишком большой',
      details: `Максимальный размер: ${formatBytes(maxSize)}`,
      code: 'FILE_TOO_LARGE',
      fileName: file.name,
      fileSize: file.size,
      maxSize,
    };
  }
  
  return null;
}
```

### Компонент обработки ошибок

```typescript
// Граница ошибок React
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Что-то пошло не так
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Произошла неожиданная ошибка'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🧪 Тестирование

### Типы тестов

```typescript
// Unit тест для утилиты
describe('formatBytes', () => {
  test('форматирует байты корректно', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

// Тест компонента
describe('FileUploader', () => {
  test('вызывает onFileSelected при выборе файла', async () => {
    const mockOnFileSelected = jest.fn();
    render(<FileUploader onFileSelected={mockOnFileSelected} />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('button');
    
    fireEvent.drop(input, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(mockOnFileSelected).toHaveBeenCalledWith(file, false);
  });
});

// Интеграционный тест API
describe('/api/parse-pdf', () => {
  test('обрабатывает PDF файл', async () => {
    const formData = new FormData();
    formData.append('pdf', mockPDFFile);
    formData.append('isSample', 'true');
    
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    
    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('pages');
    expect(result.pages).toBeInstanceOf(Array);
  });
});
```

### Моки для тестирования

```typescript
// Мок Mistral API
jest.mock('@mistralai/mistralai', () => ({
  Mistral: jest.fn().mockImplementation(() => ({
    files: {
      upload: jest.fn().mockResolvedValue({ id: 'mock-file-id' }),
      getSignedUrl: jest.fn().mockResolvedValue({ url: 'mock-signed-url' }),
    },
    ocr: {
      process: jest.fn().mockResolvedValue({
        pages: [
          {
            index: 0,
            markdown: '# Test Document',
            images: [],
            dimensions: { dpi: 72, height: 792, width: 612 },
          },
        ],
        model: 'mistral-ocr-latest',
        usageInfo: { pagesProcessed: 1, docSizeBytes: 1024 },
      }),
    },
  })),
}));

// Мок файловой системы
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue(['test.png']),
  unlinkSync: jest.fn(),
  rmdirSync: jest.fn(),
}));

// Мок Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    })),
  },
}));
```

### Конфигурация Jest

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

## 📝 Соглашения по коду

### Именование

```typescript
// Компоненты - PascalCase
const FileUploader = () => {};
const ResultsViewer = () => {};

// Хуки - camelCase с префиксом use
const useWindowSize = () => {};
const useTheme = () => {};

// Утилиты - camelCase
const formatBytes = () => {};
const extractBase64Data = () => {};

// Константы - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = ['application/pdf'];

// Интерфейсы - PascalCase с суффиксом
interface FileUploaderProps {}
interface ParsePDFResponse {}
```

### Структура файлов

```typescript
// Импорты в порядке:
// 1. React и Next.js
import React, { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';

// 2. Внешние библиотеки
import { Mistral } from '@mistralai/mistralai';
import { v4 as uuidv4 } from 'uuid';

// 3. Внутренние компоненты и утилиты
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';

// 4. Типы
import type { ParsePDFResponse, ImageData } from '@/types';
```

### Комментарии

```typescript
/**
 * Обрабатывает PDF файл через Mistral OCR API
 * @param file - PDF файл для обработки
 * @param isSample - Флаг демо файла
 * @returns Структурированные данные документа
 */
async function processPDF(file: File, isSample: boolean): Promise<ParsePDFResponse> {
  // Валидация входных параметров
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Invalid PDF file');
  }

  // TODO: Добавить поддержку других форматов документов
  // FIXME: Обработать случай очень больших файлов
  
  return result;
}
```

---

Эта техническая спецификация предоставляет полную информацию для разработчиков, работающих с проектом Mistral OCR PDF Parser.
