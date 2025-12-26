const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

exports.registerTenant = async (req, res) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

  if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check subdomain uniqueness
    const tenantCheck = await client.query(
      'SELECT 1 FROM tenants WHERE subdomain = $1',
      [subdomain]
    );
    if (tenantCheck.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Subdomain already exists',
      });
    }

    // Create tenant
    const tenantId = require('crypto').randomUUID();
    await client.query(
      `INSERT INTO tenants 
       (id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, $3, 'active', 'free', 5, 3)`,
      [tenantId, tenantName, subdomain]
    );

    // Check admin email uniqueness per tenant
    const emailCheck = await client.query(
      'SELECT 1 FROM users WHERE tenant_id = $1 AND email = $2',
      [tenantId, adminEmail]
    );
    if (emailCheck.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant',
      });
    }

    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    const adminId = require('crypto').randomUUID();

    await client.query(
      `INSERT INTO users
       (id, tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, 'tenant_admin')`,
      [adminId, tenantId, adminEmail, passwordHash, adminFullName]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenantId,
        subdomain,
        adminUser: {
          id: adminId,
          email: adminEmail,
          fullName: adminFullName,
          role: 'tenant_admin',
        },
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  // Treat empty string as undefined for tenantSubdomain
  const normalizedTenantSubdomain = tenantSubdomain;/// == undefined ? undefined : tenantSubdomain;
  console.log("Normalized Tenant Subdomain:", normalizedTenantSubdomain);
  try {
    // 1️⃣ FIRST: check if user is super_admin (tenant_id IS NULL)
    if (!normalizedTenantSubdomain) {
      const superAdminRes = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND role = $2 AND tenant_id IS NULL',
        [email, 'super_admin']
      );
      console.log("Super Admin Query Result:", superAdminRes);

      if (superAdminRes.rowCount > 0) {
        const user = superAdminRes.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials',
          });
        }
        if (!user.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Account is inactive',
          });
        }
        const token = generateToken({
          userId: user.id,
          tenantId: null,
          role: user.role,
        });
        return res.status(200).json({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              fullName: user.full_name,
              role: user.role,
              tenantId: null,
            },
            token,
            expiresIn: 86400,
          },
        });
      }
    }

    // 2️⃣ NOT super admin → tenantSubdomain REQUIRED
    if (!normalizedTenantSubdomain) {
      return res.status(400).json({
        success: false,
        message: 'Tenant subdomain is required!',
      });
    }

    // 3️⃣ Validate tenant
    const tenantRes = await pool.query(
      'SELECT * FROM tenants WHERE subdomain = $1',
      [tenantSubdomain]
    );

    if (tenantRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    const tenant = tenantRes.rows[0];

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant is not active',
      });
    }

    // 4️⃣ Find tenant-scoped user
    const userRes = await pool.query(
      'SELECT * FROM users WHERE tenant_id = $1 AND email = $2',
      [tenant.id, email]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = userRes.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
        },
        token,
        expiresIn: 86400,
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


exports.getCurrentUser = async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.is_active,
              t.id as tenant_id, t.name, t.subdomain, t.subscription_plan,
              t.max_users, t.max_projects
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const row = userRes.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role,
        isActive: row.is_active,
        tenant: row.tenant_id
          ? {
              id: row.tenant_id,
              name: row.name,
              subdomain: row.subdomain,
              subscriptionPlan: row.subscription_plan,
              maxUsers: row.max_users,
              maxProjects: row.max_projects,
            }
          : null,
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

exports.logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};