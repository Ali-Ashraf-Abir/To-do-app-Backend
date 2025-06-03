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

    // encrpyt password 
    const hashedPassword = bcrypt.hashSync(password, 8)

    try {
        const insertUser = db.prepare('INSERT INTO users (email,password) VALUES (?,?)')
        const result = insertUser.run(email, hashedPassword);
        // creating a default todo for the user
        const defaultTodoTitle = "Welcome and create your first todo here";
        const defaultTodoDescription = "welcome to our todo app, you can create, update and delete todos here";
        const defaultTodoDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        const insertTodo = db.prepare('INSERT INTO TODOS (user_id, title, date, description) VALUES (?, ?, ?, ?)');
        insertTodo.run(result.lastInsertRowid, defaultTodoTitle, defaultTodoDate, defaultTodoDescription);
        // creating a token
        const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.json({ status: 'success', message: 'User registered successfully', token: token });

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: 'Internal server error' });

    }

})

router.post('/login',(req,res)=>{

    const {email,password}=req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const getUser = db.prepare(`SELECT * FROM users WHERE email = ?`);
        const user = getUser.get(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // compare password
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if( !isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        res.send('Login successful');

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: 'Internal server error' });
        
    }
})



export default router;