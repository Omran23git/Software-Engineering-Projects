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

async function searchListings(q, categoryId) {
  let sql = "SELECT DISTINCT l.* FROM listings l";
  const params = [];
  if (categoryId) sql += " JOIN listing_categories lc ON lc.listing_id = l.id";
  sql += " WHERE 1=1";
  if (q) {
    sql += " AND (l.title LIKE ? OR l.author LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (categoryId) {
    sql += " AND lc.category_id = ?";
    params.push(categoryId);
  }
  sql += " ORDER BY l.created_at DESC";
  return db.query(sql, params);
}

async function createListing(userId, { title, author, isbn, description, book_condition, categoryIds }) {
  const result = await db.query(
    "INSERT INTO listings (user_id, title, author, isbn, description, book_condition, status) VALUES (?, ?, ?, ?, ?, ?, 'Available')",
    [userId, title, author, isbn || null, description || null, book_condition || null]
  );
  const listingId = result.insertId;
  const ids = Array.isArray(categoryIds) ? categoryIds : (categoryIds ? [categoryIds] : []);
  for (const catId of ids) {
    await db.query("INSERT INTO listing_categories (listing_id, category_id) VALUES (?, ?)", [listingId, catId]);
  }
  return listingId;
}

async function updateListing(id, { title, author, isbn, description, book_condition, status, categoryIds }) {
  await db.query(
    "UPDATE listings SET title=?, author=?, isbn=?, description=?, book_condition=?, status=? WHERE id=?",
    [title, author, isbn || null, description || null, book_condition || null, status || 'Available', id]
  );
  await db.query("DELETE FROM listing_categories WHERE listing_id = ?", [id]);
  const ids = Array.isArray(categoryIds) ? categoryIds : (categoryIds ? [categoryIds] : []);
  for (const catId of ids) {
    await db.query("INSERT INTO listing_categories (listing_id, category_id) VALUES (?, ?)", [id, catId]);
  }
}

async function deleteListing(id) {
  await db.query("DELETE FROM messages WHERE listing_id = ?", [id]);
  await db.query("DELETE FROM listing_categories WHERE listing_id = ?", [id]);
  return db.query("DELETE FROM listings WHERE id = ?", [id]);
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
  getAllListings, getListingById, getListingsByUserId,
  searchListings, createListing, updateListing, deleteListing,
  markAsSwapped, getMatchingListings,
};
