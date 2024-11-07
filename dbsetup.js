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
            attachment VARCHAR(512) NULL,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

  await connection.query(`
      INSERT IGNORE INTO users (email, password, full_name) VALUES
      ('a@a.com', '123123', 'Ariana Grande'),
      ('b@b.com', '123123', 'Justin Bieber'),
      ('c@c.com', '123123', 'Taylor Swiff');
  `);


  await connection.query(`
    INSERT INTO emails (sender_id, receiver_id, subject, message, sent_at, status_sender, status_receiver, attachment) VALUES
    (1, 2, 'Re: Hello', 'you you you', '2024-01-04 13:00:00', 1, 1, NULL),
    (1, 3, 'Re: Greetings', 'Me me me', '2024-01-05 14:00:00', 1, 1, NULL),
    (2, 3, 'From b to c', 'I dont know', '2024-01-06 15:00:00', 1, 1, NULL),
    (3, 2, 'From c to b', 'I know', '2024-01-07 16:00:00', 1, 1, NULL),
    (2, 1, 'Hello from Justin Bieber', 'what do you mean', '2024-01-01 10:00:00', 1, 1, NULL),
    (1, 2, 'Hello Taylor', 'omg im so sorry', '2024-01-02 11:00:00', 1, 1, NULL),
    (1, 3, 'Im from US', 'I love VietNam', '2024-01-04 13:00:00', 1, 1, NULL),
    (3, 2, 'Love me?', 'ready?', '2024-01-05 14:00:00', 1, 1, NULL),
    (1, 3, 'Lamb Lamb', 'ok king of', '2024-01-06 15:00:00', 1, 1, NULL),
    (3, 2, 'hihi', 'oh no no no', '2024-01-07 16:00:00', 1, 1, NULL);
  `);
  
  await connection.end();
  console.log('Database setup complete.');
})();
