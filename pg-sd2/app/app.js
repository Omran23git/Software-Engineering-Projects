const express = require("express");
const path = require("path");
const db = require("./services/db");
const usersModel = require("./services/users");
const listingsModel = require("./services/listings");
const categoriesModel = require("./services/categories");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "..", "static")));
app.get("/", function (req, res) {
  res.render("index");
});

app.get("/db_test", async function (req, res) {
  try {
    const rows = await db.query("SELECT 1 AS ok");
    res.json(rows[0]);
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

app.get("/users", async function (req, res) {
  try {
    const users = await usersModel.getAllUsers();
    res.render("users", { users: users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading users");
  }
});

app.post("/users/:id/points", async function (req, res) {
  try {
    await usersModel.addUserPoints(req.params.id, 5);
    res.redirect(`/users/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user points");
  }
});

app.get("/users/:id", async function (req, res) {
  try {
    const user = await usersModel.getUserById(req.params.id);
    const listings = await listingsModel.getListingsByUserId(req.params.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("user", { user: user, listings: listings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading user");
  }
});

app.get("/listings", async function (req, res) {
  try {
    const listings = await listingsModel.getAllListings();

    const listingsWithCategories = await Promise.all(
      listings.map(async function (listing) {
        const categories = await categoriesModel.getListingCategories(listing.id);
        return {
          ...listing,
          categories: categories,
        };
      })
    );

    res.render("listings", { listings: listingsWithCategories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading listings");
  }
});

app.get("/book/:id/matches", async function (req, res) {
  try {
    const listing = await listingsModel.getListingById(req.params.id);

    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    const matches = await listingsModel.getMatchingListings(req.params.id);

    res.render("listing-matches", {
      listing: listing,
      matches: matches,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading matching listings");
  }
});

app.get("/book/:id", async function (req, res) {
  try {
    const listing = await listingsModel.getListingById(req.params.id);

    if (!listing) {
      return res.status(404).send("Listing not found");
    }

    const categories = await categoriesModel.getListingCategories(req.params.id);
    const owner = await usersModel.getUserById(listing.user_id);

    res.render("book", {
      listing: listing,
      categories: categories,
      owner: owner,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading listing");
  }
});

module.exports = app;