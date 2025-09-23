const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Subscription = require('../models/Subscription');

const router = express.Router();

// Middleware de autenticação admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    
    // Verificar se é admin (aqui você pode implementar lógica mais complexa)
    if (user.email !== 'admin@zeustrade.com') {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    
    req.user = user;
    next();
  });
};

// Dashboard admin - estatísticas gerais
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Total de usuários
    const [usersCount] = await pool.execute('SELECT COUNT(*) as total FROM users');
    
    // Total de trades
    const [tradesCount] = await pool.execute('SELECT COUNT(*) as total FROM trades');
    
    // Total de assinaturas ativas
    const [activeSubs] = await pool.execute('SELECT COUNT(*) as total FROM subscriptions WHERE status = "active"');
    
    // Lucro total
    const [totalProfit] = await pool.execute('SELECT SUM(profit_loss) as total FROM trades WHERE profit_loss > 0');
    
    // Trades recentes
    const recentTrades = await Trade.getRecentTrades(10);
    
    // Assinaturas ativas
    const activeSubscriptions = await Subscription.getActiveSubscriptions();

    res.json({
      success: true,
      stats: {
        totalUsers: usersCount[0].total,
        totalTrades: tradesCount[0].total,
        activeSubscriptions: activeSubs[0].total,
        totalProfit: totalProfit[0].total || 0
      },
      recentTrades,
      activeSubscriptions
    });

  } catch (error) {
    console.error('Erro no dashboard admin:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Listar todos os usuários
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [users] = await pool.execute(
      'SELECT id, name, email, subscription_type, subscription_status, balance, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Gerenciar assinaturas
router.put('/subscriptions/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { planType, status, endDate } = req.body;
    
    await User.updateSubscription(userId, {
      planType,
      status,
      startDate: new Date(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias
    });

    res.json({
      success: true,
      message: 'Assinatura atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

module.exports = router;