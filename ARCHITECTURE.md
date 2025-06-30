# Архитектура Mistral OCR PDF Parser

Этот документ содержит детальные диаграммы и схемы архитектуры проекта.

## 📊 Общая архитектура системы

### Высокоуровневая архитектура

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React UI Components]
        STATE[State Management]
        HOOKS[Custom Hooks]
    end
    
    subgraph "Application Layer"
        PAGES[Next.js Pages]
        API[API Routes]
        MIDDLEWARE[Middleware]
    end
    
    subgraph "Service Layer"
        OCR[OCR Service]
        CHAT[Chat Service]
        STORAGE[Storage Service]
    end
    
    subgraph "External APIs"
        MISTRAL[Mistral AI API]
        GOOGLE[Google AI API]
        ANTHROPIC[Anthropic API]
    end
    
    subgraph "Storage Systems"
        FS[File System]
        BLOB[Vercel Blob]
        MEMORY[In-Memory Cache]
    end
    
    UI --> PAGES
    STATE --> UI
    HOOKS --> STATE
    
    PAGES --> API
    API --> OCR
    API --> CHAT
    API --> STORAGE
    
    OCR --> MISTRAL
    CHAT --> GOOGLE
    CHAT --> ANTHROPIC
    
    STORAGE --> FS
    STORAGE --> BLOB
    STORAGE --> MEMORY
    
    style UI fill:#e3f2fd
    style API fill:#f3e5f5
    style OCR fill:#fff3e0
    style MISTRAL fill:#ffecb3
```

## 🔄 Детальные потоки данных

### Поток обработки PDF

```mermaid
sequenceDiagram
    participant User as 👤 Пользователь
    participant UI as 🖥️ UI Component
    participant API as 🔌 API Route
    participant Validator as ✅ Validator
    participant Mistral as 🤖 Mistral API
    participant Storage as 💾 Storage Service
    participant FileSystem as 📁 File System
    
    User->>UI: Загружает PDF файл
    UI->>UI: Показывает индикатор "Uploading"
    UI->>API: POST /api/parse-pdf
    
    API->>Validator: Валидирует файл
    alt Файл невалидный
        Validator-->>API: Ошибка валидации
        API-->>UI: 400 Bad Request
        UI-->>User: Показывает ошибку
    else Файл валидный
        Validator-->>API: Файл OK
        API->>UI: Статус "Processing"
        
        alt Демо файл
            API->>API: Генерирует mock данные
        else Реальный файл
            API->>Mistral: Загружает файл
            Mistral->>Mistral: Создает signed URL
            Mistral->>Mistral: Обрабатывает OCR
            Mistral-->>API: Возвращает результат
        end
        
        API->>UI: Статус "Extracting"
        API->>Storage: Сохраняет изображения
        Storage->>FileSystem: Записывает файлы
        FileSystem-->>Storage: Подтверждение
        Storage-->>API: Пути к файлам
        
        API->>API: Обрабатывает Markdown
        API-->>UI: Финальный результат
        UI-->>User: Показывает результаты
    end
```

### Поток чата с документом

```mermaid
sequenceDiagram
    participant User as 👤 Пользователь
    participant Chat as 💬 Chat Interface
    participant API as 🔌 Chat API
    participant Context as 📄 Context Manager
    participant AI as 🤖 AI Service
    participant Stream as 🌊 Stream Handler
    
    User->>Chat: Открывает чат
    Chat->>Context: Загружает контекст документа
    Context-->>Chat: Контекст готов
    
    User->>Chat: Отправляет сообщение
    Chat->>API: POST /api/chat
    API->>Context: Инжектирует контекст в prompt
    Context-->>API: System prompt готов
    
    API->>AI: Отправляет запрос
    AI->>Stream: Начинает streaming
    
    loop Streaming Response
        Stream->>API: Chunk данных
        API->>Chat: Server-Sent Event
        Chat->>User: Обновляет UI
    end
    
    Stream->>API: Завершение stream
    API-->>Chat: Финальный ответ
    Chat-->>User: Показывает полный ответ
