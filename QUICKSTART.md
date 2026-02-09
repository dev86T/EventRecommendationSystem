# 🚀 Быстрый старт

## Минимальные шаги для запуска

### 1. Установите необходимое ПО:

- ✅ .NET 8 SDK - https://dotnet.microsoft.com/download/dotnet/8.0
- ✅ Node.js 18+ - https://nodejs.org/
- ✅ Docker Desktop - https://www.docker.com/products/docker-desktop

### 2. Автоматический запуск:

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### 3. Ручной запуск:

**Терминал 1 - База данных:**
```bash
docker-compose up -d
```

**Терминал 2 - Backend:**
```bash
cd backend/EventRecommendationSystem.API
dotnet run
```

**Терминал 3 - Frontend:**
```bash
cd frontend
npm install  # только первый раз
npm run dev
```

### 4. Откройте браузер:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

### 5. Создайте аккаунт и начните работу!

---

## Первые шаги в приложении

1. **Зарегистрируйтесь** - email и username могут быть любыми
2. **Создайте группу** - например "Выбор ресторана"
3. **Создайте решение** - добавьте варианты (минимум 2)
4. **Проголосуйте** - расположите варианты перетаскиванием
5. **Посмотрите результаты** - сравните методы Condorcet, Kemeny-Young, Borda

## Тестирование с несколькими пользователями

1. Зарегистрируйте нескольких пользователей (разные email)
2. Добавьте их в группу
3. Войдите под каждым и проголосуйте по-разному
4. Сравните результаты разных методов голосования

## Устранение проблем

**Backend не запускается?**
```bash
# Проверьте PostgreSQL
docker ps

# Переустановите пакеты
cd backend
dotnet restore
```

**Frontend не подключается?**
```bash
# Переустановите зависимости
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**База данных?**
```bash
# Пересоздайте базу
docker-compose down -v
docker-compose up -d
```

---

📖 Подробная документация в [README.md](README.md)
