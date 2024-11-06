const mysql = require('mysql2/promise');

(async () => {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS wpr2201040123`);
    await connection.query(`USE wpr2201040123`);

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
            status_sender INT,
            status_receiver INT,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    await connection.query(`
      INSERT IGNORE INTO users (email, password, full_name) VALUES
      ('a@a.com', '123', 'User A'),
      ('b@b.com', '123', 'User B'),
      ('c@c.com', '123', 'User C');
  `);
  
    
    await connection.query(`
      INSERT INTO emails (sender_id, receiver_id, subject, message, sent_at, status_sender, status_receiver, attachment) VALUES
      (2, 1, 'Hello from b@b.com', NULL, '2024-01-01 10:00:00', 1, 1, NULL),
      (3, 1, 'Greetings from c@c.com', NULL, '2024-01-02 11:00:00', 1, 1, NULL),
      (1, 2, 'Re: Hello', NULL, '2024-01-04 13:00:00', 1, 1, NULL),
      (1, 3, 'Re: Greetings', NULL, '2024-01-05 14:00:00', 1, 1, NULL),
      (2, 3, 'From b to c', NULL, '2024-01-06 15:00:00', 1, 1, NULL),
      (3, 2, 'From c to b', NULL, '2024-01-07 16:00:00', 1, 1,NULL);
  `);
    await connection.end();
    console.log('Database setup complete.');
})();
