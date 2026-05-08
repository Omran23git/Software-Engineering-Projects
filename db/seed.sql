DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT INTO users (name, email) VALUES
('Ismail Aktouf', 'ismail@example.com'),
('Omran Ali', 'omran@example.com'),
('Sarah Khan', 'sarah@example.com');

INSERT INTO categories (name) VALUES
('Fiction'),
('Non-Fiction'),
('Academic');

INSERT INTO listings (title, description, price, user_id, category_id) VALUES
('Atomic Habits', 'Self-improvement book in great condition', 10.00, 1, 2),
('The Great Gatsby', 'Classic fiction novel', 5.00, 2, 1),
('Introduction to Algorithms', 'University textbook, slightly used', 30.00, 3, 3);
