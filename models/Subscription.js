const { pool } = require('../config/database');

class Subscription {
  static async create(subscriptionData) {
    const { userId, planType, startDate, endDate, paymentMethod } = subscriptionData;
    const amount = this.getPlanAmount(planType);
    
    const [result] = await pool.execute(
      'INSERT INTO subscriptions (user_id, plan_type, status, start_date, end_date, payment_method, amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, planType, 'active', startDate, endDate, paymentMethod, amount]
    );
    
    return result.insertId;
  }

  static async getUserSubscription(userId) {
    const [subscriptions] = await pool.execute(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY end_date DESC LIMIT 1',
      [userId]
    );
    return subscriptions[0];
  }

  static async cancelSubscription(subscriptionId) {
    await pool.execute(
      'UPDATE subscriptions SET status = "canceled" WHERE id = ?',
      [subscriptionId]
    );
  }

  static async updateSubscription(subscriptionId, updates) {
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });
    
    values.push(subscriptionId);
    
    await pool.execute(
      `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async getActiveSubscriptions() {
    const [subscriptions] = await pool.execute(
      'SELECT s.*, u.name, u.email FROM subscriptions s JOIN users u ON s.user_id = u.id WHERE s.status = "active"'
    );
    return subscriptions;
  }

  static getPlanAmount(planType) {
    const plans = {
      'basic': 99.00,
      'professional': 199.00,
      'premium': 399.00
    };
    return plans[planType] || 99.00;
  }
}

module.exports = Subscription;