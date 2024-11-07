const express = require('express');
const router = express.Router();
const database = require("../db");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//router signin
router.get('/signin', (req, res) => {
  res.render('signin');
});

//api xử lý đăng nhập
router.post('/auth', async (req, res) => {
  //các trường email, pass là từ FE gửi lên
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
        res.render('signin', { error: 'Sai email hoặc mật khẩu!' });
      }
    } else {
      res.render('signin', { error: 'Sai email hoặc mật khẩu!' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('signin', { error: 'Lỗi hệ thống!' });
  }
});

// router signup
router.get('/signup', (req, res) => {
  res.render('signup', { message: null, messageType: null });
});

//api xử lý đăng ký
router.post('/auth/signup', async (req, res) => {
  //các trường  là từ FE gửi lên
  const { full_name, password, confirm_password, email } = req.body;
  //validate đúng định dạng email
  if (full_name && password && confirm_password && email) {
      if (!emailRegex.test(email)) {
        return res.render('signup', {
          message: 'Email không hợp lệ!',
          messageType: 'error',
          full_name,
          email
        });
      }
    //pass phải lớn hơn 6 ký tự
    if (password.length < 6) {
      return res.render('signup', {
        message: 'Mật khẩu phải dài hơn 6 ký tự!',
        messageType: 'error',
        full_name,
        email
      });
    }

    if (password !== confirm_password) {
      // Nếu mật khẩu không khớp
      return res.render('signup', {
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
        return res.render('signup', {
          message: 'Email đã tồn tại!',
          messageType: 'error',
          full_name,
          email
        });
      } else {
        await database.query('INSERT INTO users (full_name, password, email) VALUES (?, ?, ?)', [full_name, password, email]);
        return res.render('signup', {
          message: 'Chúc mừng bạn đã đăng ký thành công!',
          messageType: 'success',
          full_name: '',  
          email: ''
        });
      }
    } catch (error) {
      console.error(error);
      return res.render('signup', { message: 'Lỗi server', messageType: 'error', full_name, email });
    }
  } else {
    return res.render('signup', {
      message: 'Vui lòng nhập đầy đủ thông tin!',
      messageType: 'error',
      full_name,
      email
    });
  }
});

// khi đăng xuất thì phải xóa session
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).render('signin', { error: 'Lỗi hệ thống!' });
    }
    res.redirect('/signin');
  });
});

module.exports = router;
