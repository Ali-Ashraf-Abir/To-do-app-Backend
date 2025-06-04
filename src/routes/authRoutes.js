import express from 'express';
import bcrypt, { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();


router.post('/register', (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    // checking if user already exists
    const getUser = db.prepare(`SELECT * FROM users WHERE email = ?`);

    const user = getUser.get(email)
    if (user) {
        return res.status(409).json({ error: 'User already exists' });
    }
    // encrpyt password 
    const hashedPassword = bcrypt.hashSync(password, 8)

    try {
        const insertUser = db.prepare('INSERT INTO users (email,password) VALUES (?,?)')
        const result = insertUser.run(email, hashedPassword);
        // creating a default todo for the user
        const stmt = db.prepare("SELECT COUNT(*) AS total FROM TODOS");
        const total_todos = stmt.get();
        const defaultTodoTitle = "Welcome and create your first todo here";
        const defaultTodoId = `todo-${result.lastInsertRowid}`; // Unique ID for the todo
        const defaultTodoDescription = "welcome to our todo app, you can create, update and delete todos here";
        const defaultTodoDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        const insertTodo = db.prepare('INSERT INTO TODOS (user_id, id, title, date, description,sort_order) VALUES (?, ?, ?, ?, ?, ?)');
        insertTodo.run(result.lastInsertRowid, defaultTodoId, defaultTodoTitle, defaultTodoDate, defaultTodoDescription,total_todos.total);
        // creating a token
        const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ status: 'success', message: 'User registered successfully', token: token });

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: 'Internal server error' });

    }

})

router.post('/login', (req, res) => {

    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const getUser = db.prepare(`SELECT * FROM users WHERE email = ?`);
        const user = getUser.get(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = jwt.sign({ id: user?.id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ status: 'success', message: 'User Logged In successfully', token: token });

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: 'Internal server error' });

    }
})


router.post('/logout', (req, res) => {
    res.json({ status: 'sucess' })
})



export default router;