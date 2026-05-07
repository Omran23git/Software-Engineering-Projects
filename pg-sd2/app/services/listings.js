const db = require("./db");

async function getAllListings() {
  return await db.query("SELECT * FROM listings");
}

async function getListingById(id) {
  const rows = await db.query("SELECT * FROM listings WHERE id = ?", [id]);
  return rows[0];
}

async function getListingsByUserId(userId) {
  return await db.query("SELECT * FROM listings WHERE user_id = ?", [userId]);
}

module.exports = {
  getAllListings,
  getListingById,
  getListingsByUserId,
  getMatchingListings,
};

async function getMatchingListings(listingId) {
  return await db.query(
    `
    SELECT DISTINCT l.*
    FROM listings l
    JOIN listing_categories lc ON lc.listing_id = l.id
    WHERE lc.category_id IN (
      SELECT category_id
      FROM listing_categories
      WHERE listing_id = ?
    )
    AND l.id != ?
    `,
    [listingId, listingId]
  );
}