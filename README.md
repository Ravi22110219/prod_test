# React + FastAPI Deployment Test

A small end-to-end test app for server deployment. The React frontend calls the FastAPI backend, and the Docker build serves the compiled frontend from the same FastAPI container.

## Project Structure

```text
backend/
  app/main.py          FastAPI app and static frontend serving
  requirements.txt    Python dependencies
frontend/
  src/                React app
  vite.config.js      Vite dev proxy to FastAPI
Dockerfile            Single-container production build
docker-compose.yml    Local deployment test
```

## Run Locally

Start the backend:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`.

Note: this current local folder contains a literal backslash in its path. If Node reports `ERR_INVALID_MODULE_SPECIFIER` while running Vite from this exact directory, move or copy the project to a path without a backslash, or use the Docker flow below. Server and Docker paths normally do not have this issue.

## Run With Docker

```bash
docker compose up --build
```

Open `http://localhost:8000`. FastAPI serves both the API and the built React app.

## Test The API

```bash
curl http://localhost:8000/api/health
curl "http://localhost:8000/api/greeting?name=Deployment"
```

## Environment

For local frontend development you can optionally create `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Leave it unset to use the built-in Vite proxy during `npm run dev`.
