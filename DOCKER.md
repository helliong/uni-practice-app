# Docker

Проект можно запустить через Docker Compose: приложение Next.js и PostgreSQL поднимаются вместе.

## Локальный запуск через Docker

1. Скопировать пример переменных окружения:

   ```bash
   cp docker.env.example .env
   ```

2. Проверить значения в `.env`.

   Для локального запуска можно оставить `NEXTAUTH_URL=http://localhost:3001`.
   Перед деплоем на сервер обязательно заменить `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` и SMTP-настройки.

   Отправка шестизначного кода при регистрации требует рабочего SMTP-аккаунта:

   ```env
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=mailer@example.com
   SMTP_PASSWORD=application_password
   SMTP_FROM=Campus & Code <mailer@example.com>
   ```

   В `SMTP_PASSWORD` нужно указывать пароль приложения почтового сервиса. Для SSL обычно используется порт `465`, для STARTTLS — `587`.

3. Собрать и запустить контейнеры:

   ```bash
   docker compose up -d --build
   ```

4. Открыть приложение:

   ```text
   http://localhost:3001
   ```

Миграции Prisma применяются автоматически при старте контейнера `app` через `prisma migrate deploy`.

## Полезные команды

Посмотреть логи приложения:

```bash
docker compose logs -f app
```

Посмотреть логи базы данных:

```bash
docker compose logs -f postgres
```

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить volumes с данными:

```bash
docker compose down -v
```

## Данные

Данные PostgreSQL сохраняются в volume `postgres_data`.

Загруженные изображения сохраняются в volume `uploads_data` и доступны приложению в `/app/public/uploads`.

## Деплой на сервер

На сервере нужно задать production-значения:

```env
POSTGRES_USER=uni_user
POSTGRES_PASSWORD=strong_password
POSTGRES_DB=uni_practice_app
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=strong_random_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=mailer@example.com
SMTP_PASSWORD=application_password
SMTP_FROM=Campus & Code <mailer@example.com>
S3_ENDPOINT=https://s3.example.com
S3_REGION=region
S3_BUCKET=campuscode-products
S3_ACCESS_KEY_ID=s3-access-key
S3_SECRET_ACCESS_KEY=s3-secret-key
S3_PUBLIC_URL=https://cdn.example.com
S3_FORCE_PATH_STYLE=false
APP_PORT=3000
```

После этого:

```bash
docker compose up -d --build
```
