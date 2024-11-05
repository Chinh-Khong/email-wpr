const mysql = require('mysql2/promise');

// Tạo kết nối tới cơ sở dữ liệu
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wpr2201040111',
});

// Kiểm tra kết nối
db.getConnection()
    .then(() => {
        console.log('Kết nối cơ sở dữ có thành công!');
    })
    .catch((error) => {
        console.error('Kết nối cơ sở dữ liệu thất bại:', error.message);
    });

module.exports = db;
