# Docker

Проект запускается через Docker Compose без обязательного `.env`. Вместе поднимаются Next.js, PostgreSQL, локальная почта Mailpit и S3-совместимое хранилище MinIO.

## Локальный запуск через Docker

1. Собрать и запустить контейнеры из корня репозитория:

   ```bash
   docker compose up -d --build
   ```

2. Открыть приложение:

   ```text
   http://localhost:3001
   ```

Дополнительная настройка не требуется. Миграции Prisma и идемпотентный seed выполняются контейнером `db-init`; повторный запуск не удаляет созданные пользователем данные.

Тестовые письма с кодами регистрации доступны в Mailpit:

```text
http://localhost:8025
```

Консоль MinIO доступна на `http://localhost:9001`, логин и пароль по умолчанию — `minioadmin`. Оплата работает в демонстрационном режиме: переход на тестовую страницу результата подтверждает платёж без обращения к ЮKassa.

## Полезные команды

Посмотреть логи приложения:

```bash
docker compose logs -f app
```

Посмотреть логи базы данных:

```bash
docker compose logs -f postgres
```

Проверить состояние всех сервисов:

```bash
docker compose ps
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

Данные PostgreSQL сохраняются в volume `postgres_data`, файлы MinIO — в `minio_data`.

Документы подтверждения сохраняются в volume `uploads_data` и доступны приложению в `/app/public/uploads`. Изображения товаров сохраняются в MinIO.

## Деплой на сервер

На сервере нужно задать production-значения:

```env
POSTGRES_USER=uni_user
POSTGRES_PASSWORD=strong_password
POSTGRES_DB=uni_practice_app
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=strong_random_secret
APP_URL=https://your-domain.example
PAYMENT_MODE=yookassa
YOOKASSA_API_URL=https://api.yookassa.ru/v3
YOOKASSA_SHOP_ID=shop-id
YOOKASSA_SECRET_KEY=secret-key
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

`.env` нужен только для переопределения демонстрационных значений и подключения реальных внешних сервисов. Для обычной проверки проекта создавать его не нужно.

После этого:

```bash
docker compose up -d --build
```
