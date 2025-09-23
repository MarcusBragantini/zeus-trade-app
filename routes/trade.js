const express = require('express');
const jwt = require('jsonwebtoken');
const Trade = require('../models/Trade');
const User = require('../models/User');

const router = express.Router();

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Histórico de trades do usuário
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const trades = await Trade.getUserTrades(req.user.userId, parseInt(limit));
    
    res.json({
      success: true,
      trades
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Estatísticas de trading
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Trade.getStats(req.user.userId);
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Criar novo trade (registro)
router.post('/record', authenticateToken, async (req, res) => {
  try {
    const { asset, direction, amount, strategy } = req.body;
    
    const tradeId = await Trade.create({
      userId: req.user.userId,
      asset,
      direction,
      amount,
      strategy
    });

    res.json({
      success: true,
      message: 'Trade registrado com sucesso',
      tradeId
    });

  } catch (error) {
    console.error('Erro ao registrar trade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Atualizar resultado do trade
router.put('/:tradeId/result', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { result, profitLoss, status } = req.body;
    
    await Trade.updateResult(tradeId, result, profitLoss, status);

    // Atualizar saldo do usuário se for lucro
    if (profitLoss > 0) {
      await User.updateBalance(req.user.userId, profitLoss);
    }

    res.json({
      success: true,
      message: 'Resultado do trade atualizado'
    });

  } catch (error) {
    console.error('Erro ao atualizar trade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

module.exports = router;