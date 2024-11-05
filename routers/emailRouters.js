// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const database = require("../db");
// // Trang soạn thư
// router.get('/compose', (req, res) => {
//     res.render('compose');
// });

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
        WHERE receiver_id = ?
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
    res.status(500).render('inbox', { error: 'Lỗi server' });
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
      WHERE sender_id = ?
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
    res.status(500).render('outbox', { error: 'Lỗi server' });
  }
});

//router detail email
router.get('/email/:id', async (req, res) => {
  const emailId = req.params.id;
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
      res.render('emailDetail', { email: email[0] });
    } else {
      res.status(404).send('Email not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});

//api xóa hộp thư

router.delete('/api/emails/sender/:id', async (req, res) => {
  // Ensure the user is logged in
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.session.userId;
  const emailId = req.params.id;

  try {
    // Check if the email belongs to the logged-in user
    const checkEmailQuery = `SELECT * FROM emails WHERE id = ? AND sender_id = ?`;
    const [[email]] = await database.query(checkEmailQuery, [emailId, userId]);

    if (!email) {
      return res.status(404).json({ message: 'Email not found or not authorized to delete' });
    }

    // Delete the email
    const deleteEmailQuery = `DELETE FROM emails WHERE id = ?`;
    await database.query(deleteEmailQuery, [emailId]);

    res.status(200).json({ message: 'Emails deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/api/emails/receiver/:id', async (req, res) => {
  // Ensure the user is logged in
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
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

    // Delete the email
    const deleteEmailQuery = `DELETE FROM emails WHERE id = ?`;
    await database.query(deleteEmailQuery, [emailId]);

    res.status(200).json({ message: 'Emails deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;