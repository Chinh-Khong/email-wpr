//emailRoutes.js
const express = require('express');
const router = express.Router();
const database = require("../db");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/denied', async (req, res) => {
  return res.render('denied');
})

//api get inbox
router.get('/inbox', async (req, res) => {
  //kiểm tra xem bạn đã đăng nhập hay chưa , nếu chưa thì show trang denied
  if (!req.session.userId) {
    return res.status(403).render('denied', { message: 'Vui lòng đăng nhập' });
  }

  //nếu đã đăng nhập thì sẽ show trang inbox , vì trang inbox cần phải có các value (userName,receivedEmails , currentPage , totalPages) nên cần phải lấy value của các field này
  const userId = req.session.userId;
  const userName = req.session.fullName;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  try {
    const countQuery = `SELECT COUNT(*) as count FROM emails WHERE receiver_id = ?`;
    const [[{ count }]] = await database.query(countQuery, [userId]);
    const totalPages = Math.ceil(count / limit);
    // câu query lấy ra những danh sách của hộp thư đến , và thêm điều kiện để show ra các hộp thư này nếu người gửi xóa hộp thư này của họ
    const receivedEmailsQuery = `
        SELECT emails.*, users.full_name AS sender_name
        FROM emails
        JOIN users ON emails.sender_id = users.id
        WHERE receiver_id = ? AND status_receiver = 1
        LIMIT ? OFFSET ?
      `;

    const [receivedEmails] = await database.query(receivedEmailsQuery, [userId, limit, offset]);
    //nếu đúng chuyển sang trang inbox và truyền các value cần 
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

//api get outbox
router.get('/outbox', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).render('denied', { message: 'Vui lòng đăng nhập' });
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

//api get detail email (path params)
router.get('/email/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).render('denied', { message: 'Vui lòng đăng nhập' });
  }

  const emailId = req.params.id;
  const userName = req.session.fullName;

  try {
    const emailDetailQuery = `
            SELECT emails.*, users.full_name AS sender_name
            FROM emails
            JOIN users ON emails.sender_id = users.id
            WHERE emails.id = ?
        `;
    const [email] = await database.query(emailDetailQuery, [emailId]);

    if (email.length > 0) {
      res.render('emailDetail', { email: email[0], userName });
    } else {
      res.status(404).send('Không tìm thấy email!');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server!');
  }
});

//api xóa hộp thư đi(path params)
router.delete('/api/emails/sender/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).render('denied', { message: 'Vui lòng đăng nhập' });
  }
  const userId = req.session.userId;
  const emailId = req.params.id;

  try {
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

//api xóa hộp thư đến(path params)
router.delete('/api/emails/receiver/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(403).render('denied', { message: 'Vui lòng đăng nhập' });
  }
  const userId = req.session.userId;
  const emailId = req.params.id;

  try {
    const checkEmailQuery = `SELECT * FROM emails WHERE id = ? AND receiver_id = ?`;
    const [[email]] = await database.query(checkEmailQuery, [emailId, userId]);
    if (!email) {
      return res.status(404).json({ message: 'Email not found or not authorized to delete' });
    }
    const updateEmailQuery = 'UPDATE emails SET status_receiver = 0 WHERE id = ?'
    await database.query(updateEmailQuery, [emailId]);
    //
    res.status(200).json({ message: 'Xóa hội thoại thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server!' });
  }
});

//api get soạn tin
router.get('/compose', async (req, res) => {
  const userName = req.session.fullName;

  if (!req.session.userId) {
    return res.status(403).render('denied', { message: 'Vui lòng đăng nhập' });
  }

  try {
    const [users] = await database.query('SELECT email FROM users');
    res.render('compose', { users, error: null, userName });
  } catch (error) {
    console.error(error);
    res.render('compose', { users: [], error: 'Lỗi server! khi tải danh sách người dùng', userName });
  }
});

//api soạn tin nhắn
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
    const attachmentPath = req.file ? req.file.path : null;

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