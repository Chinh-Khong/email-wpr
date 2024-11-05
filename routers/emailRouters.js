// routes/emailRoutes.js
const express = require('express');
const router = express.Router();

// Trang inbox
router.get('/inbox', (req, res) => {
    res.render('inbox', {fullName: req.session.fullName});
});

// // Trang outbox
// router.get('/outbox', (req, res) => {
//     res.render('outbox');
// });

// // Trang soạn thư
// router.get('/compose', (req, res) => {
//     res.render('compose');
// });

router.get('/inbox', (req, res) => {
    const user_id = req.cookies.user_id;
    if (!user_id) return res.status(403).send("Access denied");

    const query = `
        SELECT e.id, u.full_name AS sender_name, e.subject, e.created_at
        FROM emails e
        JOIN users u ON e.sender_id = u.id
        WHERE e.receiver_id = ?
        ORDER BY e.created_at DESC
        LIMIT 5
    `;
    db.query(query, [user_id], (err, emails) => {
        if (err) throw err;
        res.render('inbox', { emails });
    });
});

module.exports = router;