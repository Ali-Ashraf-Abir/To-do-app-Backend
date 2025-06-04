import express from 'express';
import cors from 'cors'; 
import authRouter from './routes/authRoutes.js';
import todosRouter from './routes/todoRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Use cors middleware
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true       
}));

app.use(express.json());

// routes
app.use('/auth', authRouter);
app.use('/todos', todosRouter);

app.get('/', (req, res) => {
  res.send('listening on port 5000');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
