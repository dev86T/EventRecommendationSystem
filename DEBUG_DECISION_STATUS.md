# 🐛 Отладка проблемы "Решение сразу закрыто"

## Проблема:
После создания решения оно показывается как "Отменено" (красная кнопка) вместо "Активно" (зеленая).

## ✅ Что исправлено:

1. **Добавлено логирование** в методы создания и получения решений
2. **Явно устанавливается статус** `DecisionStatus.Active` при создании
3. **Возвращается статус** в ответе API для проверки

## 🔍 Как отладить:

### Шаг 1: Пересоберите и перезапустите бэкенд

**ВАЖНО!** Остановите старый процесс и запустите заново:

```bash
# Остановите бэкенд (Ctrl+C)

# Очистите старые сборки
cd backend
dotnet clean

# Пересоберите проект
dotnet build

# Запустите заново
cd EventRecommendationSystem.API
dotnet run
```

### Шаг 2: Создайте решение и смотрите логи

При создании решения в консоли бэкенда вы увидите:

```
[CREATE DECISION] Создание решения: Куда пойти?
[CREATE DECISION] Статус решения: Active
[CREATE DECISION] IsCompleted: False
[CREATE DECISION] Решение создано успешно: {guid}
```

### Шаг 3: Откройте решение и проверьте логи

```
[GET DECISION] Запрос решения: {guid}
[GET DECISION] Найдено решение: Куда пойти?
[GET DECISION] Статус: Active       ← ДОЛЖНО БЫТЬ Active!
[GET DECISION] IsCompleted: False
```

### Шаг 4: Проверьте в браузере

Откройте консоль браузера (F12 → Console) и посмотрите ответ API:

```javascript
{
  id: "...",
  title: "Куда пойти?",
  status: "Active",    // ← Должно быть Active, не Cancelled!
  isCompleted: false
}
```

## 🔧 Если проблема осталась:

### Проверка 1: База данных

Возможно, в БД осталась старая схема. Пересоздайте БД:

```bash
cd backend/EventRecommendationSystem.API

# Удалите БД
dotnet ef database drop --force

# Создайте заново
dotnet ef database update
```

### Проверка 2: Enum DecisionStatus

Убедитесь, что в `Decision.cs` enum правильный:

```csharp
public enum DecisionStatus
{
    Active,      // 0
    Completed,   // 1
    Cancelled    // 2
}
```

Если порядок другой - это может вызвать проблему!

### Проверка 3: Проверьте фронтенд

Откройте Network (F12 → Network) → найдите запрос к `/api/decisions/{id}`:

**Response должен содержать:**
```json
{
  "status": "Active"  // НЕ "Cancelled"!
}
```

Если там `"Cancelled"` - проблема на бэкенде.
Если там `"Active"`, но показывает красную кнопку - проблема на фронтенде.

## 🎯 Быстрое решение:

### Вариант 1: Полная перезагрузка

```bash
# 1. Остановите всё (Ctrl+C в обоих терминалах)

# 2. Удалите БД
cd backend/EventRecommendationSystem.API
dotnet ef database drop --force

# 3. Очистите сборки
cd ..
dotnet clean
rm -rf */bin */obj

# 4. Пересоберите
dotnet build

# 5. Запустите БД
cd ../..
docker-compose up -d

# 6. Запустите бэкенд
cd backend/EventRecommendationSystem.API
dotnet run

# 7. Перезагрузите фронтенд (Ctrl+F5 в браузере)
```

### Вариант 2: Проверка через Swagger

1. Откройте http://localhost:5000/swagger
2. Авторизуйтесь (Authorize → введите Bearer token)
3. Создайте решение через POST `/api/decisions`
4. Проверьте через GET `/api/decisions/{id}` - какой статус?

## 📊 Что показывают логи:

### ✅ Правильно (решение активно):
```
[CREATE DECISION] Статус решения: Active
[GET DECISION] Статус: Active
```

### ❌ Неправильно (решение отменено):
```
[CREATE DECISION] Статус решения: Cancelled
[GET DECISION] Статус: Cancelled
```

Если видите второй вариант - значит где-то Status меняется после создания.

## 🔍 Дополнительная отладка:

Добавьте логирование в репозиторий. Откройте:
`backend/EventRecommendationSystem.Infrastructure/Data/Repositories/DecisionRepository.cs`

В методе `CreateAsync` добавьте:

```csharp
public async Task<Decision> CreateAsync(Decision decision)
{
    Console.WriteLine($"[REPO CREATE] Статус ДО добавления: {decision.Status}");
    _context.Decisions.Add(decision);
    await _context.SaveChangesAsync();
    Console.WriteLine($"[REPO CREATE] Статус ПОСЛЕ сохранения: {decision.Status}");
    return decision;
}
```

Это покажет, меняется ли статус при сохранении в БД.

## 💡 Подсказка:

Скорее всего проблема в том, что:
1. Запущена старая версия бэкенда (без изменений)
2. В БД старая схема
3. Нужно просто пересобрать проект

**Решение:** Полная перезагрузка (Вариант 1 выше) ✓

---

Если после всего этого проблема остается - пришли мне:
1. Логи из консоли бэкенда при создании решения
2. Response из Network (F12) для запроса к `/api/decisions/{id}`
3. Скриншот страницы решения

И я найду причину! 🔍
