const pool = require('../config/db');

exports.getTenantById = async (req, res) => {
  const { tenantId } = req.params;
  const { role, tenantId: userTenantId } = req.user;

  if (role !== 'super_admin' && tenantId !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access',
    });
  }

  try {
    const tenantRes = await pool.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const tenant = tenantRes.rows[0];

    const statsRes = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) AS total_users,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) AS total_projects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1) AS total_tasks
      `,
      [tenantId]
    );

    const stats = statsRes.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        status: tenant.status,
        subscriptionPlan: tenant.subscription_plan,
        maxUsers: tenant.max_users,
        maxProjects: tenant.max_projects,
        createdAt: tenant.created_at,
        stats: {
          totalUsers: Number(stats.total_users),
          totalProjects: Number(stats.total_projects),
          totalTasks: Number(stats.total_tasks),
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.updateTenant = async (req, res) => {
  const { tenantId } = req.params;
  const { role, tenantId: userTenantId } = req.user;
  const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

  if (role !== 'super_admin' && tenantId !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized access',
    });
  }

  if (role !== 'super_admin' && (status || subscriptionPlan || maxUsers || maxProjects)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to update these fields',
    });
  }

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (role === 'super_admin') {
      if (status) {
        fields.push(`status = $${idx++}`);
        values.push(status);
      }
      if (subscriptionPlan) {
        fields.push(`subscription_plan = $${idx++}`);
        values.push(subscriptionPlan);
      }
      if (maxUsers) {
        fields.push(`max_users = $${idx++}`);
        values.push(maxUsers);
      }
      if (maxProjects) {
        fields.push(`max_projects = $${idx++}`);
        values.push(maxProjects);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    const query = `
      UPDATE tenants
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, name, updated_at
    `;
    values.push(tenantId);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.listTenants = async (req, res) => {
  const { page = 1, limit = 10, status, subscriptionPlan } = req.query;
  const offset = (page - 1) * limit;

  try {
    const filters = [];
    const values = [];
    let idx = 1;

    if (status) {
      filters.push(`status = $${idx++}`);
      values.push(status);
    }
    if (subscriptionPlan) {
      filters.push(`subscription_plan = $${idx++}`);
      values.push(subscriptionPlan);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const tenantsRes = await pool.query(
      `
      SELECT id, name, subdomain, status, subscription_plan, created_at
      FROM tenants
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx}
      `,
      [...values, limit, offset]
    );

    const countRes = await pool.query(
      `
      SELECT COUNT(*) FROM tenants
      ${whereClause}
      `,
      values
    );

    const totalTenants = Number(countRes.rows[0].count);
    const totalPages = Math.ceil(totalTenants / limit);

    return res.status(200).json({
      success: true,
      data: {
        tenants: tenantsRes.rows,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalTenants,
          limit: Number(limit),
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};