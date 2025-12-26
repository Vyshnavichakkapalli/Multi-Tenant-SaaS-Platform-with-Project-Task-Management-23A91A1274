const pool = require('../config/db');
const crypto = require('crypto');

exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Task title is required',
    });
  }

  try {
    const projectRes = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const projectTenantId = projectRes.rows[0].tenant_id;

    if (projectTenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized project access',
      });
    }

    if (assignedTo) {
      const userRes = await pool.query(
        'SELECT 1 FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, projectTenantId]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant',
        });
      }
    }

    const taskId = crypto.randomUUID();

    const result = await pool.query(
      `
      INSERT INTO tasks
      (id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
      VALUES ($1, $2, $3, $4, $5, 'todo', $6, $7, $8)
      RETURNING *
      `,
      [taskId, projectId, projectTenantId, title, description, priority, assignedTo || null, dueDate || null]
    );

    return res.status(201).json({
      success: true,
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

exports.listTasks = async (req, res) => {
  const { projectId } = req.params;
  const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const projectRes = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (projectRes.rows[0].tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized project access',
      });
    }

    const filters = ['t.project_id = $1'];
    const values = [projectId];
    let idx = 2;

    if (status) {
      filters.push(`t.status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (assignedTo) {
      filters.push(`t.assigned_to = $${idx}`);
      values.push(assignedTo);
      idx++;
    }

    if (priority) {
      filters.push(`t.priority = $${idx}`);
      values.push(priority);
      idx++;
    }

    if (search) {
      filters.push(`t.title ILIKE $${idx}`);
      values.push(`%${search}%`);
      idx++;
    }

    const query = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.created_at,
        u.id as assigned_user_id,
        u.full_name as assigned_user_name,
        u.email as assigned_user_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE ${filters.join(' AND ')}
      ORDER BY
        CASE t.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        t.due_date ASC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const tasksRes = await pool.query(query, [...values, limit, offset]);

    return res.status(200).json({
      success: true,
      data: {
        tasks: tasksRes.rows,
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

exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required',
    });
  }

  try {
    const taskRes = await pool.query(
      'SELECT tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (taskRes.rows[0].tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized task access',
      });
    }

    const result = await pool.query(
      `
      UPDATE tasks
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status, updated_at
      `,
      [status, taskId]
    );

    return res.status(200).json({
      success: true,
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

exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo, dueDate } = req.body;

  try {
    const taskRes = await pool.query(
      'SELECT tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (taskRes.rows[0].tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized task access',
      });
    }

    if (assignedTo !== undefined && assignedTo !== null) {
      const userRes = await pool.query(
        'SELECT 1 FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, req.user.tenantId]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant',
        });
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (title) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (status) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (priority) {
      fields.push(`priority = $${idx++}`);
      values.push(priority);
    }
    if (assignedTo !== undefined) {
      fields.push(`assigned_to = $${idx++}`);
      values.push(assignedTo);
    }
    if (dueDate !== undefined) {
      fields.push(`due_date = $${idx++}`);
      values.push(dueDate);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
    `;
    values.push(taskId);

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
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