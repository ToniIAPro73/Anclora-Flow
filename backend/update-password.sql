UPDATE users 
SET password_hash = '$2b$10$dr1MOjbyINWGp0vujVIl3Pijs63KTviwG018EfvmqEmu'
WHERE email = 'demo@anclora.test';

SELECT email, password_hash FROM users WHERE email = 'demo@anclora.test';
