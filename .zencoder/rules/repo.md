---
description: Repository Information Overview
alwaysApply: true
---

# Anclora Flow Information

## Summary

Anclora Flow is an intelligent fiscal and financial CRM platform for freelancers and digital entrepreneurs in Spain. It features multi-language support (English/Spanish), multi-project compatibility, and a scalable modular architecture with smart management of invoices, expenses, deductions, and metrics.

## Structure

- **frontend/**: Vite-based SPA with components, pages, and services
- **backend/**: Express API server with routes for auth, invoices, expenses, clients, and projects
- **ai-services/**: FastAPI service for AI assistant and RAG integration
- **shared/**: Common utilities, constants, and types shared across services
- **infrastructure/**: Docker, Kubernetes, and Terraform configurations
- **docs/**: Documentation, tutorials, and user manuals
- **scripts/**: Setup and utility scripts
- **tests/**: End-to-end and performance tests

## Language & Runtime

**Frontend**:

- **Language**: JavaScript
- **Framework**: Vanilla JS with Vite
- **Package Manager**: npm

**Backend**:

- **Language**: JavaScript (Node.js)
- **Framework**: Express
- **Package Manager**: npm

**AI Services**:

- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Package Manager**: pip

## Dependencies

**Frontend Dependencies**:

- Vite 7.1.9

**Backend Dependencies**:

- express 4.18.2
- cors 2.8.5
- passport 0.7.0
- passport-google-oauth20 2.0.0
- passport-github2 0.1.12
- pg 8.11.3
- dotenv 16.3.1
- bcrypt 5.1.1
- jsonwebtoken 9.0.2

**AI Services Dependencies**:

- fastapi 0.104.1
- uvicorn 0.24.0

## Build & Installation

```bash
# Full stack with Docker
docker-compose up --build

# Frontend only
cd frontend && npm install && npm run dev -- --host 0.0.0.0 --port 3020

# Backend only
cd backend && npm install && npm run dev

# AI services only
cd ai-services && pip install -r requirements.txt && uvicorn main:app --reload --port 8001
```

## Docker

**Configuration**: Docker Compose with three services:

- **Frontend**: Builds from ./frontend, exposes port 3020
- **Backend**: Builds from ./backend, exposes port 8020
- **AI Services**: Builds from ./ai-services, exposes port 5452

## Main Files

**Frontend**:

- Entry Point: frontend/src/main.js
- Routes: Defined in main.js with pages for dashboard, invoices, expenses, clients, etc.
- Components: Located in frontend/src/components

**Backend**:

- Entry Point: backend/src/server.js
- Routes: API endpoints for auth, invoices, expenses, clients, projects, and verifactu
- Database: PostgreSQL connection configured in database/config.js

**AI Services**:

- Entry Point: ai-services/main.py
- FastAPI app with orchestrator and RAG integration

## Testing

**Frontend**:

- Test Directories: frontend/tests/unit, frontend/tests/integration, frontend/tests/e2e

**Backend**:

- Test Directory: backend/tests

**Repository-level Tests**:

- End-to-end Tests: tests/e2e
- Performance Tests: tests/performance
