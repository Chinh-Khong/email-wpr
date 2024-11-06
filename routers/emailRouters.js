// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const database = require("../db");
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Folder where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});
const upload = multer({ storage: storage });

//router inbox
router.get('/inbox', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const userId = req.session.userId;
  const userName = req.session.fullName;
  const page = parseInt(req.query.page) || 1; // Lấy số trang từ query string, mặc định là 1
  const limit = 5; // Số email trên mỗi trang
  const offset = (page - 1) * limit; // Tính toán offset

  try {
    // Truy vấn số lượng email để tính số trang
    const countQuery = `SELECT COUNT(*) as count FROM emails WHERE receiver_id = ?`;
    const [[{ count }]] = await database.query(countQuery, [userId]);
    const totalPages = Math.ceil(count / limit);

    // Fetch emails received by the user with pagination
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
    res.status(500).render('inbox', { error: 'Lỗi server!' });
  }
});

//router outbox
router.get('/outbox', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const userId = req.session.userId;
  const userName = req.session.fullName;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  try {
    const countQuery = `SELECT COUNT(*) as count FROM emails WHERE sender_id = ?`;
    const [[{ count }]] = await database.query(countQuery, [userId]);
    const totalPages = Math.ceil(count / limit);

    const sentEmailsQuery = `
      SELECT emails.*, users.full_name AS receiver_name
      FROM emails
      JOIN users ON emails.receiver_id = users.id
      WHERE sender_id = ? AND status_sender = 1
      LIMIT ? OFFSET ?`;
    const [sentEmails] = await database.query(sentEmailsQuery, [userId, limit, offset]);

    res.render('outbox', {
      sentEmails,
      userName,
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('outbox', { error: 'Lỗi server!' });
  }
});

//router detail email
router.get('/email/:id', async (req, res) => {
  const emailId = req.params.id;
  const userName = req.session.fullName;
  try {
    // Fetch email details by ID
    const emailDetailQuery = `
            SELECT emails.*, users.full_name AS sender_name
            FROM emails
            JOIN users ON emails.sender_id = users.id
            WHERE emails.id = ?
        `;
    const [email] = await database.query(emailDetailQuery, [emailId]);

    if (email.length > 0) {
      // Render the email detail page with email data
      res.render('emailDetail', { email: email[0], userName });
    } else {
      res.status(404).send('Không tìm thấy email!');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server!');
  }
});

//api xóa hộp thư

router.delete('/api/emails/sender/:id', async (req, res) => {
  // Ensure the user is logged in
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Vui lòng hãy đăng nhập tài khoản' });
  }

  const userId = req.session.userId;
  const emailId = req.params.id;

  try {
    // Check if the email belongs to the logged-in user
    const checkEmailQuery = `SELECT * FROM emails WHERE id = ? AND sender_id = ?`;
    const [[email]] = await database.query(checkEmailQuery, [emailId, userId]);

    if (!email) {
      return res.status(404).json({ message: 'Không tìm thấy email!' });
    }
    const updateEmailQuery = `UPDATE emails SET status_sender = 0 WHERE id = ?`;
    await database.query(updateEmailQuery, [emailId]);

    res.status(200).json({ message: 'Xóa hội thoại thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

router.delete('/api/emails/receiver/:id', async (req, res) => {
  // Ensure the user is logged in
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Vui lòng hãy đăng nhập tài khoản!' });
  }

  const userId = req.session.userId;
  const emailId = req.params.id;

  try {
    // Check if the email belongs to the logged-in user
    const checkEmailQuery = `SELECT * FROM emails WHERE id = ? AND receiver_id = ?`;
    const [[email]] = await database.query(checkEmailQuery, [emailId, userId]);
    if (!email) {
      return res.status(404).json({ message: 'Email not found or not authorized to delete' });
    }
    //update status_receiver
    const updateEmailQuery = 'UPDATE emails SET status_receiver = 0 WHERE id = ?'
    await database.query(updateEmailQuery, [emailId]);
    //
    res.status(200).json({ message: 'Xóa hội thoại thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

//compose
// GET route for composing email
router.get('/compose', async (req, res) => {
  const userName = req.session.fullName;

  if (!req.session.userId) {
    return res.redirect('/login');
  }

  try {
    const [users] = await database.query('SELECT email FROM users');
    res.render('compose', { users, error: null, userName });
  } catch (error) {
    console.error(error);
    res.render('compose', { users: [], error: 'Lỗi server! khi tải danh sách người dùng', userName });
  }
});

// POST route to compose and send email with file upload
router.post('/email/compose', upload.single('attachment'), async (req, res) => {
  const userName = req.session.fullName;
  if (!req.session.userId) {
    return res.render('compose', { users, error: 'Vui lòng hãy đăng nhập tài khoản', userName });
  }
  const [users] = await database.query('SELECT email FROM users');
  const { receiverEmail, subject, content } = req.body;
  const senderId = req.session.userId;

  if (!receiverEmail) {
    return res.render('compose', { users, error: 'Vui lòng chọn người nhận', userName });
  }

  try {
    const checkUserQuery = 'SELECT id FROM users WHERE email = ?';
    const [[receiver]] = await database.query(checkUserQuery, [receiverEmail]);

    if (!receiver) {
      return res.render('compose', { users, error: 'Người nhận không tồn tại', userName });
    }

    const receiverId = receiver.id;
    const attachmentPath = req.file ? req.file.path : null; // Path to uploaded file

    const insertEmailQuery = `
      INSERT INTO emails (sender_id, receiver_id, subject, message, sent_at, status_sender, status_receiver, attachment)
      VALUES (?, ?, ?, ?, NOW(), 1, 1, ?)
    `;
    await database.query(insertEmailQuery, [senderId, receiverId, subject, content, attachmentPath]);

    return res.redirect('/outbox');
  } catch (err) {
    console.error(err);
    res.render('compose', { users, error: 'Lỗi server! Không thể gửi thư', userName });
  }
});

module.exports = router;