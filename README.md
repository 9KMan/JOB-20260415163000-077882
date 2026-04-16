# Lead Gen & Workflow Automation SaaS Platform

A modern lead generation and workflow automation platform built with React/Next.js, FastAPI, and Firebase.

## Architecture

```
frontend/          Next.js 14 App (App Router)
  app/             Pages: /, /login, /register, /dashboard
  components/      LeadDashboard, AIAssistantPanel
  hooks/           useAuth, useLeads, useAIAssistant
  lib/             Firebase client config
  types/           TypeScript interfaces
  types/index.ts   Lead, User, AIAssistant types

backend/           FastAPI application
  main.py          App entry, CORS, rate limiting, lifespan
  routers/         leads.py, ai.py
  schemas/         Pydantic v2 models
  services/        firebase_service, ai_service
  Dockerfile
  docker-compose.yml

firebase/          Firebase project config
  firestore.rules  Security rules for leads, users
  firestore.indexes.json
  storage.rules
  .firebaserc
```

## Tech Stack

| Layer       | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14, TypeScript, Tailwind  |
| Backend    | FastAPI, Pydantic v2, Python 3.12 |
| Database   | Firebase Firestore                 |
| Auth       | Firebase Auth                      |
| AI         | OpenAI API, Claude API             |
| Container  | Docker, docker-compose             |
| CI/CD      | GitHub Actions                     |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & docker-compose (for backend)
- Firebase project (for Firestore + Auth)

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in your Firebase project values in .env.local
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your Firebase, OpenAI, Claude credentials
pip install -r requirements.txt
docker-compose up -d  # starts Redis
uvicorn main:app --reload
```

### Firebase Setup

1. Create a Firebase project at console.firebase.google.com
2. Enable Firestore and Firebase Auth
3. Copy config to frontend `.env.local`
4. Deploy security rules:
   ```bash
   cd firebase
   firebase deploy --only firestore
   ```

## Environment Variables

### Frontend (.env.local)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)

```
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
OPENAI_API_KEY=
CLAUDE_API_KEY=
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_PER_MINUTE=60
```

## API Endpoints

| Method | Path                      | Description               |
|--------|---------------------------|--------------------------|
| GET    | /api/leads                | List leads (filterable) |
| POST   | /api/leads                | Create lead              |
| GET    | /api/leads/{id}           | Get single lead          |
| PUT    | /api/leads/{id}           | Update lead              |
| DELETE | /api/leads/{id}           | Delete lead              |
| POST   | /api/ai/analyze           | Analyze lead (OpenAI)    |
| POST   | /api/ai/compose           | Compose outreach (Claude)|

## Scripts

```bash
# Frontend
npm run dev         # Development server
npm run build       # Production build
npm run lint        # ESLint
npx tsc --noEmit    # Type check

# Backend
uvicorn main:app --reload   # Dev server
python -m pytest            # Run tests
python -m ruff check .      # Lint
python -m mypy .            # Type check
```
