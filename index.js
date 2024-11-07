// // index.js
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // Import express-session
const path = require('path');
const authRoutes = require('./routers/authRouters');
const emailRoutes = require('./routers/emailRouters');
const app = express();
const database = require("./db");

app.use('/uploads', express.static('uploads'));

app.use(express.static('public'));

// Middleware
app.use(express.urlencoded({ extended: true })); //phân tích dữ liệu từ form
app.use(cookieParser());

// Set up session middleware
app.use(session({
  secret: 'wpr_ntmp', // Replace with a strong secret
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: true, secure: false } //nếu muốn là HTTPS thì set secure là true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Sử dụng router
app.use('/', authRoutes);
app.use('/', emailRoutes);
app.get('/', async (req, res) => {
  if (req.session.userId) {
    // res.render('inbox');
    const userId = req.session.userId;
    const userName = req.session.fullName;
    const page = parseInt(req.query.page) || 1; // Get page number from query, default is 1
    const limit = 5; // Number of emails per page
    const offset = (page - 1) * limit; // Calculate offset

    try {
      // Get the total count of emails
      const countQuery = `SELECT COUNT(*) as count FROM emails WHERE receiver_id = ?`;
      const [[{ count }]] = await database.query(countQuery, [userId]);
      const totalPages = Math.ceil(count / limit);

      // Fetch emails for the current page
      const receivedEmailsQuery = `
        SELECT emails.*, users.full_name AS sender_name
        FROM emails
        JOIN users ON emails.sender_id = users.id
        WHERE receiver_id = ? AND status_receiver = 1
        LIMIT ? OFFSET ?
      `;
      const [receivedEmails] = await database.query(receivedEmailsQuery, [userId, limit, offset]);

      res.render('inbox', {
        userName,
        receivedEmails,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('signin', { error: 'Lỗi hệ thống!' });
    }
  } else {
    res.render('signin');
  }
});


const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
