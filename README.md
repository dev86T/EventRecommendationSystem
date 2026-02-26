# 🎯 Event Recommendation System

**Система Рекомендаций Мероприятий** — платформа для коллективного принятия решений с использованием продвинутых алгоритмов голосования.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![.NET](https://img.shields.io/badge/.NET-8.0-purple) ![React](https://img.shields.io/badge/React-18-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

---

## 🌟 Возможности

- ✅ **4 алгоритма голосования:** Condorcet, Kemeny-Young, Borda, Plurality
- ⏱️ **Таймер обратного отсчёта** до дедлайна
- 🏁 **Автоматическое завершение** голосования
- 🗑️ **Удаление решений** (только создатель)
- 📧 **Email уведомления** через Gmail
- 🔐 **JWT аутентификация**
- 🎨 **Drag-and-drop** ранжирование

---

## 🚀 Быстрый старт

### Требования

- .NET 8 SDK
- Node.js 18+
- Docker

### Установка

```bash
# 1. Распаковать архив
tar -xzf event-recommendation-system.tar.gz
cd event-recommendation-system/

# 2. Запустить PostgreSQL
docker-compose up -d

# 3. Backend
cd backend/EventRecommendationSystem.API
dotnet ef database update
dotnet run
# → http://localhost:5000

# 4. Frontend
cd frontend/
npm install
npm start
# → http://localhost:3000
```

---

## ⚠️ ВАЖНО: Исправление статусов

Если решения показывают статус **"Отменено"** вместо **"Активно"**, выполни:

```bash
docker exec -it eventrecommendation_db psql -U postgres -d eventrecommendation
```

Затем:

```sql
UPDATE "Decisions" SET "Status" = 0 WHERE "IsCompleted" = false;
```

Или используй файл: **`fix_decision_statuses.sql`**

Подробнее: **`URGENT_FIX_GUIDE.md`**

---

## 📧 Настройка Email

Отредактируй `backend/EventRecommendationSystem.API/appsettings.json`:

```json
{
  "EmailSettings": {
    "SenderEmail": "твой-email@gmail.com",
    "SenderPassword": "твой-app-password"
  }
}
```

Подробнее: **`EMAIL_SETUP_GUIDE.md`**

---

## 📚 Документация

- **`URGENT_FIX_GUIDE.md`** — исправление статусов и таймера
- **`EMAIL_SETUP_GUIDE.md`** — настройка email
- **`TROUBLESHOOTING.md`** — решение проблем
- **`Описание_Проекта_Система_Рекомендаций.docx`** — описание для диплома

---

## 🎯 Использование

1. **Регистрация** → http://localhost:3000/register
2. **Создать группу** → Dashboard → "Создать группу"
3. **Добавить участников** → По email
4. **Создать решение** → Указать дедлайн, добавить варианты
5. **Голосовать** → Drag-and-drop ранжирование
6. **Результаты** → Сравнение 4 методов голосования

---

## 🛠️ Технологии

**Backend:** .NET 8, Entity Framework Core, PostgreSQL, JWT, MailKit  
**Frontend:** React 18, React Router, Axios, React Beautiful DND  
**DevOps:** Docker, Docker Compose

---

## 👨‍💻 Автор

Дипломный проект, 2026

---

**Event Recommendation System — делаем групповые решения справедливыми! 🎉**
