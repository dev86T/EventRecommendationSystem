# 🎯 Event Recommendation System

**Система коллективного принятия решений** — веб-платформа, где группы людей могут создавать голосования, ранжировать варианты и получать результат сразу по четырём методам голосования.

![.NET](https://img.shields.io/badge/.NET-8.0-purple) ![React](https://img.shields.io/badge/React-18-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![Docker](https://img.shields.io/badge/Docker-ready-2496ED)

---

## ✨ Возможности

| Фича | Описание |
|------|----------|
| 🗳️ **4 метода голосования** | Condorcet, Kemeny-Young, Borda, Plurality |
| 🖱️ **Drag-and-drop** | Интуитивное ранжирование вариантов |
| ⏱️ **Таймер дедлайна** | Анимированный обратный отсчёт на карточках |
| 🏁 **Завершение голосования** | Ручное или автоматическое по дедлайну |
| 📄 **Экспорт в PDF** | Скачать итоги решения одной кнопкой |
| 📧 **Email уведомления** | Инвайты и сброс пароля через Gmail |
| 🌙 **Тёмная тема** | Полноценный dark mode |
| 🔐 **JWT аутентификация** | Регистрация, вход, восстановление пароля |

---

## 🚀 Запуск

### Требования

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/)

### Установка и запуск

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd EventRecommendationSystem

# 2. Запустить PostgreSQL
docker-compose up -d

# 3. Запустить Backend
cd backend/EventRecommendationSystem.API
dotnet ef database update
dotnet run
# → http://localhost:5000

# 4. Запустить Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

> **Windows:** можно использовать `start.bat` для одновременного запуска backend и frontend.

---

## 📧 Настройка email

Отредактируй `backend/EventRecommendationSystem.API/appsettings.json`:

```json
{
  "EmailSettings": {
    "SenderEmail": "your-email@gmail.com",
    "SenderPassword": "your-app-password"
  }
}
```

Для Gmail: [создать App Password](https://myaccount.google.com/apppasswords) (требуется включённая 2FA).

---

## 🗄️ Утилиты базы данных

| Файл | Назначение |
|------|-----------|
| `CLEAN_DATABASE.sql` | Полная очистка всех данных (оставляет структуру) |

```bash
# Подключиться к БД
docker exec -it eventrecommendation_db psql -U postgres -d eventrecommendation

# Выполнить скрипт
\i /path/to/CLEAN_DATABASE.sql
```

---

## 🛠️ Стек

**Backend:** .NET 8 · Entity Framework Core · PostgreSQL · JWT · MailKit
**Frontend:** React 18 · React Router · Axios · Recharts · html2pdf.js
**Infra:** Docker · Docker Compose

---

## 📁 Структура

```
EventRecommendationSystem/
├── backend/
│   ├── EventRecommendationSystem.API/        # Web API, контроллеры
│   ├── EventRecommendationSystem.Core/       # Доменные модели, интерфейсы
│   └── EventRecommendationSystem.Infrastructure/  # EF Core, репозитории
├── frontend/
│   └── src/pages/                            # React страницы
├── docker-compose.yml
├── CLEAN_DATABASE.sql
└── fix_decision_statuses.sql
```

---

*Дипломный проект, 2026*
