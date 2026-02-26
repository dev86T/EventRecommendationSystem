# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ: Статус "Отменено" + Таймер + Удаление решений

## 🐛 Проблемы:
1. ❌ Решения создаются со статусом "Отменено" вместо "Активно"
2. ❌ Таймер не появляется
3. ➕ Добавлено удаление решений

---

## 🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ (3 шага):

### Шаг 1: Исправь БД (SQL)

Проблема в том, что в БД старые данные со статусом 2 (Cancelled). Нужно исправить:

```bash
# Зайди в PostgreSQL
docker exec -it eventrecommendation_db psql -U postgres -d eventrecommendation

# Или через pgAdmin
# Или через DBeaver
```

Затем выполни SQL из файла `fix_decision_statuses.sql`:

```sql
-- Исправляем все активные решения
UPDATE "Decisions"
SET "Status" = 0
WHERE "IsCompleted" = false
  AND ("Deadline" IS NULL OR "Deadline" > NOW());

-- Исправляем завершённые
UPDATE "Decisions"
SET "Status" = 1
WHERE "IsCompleted" = true;
```

### Шаг 2: Замени backend файл

```bash
cp DecisionsController.cs \
   backend/EventRecommendationSystem.API/Controllers/
```

**Ключевые изменения:**
- ✅ Возвращает `Status` как строку (ToString()), а не число
- ✅ Детальное логирование статуса при создании
- ✅ Добавлен endpoint `DELETE /api/decisions/{id}` для удаления
- ✅ Автоматическое завершение при истёкшем дедлайне

### Шаг 3: Замени frontend файлы

```bash
# GroupDetail с кнопкой удаления
cp GroupDetail.jsx frontend/src/pages/

# DecisionDetail с таймером (если ещё не заменён)
cp DecisionDetail.jsx frontend/src/pages/
```

### Шаг 4: Перезапусти

```bash
# Backend
cd backend/EventRecommendationSystem.API
dotnet run

# Frontend - просто обнови страницу (Ctrl+F5)
```

---

## 📊 Что добавлено:

### 1. ✅ Исправлен статус

**До:**
```json
{
  "status": 2  // Cancelled (число)
}
```

**После:**
```json
{
  "status": "Active"  // Строка!
}
```

Теперь фронтенд правильно распознаёт статус!

### 2. ⏱️ Таймер работает

При открытии решения с дедлайном появится:
```
📅 Дедлайн: 26.02.2026, 18:00
⏱️ Осталось: 2ч 15м 43с
```

### 3. 🗑️ Удаление решений

**Только создатель группы** видит кнопку "🗑️ Удалить" на карточке решения.

При удалении:
- Подтверждение через `confirm()`
- Каскадное удаление: решение → альтернативы → голоса → результаты
- Обновление списка решений

---

## 🧪 Тестирование:

### Тест 1: Создание решения

1. Создай новое решение с дедлайном через 5 минут
2. Проверь логи бэкенда:
   ```
   [CREATE DECISION] Статус решения ПЕРЕД сохранением: Active (число: 0)
   [CREATE DECISION] Статус ПОСЛЕ сохранения: Active (число: 0)
   ```
3. Открой решение → должен быть зелёный бейдж "✅ Активно"
4. Должен появиться таймер "⏱️ Осталось: 4м 58с"

### Тест 2: Удаление решения

1. Зайди под создателем группы
2. Открой страницу группы
3. На карточке решения должна быть кнопка "🗑️ Удалить" (справа вверху)
4. Нажми → подтверди → решение удалено
5. Зайди под другим пользователем → кнопки удаления НЕТ

### Тест 3: Автоматическое завершение

1. Создай решение с дедлайном в прошлом (например вчера)
2. Открой страницу решения
3. В логах должно быть:
   ```
   [AUTO COMPLETE] Дедлайн истёк, завершаем решение: {guid}
   ```
4. Статус должен смениться на "🏁 Завершено"

---

## 🔍 Отладка:

### Проблема: Статус всё ещё "Отменено"

**Проверь:**

1. **SQL выполнен?**
   ```sql
   SELECT "Title", "Status" FROM "Decisions";
   ```
   Должно быть 0 или 1, не 2!

2. **Backend перезапущен?**
   - Останови старый процесс (Ctrl+C)
   - Запусти `dotnet run` заново

