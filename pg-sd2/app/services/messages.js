const db = require("./db");

async function sendMessage(senderId, receiverId, body, listingId) {
  const result = await db.query(
    "INSERT INTO messages (sender_id, receiver_id, body, listing_id) VALUES (?, ?, ?, ?)",
    [senderId, receiverId, body, listingId || null]
  );
  await db.query("UPDATE users SET points = points + 2 WHERE id = ?", [senderId]);
  return result.insertId;
}

async function getConversation(userId, otherUserId) {
  await db.query(
    "UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?",
    [userId, otherUserId]
  );
  return db.query(
    `SELECT m.*, l.title AS listing_title
     FROM messages m
     LEFT JOIN listings l ON l.id = m.listing_id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [userId, otherUserId, otherUserId, userId]
  );
}

async function getInbox(userId) {
  const uid = Number(userId);
  const messages = await db.query(
    `SELECT m.*, u.name AS other_name, l.title AS listing_title
     FROM messages m
     JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
     LEFT JOIN listings l ON l.id = m.listing_id
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at DESC`,
    [uid, uid, uid]
  );

  const convMap = new Map();
  for (const msg of messages) {
    const otherId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
    if (!convMap.has(otherId)) {
      convMap.set(otherId, {
        other_user_id: otherId,
        other_name: msg.other_name,
        last_message: msg.body,
        last_at: msg.created_at,
        listing_title: msg.listing_title,
        unread_count: 0,
      });
    }
    if (msg.receiver_id === uid && !msg.is_read) {
      convMap.get(otherId).unread_count++;
    }
  }
  return Array.from(convMap.values());
}

module.exports = { sendMessage, getConversation, getInbox };
