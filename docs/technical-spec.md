# Technical Specification
## Multi-Tenant SaaS Platform with Project & Task Management


---

## 1. Purpose

This document defines the technical architecture, design decisions, and implementation details of the Multi-Tenant Task Planner system developed in Week 5. The goal is to explain how the system ensures tenant isolation, security, scalability, and reliability.

---

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a layered REST API architecture:

- Client Layer – Frontend consuming REST APIs  
- API Layer – Express.js server handling routing, validation, and authentication  
- Service Layer – Business logic for tenants, users, projects, and tasks  
- Data Access Layer – PostgreSQL accessed via parameterized SQL queries  
- Infrastructure Layer – Environment configuration and database connectivity  

The application is stateless, enabling horizontal scaling.

---

## 3. Multi-Tenancy Model

### 3.1 Tenant Isolation Strategy

The system uses a shared-database, shared-schema, tenant-id-based isolation model.

- Each tenant has a unique tenant_id
- Every domain table includes tenant_id
- All queries explicitly scope data using tenant_id
- Cross-tenant data access is prevented at the query level

### 3.2 Tenant Context Resolution

Tenant context is resolved using:
- Subdomain during tenant registration
- JWT payload during authenticated requests

Middleware extracts and validates tenant information for each request.

---

## 4. Authentication & Authorization

### 4.1 Authentication

- JWT-based authentication
- Tokens issued on successful login
- JWT payload contains user_id, tenant_id, and role
- Tokens validated on all protected routes

### 4.2 Authorization (RBAC)

Role-Based Access Control is enforced via middleware.

| Role  |             Permissions           |
|-------|-----------------------------------|
| Admin | Full access to projects and tasks |
| User  |         Restricted access         |

Authorization checks are performed before controller execution.

---

## 5. Data Model

### Tenant
- id (UUID, PK)
- name
- subdomain
- created_at

### User
- id (UUID, PK)
- tenant_id (FK)
- email
- password_hash
- role
- created_at

### Project
- id (UUID, PK)
- tenant_id (FK)
- name
- description
- status
- created_at

### Task
- id (UUID, PK)
- tenant_id (FK)
- project_id (FK)
- title
- status
- created_at

---

## 6. Task State Machine

Tasks follow a controlled lifecycle:

todo → in_progress → completed → todo

Invalid transitions are rejected at the API layer.

---

## 7. API Design

| Method |        Endpoint       |     Description    |
|--------|-----------------------|--------------------|
| POST   | /auth/register-tenant |  Register tenant   |
| POST   |      /auth/login      |       Login        |
| POST   |       /projects       |   Create project   |
| GET    |     /projects/:id     |     Get project    |
| GET    |  /projects/:id/tasks  |      Get tasks     |
| PATCH  |   /tasks/:id/status   | Update task status |

---

## 8. Error Handling

- Centralized error middleware
- Meaningful HTTP status codes
- Transaction rollback on failure
- Consistent error responses

---

## 9. Security Considerations

- Password hashing with bcrypt
- JWT secrets stored in environment variables
- Parameterized SQL queries
- Tenant-level authorization enforced

---

## 10. Transaction Management

PostgreSQL transactions ensure data consistency across multi-step operations.

---

## 11. Scalability & Performance

- Stateless API
- Horizontal scaling supported
- Indexed foreign keys
- Efficient tenant-based query scoping

---

## 12. Configuration Management

- Environment-based configuration
- .env files for local setup
- .env.example committed
- Secrets excluded from version control

---

## 13. Testing Strategy

- Manual API testing via Postman/curl
- Authentication and authorization validation
- Tenant isolation verification
- Error-path testing

---

## 14. Limitations & Future Enhancements

### Limitations
- No pagination
- No task assignments
- No audit logs

### Enhancements
- Pagination and filtering
- User-task assignments
- Audit logging
- CI/CD integration

---

## 15. Conclusion

This project demonstrates a production-ready multi-tenant backend system with strong focus on security, correctness, and scalability.
