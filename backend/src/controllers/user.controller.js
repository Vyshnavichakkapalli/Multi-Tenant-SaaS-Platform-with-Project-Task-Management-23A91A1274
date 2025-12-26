const bcrypt = require('bcrypt');
const pool = require('../config/db');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

exports.createUser = async (req, res) => {
  const { tenantId } = req.params;
  const { email, password, fullName, role = 'user' } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and fullName are required',
    });
  }

  if (req.user.tenantId !== tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized tenant access',
    });
  }

  try {
    // Check subscription user limit
    const tenantRes = await pool.query(
      'SELECT max_users FROM tenants WHERE id = $1',
      [tenantId]
    );

    const maxUsers = tenantRes.rows[0].max_users;

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    if (Number(countRes.rows[0].count) >= maxUsers) {
      return res.status(403).json({
        success: false,
        message: 'Subscription limit reached',
      });
    }

    // Email uniqueness per tenant
    const emailCheck = await pool.query(
      'SELECT 1 FROM users WHERE tenant_id = $1 AND email = $2',
      [tenantId, email]
    );

    if (emailCheck.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in this tenant',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = crypto.randomUUID();

    const result = await pool.query(
      `
      INSERT INTO users
      (id, tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, role, is_active, created_at
      `,
      [userId, tenantId, email, passwordHash, fullName, role]
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        ...result.rows[0],
        tenantId,
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

exports.listUsers = async (req, res) => {
  const { tenantId } = req.params;
  const { search, role, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  if (req.user.tenantId !== tenantId && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized tenant access',
    });
  }

  try {
    const filters = ['tenant_id = $1'];
    const values = [tenantId];
    let idx = 2;

    if (search) {
      filters.push(`(email ILIKE $${idx} OR full_name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (role) {
      filters.push(`role = $${idx}`);
      values.push(role);
      idx++;
    }

    const query = `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      WHERE ${filters.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const usersRes = await pool.query(query, [...values, limit, offset]);

    return res.status(200).json({
      success: true,
      data: {
        users: usersRes.rows,
        total: usersRes.rows.length,
        pagination: {
          currentPage: Number(page),
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

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, role, isActive } = req.body;

  try {
    const userRes = await pool.query(
      'SELECT id, tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const targetUser = userRes.rows[0];

    if (
      req.user.userId !== userId &&
      req.user.role !== 'tenant_admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (
      req.user.role !== 'tenant_admin' &&
      (role !== undefined || isActive !== undefined)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    if (req.user.tenantId !== targetUser.tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'Cross-tenant access denied',
      });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (fullName) {
      fields.push(`full_name = $${idx++}`);
      values.push(fullName);
    }
    if (req.user.role === 'tenant_admin') {
      if (role !== undefined) {
        fields.push(`role = $${idx++}`);
        values.push(role);
      }
      if (isActive !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(isActive);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, full_name, role, is_active, updated_at
    `;
    values.push(userId);

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
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

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  if (req.user.userId === userId) {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete yourself',
    });
  }

  try {
    const userRes = await pool.query(
      'SELECT tenant_id FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.user.tenantId !== userRes.rows[0].tenant_id) {
      return res.status(403).json({
        success: false,
        message: 'Cross-tenant access denied',
      });
    }

    await pool.query(
      'UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1',
      [userId]
    );

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};