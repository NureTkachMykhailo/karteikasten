# Karteikasten

Каталог + Leitner-SRS для изучения немецкого, с двумя точечными AI-функциями
(генерация карточки с RAG-проверкой на дубли через pgvector, генерация
диалога по due-карточкам) и реальными аккаунтами (регистрация, JWT-логин,
данные каждого пользователя изолированы).

Стек: FastAPI + PostgreSQL(pgvector) + React + Tailwind — как в исходном ТЗ.

## Что протестировано

Backend прогнан через FastAPI TestClient локально (LLM-вызовы замоканы —
реальный внешний API из тестовой среды недоступен):
- CRUD карточек, Leitner-обновление (`/review`), оба AI-эндпоинта
- Регистрация / логин / `/auth/me`, неверный пароль отклоняется
- **Изоляция данных**: второй пользователь не видит и не может
  редактировать/удалить чужие карточки (проверено на 404, не 403 —
  специально, чтобы не подтверждать сам факт существования чужой карточки)
- Запросы без токена ко всем защищённым эндпоинтам блокируются (401)

Frontend: `npm run build` проходит чисто, линтер (`oxlint`) — 0 предупреждений,
все пропсы между компонентами перепроверены вручную. Живой rendering-прогон
в браузере (клики, формы) не выполнялся — сделай это первым делом после
`docker compose up`.

## Важно: это не хостится автоматически

У меня как у ассистента нет доступа к деплой-платформам и я не могу выдать
тебе публичный URL — это должен сделать ты сам. Ниже — оба пути: локально и
на бесплатном хостинге.

## Запуск локально (Docker)

```bash
cp backend/.env.example backend/.env
# впиши в backend/.env:
#   LLM_API_KEY   — твой ключ (OpenAI-совместимый провайдер)
#   SECRET_KEY    — сгенерируй: python -c "import secrets; print(secrets.token_hex(32))"

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