```

## 🏗️ Архитектура компонентов

### Иерархия React компонентов

```mermaid
graph TB
    subgraph "Page Level"
        HOME[Home Page]
    end
    
    subgraph "Layout Components"
        LAYOUT[RootLayout]
        THEME[ThemeProvider]
    end
    
    subgraph "Feature Components"
        UPLOADER[FileUploader]
        PROCESSOR[ProcessingIndicator]
        RESULTS[ResultsViewer]
        CHAT[ChatInterface]
        ERROR[ErrorDisplay]
        INFO[InfoPanel]
    end
    
    subgraph "UI Components"
        BUTTON[Button]
        TABS[Tabs]
        DIALOG[Dialog]
        TOOLTIP[Tooltip]
        PROGRESS[Progress]
    end
    
    subgraph "Custom Hooks"
        WINDOW[useWindowSize]
        THEME_HOOK[useTheme]
    end
    
    LAYOUT --> HOME
    THEME --> LAYOUT
    
    HOME --> UPLOADER
    HOME --> PROCESSOR
    HOME --> RESULTS
    HOME --> ERROR
    HOME --> INFO
    
    RESULTS --> CHAT
    RESULTS --> TABS
    RESULTS --> TOOLTIP
    
    CHAT --> BUTTON
    CHAT --> DIALOG
    
    UPLOADER --> BUTTON
    UPLOADER --> PROGRESS
    
    RESULTS --> WINDOW
    CHAT --> WINDOW
    THEME --> THEME_HOOK
    
    style HOME fill:#e1f5fe
    style RESULTS fill:#f3e5f5
    style CHAT fill:#e8f5e8