3. **Логи при создании:**
   ```
   [CREATE DECISION] Статус решения ПЕРЕД сохранением: Active (число: 0)
   ```
   Если видишь `(число: 2)` — что-то не так!

4. **Ответ API:**
   Открой DevTools (F12) → Network → найди `/api/decisions/{id}`
   Должно быть: `"status": "Active"` (строка, не число!)

### Проблема: Таймер не появляется

**Проверь:**

1. **Есть ли дедлайн?**
   - При создании решения указал дату/время?
   - Дедлайн должен быть в будущем!

2. **Консоль браузера (F12):**
   - Есть ли ошибки JavaScript?
   - Проверь `decision.deadline` — не null?

3. **DecisionDetail.jsx заменён?**
   - Должен быть код с `useEffect` для таймера
   - Должна быть переменная `timeLeft`

### Проблема: Кнопка удаления не видна

**Проверь:**

1. **Ты создатель группы?**
   - Только создатель видит кнопку удаления
   - Проверь `group.creatorId === user.id`

2. **GroupDetail.jsx заменён?**
   - Должна быть функция `handleDeleteDecision`
   - Должна быть переменная `isCreator`

3. **Консоль браузера:**
   - Проверь, что `user` не null
   - Проверь `group.creatorId` и `user.id`

---

## 📝 Структура изменений:

### DecisionsController.cs

```csharp
// ✅ Добавлено:
Status = decision.Status.ToString() // Возвращаем строку!

// ✅ Добавлено:
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteDecision(Guid id)

// ✅ Добавлено:
private async Task CheckAndCompleteExpiredDecisions(Guid decisionId)
```

### GroupDetail.jsx

```jsx
// ✅ Добавлено:
const [deletingDecision, setDeletingDecision] = useState(null);
const isCreator = group.creatorId === user?.id;

// ✅ Добавлено:
const handleDeleteDecision = async (decisionId, decisionTitle, e) => {
  // ... удаление через axios.delete
}

// ✅ Добавлено в JSX:
{isCreator && (
  <button onClick={(e) => handleDeleteDecision(...)}>
    🗑️ Удалить
  </button>
)}
```

### DecisionDetail.jsx

```jsx
// ✅ Добавлено:
const [timeLeft, setTimeLeft] = useState(null);
const [isCreator, setIsCreator] = useState(false);

// ✅ Добавлено:
useEffect(() => {
  // Проверка создателя
}, [decision?.groupId, user?.id]);

// ✅ Добавлено:
useEffect(() => {
  // Таймер обратного отсчёта
}, [decision?.deadline, decision?.isCompleted]);

// ✅ Добавлено в JSX:
{timeLeft && (
  <div>⏱️ Осталось: {timeLeft}</div>
)}

{isCreator && (
  <button onClick={handleCompleteVoting}>
    🏁 Завершить досрочно
  </button>
)}
```

---

## ⚠️ ВАЖНО:

### Enum DecisionStatus:
```csharp
Active = 0       // ✅ Активно (зелёный)
Completed = 1    // ✅ Завершено (синий)
Cancelled = 2    // ❌ Отменено (красный)
```

В БД хранится как INT:
- 0 = Active
- 1 = Completed  
- 2 = Cancelled

**Проблема была:** фронтенд получал число вместо строки!

**Решение:** `Status = decision.Status.ToString()` в API

---

## 🎯 Итоговый чеклист:

- [ ] Выполнил SQL для исправления статусов в БД
- [ ] Заменил `DecisionsController.cs`
- [ ] Заменил `GroupDetail.jsx`
- [ ] Заменил `DecisionDetail.jsx` (если ещё не сделал)
- [ ] Перезапустил backend (`dotnet run`)
- [ ] Обновил фронтенд (Ctrl+F5)
- [ ] Проверил создание решения → статус "Активно" ✅
- [ ] Проверил таймер → работает ⏱️
- [ ] Проверил удаление → работает 🗑️
- [ ] Проверил права → только создатель видит кнопки 🔐

---

**Всё готово! Теперь всё должно работать идеально!** 🎉

Если проблемы остались — покажи:
1. Логи из консоли бэкенда (при создании решения)
2. Response из DevTools Network для `/api/decisions/{id}`
3. Консоль браузера (F12 → Console)
