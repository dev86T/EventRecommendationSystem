-- Скрипт для исправления статусов решений в БД
-- Запусти это в psql или через pgAdmin

-- Проверяем текущие статусы
SELECT 
    "Id",
    "Title", 
    "Status",
    "IsCompleted",
    "Deadline",
    "CreatedAt"
FROM "Decisions"
ORDER BY "CreatedAt" DESC;

-- Исправляем все активные незавершённые решения
-- DecisionStatus.Active = 0
UPDATE "Decisions"
SET "Status" = 0
WHERE "IsCompleted" = false
  AND ("Deadline" IS NULL OR "Deadline" > NOW());

-- Исправляем завершённые решения
-- DecisionStatus.Completed = 1
UPDATE "Decisions"
SET "Status" = 1
WHERE "IsCompleted" = true;

-- Автоматически завершаем решения с истёкшим дедлайном
UPDATE "Decisions"
SET 
    "Status" = 1,  -- Completed
    "IsCompleted" = true
WHERE "IsCompleted" = false
  AND "Deadline" IS NOT NULL 
  AND "Deadline" <= NOW();

-- Проверяем результат
SELECT 
    "Id",
    "Title", 
    CASE 
        WHEN "Status" = 0 THEN 'Active'
        WHEN "Status" = 1 THEN 'Completed'
        WHEN "Status" = 2 THEN 'Cancelled'
        ELSE 'Unknown'
    END as "StatusName",
    "IsCompleted",
    "Deadline",
    "CreatedAt"
FROM "Decisions"
ORDER BY "CreatedAt" DESC;

-- Если нужно удалить все тестовые решения
-- РАСКОММЕНТИРУЙ ТОЛЬКО ЕСЛИ УВЕРЕН!
-- DELETE FROM "Decisions";
