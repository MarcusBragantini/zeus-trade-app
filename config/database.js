const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zeus_trade',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Criar tabelas se não existirem
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Tabela de usuários
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        iq_option_email VARCHAR(255),
        iq_option_password VARCHAR(255),
        subscription_type ENUM('basic', 'professional', 'premium') DEFAULT 'basic',
        subscription_status ENUM('active', 'inactive', 'suspended') DEFAULT 'inactive',
        balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela de trades
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        asset VARCHAR(50) NOT NULL,
        direction ENUM('call', 'put') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        result DECIMAL(10,2),
        status ENUM('pending', 'win', 'loss') DEFAULT 'pending',
        strategy VARCHAR(100) NOT NULL,
        profit_loss DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Tabela de assinaturas
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        plan_type ENUM('basic', 'professional', 'premium') NOT NULL,
        status ENUM('active', 'canceled', 'expired') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        payment_method VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Tabela de configurações de trading
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trading_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        strategy VARCHAR(100) NOT NULL,
        asset VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        duration INT DEFAULT 1,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ Banco de dados inicializado com sucesso');
    
    // Inserir usuário admin padrão se não existir
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(
      'INSERT IGNORE INTO users (name, email, password, subscription_type, subscription_status) VALUES (?, ?, ?, ?, ?)',
      ['Admin Zeus', 'admin@zeustrade.com', hashedPassword, 'premium', 'active']
    );
    
    connection.release();
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
  }
}

module.exports = { pool, initializeDatabase };