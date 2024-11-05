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
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    await connection.query(`INSERT INTO users (email, password, full_name) VALUES
        ('a@a.com', '123', 'User A'),
        ('b@b.com', '123', 'User B'),
        ('c@c.com', '123', 'User C');
    `);
    
    await connection.query(`INSERT INTO emails (sender_id, receiver_id, subject, sent_at) VALUES
        (2, 1, 'Hello from b@b.com', '2024-01-01 10:00:00'),
        (3, 1, 'Greetings from c@c.com', '2024-01-02 11:00:00'),
        (1, 2, 'Re: Hello', '2024-01-04 13:00:00'),
        (1, 3, 'Re: Greetings', '2024-01-05 14:00:00'),
        (2, 3, 'From b to c', '2024-01-06 15:00:00'),
        (3, 2, 'From c to b', '2024-01-07 16:00:00');
    `);

    await connection.end();
    console.log('Database setup complete.');
})();
