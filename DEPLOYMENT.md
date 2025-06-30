# Руководство по развертыванию Mistral OCR PDF Parser

Этот документ содержит подробные инструкции по развертыванию и эксплуатации проекта в различных окружениях.

## 📋 Содержание

- [Требования к системе](#требования-к-системе)
- [Локальная разработка](#локальная-разработка)
- [Развертывание на Vercel](#развертывание-на-vercel)
- [Альтернативные платформы](#альтернативные-платформы)
- [Конфигурация окружения](#конфигурация-окружения)
- [Мониторинг и логирование](#мониторинг-и-логирование)
- [Резервное копирование](#резервное-копирование)
- [Устранение неполадок](#устранение-неполадок)

## 💻 Требования к системе

### Минимальные требования

**Для локальной разработки:**
- Node.js 18.17.0 или выше
- pnpm 8.0.0 или выше (рекомендуется)
- Git 2.30.0 или выше
- 4 GB RAM
- 2 GB свободного места на диске

**Для продакшн развертывания:**
- Serverless платформа (Vercel, Netlify, etc.)
- Blob Storage (для изображений)
- CDN (опционально, для ускорения)

### Рекомендуемые требования

**Для разработки:**
- Node.js 20.x LTS
- pnpm 9.x
- 8 GB RAM
- SSD диск
- VS Code с расширениями TypeScript и Tailwind CSS

## 🛠️ Локальная разработка

### Шаг 1: Клонирование репозитория

```bash
# Клонирование проекта
git clone <repository-url>
cd mistral_ocr_webapp

# Проверка структуры проекта
ls -la
```

### Шаг 2: Установка зависимостей

```bash
# Установка pnpm (если не установлен)
npm install -g pnpm

# Установка зависимостей проекта
pnpm install

# Проверка установки
pnpm list --depth=0
```

### Шаг 3: Настройка переменных окружения

```bash
# Создание файла переменных окружения
cp .env.example .env.local

# Редактирование файла (используйте ваш предпочитаемый редактор)
nano .env.local
```

**Содержимое .env.local:**
```bash
# Обязательные переменные
MISTRAL_API_KEY=your_mistral_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here

# Опциональные переменные
OPENAI_API_KEY=your_openai_api_key_here
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Настройки разработки
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Шаг 4: Запуск сервера разработки

```bash
# Запуск в режиме разработки
pnpm dev

# Альтернативные команды
pnpm run dev          # То же самое
npm run dev           # Если используете npm
```

**Проверка запуска:**
- Откройте браузер и перейдите на `http://localhost:3000`
- Проверьте консоль на наличие ошибок
- Загрузите тестовый PDF файл

### Шаг 5: Проверка функциональности

```bash
# Проверка линтера
pnpm lint

# Проверка типов TypeScript
pnpm type-check

# Сборка проекта
pnpm build

# Запуск продакшн версии локально
pnpm start
```

## 🚀 Развертывание на Vercel

### Автоматическое развертывание

#### Шаг 1: Подготовка репозитория

```bash
# Убедитесь, что код зафиксирован
git add .
git commit -m "feat: prepare for deployment"
git push origin main
```

#### Шаг 2: Подключение к Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub/GitLab/Bitbucket
3. Нажмите "New Project"
4. Выберите ваш репозиторий
5. Настройте параметры проекта:

```yaml
Framework Preset: Next.js
Root Directory: ./
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

#### Шаг 3: Настройка переменных окружения

В панели Vercel перейдите в Settings → Environment Variables:

```bash
# Production переменные
MISTRAL_API_KEY=prod_mistral_key
ANTHROPIC_API_KEY=prod_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=prod_google_key
BLOB_READ_WRITE_TOKEN=prod_blob_token
NODE_ENV=production
```

#### Шаг 4: Настройка Blob Storage

```bash
# В панели Vercel перейдите в Storage
# Создайте новое Blob хранилище
# Скопируйте токен доступа
# Добавьте его в переменные окружения как BLOB_READ_WRITE_TOKEN
```

### Ручное развертывание

```bash
# Установка Vercel CLI
npm install -g vercel

# Вход в аккаунт
vercel login

# Развертывание
vercel

# Развертывание в продакшн
vercel --prod
```

### Конфигурация vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "functions": {
    "app/api/parse-pdf/route.ts": {
      "maxDuration": 60
    },
    "app/api/chat/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/assets/ocr-images/(.*)",
      "destination": "/api/assets/$1"
    }
  ]
}
```

## 🌐 Альтернативные платформы

### Netlify

#### Настройка

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--version"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization"
```

#### Развертывание

```bash
# Установка Netlify CLI
npm install -g netlify-cli

# Вход в аккаунт
netlify login

# Инициализация проекта
netlify init

# Развертывание
netlify deploy

# Продакшн развертывание
netlify deploy --prod
```

### Railway

#### Настройка

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml ./

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN pnpm build

# Экспорт порта
EXPOSE 3000

# Запуск приложения
CMD ["pnpm", "start"]
```

#### Развертывание

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Вход в аккаунт
railway login

# Инициализация проекта
railway init

# Развертывание
railway up
```

### DigitalOcean App Platform

#### Конфигурация

```yaml
# .do/app.yaml
name: mistral-ocr-pdf-parser
services:
- name: web
  source_dir: /
  github:
    repo: your-username/mistral-ocr-webapp
    branch: main
  run_command: pnpm start
  build_command: pnpm build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: MISTRAL_API_KEY
    value: ${MISTRAL_API_KEY}
  - key: ANTHROPIC_API_KEY
    value: ${ANTHROPIC_API_KEY}
  - key: GOOGLE_GENERATIVE_AI_API_KEY
    value: ${GOOGLE_GENERATIVE_AI_API_KEY}
```

## ⚙️ Конфигурация окружения

### Переменные окружения по средам

#### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
MISTRAL_API_KEY=dev_mistral_key
ANTHROPIC_API_KEY=dev_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=dev_google_key
```

#### Staging (.env.staging)
```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.yourapp.com
MISTRAL_API_KEY=staging_mistral_key
ANTHROPIC_API_KEY=staging_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=staging_google_key
BLOB_READ_WRITE_TOKEN=staging_blob_token
```

#### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourapp.com
MISTRAL_API_KEY=prod_mistral_key
ANTHROPIC_API_KEY=prod_anthropic_key
GOOGLE_GENERATIVE_AI_API_KEY=prod_google_key
BLOB_READ_WRITE_TOKEN=prod_blob_token
```

### Безопасность переменных

```bash
# Проверка безопасности переменных
echo "Checking environment variables..."

# Проверка наличия обязательных переменных
required_vars=("MISTRAL_API_KEY" "ANTHROPIC_API_KEY" "GOOGLE_GENERATIVE_AI_API_KEY")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required variable: $var"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

echo "All required variables are set!"
```

## 📊 Мониторинг и логирование

### Настройка мониторинга

#### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Sentry для отслеживания ошибок

```bash
# Установка Sentry
pnpm add @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Логирование

```typescript
// lib/logger.ts
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

class Logger {
  private level: string;

  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
  }

  error(message: string, meta?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
  }

  warn(message: string, meta?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  }

  info(message: string, meta?: any) {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  }

  debug(message: string, meta?: any) {
    if (this.level === 'debug') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
}

export const logger = new Logger();
```

### Метрики производительности

```typescript
// lib/metrics.ts
export class PerformanceMetrics {
  static startTimer(name: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(`[METRICS] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const endTimer = this.startTimer(name);
    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }
}

// Использование
const result = await PerformanceMetrics.measureAsync(
  'PDF Processing',
  () => processPDF(file)
);
```

## 💾 Резервное копирование

### Резервное копирование кода

```bash
#!/bin/bash
# backup.sh

# Создание резервной копии репозитория
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Архивирование кода
git archive --format=tar.gz --output="$BACKUP_DIR/source.tar.gz" HEAD

# Экспорт переменных окружения (без значений)
env | grep -E '^(MISTRAL|ANTHROPIC|GOOGLE|BLOB)' | sed 's/=.*/=***/' > "$BACKUP_DIR/env.template"

echo "Backup created in $BACKUP_DIR"
```

### Резервное копирование данных

```typescript
// scripts/backup-assets.ts
import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

async function backupAssets() {
  const assetsDir = path.join(process.cwd(), 'public', 'assets', 'ocr-images');
  const backupDir = path.join(process.cwd(), 'backups', 'assets', new Date().toISOString().split('T')[0]);

  if (!fs.existsSync(assetsDir)) {
    console.log('No assets directory found');
    return;
  }

  // Создание директории для резервной копии
  fs.mkdirSync(backupDir, { recursive: true });

  // Копирование всех файлов
  const sessions = fs.readdirSync(assetsDir);
  
  for (const session of sessions) {
    const sessionPath = path.join(assetsDir, session);
    const backupSessionPath = path.join(backupDir, session);
    
    if (fs.statSync(sessionPath).isDirectory()) {
      fs.mkdirSync(backupSessionPath, { recursive: true });
      
      const files = fs.readdirSync(sessionPath);
      for (const file of files) {
        const sourcePath = path.join(sessionPath, file);
        const destPath = path.join(backupSessionPath, file);
        
        await pipeline(
          createReadStream(sourcePath),
          createWriteStream(destPath)
        );
      }
    }
  }

  console.log(`Assets backed up to ${backupDir}`);
}

// Запуск резервного копирования
backupAssets().catch(console.error);
```

## 🔧 Устранение неполадок

### Частые проблемы и решения

#### 1. Ошибки API ключей

**Проблема**: `API key is invalid`

**Решение**:
```bash
# Проверка переменных окружения
echo $MISTRAL_API_KEY
echo $ANTHROPIC_API_KEY

# Проверка в приложении
curl -X POST http://localhost:3000/api/parse-pdf \
  -F "pdf=@test.pdf" \
  -F "isSample=true"
```

#### 2. Проблемы с памятью

**Проблема**: `JavaScript heap out of memory`

**Решение**:
```bash
# Увеличение лимита памяти для Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Или в package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

#### 3. Ошибки сборки

**Проблема**: `Module not found` или `Type errors`

**Решение**:
```bash
# Очистка кэша
pnpm store prune
rm -rf .next
rm -rf node_modules
pnpm install

# Проверка типов
pnpm type-check

# Проверка линтера
pnpm lint --fix
```

#### 4. Проблемы с изображениями

**Проблема**: Изображения не отображаются

**Решение**:
```bash
# Проверка директории assets
ls -la public/assets/ocr-images/

# Проверка прав доступа
chmod -R 755 public/assets/

# Проверка конфигурации Next.js
# В next.config.mjs должно быть:
images: {
  domains: ['localhost', 'your-domain.com'],
}
```

### Диагностические команды

```bash
# Проверка состояния системы
echo "=== System Information ==="
node --version
pnpm --version
git --version

echo "=== Environment Variables ==="
env | grep -E '^(NODE_ENV|MISTRAL|ANTHROPIC|GOOGLE)'

echo "=== Project Status ==="
pnpm list --depth=0
pnpm audit

echo "=== Build Status ==="
pnpm build --dry-run

echo "=== Network Connectivity ==="
curl -I https://api.mistral.ai
curl -I https://api.anthropic.com
```

### Логи для отладки

```typescript
// lib/debug.ts
export function enableDebugMode() {
  if (process.env.NODE_ENV === 'development') {
    // Включение детального логирования
    process.env.DEBUG = 'mistral:*,anthropic:*';
    
    // Логирование всех HTTP запросов
    const originalFetch = global.fetch;
    global.fetch = async (input, init) => {
      console.log(`[FETCH] ${input}`, init);
      const response = await originalFetch(input, init);
      console.log(`[RESPONSE] ${response.status} ${response.statusText}`);
      return response;
    };
  }
}
```

### Мониторинг производительности

```bash
# Анализ bundle размера
pnpm build
pnpm analyze

# Проверка производительности
lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html

# Профилирование памяти
node --inspect-brk=0.0.0.0:9229 node_modules/.bin/next dev
```

## 📈 Оптимизация производительности

### Оптимизация сборки

```javascript
// next.config.mjs
const nextConfig = {
  // Оптимизация bundle
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Сжатие
  compress: true,
  
  // Оптимизация изображений
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 дней
  },
  
  // Заголовки кэширования
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Мониторинг в реальном времени

```typescript
// lib/monitoring.ts
export class RealTimeMonitoring {
  private static instance: RealTimeMonitoring;
  private metrics: Map<string, number> = new Map();

  static getInstance(): RealTimeMonitoring {
    if (!this.instance) {
      this.instance = new RealTimeMonitoring();
    }
    return this.instance;
  }

  recordMetric(name: string, value: number) {
    this.metrics.set(name, value);
    
    // Отправка метрик в внешний сервис
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, value);
    }
  }

  private async sendToAnalytics(name: string, value: number) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric: name, value, timestamp: Date.now() }),
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
}
```

---

Это руководство обеспечивает полное покрытие процесса развертывания и эксплуатации проекта Mistral OCR PDF Parser в различных окружениях.
