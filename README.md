# Multi-Tenant SaaS Platform with Project & Task Management

## Overview

A robust multi-tenant SaaS platform for project and task management. Supports super admin and tenant admin roles, user management, project/task CRUD, and modern Material UI frontend. Built with Node.js (Express), PostgreSQL, React, Vite, and Docker.

## Features

- Multi-tenant architecture: each tenant has isolated users, projects, and tasks
- Super admin: manage all tenants, update subscription plans, status, limits
- Tenant admin: manage users, projects, tasks within their tenant
- User authentication (JWT), role-based access
- Project and task CRUD with limits per tenant
- Modern, responsive Material UI frontend
- Dockerized backend and frontend for easy deployment

## Roles

- **Super Admin**: Can list and manage all tenants, update subscription plan/status/limits. Not associated with any tenant. Cannot manage projects/tasks/users directly.

- **Tenant Admin**: Can manage users, projects, and tasks within their tenant. Can update tenant name, but not plan/status.

## Tech Stack

- Backend: Node.js, Express, PostgreSQL
- Frontend: React, Vite, Material UI
- Auth: JWT
- Docker: For both backend and frontend

## Folder Structure

- `backend/` - Express API, database migrations/seeds, Dockerfile
- `frontend/` - React app, Material UI, Dockerfile
- `docs/` - Architecture, PRD, technical specs

## Setup & Execution

### Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL

### Local Development

1. **Clone the repo**

2. **Setup environment variables**

   - `backend/.env` (DB connection, JWT secret)
   - `frontend/.env` (`VITE_API_URL`)

3. **Install dependencies**

   - `cd backend && npm install`
   - `cd ../frontend && npm install`

4. **Setup database**

   - Run migrations: `node database/migrate.js` (in backend)
   - Seed data: `node database/seed.js` (in backend)

5. **Start servers**

   - Backend: `npm start` (port 4000)
   - Frontend: `npm run dev` (port 3000)

6. **Access app**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:4000](http://localhost:4000)

### Docker Execution

1. **Build and run containers**

   - From project root: `docker-compose up --build`

2. **Access app**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:4000](http://localhost:4000)

## Usage

- Register a tenant (creates tenant and tenant admin)

- Super admin can log in without subdomain

- Tenant admin must provide subdomain

- Manage users, projects, tasks (tenant admin)

- Super admin can list/update tenants

- Project/task CRUD, including delete (Material UI buttons)


## Additional Documentation

- See `/docs` for architecture, PRD, technical specs, and ERD images