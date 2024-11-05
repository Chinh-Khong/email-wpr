const mysql = require('mysql2/promise');

(async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS wpr2201040111`);
    await connection.query(`USE wpr2201040111`);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL
        );
    `);

    await connection.query(`
        CREATE TABLE IF NOT EXISTS emails (
            id INT PRIMARY KEY AUTO_INCREMENT,
            sender_id INT NOT NULL,
            receiver_id INT NOT NULL,
            subject VARCHAR(255),
            message TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        );
    `);

    await connection.query(`INSERT INTO users (email, password, full_name) VALUES
        ('a@a.com', '123', 'User A'),
        ('b@b.com', '123', 'User B'),
        ('c@c.com', '123', 'User C');
    `);

    await connection.end();
    console.log('Database setup complete.');
})();
