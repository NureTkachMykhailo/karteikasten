# Karteikasten

Каталог + Leitner-SRS для изучения немецкого, с двумя точечными AI-функциями
(генерация карточки с RAG-проверкой на дубли через pgvector, генерация
диалога по due-карточкам) и реальными аккаунтами (email/пароль + опционально
"Войти через Google", JWT-сессия, данные каждого пользователя изолированы).

Стек: FastAPI + PostgreSQL(pgvector) + React + Tailwind — как в исходном ТЗ.

## Что протестировано

Backend: 31 pytest-тестов в `backend/tests/` (LLM- и Google-вызовы замокан —
реальные внешние API из тестовой среды недоступны):
- CRUD карточек, все три Leitner-исхода `/review` (`again`/`good`/`easy`,
  включая потолок box=5), оба AI-эндпоинта (успех, отказ LLM, невалидный
  JSON → 502, фильтры диалога, 404 без подходящих карточек)
- Регистрация / логин / `/auth/me`, неверный пароль и дубль email отклоняются
- **Google-вход**: создание нового аккаунта по email из токена, повторный
  вход переиспользует тот же аккаунт, вход по паролю для Google-only
  аккаунта блокируется, неподтверждённый email и невалидный токен
  отклоняются, `/auth/google` возвращает 501 без `GOOGLE_CLIENT_ID`
- **Изоляция данных**: второй пользователь не видит и не может
  редактировать/удалить/оценить чужие карточки (проверено на 404, не 403 —
  специально, чтобы не подтверждать сам факт существования чужой карточки)
- Запросы без токена ко всем защищённым эндпоинтам блокируются (401)

Запуск локально (нужен отдельный Postgres с pgvector — не тот же контейнер,
что в `docker compose`, чтобы не затирать свои карточки):

```bash
docker run -d -p 55432:5432 -e POSTGRES_USER=karteikasten \
  -e POSTGRES_PASSWORD=karteikasten -e POSTGRES_DB=karteikasten_test \
  pgvector/pgvector:pg16

cd backend
pip install -r requirements.txt pytest httpx ruff
DATABASE_URL=postgresql://karteikasten:karteikasten@localhost:55432/karteikasten_test \
SECRET_KEY=test LLM_API_KEY=test \
  pytest -v
ruff check . && ruff format --check .
```

GitHub Actions (`.github/workflows/ci.yml`) прогоняет это же (плюс
`docker build` обоих образов) на каждый push/PR — с сервисным
`pgvector/pgvector:pg16` контейнером вместо ручного шага выше.

Frontend: `npm run build` проходит чисто (в том числе отдельно проверено с
заданным `VITE_GOOGLE_CLIENT_ID` и без него — кнопка Google корректно
встраивается или скрывается), линтер (`oxlint`) — 0 ошибок. Живой прогон в
браузере (регистрация, создание карточек трёх типов, каталог, повторение с
переворотом карточки и оценкой) пройден вручную через `docker compose up`.

## Важно: это не хостится автоматически

У меня как у ассистента нет доступа к деплой-платформам и я не могу выдать
тебе публичный URL — это должен сделать ты сам. Ниже — оба пути: локально и
на бесплатном хостинге.

## Настройка Google-входа (опционально)

Без этого шага приложение работает как обычно — просто кнопка Google не
показывается (`/auth/google` вернёт 501, если её всё же дёрнуть).

1. **Google Cloud Console** → создай проект (если ещё нет) → **APIs &
   Services → OAuth consent screen** → тип "External", заполни минимум
   (имя приложения, email) → статус можно оставить **Testing** и добавить
   себя в тестовые пользователи (до 100 человек, без верификации Google —
   этого достаточно для защиты)
2. **Credentials → Create Credentials → OAuth client ID** → тип
   **Web application** → в "Authorized JavaScript origins" добавь
   `http://localhost:8080` (и позже — реальный домен, если задеплоишь)
3. Скопируй **Client ID** (это не секрет, можно не прятать) в оба места:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` (создай из `frontend/.env.example`) →
     `VITE_GOOGLE_CLIENT_ID=...`
4. Пересобери: `docker compose up --build` (фронт должен пересобраться
   заново — Vite встраивает переменную во время сборки, не во время запуска)

## Запуск локально (Docker)

```bash
cp backend/.env.example backend/.env
# впиши в backend/.env:
#   LLM_API_KEY   — твой ключ (OpenAI-совместимый провайдер)
#   SECRET_KEY    — сгенерируй: python -c "import secrets; print(secrets.token_hex(32))"
#   GOOGLE_CLIENT_ID — опционально, см. раздел выше

docker compose up --build
```

- Frontend: http://localhost:8080 — откроется экран регистрации/входа
- Backend: http://localhost:8000/docs — Swagger со всеми эндпоинтами
- Postgres с pgvector поднимается автоматически, расширение и таблицы
  (включая `users`) создаются при первом старте backend

Первый запуск: зарегистрируй аккаунт прямо в интерфейсе — своего рода
семья/группа пользователей может завести отдельные логины, у каждого будет
свой изолированный каталог карточек.

## Запуск локально без Docker

```bash
# 1. Postgres с pgvector:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=karteikasten \
  -e POSTGRES_USER=karteikasten -e POSTGRES_DB=karteikasten \
  pgvector/pgvector:pg16

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # впиши LLM_API_KEY и SECRET_KEY
uvicorn app.main:app --reload

# 3. Frontend (React/Vite)
cd frontend
npm install
cp .env.example .env   # впиши VITE_GOOGLE_CLIENT_ID, если нужен Google-вход
npm run dev   # http://localhost:5173, дев-сервер с hot reload
# или для прод-сборки:
npm run build && npm run preview
```

## Реальный хостинг (бесплатные варианты для курсового проекта)

- **Backend + Postgres**: Railway или Render — оба поддерживают Dockerfile
  напрямую, дают бесплатный managed Postgres (расширение `vector` включается
  автоматически backend'ом при старте)
- **Frontend**: Vercel/Netlify отлично подходят именно для Vite-проектов
  (авто-детект, `npm run build` → раздача `dist/`), либо тот же Dockerfile
  через Render как static/web service
- После деплоя backend поменяй `API_BASE`: `localStorage.setItem('api_base',
  'https://твой-backend-url')` в консоли браузера, или пропиши дефолт в
  `frontend/src/api.js` перед деплоем

## Что не реализовано специально

- Alembic-миграции — для курсовой достаточно `create_all` на старте
  (упомяни на защите как осознанное упрощение, не пробел)
- LangChain — сознательно не использован (см. обсуждение в разработке): для
  двух прямолинейных LLM-вызовов прямой клиент проще и понятнее на защите
- Refresh-токены / логаут на всех устройствах — токен просто живёт 7 дней;
  для личного/учебного проекта усложнение не оправдано
- Восстановление пароля — не реализовано (нет email-инфраструктуры); при
  необходимости на защите можно честно назвать это "known limitation"
