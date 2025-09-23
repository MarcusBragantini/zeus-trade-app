const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password, subscriptionType = 'basic' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, subscription_type) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, subscriptionType]
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0];
  }

  static async findById(id) {
    const [users] = await pool.execute(
      'SELECT id, name, email, subscription_type, subscription_status, balance, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0];
  }

  static async updateSubscription(userId, subscriptionData) {
    const { planType, status, startDate, endDate } = subscriptionData;
    
    await pool.execute(
      'UPDATE users SET subscription_type = ?, subscription_status = ? WHERE id = ?',
      [planType, status, userId]
    );
    
    // Registrar na tabela de assinaturas
    await pool.execute(
      'INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, amount) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, planType, status, startDate, endDate, this.getPlanAmount(planType)]
    );
  }

  static getPlanAmount(planType) {
    const plans = {
      'basic': 99.00,
      'professional': 199.00,
      'premium': 399.00
    };
    return plans[planType] || 99.00;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateBalance(userId, amount) {
    await pool.execute(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, userId]
    );
  }
}

module.exports = User;