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
  addUserPoints,
};
