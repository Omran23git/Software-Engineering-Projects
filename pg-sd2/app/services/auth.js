const db = require("./db");
const bcrypt = require("bcryptjs");

async function register(name, email, password, bio) {
  const existing = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) throw new Error("Email already registered");
  const hash = await bcrypt.hash(password, 10);
  const result = await db.query(
    "INSERT INTO users (name, email, password, bio, points) VALUES (?, ?, ?, ?, 10)",
    [name, email, hash, bio || null]
  );
  return result.insertId;
}

async function login(email, password) {
  const rows = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  if (rows.length === 0) return null;
  const user = rows[0];
  // Support both bcrypt hashes (new accounts) and plain text (seeded accounts)
  const match = user.password.startsWith("$2")
    ? await bcrypt.compare(password, user.password)
    : password === user.password;
  return match ? user : null;
}

module.exports = { register, login };
