const db = require("./db");

async function getAllCategories() {
  return await db.query("SELECT * FROM categories");
}

async function getListingCategories(listingId) {
  return await db.query(
    `SELECT c.*
     FROM categories c
     JOIN listing_categories lc ON lc.category_id = c.id
     WHERE lc.listing_id = ?`,
    [listingId]
  );
}

module.exports = {
  getAllCategories,
  getListingCategories,
};