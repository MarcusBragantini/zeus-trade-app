const { pool } = require('../config/database');

class Trade {
  static async create(tradeData) {
    const { userId, asset, direction, amount, strategy } = tradeData;
    
    const [result] = await pool.execute(
      'INSERT INTO trades (user_id, asset, direction, amount, strategy) VALUES (?, ?, ?, ?, ?)',
      [userId, asset, direction, amount, strategy]
    );
    
    return result.insertId;
  }

  static async updateResult(tradeId, result, profitLoss, status = 'win') {
    await pool.execute(
      'UPDATE trades SET result = ?, profit_loss = ?, status = ? WHERE id = ?',
      [result, profitLoss, status, tradeId]
    );
  }

  static async getUserTrades(userId, limit = 50) {
    const [trades] = await pool.execute(
      'SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return trades;
  }

  static async getRecentTrades(limit = 100) {
    const [trades] = await pool.execute(
      'SELECT t.*, u.name as user_name FROM trades t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT ?',
      [limit]
    );
    return trades;
  }

  static async getStats(userId) {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN status = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN status = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(profit_loss) as total_profit,
        AVG(profit_loss) as avg_profit
      FROM trades 
      WHERE user_id = ? AND status IN ('win', 'loss')
    `, [userId]);
    
    return stats[0];
  }
}

module.exports = Trade;