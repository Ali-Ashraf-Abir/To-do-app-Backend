import express from 'express';
import db from '../db.js';


const router = express.Router();

// routes starts with /todos
router.get("/:user_id", (req, res) => {
    const { user_id } = req.params;
    const { date } = req.query; // date from query string

    let getTodos;
    let todos;

    if (date) {
        getTodos = db.prepare(
            `SELECT * FROM TODOS WHERE user_id = ? AND date = ? ORDER BY sort_order ASC`
        );
        todos = getTodos.all(user_id, date);
    } else {
        getTodos = db.prepare(
            `SELECT * FROM TODOS WHERE user_id = ? ORDER BY sort_order ASC`
        );
        todos = getTodos.all(user_id);
    }

    if (!todos.length) {
        return res.status(404).json({ error: "No todos found" });
    }

    res.json({ status: "success", todos });
});

router.get('/:user_id/todo-dates', (req, res) => {
    const { user_id } = req.params;
    const query = `
    SELECT date, COUNT(*) as count
    FROM TODOS
    WHERE user_id = ?
    GROUP BY date
    ORDER BY date ASC
  `;
    const stmt = db.prepare(query);
    const results = stmt.all(user_id);

    res.json({ status: 'success', dates: results });
});



router.post(`/:user_id`, (req, res) => {
    const { user_id } = req.params;
    const { id, title, date, description } = req.body;
    if (!id || !title || !date || !description) {
        return res.status(400).json({ error: 'All fields are required' })
    }
    try {
        const insertTodo = db.prepare('INSERT INTO todos (user_id, id, title, date, description) VALUES (?, ?, ?, ?, ?)');
        insertTodo.run(user_id, id, title, date, description);
        res.json({ status: 'success', message: 'Todo created successfully' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

router.put("/:user_id/reorder", (req, res) => {
    const { user_id } = req.params;
    const newOrder = req.body;

    try {
        const updateStmt = db.prepare("UPDATE TODOS SET sort_order = ? WHERE id = ? AND user_id = ?");

        const updateMany = db.transaction((orderArray) => {
            for (const todo of orderArray) {
                updateStmt.run(todo.sort_order, todo.id, user_id);
            }
        });

        updateMany(newOrder);
        res.json({ status: "success" });
    } catch (err) {
        console.error("Error updating order:", err);
        res.status(500).json({ status: "error", error: "Failed to update todo order" });
    }
});


router.put('/:user_id/:id', (req, res) => {
    const { user_id, id } = req.params;
    const { title, date, description, completed, sort_order } = req.body;

    console.log(user_id, id, title, date, description, completed, sort_order);

    if (!title || !date || !description) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const updateTodo = db.prepare(`
            UPDATE todos
            SET title = ?, date = ?, description = ?, completed = ?, sort_order = ?
            WHERE id = ? AND user_id = ?
        `);
        updateTodo.run(title, date, description, completed, sort_order, id, user_id);

        res.json({ status: 'success', message: 'Todo updated successfully' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:user_id/:id/complete', (req, res) => {
    const { user_id, id } = req.params;
    const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, user_id);
    if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    if (todo.completed) {
        try {
            const completeTodo = db.prepare(`
            UPDATE todos
            SET completed = 0
            WHERE id = ? AND user_id = ?
        `);
            completeTodo.run(id, user_id);

            return res.json({ status: 'success', message: 'Todo marked as incompleted' });
        } catch (error) {
            console.error(error.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    try {
        const completeTodo = db.prepare(`
            UPDATE todos
            SET completed = 1
            WHERE id = ? AND user_id = ?
        `);
        completeTodo.run(id, user_id);

        return res.json({ status: 'success', message: 'Todo marked as completed' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get(`/todo-dashboard/:user_id`, (req, res) => {
    const { user_id } = req.params;
    const getUserTodoData = db.prepare(`SELECT * FROM todos WHERE user_id = ?`)
    const todos = getUserTodoData.all(user_id);
    if (!todos.length) {
        res.status(404).json({ error: "No todos found for this user" })
    }
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length
    const overdue = todos.filter(todo => new Date(todo.date) < new Date() && !todo.completed).length;
    const upcoming = todos.filter(todo => new Date(todo.date) >= new Date() && !todo.completed).length;
    res.json({ status: "success", data: { total, completed, overdue, upcoming } });
})

router.delete(`/:user_id/:id`, (req, res) => {
    const { user_id, id } = req.params;
    try {
        const deleteTodo = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?');
        deleteTodo.run(id, user_id);
        res.json({ status: 'success', message: 'Todo deleted successfully' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
})

export default router;