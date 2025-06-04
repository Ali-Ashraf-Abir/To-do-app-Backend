import express from 'express';
import db from '../db.js';


const router = express.Router();

// routes starts with /todos
router.get("/:user_id", (req, res) => {
    const { user_id } = req.params;
    const getTodos = db.prepare(`SELECT * FROM TODOS WHERE user_id = ? ORDER BY sort_order ASC`);
    const todos = getTodos.all(user_id);

    if (!todos.length) {
        return res.status(404).json({ error: "No todos found" });
    }

    res.json({ status: "success", todos });
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
    const newOrder = req.body; // Expecting: [{ id: 'uuid1', sort_order: 0 }, ...]

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


router.put(`/:id`, (req, res) => { })


router.delete(`/:id`, (req, res) => { })

export default router;