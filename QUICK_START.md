# 🚀 Быстрый старт Mistral OCR PDF Parser

Это краткое руководство поможет вам быстро запустить проект локально и начать работу.

## ⚡ Быстрая установка (5 минут)

### 1. Клонирование и установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd mistral_ocr_webapp

# Установка зависимостей
npm install -g pnpm
pnpm install
```

### 2. Настройка API ключей

Создайте файл `.env.local` в корне проекта:

```bash
# Обязательные ключи
MISTRAL_API_KEY=your_mistral_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here

# Опциональные
OPENAI_API_KEY=your_openai_api_key_here
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

### 3. Запуск

```bash
# Запуск сервера разработки
pnpm dev

# Откройте http://localhost:3000 в браузере
```

## 🔑 Получение API ключей

### Mistral AI (обязательно)
1. Перейдите на [console.mistral.ai](https://console.mistral.ai)
2. Зарегистрируйтесь или войдите
3. Создайте API ключ в разделе "API Keys"
4. Скопируйте ключ в `.env.local`

### Anthropic Claude (обязательно)
1. Перейдите на [console.anthropic.com](https://console.anthropic.com)
2. Зарегистрируйтесь или войдите
3. Создайте API ключ
4. Скопируйте ключ в `.env.local`

### Google AI (обязательно)
1. Перейдите в [Google AI Studio](https://aistudio.google.com)
2. Создайте новый API ключ
3. Скопируйте ключ в `.env.local`

## 🧪 Тестирование

### Проверка работоспособности

1. **Загрузите PDF файл** через интерфейс
2. **Используйте демо файл** - нажмите "Try Sample PDF"
3. **Проверьте чат** - откройте ChatPDF после обработки

### Команды для проверки

```bash
# Проверка линтера
pnpm lint

# Проверка типов
pnpm type-check

# Сборка проекта
pnpm build

# Запуск продакшн версии
pnpm start
```

## 📁 Структура проекта

```
mistral_ocr_webapp/
├── app/                    # Next.js App Router
│   ├── api/               # API маршруты
│   │   ├── chat/          # Чат с документом
│   │   └── parse-pdf/     # Обработка PDF
│   ├── layout.tsx         # Корневой макет
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
├── lib/                   # Утилиты и хелперы
├── public/               # Статические файлы
└── .env.local            # Переменные окружения
```

## 🔧 Основные функции

### 1. Обработка PDF
- Загрузка PDF файлов (drag & drop)
- OCR через Mistral AI
- Извлечение текста и изображений
- Сохранение макета документа

### 2. ChatPDF
- Интерактивный чат с документом
- Контекстные ответы на основе содержимого
- Поддержка Google Gemini и Anthropic Claude

### 3. Управление ресурсами
- Просмотр извлеченных изображений
- Масштабирование и скачивание
- Организация по сессиям

## 🚨 Частые проблемы

### Ошибка "API key is invalid"
```bash
# Проверьте переменные окружения
echo $MISTRAL_API_KEY
echo $ANTHROPIC_API_KEY

# Убедитесь, что файл .env.local существует
ls -la .env.local
```

### Ошибка "Module not found"
```bash
# Переустановите зависимости
rm -rf node_modules
rm -rf .next
pnpm install
```

### Изображения не отображаются
```bash
# Проверьте директорию assets
ls -la public/assets/ocr-images/

# Проверьте права доступа
chmod -R 755 public/assets/
```

## 📚 Дополнительная документация

- **[README.md](./README.md)** - Полная документация проекта
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Архитектурные диаграммы
- **[TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md)** - Технические спецификации
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Руководство по развертыванию

## 🎯 Следующие шаги

1. **Изучите интерфейс** - загрузите несколько PDF файлов
2. **Протестируйте чат** - задайте вопросы о документах
3. **Настройте развертывание** - следуйте [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Кастомизируйте** - изучите компоненты в папке `components/`

## 💡 Полезные команды

```bash
# Разработка
pnpm dev                  # Запуск сервера разработки
pnpm build               # Сборка проекта
pnpm start               # Запуск продакшн версии

# Качество кода
pnpm lint                # Проверка линтера
pnpm lint --fix          # Исправление ошибок линтера
pnpm type-check          # Проверка типов TypeScript

# Управление зависимостями
pnpm add <package>       # Добавление пакета
pnpm remove <package>    # Удаление пакета
pnpm update              # Обновление зависимостей
```

## 🆘 Получение помощи

Если у вас возникли проблемы:

1. **Проверьте логи** в консоли браузера и терминале
2. **Изучите документацию** в файлах README и TECHNICAL_SPECS
3. **Проверьте переменные окружения** - все ли ключи настроены
4. **Попробуйте демо режим** - используйте "Try Sample PDF"

---

**Готово! 🎉** Теперь у вас есть работающий Mistral OCR PDF Parser. Начните с загрузки PDF файла и изучения возможностей системы.
