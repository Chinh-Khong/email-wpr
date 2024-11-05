const express = require('express');
const router = express.Router();
const database = require("../db");

// Handle login
router.post('/auth', async (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  try {
    const [rows] = await database.query(query, [email]);
    if (rows.length > 0) {
      const user = rows[0];
      if (user.password === password) {
        req.session.userId = user.id;
        req.session.fullName = user.full_name;
        return res.redirect('/inbox');
      } else {
        res.render('login', { error: 'Sai email hoặc mật khẩu' });
      }
    } else {
      res.render('login', { error: 'Sai email hoặc mật khẩu' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('login', { error: 'Lỗi server' });
  }
});

// Registration page
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/auth-register', (req, res) => {
  const { full_name, email, password } = req.body;
  const query = 'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)';
  database.query(query, [full_name, email, password], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).render('register', { error: 'Lỗi server' });
    }
    // Render the registration page with a success message
   return res.render('hahahaha');
  });
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).render('login', { error: 'Lỗi server' });
    }
    res.redirect('/login');
  });
});

module.exports = router;
