-- SUPER ADMIN (tenant_id = NULL)
INSERT INTO users (
    id, tenant_id, email, password_hash, full_name, role, is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    NULL,
    'superadmin@system.com',
    '$2b$10$8vL5k2yQmZJmXzXG6zH0Ue3sJ8jzJXh7eKpJxqJ6rEJ2k2cZ9W1E2',
    'System Administrator',
    'super_admin',
    true
);

-- TENANT
INSERT INTO tenants (
    id, name, subdomain, status, subscription_plan, max_users, max_projects
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15
);

-- TENANT ADMIN
INSERT INTO users (
    id, tenant_id, email, password_hash, full_name, role, is_active
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'admin@demo.com',
    '$2b$10$8vL5k2yQmZJmXzXG6zH0Ue3sJ8jzJXh7eKpJxqJ6rEJ2k2cZ9W1E2',
    'Demo Admin',
    'tenant_admin',
    true
);

-- REGULAR USERS
INSERT INTO users (
    id, tenant_id, email, password_hash, full_name, role, is_active
) VALUES
(
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'user1@demo.com',
    '$2b$10$8vL5k2yQmZJmXzXG6zH0Ue3sJ8jzJXh7eKpJxqJ6rEJ2k2cZ9W1E2',
    'Demo User One',
    'user',
    true
),
(
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'user2@demo.com',
    '$2b$10$8vL5k2yQmZJmXzXG6zH0Ue3sJ8jzJXh7eKpJxqJ6rEJ2k2cZ9W1E2',
    'Demo User Two',
    'user',
    true
);

-- PROJECTS
INSERT INTO projects (
    id, tenant_id, name, description, status, created_by
) VALUES
(
    '66666666-6666-6666-6666-666666666666',
    '22222222-2222-2222-2222-222222222222',
    'Project Alpha',
    'First demo project',
    'active',
    '33333333-3333-3333-3333-333333333333'
),
(
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    'Project Beta',
    'Second demo project',
    'active',
    '33333333-3333-3333-3333-333333333333'
);

-- TASKS
INSERT INTO tasks (
    id, project_id, tenant_id, title, status, priority, assigned_to
) VALUES
(
    '88888888-8888-8888-8888-888888888888',
    '66666666-6666-6666-6666-666666666666',
    '22222222-2222-2222-2222-222222222222',
    'Setup project repository',
    'completed',
    'medium',
    '44444444-4444-4444-4444-444444444444'
),
(
    '99999999-9999-9999-9999-999999999999',
    '66666666-6666-6666-6666-666666666666',
    '22222222-2222-2222-2222-222222222222',
    'Design database schema',
    'in_progress',
    'high',
    '55555555-5555-5555-5555-555555555555'
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    'Implement authentication',
    'todo',
    'high',
    NULL
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    'Create frontend UI',
    'todo',
    'medium',
    NULL
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '77777777-7777-7777-7777-777777777777',
    '22222222-2222-2222-2222-222222222222',
    'Write documentation',
    'todo',
    'low',
    '44444444-4444-4444-4444-444444444444'
);
