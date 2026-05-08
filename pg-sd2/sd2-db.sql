DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS listing_categories;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points INT DEFAULT 0
);

CREATE TABLE listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(150) NOT NULL,
    isbn VARCHAR(20),
    description TEXT,
    book_condition VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE listing_categories (
    listing_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (listing_id, category_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT INTO users (name, email, password, bio, points) VALUES
('Ismail Aktouf', 'ismail@example.com', 'password123', 'BookSwap user interested in self-improvement and academic books', 20),
('Omran Ali', 'omran@example.com', 'password123', 'Enjoys classic novels and fiction', 15),
('Sarah Khan', 'sarah@example.com', 'password123', 'University student selling textbooks', 10);

INSERT INTO categories (name) VALUES
('Fiction'),
('Classic'),
('Textbook'),
('Computer Science'),
('Non-fiction'),
('Self-help');

INSERT INTO listings (user_id, title, author, isbn, description, book_condition, status) VALUES
(1, 'Atomic Habits', 'James Clear', '9780735211292', 'Self-improvement book in great condition', 'Very Good', 'Available'),
(2, 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Classic fiction novel', 'Good', 'Available'),
(3, 'Introduction to Algorithms', 'Thomas H. Cormen', '9780262046305', 'University textbook, slightly used', 'Used', 'Available'),
(2, '1984', 'George Orwell', '9780451524935', 'Classic dystopian fiction novel.', 'Good', 'Available');

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    listing_id INT,
    body TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id)
);

INSERT INTO listing_categories (listing_id, category_id) VALUES
(1, 5),
(1, 6),
(2, 1),
(2, 2),
(3, 3),
(3, 4),
(4, 1),
(4, 2);