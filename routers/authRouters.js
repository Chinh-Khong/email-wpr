const express = require('express');
const router = express.Router();
const database = require("../db");
router.get('/login', (req, res) => {
  res.render('login'); 
});
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
  res.render('register', { message: null, messageType: null });
});


// Handle registration
router.post('/auth/register', async (req, res) => {
  const { full_name, password, confirm_password, email } = req.body;
  // Kiểm tra các trường nhập liệu
  if (full_name && password && confirm_password && email) {
    //pass phải lớn hơn 6 ký tự
    if (password.length < 6) {
      return res.render('register', { 
        message: 'Mật khẩu phải dài hơn 6 ký tự!', 
        messageType: 'error', 
        full_name, 
        email 
      });
    }

    if (password !== confirm_password) {
      // Nếu mật khẩu không khớp
      return res.render('register', {
        message: 'Mật khẩu không khớp!',
        messageType: 'error',
        full_name,
        email
      });
    }

    try {
      const [existingUser] = await database.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        // Nếu email đã tồn tại
        return res.render('register', {
          message: 'Email đã tồn tại!',
          messageType: 'error',
          full_name,
          email
        });
      } else {
        // Đăng ký thành công, lưu thông tin người dùng (không bao gồm confirm_password)
        await database.query('INSERT INTO users (full_name, password, email) VALUES (?, ?, ?)', [full_name, password, email]);
        return res.render('register', {
          message: 'Chúc mừng bạn đã đăng ký thành công!',
          messageType: 'success',
          full_name: '',  // Reset các giá trị sau khi đăng ký thành công
          email: ''
        });
      }
    } catch (error) {
      console.error(error);
      return res.render('register', { message: 'Lỗi server', messageType: 'error', full_name, email });
    }
  } else {
    return res.render('register', {
      message: 'Vui lòng nhập đầy đủ thông tin!',
      messageType: 'error',
      full_name,
      email
    });
  }
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
