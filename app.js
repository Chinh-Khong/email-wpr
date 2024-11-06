// // app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // Import express-session
const path = require('path');
const authRoutes = require('./routers/authRouters');
const emailRoutes = require('./routers/emailRouters');
const app = express();
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
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.render('inbox');
  } else {
    res.render('login');
  }
});


const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
