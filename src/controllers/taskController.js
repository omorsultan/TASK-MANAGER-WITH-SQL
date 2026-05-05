const { getPool } = require('../config/db');

async function createTask(req, res) {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const pool = await getPool();
    const taskStatus = ['pending', 'in_progress', 'completed'].includes(status) ? status : 'pending';

    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)',
      [title, description || null, taskStatus, req.user.id]
    );

    return res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: result.insertId,
        title,
        description: description || null,
        status: taskStatus,
        user_id: req.user.id,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Task creation failed', error: error.message });
  }
}

async function getTasks(req, res) {
  try {
    const { status, q } = req.query;
    const pool = await getPool();
    const filters = [];
    const values = [];
    const isAdmin = req.user.role === 'admin';

    let query = `
      SELECT tasks.id, tasks.title, tasks.description, tasks.status, tasks.user_id, tasks.created_at, tasks.updated_at,
             users.username, users.email
      FROM tasks
      INNER JOIN users ON users.id = tasks.user_id
    `;

    if (!isAdmin) {
      filters.push('tasks.user_id = ?');
      values.push(req.user.id);
    }

    if (status) {
      filters.push('tasks.status = ?');
      values.push(status);
    }

    if (q) {
      filters.push('(tasks.title LIKE ? OR tasks.description LIKE ?)');
      values.push(`%${q}%`, `%${q}%`);
    }

    if (filters.length > 0) {
      query += ` WHERE ${filters.join(' AND ')}`;
    }

    query += ' ORDER BY tasks.id DESC';

    const [tasks] = await pool.query(query, values);

    return res.json({ tasks });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch tasks', error: error.message });
  }
}

async function getTaskById(req, res) {
  try {
    const pool = await getPool();
    const [tasks] = await pool.query(
      `
      SELECT tasks.id, tasks.title, tasks.description, tasks.status, tasks.user_id, tasks.created_at, tasks.updated_at,
             users.username, users.email
      FROM tasks
      INNER JOIN users ON users.id = tasks.user_id
      WHERE tasks.id = ?
      `,
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = tasks[0];
    const isOwner = task.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only access your own task' });
    }

    return res.json({ task });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch task', error: error.message });
  }
}

async function updateTask(req, res) {
  try {
    const pool = await getPool();
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = tasks[0];
    const isOwner = task.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only update your own task' });
    }

    const title = req.body.title || task.title;
    const description = req.body.description !== undefined ? req.body.description : task.description;
    const status = ['pending', 'in_progress', 'completed'].includes(req.body.status)
      ? req.body.status
      : task.status;

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
      [title, description, status, req.params.id]
    );

    return res.json({
      message: 'Task updated successfully',
      task: {
        id: Number(req.params.id),
        title,
        description,
        status,
        user_id: task.user_id,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Task update failed', error: error.message });
  }
}

async function deleteTask(req, res) {
  try {
    const pool = await getPool();
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = tasks[0];
    const isOwner = task.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete your own task' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Task delete failed', error: error.message });
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
