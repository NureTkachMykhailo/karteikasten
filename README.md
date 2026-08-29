# Karteikasten

Каталог та Leitner-SRS для вивчення німецької мови, з двома точковими
AI-функціями (генерація картки з RAG-перевіркою на дублікати через pgvector,
генерація діалогу за due-картками) та обліковими записами користувачів
(email/пароль або опційно «Вхід через Google», JWT-сесія; дані кожного
користувача ізольовані).

Стек: FastAPI + PostgreSQL (pgvector) + React + Tailwind — відповідно до
початкового технічного завдання.

## Що перевірено

Backend: 31 pytest-тест у `backend/tests/` (виклики LLM та Google замокано —
реальні зовнішні API з тестового середовища недоступні):
- CRUD карток, усі три результати повторення `/review` (`again`/`good`/
  `easy`, включно з межею box=5), обидва AI-ендпоінти (успіх, відмова LLM,
  недійсний JSON → 502, фільтри діалогу, 404 без відповідних карток)
- Реєстрація / вхід / `/auth/me`, невірний пароль і дубль email
  відхиляються
- **Вхід через Google**: створення нового облікового запису за email із
  токена, повторний вхід використовує той самий обліковий запис, вхід за
  паролем для облікового запису лише з Google блокується, непідтверджений
  email і недійсний токен відхиляються, `/auth/google` повертає 501 без
  `GOOGLE_CLIENT_ID`
- **Ізоляція даних**: інший користувач не бачить і не може редагувати чи
  видаляти чужі картки (перевірено через 404, а не 403 — навмисно, щоб не
  підтверджувати сам факт існування чужої картки)
- Запити без токена до всіх захищених ендпоінтів блокуються (401)

Запуск локально (потрібен окремий Postgres із pgvector — не той самий
контейнер, що в `docker compose`, щоб не затерти наявні картки):

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

GitHub Actions (`.github/workflows/ci.yml`) виконує ті самі перевірки (а
також `docker build` обох образів) на кожен push/PR — із сервісним
контейнером `pgvector/pgvector:pg16` замість наведеного вище ручного кроку.

Frontend: `npm run build` проходить без помилок (окремо перевірено із
заданою змінною `VITE_GOOGLE_CLIENT_ID` та без неї — кнопка Google коректно
відображається або приховується), лінтер (`oxlint`) — 0 помилок. Ручну
перевірку в браузері (реєстрація, створення карток трьох типів, каталог,
повторення з перевертанням картки та оцінкою) виконано через `docker
compose up`.

## Важливо: автоматичного хостингу немає

Асистент не має доступу до платформ розгортання і не може надати публічну
URL-адресу — це слід зробити самостійно. Нижче наведено два варіанти:
локальний запуск і безкоштовний хостинг.

## Налаштування входу через Google (опційно)

Без цього кроку застосунок працює у звичайному режимі — кнопка Google
просто не відображається (`/auth/google` поверне 501 у разі звернення).

1. **Google Cloud Console** → створити проект (за відсутності) →
   **APIs & Services → OAuth consent screen** → тип «External», заповнити
   мінімум (назва застосунку, email) → статус можна залишити **Testing** і
   додати себе до тестових користувачів (до 100 осіб, без верифікації
   Google — цього достатньо для захисту)
2. **Credentials → Create Credentials → OAuth client ID** → тип **Web
   application** → в «Authorized JavaScript origins» додати
   `http://localhost:8080` (а згодом — реальний домен, у разі розгортання)
3. Скопіювати **Client ID** (не є секретом, приховувати не обов'язково) в
   обидва місця:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` (створити з `frontend/.env.example`) →
     `VITE_GOOGLE_CLIENT_ID=...`
4. Перезібрати: `docker compose up --build` (frontend має пересобратися
   заново — Vite вбудовує змінну під час збірки, а не під час запуску)

## Запуск локально (Docker)

```bash
cp backend/.env.example backend/.env
# вписати у backend/.env:
#   LLM_API_KEY   — ключ (OpenAI-сумісний провайдер)
#   SECRET_KEY    — згенерувати: python -c "import secrets; print(secrets.token_hex(32))"
#   GOOGLE_CLIENT_ID — опційно, див. розділ вище

docker compose up --build
```

- Frontend: http://localhost:8080 — відкриється екран реєстрації/входу
- Backend: http://localhost:8000/docs — Swagger з усіма ендпоінтами
- Postgres із pgvector піднімається автоматично, розширення й таблиці
  (включно з `users`) створюються під час першого запуску backend

Перший запуск: зареєструвати обліковий запис безпосередньо в інтерфейсі —
кілька користувачів (наприклад, члени родини) можуть завести окремі
логіни, кожен матиме власний ізольований каталог карток.

## Запуск локально без Docker

```bash
# 1. Postgres із pgvector:
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=karteikasten \
  -e POSTGRES_USER=karteikasten -e POSTGRES_DB=karteikasten \
  pgvector/pgvector:pg16

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # вписати LLM_API_KEY і SECRET_KEY
uvicorn app.main:app --reload

# 3. Frontend (React/Vite)
cd frontend
npm install
cp .env.example .env   # вписати VITE_GOOGLE_CLIENT_ID, якщо потрібен вхід через Google
npm run dev   # http://localhost:5173, dev-сервер із hot reload
# або для production-збірки:
npm run build && npm run preview
```

## Реальний хостинг (безкоштовні варіанти для курсового проєкту)

- **Backend + Postgres**: Railway або Render — обидва підтримують
  Dockerfile напряму, надають безкоштовний managed Postgres (розширення
  `vector` вмикається автоматично бекендом під час старту)
- **Frontend**: Vercel/Netlify добре підходять саме для Vite-проєктів
  (автовизначення, `npm run build` → роздача `dist/`), або той самий
  Dockerfile через Render як static/web service
- Після розгортання backend слід змінити `API_BASE`:
  `localStorage.setItem('api_base', 'https://адреса-бекенду')` у консолі
  браузера, або прописати значення за замовчуванням у `frontend/src/api.js`
  перед розгортанням

## Що свідомо не реалізовано

- Alembic-міграції — для курсового проєкту достатньо `create_all` під час
  старту (варто згадати на захисті як свідоме спрощення, а не прогалину)
- LangChain — свідомо не використано: для двох прямолінійних викликів LLM
  прямий клієнт простіший і зрозуміліший на захисті
- Refresh-токени / вихід з усіх пристроїв — токен просто діє 7 днів; для
  особистого/навчального проєкту ускладнення не виправдане
- Відновлення пароля — не реалізовано (немає email-інфраструктури); за
  потреби на захисті це можна чесно назвати «відомим обмеженням»
