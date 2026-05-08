const db = require("./db");

async function getAllListings() {
  return db.query("SELECT * FROM listings ORDER BY created_at DESC");
}

async function getListingById(id) {
  const rows = await db.query("SELECT * FROM listings WHERE id = ?", [id]);
  return rows[0];
}

async function getListingsByUserId(userId) {
  return db.query("SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC", [userId]);
}

async function markAsSwapped(id) {
  return db.query("UPDATE listings SET status = 'Swapped' WHERE id = ?", [id]);
}

async function getMatchingListings(listingId) {
  return db.query(
    `SELECT l.*, COUNT(*) AS match_score
     FROM listings l
     JOIN listing_categories lc ON lc.listing_id = l.id
     WHERE lc.category_id IN (
       SELECT category_id FROM listing_categories WHERE listing_id = ?
     )
     AND l.id != ?
     AND l.status = 'Available'
     GROUP BY l.id
     ORDER BY match_score DESC`,
    [listingId, listingId]
  );
}

module.exports = {
  getAllListings,
  getListingById,
  getListingsByUserId,
  markAsSwapped,
  getMatchingListings,
};
