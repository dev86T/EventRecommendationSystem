# Система рекомендаций мероприятий

Дипломный проект: Разработка системы поддержки принятия групповых решений на основе анализа пользовательских предпочтений с применением методов Condorcet и Kemeny-Young.

## 🎯 О проекте

Веб-приложение для коллективного принятия решений с использованием различных методов голосования:

- **Метод Кондорсе (Condorcet)** - определяет победителя через попарные сравнения
- **Метод Кемени-Янга (Kemeny-Young)** - находит оптимальное ранжирование
- **Метод Борда (Borda)** - балльная система
- **Простое большинство (Plurality)** - учет только первых мест

## 🛠 Технологический стек

### Backend
- **.NET 8** - веб API
- **ASP.NET Core** - REST API с JWT аутентификацией
- **Entity Framework Core** - ORM для работы с БД
- **PostgreSQL** - реляционная база данных
- **BCrypt** - хеширование паролей

### Frontend
- **React 18** - UI библиотека
- **Vite** - сборщик проекта
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **Drag and Drop** - интерактивное голосование

## 📋 Предварительные требования

Установите следующие программы:

1. **.NET 8 SDK** - https://dotnet.microsoft.com/download/dotnet/8.0
2. **Node.js 18+** - https://nodejs.org/
3. **Docker Desktop** (для PostgreSQL) - https://www.docker.com/products/docker-desktop
   
   ИЛИ
   
   **PostgreSQL 15+** - https://www.postgresql.org/download/

## 🚀 Инструкция по запуску

### Шаг 1: Клонирование и подготовка

```bash
# Перейдите в директорию проекта
cd event-recommendation-system
```

### Шаг 2: Запуск базы данных PostgreSQL

#### Вариант A: С использованием Docker (рекомендуется)

```bash
# Запустите PostgreSQL в Docker
docker-compose up -d

# Проверьте, что контейнер запущен
docker ps
```

#### Вариант B: Локальная установка PostgreSQL

1. Установите PostgreSQL
2. Создайте базу данных:
```sql
CREATE DATABASE eventrecommendation;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE eventrecommendation TO postgres;
```

3. Если используете другие учетные данные, измените строку подключения в файле:
   `backend/EventRecommendationSystem.API/appsettings.json`

### Шаг 3: Запуск Backend

```bash
# Перейдите в директорию backend
cd backend

# Восстановите NuGet пакеты
dotnet restore

# Примените миграции базы данных (автоматически при запуске)
# Или вручную:
cd EventRecommendationSystem.API
dotnet ef database update --project ../EventRecommendationSystem.Infrastructure

# Запустите API
dotnet run --project EventRecommendationSystem.API

# API будет доступен по адресу: http://localhost:5000
# Swagger документация: http://localhost:5000/swagger
```

### Шаг 4: Запуск Frontend

Откройте новый терминал:

```bash
# Перейдите в директорию frontend
cd frontend

# Установите зависимости
npm install

# Запустите development сервер
npm run dev

# Приложение будет доступно по адресу: http://localhost:3000
```

## 🎮 Использование приложения

### 1. Регистрация и вход

1. Откройте http://localhost:3000
2. Нажмите "Зарегистрироваться"
3. Заполните форму регистрации
4. Войдите в систему

### 2. Создание группы

1. На главной странице нажмите "Перейти к группам"
2. Нажмите "+ Создать группу"
3. Укажите название и описание группы
4. Добавьте участников через кнопку "+ Добавить участника"

### 3. Создание решения

1. Откройте группу
2. Нажмите "+ Создать решение"
3. Укажите название и описание решения
4. Добавьте минимум 2 варианта для выбора
5. Сохраните решение

### 4. Голосование

1. Откройте решение
2. На вкладке "Голосование" расположите варианты в порядке предпочтения:
   - Перетаскивайте карточки мышью
   - Используйте стрелки ▲▼ для перемещения
3. Нажмите "Отправить голос"
4. Вы можете изменить свой выбор в любой момент

### 5. Просмотр результатов

1. Перейдите на вкладку "Результаты"
2. Нажмите "Рассчитать результаты"
3. Изучите результаты по разным методам:
   - Метод Кондорсе
   - Метод Кемени-Янга
   - Метод Борда
   - Простое большинство
4. Прочитайте сравнительный анализ методов

## 📊 Архитектура проекта

