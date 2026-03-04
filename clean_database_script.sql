-- ПОЛНАЯ ОЧИСТКА БАЗЫ ДАННЫХ
-- Используй это для старта с чистого листа

-- Подключись к БД:
-- psql -U postgres -d eventrecommendation

-- ВНИМАНИЕ! Это удалит ВСЕ данные!

-- 1. Отключаем foreign key проверки временно
SET session_replication_role = 'replica';

-- 2. Удаляем данные из всех таблиц (порядок важен!)
TRUNCATE TABLE "VoteRankings" CASCADE;
TRUNCATE TABLE "Votes" CASCADE;
TRUNCATE TABLE "DecisionResults" CASCADE;
TRUNCATE TABLE "Alternatives" CASCADE;
TRUNCATE TABLE "Decisions" CASCADE;
TRUNCATE TABLE "GroupMembers" CASCADE;
TRUNCATE TABLE "Groups" CASCADE;
TRUNCATE TABLE "Users" CASCADE;

-- 3. Включаем foreign key проверки обратно
SET session_replication_role = 'origin';

-- 4. Сбрасываем sequences (если есть auto-increment)
-- ALTER SEQUENCE "Users_Id_seq" RESTART WITH 1;

-- ГОТОВО! База пустая.

-- Проверка:
SELECT 
  'Users' as table_name, COUNT(*) as count FROM "Users"
UNION ALL
SELECT 'Groups', COUNT(*) FROM "Groups"
UNION ALL
SELECT 'Decisions', COUNT(*) FROM "Decisions"
UNION ALL
SELECT 'Votes', COUNT(*) FROM "Votes";

-- Должны быть все нули!
