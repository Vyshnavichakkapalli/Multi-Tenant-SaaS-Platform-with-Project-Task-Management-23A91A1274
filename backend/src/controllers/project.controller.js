const pool = require('../config/db');
const crypto = require('crypto');

exports.createProject = async (req, res) => {
  const { name, description, status = 'active' } = req.body;
  const { tenantId, userId } = req.user;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Project name is required',
    });
  }

  try {
    const tenantRes = await pool.query(
      'SELECT max_projects FROM tenants WHERE id = $1',
      [tenantId]
    );

    const maxProjects = tenantRes.rows[0].max_projects;

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM projects WHERE tenant_id = $1',
      [tenantId]
    );

    if (Number(countRes.rows[0].count) >= maxProjects) {
      return res.status(403).json({
        success: false,
        message: 'Project limit reached',
      });
    }

    const projectId = crypto.randomUUID();

    const result = await pool.query(
      `
      INSERT INTO projects
      (id, tenant_id, name, description, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [projectId, tenantId, name, description, status, userId]
    );

    return res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
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

exports.listProjects = async (req, res) => {
  const { tenantId } = req.user;
  const { status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const filters = ['p.tenant_id = $1'];
    const values = [tenantId];
    let idx = 2;

    if (status) {
      filters.push(`p.status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (search) {
      filters.push(`p.name ILIKE $${idx}`);
      values.push(`%${search}%`);
      idx++;
    }

    const query = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at,
        u.id as creator_id,
        u.full_name as creator_name,
        COUNT(t.id) as task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_task_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE ${filters.join(' AND ')}
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const projectsRes = await pool.query(query, [...values, limit, offset]);

    return res.status(200).json({
      success: true,
      data: {
        projects: projectsRes.rows,
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

exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { name, description, status } = req.body;
  const { tenantId, userId, role } = req.user;

  try {
    const projectRes = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = projectRes.rows[0];

    if (
      project.tenant_id !== tenantId ||
      (role !== 'tenant_admin' && project.created_by !== userId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (status) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    const query = `
      UPDATE projects
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;
    values.push(projectId);

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
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

exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  try {
    const projectRes = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = projectRes.rows[0];

    if (
      project.tenant_id !== tenantId ||
      (role !== 'tenant_admin' && project.created_by !== userId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.getProjectDetails = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;

  try {
    const projectRes = await pool.query(
      `SELECT * FROM projects WHERE id = $1 AND tenant_id = $2`,
      [projectId, tenantId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: projectRes.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};