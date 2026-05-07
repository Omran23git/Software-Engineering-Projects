const db = require("./db");

async function getAllUsers() {
  return await db.query("SELECT * FROM users");
}

async function getUserById(id) {
  const rows = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}

async function addUserPoints(userId, pointsToAdd) {
  return await db.query(
    "UPDATE users SET points = points + ? WHERE id = ?",
    [pointsToAdd, userId]
  );
}

module.exports = {
  getAllUsers,
  getUserById,
  addUserPoints,
};
