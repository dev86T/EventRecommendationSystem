# 📦 Event Recommendation System

## Что изменилось по сравнению с оригиналом:

### ✅ Все упоминания переименованы:

**Старое название:**
- Group Decision System
- GroupDecisionSystem
- group-decision-system
- groupdecision
- Система Групповых Решений

**Новое название:**
- Event Recommendation System
- EventRecommendationSystem
- event-recommendation-system
- eventrecommendation
- Система Рекомендаций Мероприятий

### 📂 Структура проекта:

```
event-recommendation-system/
├── backend/
│   ├── EventRecommendationSystem.sln
│   ├── EventRecommendationSystem.Core/
│   ├── EventRecommendationSystem.Infrastructure/
│   └── EventRecommendationSystem.API/
├── frontend/
└── docker-compose.yml
```

### 🗄️ База данных:

- **Имя БД:** `eventrecommendation` (было: `groupdecision`)
- **Контейнер:** `eventrecommendation_db` (было: `groupdecision_db`)

### 🚀 Запуск точно такой же:

```bash
# 1. База данных
docker-compose up -d

# 2. Backend
cd backend/EventRecommendationSystem.API
dotnet run

# 3. Frontend
cd frontend
npm install
npm run dev
```

### 🎯 Функционал остался тот же:

- Регистрация и аутентификация
- Создание групп
- Создание решений
- Голосование с drag-and-drop
- Методы: Condorcet, Kemeny-Young, Borda, Plurality
- Сравнительный анализ

---

**P.S.** Никаких флешбеков из Decisions! 😉 Теперь это система рекомендаций мероприятий!
