// db.js
import Database from 'better-sqlite3';

const db = new Database('data.db'); // creates or uses data.db in project root
// or 'my-database.db' for file-based

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS TODOS (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    title TEXT,
    date TEXT,
    description TEXT,
    completed BOOLEAN DEFAULT 0,
    sort_order INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);




export default db;
