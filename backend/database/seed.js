const bcrypt = require('bcrypt');
const pool = require('../src/config/db');
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}


(async () => {
  try {
    console.log('Seeding database...');

    // ---------- PASSWORD HASHES ----------
    const superAdminHash = await bcrypt.hash('Admin@123', 10);
    const tenantAdminHash = await bcrypt.hash('Demo@123', 10);
    const userHash = await bcrypt.hash('User@123', 10);

    // ---------- IDS ----------
    const tenantId = uuidv4();
    const tenantAdminId = uuidv4();
    const userId = uuidv4();
    const projectId = uuidv4();
    const taskId = uuidv4();

    // ---------- SUPER ADMIN ----------
    await pool.query(
      `
      INSERT INTO users (id, email, password_hash, full_name, role, tenant_id)
      VALUES ($1, $2, $3, 'Super Admin', 'super_admin', NULL)
      ON CONFLICT DO NOTHING
      `,
      [uuidv4(), 'superadmin@system.com', superAdminHash]
    );

    // ---------- TENANT ----------
    await pool.query(
      `
      INSERT INTO tenants (
        id, name, subdomain, status, subscription_plan,
        max_users, max_projects
      )
      VALUES ($1, $2, $3, 'active', 'pro', 25, 15)
      ON CONFLICT DO NOTHING
      `,
      [tenantId, 'Demo Company', 'demo']
    );

    // ---------- TENANT ADMIN ----------
    await pool.query(
      `
      INSERT INTO users (
        id, tenant_id, email, password_hash,
        full_name, role
      )
      VALUES ($1, $2, $3, $4, 'Demo Admin', 'tenant_admin')
      ON CONFLICT DO NOTHING
      `,
      [tenantAdminId, tenantId, 'admin@demo.com', tenantAdminHash]
    );

    // ---------- REGULAR USER ----------
    await pool.query(
      `
      INSERT INTO users (
        id, tenant_id, email, password_hash,
        full_name, role
      )
      VALUES ($1, $2, $3, $4, 'Demo User', 'user')
      ON CONFLICT DO NOTHING
      `,
      [userId, tenantId, 'user1@demo.com', userHash]
    );

    // ---------- PROJECT ----------
    await pool.query(
      `
      INSERT INTO projects (
        id, tenant_id, name, description,
        status, created_by
      )
      VALUES ($1, $2, $3, 'First demo project', 'active', $4)
      ON CONFLICT DO NOTHING
      `,
      [projectId, tenantId, 'Project Alpha', tenantAdminId]
    );

    // ---------- TASK ----------
    await pool.query(
      `
      INSERT INTO tasks (
        id, tenant_id, project_id,
        title, description,
        status, priority, assigned_to
      )
      VALUES ($1, $2, $3, 'Initial Task', 'Seeded task', 'todo', 'medium', $4)
      ON CONFLICT DO NOTHING
      `,
      [taskId, tenantId, projectId, userId]
    );

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();