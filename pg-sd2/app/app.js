const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./services/db");
const usersModel = require("./services/users");
const listingsModel = require("./services/listings");
const categoriesModel = require("./services/categories");
const authService = require("./services/auth");
const messagesService = require("./services/messages");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "..", "static")));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "bookswap-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("login", { title: "Login" });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    if (!user) return res.render("login", { title: "Login", error: "Invalid email or password" });
    req.session.userId = user.id;
    req.session.username = user.name;
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("login", { title: "Login", error: "Login failed. Please try again." });
  }
});

app.get("/register", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("register", { title: "Register" });
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;
    if (!name || !email || !password)
      return res.render("register", { title: "Register", error: "All fields are required" });
    const userId = await authService.register(name, email, password, bio);
    req.session.userId = userId;
    req.session.username = name;
    res.redirect("/");
  } catch (err) {
    if (err.message === "Email already registered")
      return res.render("register", { title: "Register", error: err.message });
    console.error(err);
    res.render("register", { title: "Register", error: "Registration failed. Please try again." });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ── Home ──────────────────────────────────────────────────────────────────────

app.get("/", async (req, res) => {
  try {
    const [allUsers, allListings] = await Promise.all([
      usersModel.getAllUsers(),
      listingsModel.getAllListings(),
    ]);
    const available = allListings.filter(l => l.status === "Available").length;
    res.render("index", { title: "Book Swap", userCount: allUsers.length, availableCount: available });
  } catch (err) {
    res.render("index", { title: "Book Swap", userCount: 0, availableCount: 0 });
  }
});

app.get("/db_test", async (req, res) => {
  try {
    const rows = await db.query("SELECT 1 AS ok");
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "DB connection failed" });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────

app.get("/users", async (req, res) => {
  try {
    const users = await usersModel.getAllUsers();
    res.render("users", { title: "Users", users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading users");
  }
});

app.post("/users/:id/points", async (req, res) => {
  try {
    await usersModel.addUserPoints(req.params.id, 5);
    res.redirect(`/users/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user points");
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await usersModel.getUserById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    const listings = await listingsModel.getListingsByUserId(req.params.id);
    res.render("user", { title: user.name, user, listings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading user");
  }
});

// ── Listings ──────────────────────────────────────────────────────────────────

app.get("/listings", async (req, res) => {
  try {
    const { q, category } = req.query;
    const [listings, categories] = await Promise.all([
      listingsModel.searchListings(q, category),
      categoriesModel.getAllCategories(),
    ]);
    const listingsWithCategories = await Promise.all(
      listings.map(async (listing) => {
        const cats = await categoriesModel.getListingCategories(listing.id);
        return { ...listing, categories: cats };
      })
    );
    res.render("listings", {
      title: "Browse Books",
      listings: listingsWithCategories,
      categories,
      q: q || "",
      selectedCategory: category || "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading listings");
  }
});

app.get("/listings/new", requireAuth, async (req, res) => {
  try {
    const categories = await categoriesModel.getAllCategories();
    res.render("add-listing", { title: "Add a Book", categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading form");
  }
});

app.post("/listings", requireAuth, async (req, res) => {
  try {
    const { title, author, isbn, description, book_condition, categories } = req.body;
    if (!title || !author) {
      const allCats = await categoriesModel.getAllCategories();
      return res.render("add-listing", {
        title: "Add a Book",
        categories: allCats,
        error: "Title and author are required",
        form: req.body,
      });
    }
    const listingId = await listingsModel.createListing(req.session.userId, {
      title, author, isbn, description, book_condition,
      categoryIds: categories || [],
    });
    await usersModel.addUserPoints(req.session.userId, 5);
    res.redirect(`/book/${listingId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating listing");
  }
});

app.get("/book/:id/matches", async (req, res) => {
  try {
    const listing = await listingsModel.getListingById(req.params.id);
    if (!listing) return res.status(404).send("Listing not found");
    const matches = await listingsModel.getMatchingListings(req.params.id);
    res.render("listing-matches", { title: "Matching Listings", listing, matches });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading matching listings");
  }
});

app.get("/book/:id", async (req, res) => {
  try {
    const listing = await listingsModel.getListingById(req.params.id);
    if (!listing) return res.status(404).send("Listing not found");
    const [categories, owner] = await Promise.all([
      categoriesModel.getListingCategories(req.params.id),
      usersModel.getUserById(listing.user_id),
    ]);
    res.render("book", { title: listing.title, listing, categories, owner });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading listing");
  }
});

app.post("/book/:id/swap", requireAuth, async (req, res) => {
  try {
    const listing = await listingsModel.getListingById(req.params.id);
    if (!listing) return res.status(404).send("Listing not found");
    if (listing.user_id !== req.session.userId) return res.status(403).send("Not your listing");
    await listingsModel.markAsSwapped(req.params.id);
    await usersModel.addUserPoints(req.session.userId, 15);
    res.redirect(`/book/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error marking swap");
  }
});

app.post("/book/:id/delete", requireAuth, async (req, res) => {
  try {
    const listing = await listingsModel.getListingById(req.params.id);
    if (!listing) return res.status(404).send("Listing not found");
    if (listing.user_id !== req.session.userId) return res.status(403).send("Not your listing");
    await listingsModel.deleteListing(req.params.id);
    res.redirect(`/users/${req.session.userId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting listing");
  }
});

// ── Messages ──────────────────────────────────────────────────────────────────

app.get("/messages", requireAuth, async (req, res) => {
  try {
    const conversations = await messagesService.getInbox(req.session.userId);
    res.render("messages", { title: "Messages", conversations });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading messages");
  }
});

app.get("/messages/conversation/:userId", requireAuth, async (req, res) => {
  try {
    const otherUser = await usersModel.getUserById(req.params.userId);
    if (!otherUser) return res.status(404).send("User not found");
    const messages = await messagesService.getConversation(req.session.userId, req.params.userId);
    const listingId = req.query.listing_id || null;
    res.render("conversation", { title: `Chat with ${otherUser.name}`, otherUser, messages, listingId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading conversation");
  }
});

app.post("/messages", requireAuth, async (req, res) => {
  try {
    const { receiver_id, body, listing_id } = req.body;
    if (!receiver_id || !body) return res.status(400).send("Missing fields");
    await messagesService.sendMessage(req.session.userId, receiver_id, body, listing_id);
    res.redirect(`/messages/conversation/${receiver_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending message");
  }
});

module.exports = app;
