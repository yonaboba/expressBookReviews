const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");  // Assuming you have books data in booksdb.js
let users = require('./general.js').users;  // Get the shared users array from general.js
const regd_users = express.Router();

// Authenticate a user by username and password
const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
}

// Login route for registered users
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Validate if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  // Validate user credentials
  if (authenticatedUser(username, password)) {
    // Generate a JWT token
    let accessToken = jwt.sign({ username: username }, 'secretkey', { expiresIn: '1h' });
    
    // Save the token in the session, but don't return it to the user
    req.session.token = accessToken;
    req.session.username = username;  // Save the username in the session for review purposes
    
    return res.status(200).json({ message: "Login successful" });  // No token in response
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

// Add or modify a book review for authenticated users
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;  // Get review from the request query

  if (!review) {
    return res.status(400).json({ message: "Review is required" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  const username = req.session.username;  // Retrieve username from session after login

  if (!username) {
    return res.status(401).json({ message: "Unauthorized: User must be logged in" });
  }

  // Ensure the book has a reviews object
  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // If the user has already reviewed the book, update the review
  if (books[isbn].reviews[username]) {
    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review updated successfully" });
  }

  // Otherwise, add a new review
  books[isbn].reviews[username] = review;
  return res.status(200).json({ message: "Review added successfully" });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.username;  // Retrieve username from session

  if (!username) {
    return res.status(401).json({ message: "Unauthorized: User must be logged in" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Check if the review exists and belongs to the logged-in user
  if (books[isbn].reviews && books[isbn].reviews[username]) {
    delete books[isbn].reviews[username];  // Delete the review
    return res.status(200).json({ message: "Review deleted successfully" });
  } else {
    return res.status(404).json({ message: "Review not found or you don't have permission to delete this review" });
  }
});

module.exports.authenticated = regd_users;
