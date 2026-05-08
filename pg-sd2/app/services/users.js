const db = require("./db");

async function getAllUsers() {
  return db.query("SELECT * FROM users ORDER BY points DESC");
}

async function getUserById(id) {
  const rows = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}

async function getUserByEmail(email) {
  const rows = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}

async function updateUser(id, { name, bio, password }) {
  if (password) {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(password, 10);
    return db.query("UPDATE users SET name=?, bio=?, password=? WHERE id=?", [name, bio || null, hash, id]);
  }
  return db.query("UPDATE users SET name=?, bio=? WHERE id=?", [name, bio || null, id]);
}

async function addUserPoints(userId, pointsToAdd) {
  return db.query(
    "UPDATE users SET points = points + ? WHERE id = ?",
    [pointsToAdd, userId]
  );
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  addUserPoints,
};
