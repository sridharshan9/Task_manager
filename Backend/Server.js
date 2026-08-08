require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

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

// Set up PostgreSQL Pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// PostgreSQL Query Helper
const query = (text, params = []) => pool.query(text, params).then((res) => res.rows);

async function initDatabase() {
  // Create ENUM types if they don't exist
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('super_admin', 'manager', 'employee');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create Users Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL DEFAULT '',
      role user_role NOT NULL DEFAULT 'manager',
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Tasks Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status task_status NOT NULL DEFAULT 'pending',
      priority task_priority NOT NULL DEFAULT 'medium',
      due_date VARCHAR(100) NOT NULL DEFAULT '',
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      started_at TIMESTAMP DEFAULT NULL,
      completed_at TIMESTAMP DEFAULT NULL
    )
  `);

  // Seed Superadmin
  const existing = await query("SELECT id FROM users WHERE email = $1", [SUPERADMIN_EMAIL]);
  if (existing.length === 0) {
    const hash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
    await query(
      "INSERT INTO users (email, full_name, role, password) VALUES ($1, 'Super Admin', 'super_admin', $2)",
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

    const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const user = await query(
      "INSERT INTO users (email, full_name, role, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [normalizedEmail, full_name || "", roleValue, hash]
    );
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
    const rows = await query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
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
      `SELECT * FROM tasks ORDER BY 
        CASE status 
          WHEN 'pending' THEN 1 
          WHEN 'in_progress' THEN 2 
          WHEN 'completed' THEN 3 
        END, created_at DESC`
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
    const task = await query(
      "INSERT INTO tasks (title, description, priority, due_date, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [String(title).trim(), description || null, priorityValue, due_date || "", created_by || null]
    );
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
    const current = await query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (current.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    const task = current[0];
    const newStatus = status || task.status;

    let startedAt = task.started_at;
    let completedAt = task.completed_at;
    if (status === "in_progress" && task.status !== "in_progress") startedAt = new Date();
    if (status === "completed" && task.status !== "completed") completedAt = new Date();
    if (status === "pending") {
      startedAt = null;
      completedAt = null;
    }

    const updated = await query(
      `UPDATE tasks
         SET title = $1, description = $2, priority = $3, due_date = $4, status = $5,
             started_at = $6, completed_at = $7
       WHERE id = $8
       RETURNING *`,
      [
        title !== undefined ? title : task.title,
        description !== undefined ? description : task.description,
        priority !== undefined ? priority : task.priority,
        due_date !== undefined ? due_date : task.due_date,
        newStatus,
        startedAt,
        completedAt,
        id,
      ]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error("Update task error:", err.message);
    res.status(500).json({ message: "Failed to update task." });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
    if (result.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.json({ message: "Task deleted." });
  } catch (err) {
    console.error("Delete task error:", err.message);
    res.status(500).json({ message: "Failed to delete task." });
  }
});

// ---------------- Stats Route (SQL Aggregated) ----------------

app.get("/api/stats", async (_req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE priority IN ('high', 'urgent'))::int AS urgent,
        COUNT(*) FILTER (WHERE status != 'completed' AND due_date != '' AND due_date < $1)::int AS overdue
      FROM tasks
    `, [today]);

    const stats = rows[0];
    const total = stats.total || 0;
    const completed = stats.completed || 0;

    res.json({
      total,
      completed,
      inProgress: stats.in_progress || 0,
      pending: stats.pending || 0,
      urgent: stats.urgent || 0,
      overdue: stats.overdue || 0,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ message: "Failed to load stats." });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

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