```
event-recommendation-system/
├── backend/
│   ├── EventRecommendationSystem.Core/          # Доменные сущности и интерфейсы
│   │   ├── Entities/                      # User, Group, Decision, Vote и т.д.
│   │   └── Interfaces/                    # Репозитории и сервисы
│   ├── EventRecommendationSystem.Infrastructure/# Реализация инфраструктуры
│   │   ├── Data/                          # EF Core, репозитории
│   │   └── Services/                      # Алгоритмы голосования
│   └── EventRecommendationSystem.API/           # Web API контроллеры
│       ├── Controllers/                   # Auth, Groups, Decisions, Users
│       └── Program.cs                     # Конфигурация приложения
├── frontend/
│   └── src/
│       ├── components/                    # React компоненты
│       │   ├── Navbar.jsx
│       │   ├── VotingInterface.jsx        # Интерфейс голосования
│       │   └── ResultsDisplay.jsx         # Отображение результатов
│       ├── pages/                         # Страницы приложения
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Groups.jsx
│       │   ├── GroupDetail.jsx
│       │   ├── CreateDecision.jsx
│       │   └── DecisionDetail.jsx
│       ├── context/                       # React Context
│       │   └── AuthContext.jsx
│       └── services/                      # API сервисы
│           └── api.js
└── docker-compose.yml                     # PostgreSQL контейнер
```

## 🧮 Алгоритмы голосования

### Метод Кондорсе (Condorcet)

Альтернатива является **победителем Кондорсе**, если она побеждает каждую другую альтернативу в парном сравнении. Основан на построении матрицы попарных предпочтений.

**Преимущества:**
- Отражает истинные предпочтения большинства
- Интуитивно понятен

**Недостатки:**
- Может не существовать победителя (парадокс Кондорсе)

### Метод Кемени-Янга (Kemeny-Young)

Находит оптимальное ранжирование, максимизирующее согласованность с парными предпочтениями избирателей. Всегда дает однозначный результат.

**Преимущества:**
- Всегда дает решение
- Математически обоснован
- Устойчив к стратегическому голосованию

**Недостатки:**
- Вычислительно сложен (NP-трудная задача)
- Для >5 вариантов используется эвристика

### Метод Борда (Borda Count)

Каждому месту присваивается балл: первое место = n-1, второе = n-2, и т.д. Побеждает альтернатива с максимальной суммой.

**Преимущества:**
- Учитывает интенсивность предпочтений
- Прост в вычислении

**Недостатки:**
- Уязвим к стратегическому голосованию
- Зависит от количества альтернатив

### Простое большинство (Plurality)

Учитывает только первые места в ранжировании.

**Преимущества:**
- Максимально прост

**Недостатки:**
- Игнорирует важную информацию
- Может выбрать альтернативу, нелюбимую большинством

## 🔧 Настройка

### Изменение порта Backend

Измените в `backend/EventRecommendationSystem.API/Properties/launchSettings.json`:

```json
"applicationUrl": "http://localhost:НОВЫЙ_ПОРТ"
```

И обновите `frontend/src/services/api.js`:

```javascript
const API_URL = 'http://localhost:НОВЫЙ_ПОРТ/api';
```

### Изменение секретного ключа JWT

Измените в `backend/EventRecommendationSystem.API/appsettings.json`:

```json
"JwtSettings": {
  "SecretKey": "ВАШ_НОВЫЙ_ДЛИННЫЙ_СЕКРЕТНЫЙ_КЛЮЧ_МИНИМУМ_32_СИМВОЛА",
  ...
}
```

## 🐛 Решение проблем

### Backend не запускается

1. Проверьте, что PostgreSQL запущен: `docker ps` или проверьте службу
2. Проверьте строку подключения в `appsettings.json`
3. Проверьте, что порт 5000 не занят

### Frontend не подключается к Backend

1. Убедитесь, что Backend запущен на http://localhost:5000
2. Проверьте настройки CORS в `Program.cs`
3. Откройте консоль браузера для ошибок (F12)

### Ошибки миграций базы данных

```bash
cd backend/EventRecommendationSystem.API
dotnet ef database drop --force
dotnet ef database update
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Groups
- `GET /api/groups` - Список групп пользователя
- `GET /api/groups/{id}` - Детали группы
- `POST /api/groups` - Создать группу
- `POST /api/groups/{id}/members` - Добавить участника

### Decisions
- `GET /api/decisions/group/{groupId}` - Решения группы
- `GET /api/decisions/{id}` - Детали решения
- `POST /api/decisions` - Создать решение
- `POST /api/decisions/{id}/alternatives` - Добавить вариант
- `POST /api/decisions/{id}/vote` - Проголосовать
- `POST /api/decisions/{id}/calculate?method=all` - Рассчитать результаты

### Users
- `GET /api/users` - Список пользователей
- `GET /api/users/{id}` - Информация о пользователе

## 📚 Полезные ссылки

- [Теория социального выбора](https://ru.wikipedia.org/wiki/Теория_социального_выбора)
- [Метод Кондорсе](https://ru.wikipedia.org/wiki/Метод_Кондорсе)
- [Метод Кемени-Янга](https://en.wikipedia.org/wiki/Kemeny–Young_method)

## 📄 Лицензия

Дипломный проект для образовательных целей.

## 👨‍💻 Автор

Дипломный проект по теме "Разработка системы поддержки принятия групповых решений на основе анализа пользовательских предпочтений"