```

### Структура данных

```mermaid
erDiagram
    PDF_FILE {
        string name
        number size
        string type
        ArrayBuffer content
    }
    
    SESSION {
        string id
        datetime createdAt
        number imageCount
        string status
    }
    
    PAGE_DATA {
        number index
        string markdown
        string rawMarkdown
        object dimensions
    }
    
    IMAGE_DATA {
        string id
        string url
        object coordinates
        object originalCoordinates
    }
    
    STORED_ASSET {
        string id
        string originalId
        string filePath
        string publicPath
        string mimeType
        number width
        number height
    }
    
    CHAT_MESSAGE {
        string role
        string content
        datetime timestamp
    }
    
    OCR_RESPONSE {
        string text
        string rawText
        string model
        object usage
    }
    
    PDF_FILE ||--o{ PAGE_DATA : contains
    PAGE_DATA ||--o{ IMAGE_DATA : includes
    IMAGE_DATA ||--|| STORED_ASSET : references
    SESSION ||--o{ STORED_ASSET : manages
    OCR_RESPONSE ||--o{ PAGE_DATA : generates
    CHAT_MESSAGE }o--|| OCR_RESPONSE : references
```

## 🔧 Архитектура сервисов

### OCR Service Architecture

```mermaid
graph TB
    subgraph "OCR Processing Pipeline"
        INPUT[PDF Input]
        VALIDATE[File Validation]
        UPLOAD[File Upload]
        PROCESS[OCR Processing]
        EXTRACT[Image Extraction]
        STORE[Asset Storage]
        MARKDOWN[Markdown Generation]
        OUTPUT[Structured Output]
    end
    
    subgraph "Mistral API Integration"
        SDK[Mistral SDK]
        FILES[Files API]
        OCR_API[OCR API]
        SIGNED[Signed URLs]
    end
    
    subgraph "Fallback System"
        MOCK[Mock Data Generator]
        SAMPLE[Sample Assets]
        DEMO[Demo Response]
    end
    
    INPUT --> VALIDATE
    VALIDATE --> UPLOAD
    UPLOAD --> SDK
    SDK --> FILES
    FILES --> SIGNED
    SIGNED --> OCR_API
    OCR_API --> PROCESS
    PROCESS --> EXTRACT
    EXTRACT --> STORE
    STORE --> MARKDOWN
    MARKDOWN --> OUTPUT
    
    PROCESS -.->|API Error| MOCK
    MOCK --> SAMPLE
    SAMPLE --> DEMO
    DEMO --> OUTPUT
    
    style INPUT fill:#e3f2fd
    style PROCESS fill:#fff3e0
    style MOCK fill:#ffebee
```

### Storage Service Architecture

```mermaid
graph TB
    subgraph "Storage Strategy"
        ENV_CHECK{Environment Check}
        LOCAL[Local Development]
        PROD[Production]
    end
    
    subgraph "Local Storage"
        FS[File System]
        PUBLIC[Public Directory]
        SESSION_DIR[Session Directories]
        METADATA[Metadata Files]
    end
    
    subgraph "Production Storage"
        BLOB[Vercel Blob]
        CDN[CDN Distribution]
        SIGNED_URLS[Signed URLs]
    end
    
    subgraph "Common Operations"
        SAVE[Save Image]
        RETRIEVE[Retrieve Image]
        DELETE[Delete Session]
        LIST[List Assets]
    end
    
    ENV_CHECK -->|Local| LOCAL
    ENV_CHECK -->|Vercel| PROD
    
    LOCAL --> FS
    FS --> PUBLIC
    PUBLIC --> SESSION_DIR
    SESSION_DIR --> METADATA
    
    PROD --> BLOB
    BLOB --> CDN
    CDN --> SIGNED_URLS
    
    SAVE --> ENV_CHECK
    RETRIEVE --> ENV_CHECK
    DELETE --> ENV_CHECK
    LIST --> ENV_CHECK
    
    style LOCAL fill:#90EE90
    style PROD fill:#87CEEB
```

## 🌐 API Architecture

### API Routes Structure

```mermaid
graph TB
    subgraph "API Layer"
        ROUTES[API Routes]
        MIDDLEWARE[Middleware]
        HANDLERS[Route Handlers]
    end
    
    subgraph "PDF Processing"
        PDF_ROUTE[/api/parse-pdf]
        PDF_HANDLER[PDF Handler]
        PDF_VALIDATOR[PDF Validator]
        PDF_PROCESSOR[PDF Processor]
    end
    
    subgraph "Chat Processing"
        CHAT_ROUTE[/api/chat]
        CHAT_HANDLER[Chat Handler]
        CONTEXT_MANAGER[Context Manager]
        AI_CONNECTOR[AI Connector]
    end
    
    subgraph "External Integrations"
        MISTRAL_CLIENT[Mistral Client]
        GOOGLE_CLIENT[Google AI Client]
        ANTHROPIC_CLIENT[Anthropic Client]
    end
    
    ROUTES --> PDF_ROUTE
    ROUTES --> CHAT_ROUTE
    
    PDF_ROUTE --> PDF_HANDLER
    PDF_HANDLER --> PDF_VALIDATOR
    PDF_HANDLER --> PDF_PROCESSOR
    PDF_PROCESSOR --> MISTRAL_CLIENT
    
    CHAT_ROUTE --> CHAT_HANDLER
    CHAT_HANDLER --> CONTEXT_MANAGER
    CHAT_HANDLER --> AI_CONNECTOR
    AI_CONNECTOR --> GOOGLE_CLIENT
    AI_CONNECTOR --> ANTHROPIC_CLIENT
    
    style PDF_ROUTE fill:#f3e5f5
    style CHAT_ROUTE fill:#e8f5e8
```

### Request/Response Flow

```mermaid
sequenceDiagram
    participant Client as 🖥️ Client
    participant NextJS as ⚡ Next.js
    participant Handler as 🔧 Route Handler
    participant Service as 🛠️ Service Layer
    participant External as 🌐 External API
    
    Client->>NextJS: HTTP Request
    NextJS->>Handler: Route to handler
    Handler->>Handler: Validate request
    Handler->>Service: Process business logic
    Service->>External: API call
    External-->>Service: API response
    Service-->>Handler: Processed data
    Handler->>Handler: Format response
    Handler-->>NextJS: HTTP Response
    NextJS-->>Client: JSON/Stream response
```

## 🎨 UI/UX Architecture

### Component State Management

```mermaid
graph TB
    subgraph "State Management Strategy"
        LOCAL[Local State]
        PROPS[Props Drilling]
        CONTEXT[React Context]
        CUSTOM[Custom Hooks]
    end
    
    subgraph "State Types"
        UI_STATE[UI State]
        DATA_STATE[Data State]
        ASYNC_STATE[Async State]
        FORM_STATE[Form State]
    end
    
    subgraph "State Patterns"
        LOADING[Loading States]
        ERROR[Error States]
        SUCCESS[Success States]
        IDLE[Idle States]
    end
    
    LOCAL --> UI_STATE
    PROPS --> DATA_STATE
    CONTEXT --> ASYNC_STATE
    CUSTOM --> FORM_STATE
    
    UI_STATE --> LOADING
    DATA_STATE --> SUCCESS
    ASYNC_STATE --> ERROR
    FORM_STATE --> IDLE
    
    style LOCAL fill:#e3f2fd
    style CONTEXT fill:#f3e5f5
    style CUSTOM fill:#e8f5e8
```

### Responsive Design Strategy

```mermaid
graph LR
    subgraph "Breakpoints"
        SM[sm: 640px]
        MD[md: 768px]
        LG[lg: 1024px]
        XL[xl: 1280px]
    end
    
    subgraph "Layout Patterns"
        MOBILE[Mobile First]
        TABLET[Tablet Layout]
        DESKTOP[Desktop Layout]
        WIDE[Wide Screen]
    end
    
    subgraph "Components Adaptation"
        GRID[Grid System]
        FLEX[Flexbox]
        STACK[Stack Layout]
        SIDEBAR[Sidebar Toggle]
    end
    
    SM --> MOBILE
    MD --> TABLET
    LG --> DESKTOP
    XL --> WIDE
    
    MOBILE --> STACK
    TABLET --> FLEX
    DESKTOP --> GRID
    WIDE --> SIDEBAR
    
    style MOBILE fill:#e3f2fd
    style DESKTOP fill:#f3e5f5
```

## 🔒 Security Architecture

### Security Layers

```mermaid
graph TB
    subgraph "Client Security"
        CSP[Content Security Policy]
        CORS[CORS Configuration]
        VALIDATION[Input Validation]
    end
    
    subgraph "API Security"
        AUTH[API Authentication]
        RATE[Rate Limiting]
        SANITIZE[Data Sanitization]
    end
    
    subgraph "Data Security"
        ENCRYPT[Data Encryption]
        ISOLATION[Session Isolation]
        CLEANUP[Automatic Cleanup]
    end
    
    subgraph "Infrastructure Security"
        HTTPS[HTTPS Only]
        ENV[Environment Variables]
        SECRETS[Secret Management]
    end
    
    CSP --> AUTH
    CORS --> RATE
    VALIDATION --> SANITIZE
    
    AUTH --> ENCRYPT
    RATE --> ISOLATION
    SANITIZE --> CLEANUP
    
    ENCRYPT --> HTTPS
    ISOLATION --> ENV
    CLEANUP --> SECRETS
    
    style CSP fill:#ffebee
    style AUTH fill:#e8f5e8
    style ENCRYPT fill:#e3f2fd
    style HTTPS fill:#fff3e0
```

## 📊 Performance Architecture

### Performance Optimization Strategy

```mermaid
graph TB
    subgraph "Frontend Optimization"
        CODE_SPLIT[Code Splitting]
        LAZY_LOAD[Lazy Loading]
        MEMOIZATION[React Memoization]
        BUNDLE[Bundle Optimization]
    end
    
    subgraph "Backend Optimization"
        STREAMING[Response Streaming]
        CACHING[Response Caching]
        COMPRESSION[Data Compression]
        ASYNC[Async Processing]
    end
    
    subgraph "Asset Optimization"
        IMAGE_OPT[Image Optimization]
        CDN[CDN Distribution]
        PRELOAD[Resource Preloading]
        MINIFY[Asset Minification]
    end
    
    subgraph "Monitoring"
        METRICS[Performance Metrics]
        LOGGING[Performance Logging]
        ALERTS[Performance Alerts]
    end
    
    CODE_SPLIT --> STREAMING
    LAZY_LOAD --> CACHING
    MEMOIZATION --> COMPRESSION
    BUNDLE --> ASYNC
    
    STREAMING --> IMAGE_OPT
    CACHING --> CDN
    COMPRESSION --> PRELOAD
    ASYNC --> MINIFY
    
    IMAGE_OPT --> METRICS
    CDN --> LOGGING
    PRELOAD --> ALERTS
    
    style CODE_SPLIT fill:#e3f2fd
    style STREAMING fill:#f3e5f5
    style IMAGE_OPT fill:#e8f5e8
    style METRICS fill:#fff3e0
```

## 🚀 Deployment Architecture

### Deployment Strategy

```mermaid
graph TB
    subgraph "Development"
        DEV_ENV[Local Development]
        DEV_SERVER[Dev Server]
        HOT_RELOAD[Hot Reload]
    end
    
    subgraph "Staging"
        STAGING_ENV[Staging Environment]
        PREVIEW[Preview Deployments]
        TESTING[Integration Testing]
    end
    
    subgraph "Production"
        PROD_ENV[Production Environment]
        CDN_DIST[CDN Distribution]
        MONITORING[Production Monitoring]
    end
    
    subgraph "Infrastructure"
        VERCEL[Vercel Platform]
        BLOB_STORAGE[Blob Storage]
        EDGE_FUNCTIONS[Edge Functions]
    end
    
    DEV_ENV --> STAGING_ENV
    DEV_SERVER --> PREVIEW
    HOT_RELOAD --> TESTING
    
    STAGING_ENV --> PROD_ENV
    PREVIEW --> CDN_DIST
    TESTING --> MONITORING
    
    PROD_ENV --> VERCEL
    CDN_DIST --> BLOB_STORAGE
    MONITORING --> EDGE_FUNCTIONS
    
    style DEV_ENV fill:#e8f5e8
    style STAGING_ENV fill:#fff3e0
    style PROD_ENV fill:#ffebee
    style VERCEL fill:#e3f2fd
```

### CI/CD Pipeline

```mermaid
graph LR
    subgraph "Source Control"
        GIT[Git Repository]
        BRANCH[Feature Branch]
        PR[Pull Request]
    end
    
    subgraph "Build Process"
        INSTALL[Install Dependencies]
        LINT[Code Linting]
        TYPE_CHECK[Type Checking]
        BUILD[Build Application]
    end
    
    subgraph "Testing"
        UNIT[Unit Tests]
        INTEGRATION[Integration Tests]
        E2E[E2E Tests]
    end
    
    subgraph "Deployment"
        PREVIEW[Preview Deploy]
        PRODUCTION[Production Deploy]
        ROLLBACK[Rollback Strategy]
    end
    
    GIT --> INSTALL
    BRANCH --> LINT
    PR --> TYPE_CHECK
    
    INSTALL --> BUILD
    LINT --> UNIT
    TYPE_CHECK --> INTEGRATION
    BUILD --> E2E
    
    UNIT --> PREVIEW
    INTEGRATION --> PRODUCTION
    E2E --> ROLLBACK
    
    style GIT fill:#e8f5e8
    style BUILD fill:#f3e5f5
    style UNIT fill:#fff3e0
    style PREVIEW fill:#e3f2fd
```

## 📈 Scalability Considerations

### Horizontal Scaling Strategy

```mermaid
graph TB
    subgraph "Application Scaling"
        SERVERLESS[Serverless Functions]
        EDGE[Edge Computing]
        LOAD_BALANCE[Load Balancing]
    end
    
    subgraph "Data Scaling"
        BLOB_SCALE[Blob Storage Scaling]
        CDN_SCALE[CDN Scaling]
        CACHE_SCALE[Cache Scaling]
    end
    
    subgraph "API Scaling"
        RATE_LIMIT[Rate Limiting]
        QUEUE[Request Queuing]
        RETRY[Retry Logic]
    end
    
    subgraph "Monitoring Scaling"
        METRICS_SCALE[Metrics Collection]
        LOG_SCALE[Log Aggregation]
        ALERT_SCALE[Alert Management]
    end
    
    SERVERLESS --> BLOB_SCALE
    EDGE --> CDN_SCALE
    LOAD_BALANCE --> CACHE_SCALE
    
    BLOB_SCALE --> RATE_LIMIT
    CDN_SCALE --> QUEUE
    CACHE_SCALE --> RETRY
    
    RATE_LIMIT --> METRICS_SCALE
    QUEUE --> LOG_SCALE
    RETRY --> ALERT_SCALE
    
    style SERVERLESS fill:#e3f2fd
    style BLOB_SCALE fill:#f3e5f5
    style RATE_LIMIT fill:#e8f5e8
    style METRICS_SCALE fill:#fff3e0
```

---

Эта архитектурная документация предоставляет полное понимание структуры и взаимодействий в системе Mistral OCR PDF Parser.
