const express = require("express");
const mariadb = require("mariadb");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pool = mariadb.createPool({
  host: "localhost",
  user: "root", 
  password: "safa", 
  database: "eccouser",
  connectionLimit: 5,
});


(async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log("Users table created or already exists");
  } catch (err) {
    console.error("Error creating users table:", err);
  } finally {
    if (conn) conn.release();
  }
})();

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "INSERT INTO users (username, password) VALUES (?, ?)";
    await conn.query(query, [username, password]);
    console.log("User registered successfully:", { username, password });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(400).json({ error: "Username already exists" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    const result = await conn.query(query, [username, password]);
    console.log("Login query result:", result);
    if (result.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }
    res.status(200).json({ message: "Login successful", username });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (conn) conn.release();
  }
});

const PORT = 3600;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});