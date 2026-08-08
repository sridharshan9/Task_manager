require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "gen_lab";
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || "superadmin@genlab.com";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || "supergen@123";

const corsOptions = {
  origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(",").map((o) => o.trim()),
};
app.use(cors(corsOptions));
app.use(express.json());

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

async function ensureDatabase() {
  try {
    const probe = await mysql
      .createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME })
      .promise();
    await probe.end();
    console.log(`Database '${DB_NAME}' already exists.`);
    return;
  } catch (err) {
    if (err.code !== "ER_BAD_DB_ERROR") throw err;
  }

  const conn = await mysql
    .createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD })
    .promise();
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();
  console.log(`Database '${DB_NAME}' created.`);
}

async function initDatabase() {
  await ensureDatabase();

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL DEFAULT '',
      role ENUM('super_admin', 'manager', 'employee') NOT NULL DEFAULT 'manager',
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
      priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
      due_date VARCHAR(100) NOT NULL DEFAULT '',
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME DEFAULT NULL,
      completed_at DATETIME DEFAULT NULL
    )
  `);

  const existing = await query("SELECT id FROM users WHERE email = ?", [SUPERADMIN_EMAIL]);
  if (existing.length === 0) {
    const hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
    await query(
      "INSERT INTO users (email, full_name, role, password) VALUES (?, 'Super Admin', 'super_admin', ?)",
      [SUPERADMIN_EMAIL, hash]
    );
    console.log(`Superadmin seeded: ${SUPERADMIN_EMAIL}`);
  }
}

initDatabase()
  .then(() => console.log("Database tables ready."))
  .catch((err) => {
    console.error("Database initialization failed:", err.message);
    process.exit(1);
  });

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  role: u.role,
});

// ---------------- Auth Routes ----------------

app.post("/register", async (req, res) => {
  try {
    const { email, full_name, role, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const roleValue = ["manager", "employee"].includes(role) ? role : "manager";

    const existing = await query("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const result = await query(
      "INSERT INTO users (email, full_name, role, password) VALUES (?, ?, ?, ?)",
      [normalizedEmail, full_name || "", roleValue, hash]
    );
    const user = await query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    res.status(201).json({ message: "Registration successful.", user: publicUser(user[0]) });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const rows = await query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const user = rows[0];
    const match = await bcrypt.compare(String(password), user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    res.json({ message: "Login successful.", user: publicUser(user) });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ---------------- Users Routes ----------------

app.get("/api/users", async (_req, res) => {
  try {
    const rows = await query(
      "SELECT id, email, full_name, role, created_at FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Users error:", err.message);
    res.status(500).json({ message: "Failed to load users." });
  }
});

// ---------------- Tasks Routes ----------------

app.get("/api/tasks", async (_req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM tasks ORDER BY FIELD(status, 'pending', 'in_progress', 'completed'), created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Tasks error:", err.message);
    res.status(500).json({ message: "Failed to load tasks." });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, priority, due_date, created_by } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }
    const priorityValue = ["low", "medium", "high", "urgent"].includes(priority)
      ? priority
      : "medium";
    const result = await query(
      "INSERT INTO tasks (title, description, priority, due_date, created_by) VALUES (?, ?, ?, ?, ?)",
      [String(title).trim(), description || null, priorityValue, due_date || "", created_by || null]
    );
    const task = await query("SELECT * FROM tasks WHERE id = ?", [result.insertId]);
    res.status(201).json(task[0]);
  } catch (err) {
    console.error("Create task error:", err.message);
    res.status(500).json({ message: "Failed to create task." });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, title, description, priority, due_date } = req.body;
    const current = await query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (current.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    const task = current[0];
    const newStatus = status || task.status;

    const startedAt = task.started_at;
    const completedAt = task.completed_at;
    const updates = {};
    if (status === "in_progress" && task.status !== "in_progress") updates.started_at = new Date();
    if (status === "completed" && task.status !== "completed") updates.completed_at = new Date();
    if (status === "pending") {
      updates.started_at = null;
      updates.completed_at = null;
    }

    await query(
      `UPDATE tasks
         SET title = ?, description = ?, priority = ?, due_date = ?, status = ?,
             started_at = ?, completed_at = ?
       WHERE id = ?`,
      [
        title !== undefined ? title : task.title,
        description !== undefined ? description : task.description,
        priority !== undefined ? priority : task.priority,
        due_date !== undefined ? due_date : task.due_date,
        newStatus,
        updates.started_at ?? startedAt,
        updates.completed_at ?? completedAt,
        id,
      ]
    );
    const updated = await query("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error("Update task error:", err.message);
    res.status(500).json({ message: "Failed to update task." });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query("DELETE FROM tasks WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.json({ message: "Task deleted." });
  } catch (err) {
    console.error("Delete task error:", err.message);
    res.status(500).json({ message: "Failed to delete task." });
  }
});

// ---------------- Stats Route ----------------

app.get("/api/stats", async (_req, res) => {
  try {
    const rows = await query("SELECT * FROM tasks");
    const total = rows.length;
    const completed = rows.filter((t) => t.status === "completed").length;
    const inProgress = rows.filter((t) => t.status === "in_progress").length;
    const pending = rows.filter((t) => t.status === "pending").length;
    const urgent = rows.filter((t) => ["high", "urgent"].includes(t.priority)).length;
    const today = new Date().toISOString().slice(0, 10);
    const overdue = rows.filter(
      (t) => t.status !== "completed" && t.due_date && t.due_date < today
    ).length;
    res.json({
      total,
      completed,
      inProgress,
      pending,
      urgent,
      overdue,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ message: "Failed to load stats." });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Serve the built frontend (single-server deployment).
// Build the app first with `cd Frontend/gen_lab && npm run build`.
const buildDir = path.resolve(__dirname, "../Frontend/gen_lab/build");
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
      return res.status(404).json({ message: "Not found" });
    }
    res.sendFile(path.join(buildDir, "index.html"));
  });
  console.log(`Serving frontend build from ${buildDir}`);
} else {
  console.log("Frontend build not found. Run: cd Frontend/gen_lab && npm run build");
}

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, HOST, () =>
  console.log(`GenLab server running on http://${HOST}:${PORT}`)
);
