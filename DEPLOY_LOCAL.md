# Local Deployment (No App/UI Changes)

This project can be deployed locally with Docker Compose without changing the existing app flow, UI, or business logic.

## What this adds

- Containerized backend (`backend/Dockerfile`)
- Containerized frontend (`frontend/Dockerfile`)
- Existing frontend runtime config (`frontend/nginx.conf.template` + `frontend/docker-entrypoint.sh`)
- Local deployment orchestration (`docker-compose.local.yml`)

## Requirements

- Docker Desktop installed and running

## Deploy locally

From the project root:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

## Access

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`

## Keep it running locally

Containers are configured with `restart: unless-stopped`, so they remain available locally until you stop them.

## Stop without deleting your local project

```bash
docker compose -f docker-compose.local.yml stop
```

## Start again

```bash
docker compose -f docker-compose.local.yml start
```

## Fully remove running containers (optional)

This does not delete your local source code.

```bash
docker compose -f docker-compose.local.yml down
```
