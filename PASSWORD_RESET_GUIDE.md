# 🔑 Восстановление пароля - Инструкция

## ✅ Добавлена функция "Забыли пароль?"

### Как использовать:

1. **На странице входа** нажмите "Забыли пароль?"
2. **Введите email** и нажмите "Получить код"
3. **Смотрите в консоль бэкенда** - там появится 6-значный код
4. **Введите код** и новый пароль
5. **Готово!** Можете входить с новым паролем

## 🛠 Вариант 1: Без email (текущая реализация)

**Для разработки** - код выводится в консоль бэкенда:

```
========================================
[FORGOT PASSWORD] КОД ВОССТАНОВЛЕНИЯ для user@test.com:
[FORGOT PASSWORD] КОД: 456789
[FORGOT PASSWORD] Действителен до: 10:45:00
========================================
```

**Преимущества:**
- ✅ Работает сразу, без настройки
- ✅ Не нужен SMTP сервер
- ✅ Удобно для разработки

**Недостатки:**
- ❌ Нужен доступ к консоли бэкенда
- ❌ Не подходит для продакшена

## 📧 Вариант 2: С отправкой email (опционально)

Если нужна отправка email, добавь настройки SMTP:

### Шаг 1: Добавь в appsettings.json

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "your-email@gmail.com",
    "SenderPassword": "your-app-password",
    "SenderName": "Event Recommendation System"
  }
}
```

### Шаг 2: Для Gmail создай App Password

1. Включи 2FA в Google аккаунте
2. Перейди: https://myaccount.google.com/apppasswords
3. Создай App Password для "Mail"
4. Используй этот пароль в `SenderPassword`

### Шаг 3: Установи NuGet пакет

```bash
cd backend/EventRecommendationSystem.API
dotnet add package MailKit
```

### Шаг 4: Создай EmailService

Скажи, если нужно - я создам полный сервис отправки email!

## 🔒 Безопасность

### Текущая реализация:

✅ **Хорошо:**
- Не раскрывает существование email
- 6-значный код (миллион комбинаций)
- Код действует 15 минут
- Хеширование нового пароля

⚠️ **Для продакшена нужно добавить:**
- Сохранение кода в БД
- Проверка срока действия кода
- Ограничение попыток (rate limiting)
- Отправка email вместо консоли

## 🎯 Использование прямо сейчас:

### Восстановление пароля:

1. **Frontend:** http://localhost:3000/forgot-password
2. **Введи email:** test@test.com
3. **Смотри консоль Backend** (терминал где `dotnet run`)
4. **Скопируй код:** например, 456789
5. **Введи код и новый пароль**
6. **Войди с новым паролем**

### API endpoints:

```bash
# Запросить код
POST http://localhost:5000/api/auth/forgot-password
{
  "email": "user@example.com"
}

# Сбросить пароль
POST http://localhost:5000/api/auth/reset-password
{
  "email": "user@example.com",
  "resetCode": "123456",
  "newPassword": "newpassword123"
}
```

## 📝 Для продакшена

Чтобы сделать production-ready версию:

1. **Добавь поля в User entity:**
   ```csharp
   public string? PasswordResetCode { get; set; }
   public DateTime? PasswordResetExpiry { get; set; }
   ```

2. **Сохраняй код в БД** вместо консоли

3. **Проверяй срок действия**

4. **Добавь email сервис**

5. **Удали debug вывод кода** в ответе API

Если нужна помощь с этим - скажи! 🚀
