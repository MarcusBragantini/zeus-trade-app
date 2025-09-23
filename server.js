const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/admin', require('./routes/admin'));

// Servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'zeus.html'));
});

// Conexão Socket.io para tempo real
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);
  
  socket.on('subscribe-to-asset', (asset) => {
    socket.join(asset);
    console.log(`Usuário ${socket.id} inscrito em ${asset}`);
  });
  
  socket.on('start-trading', (data) => {
    console.log('Iniciando trading para usuário:', socket.id, data);
    // Lógica de trading será implementada aqui
  });
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Usuário ${userId} conectado na sala`);
  });
  
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

// Função para emitir atualizações para usuários específicos
function emitToUser(userId, event, data) {
  io.to(`user_${userId}`).emit(event, data);
}

// Função para emitir para todos os usuários
function emitToAll(event, data) {
  io.emit(event, data);
}

// Inicializar serviços
const { initializeDatabase, pool } = require('./config/database');
const IQOptionService = require('./services/iqoption');
const DerivService = require('./services/deriv');
const TradingEngine = require('./services/tradingEngine');

// Instância global do DerivService
let globalDerivService = null;

// Rotas de API para o frontend
app.post('/api/iqoption/login', async (req, res) => {
  try {
    console.log('🔗 Recebida requisição de login IQ Option');
    console.log('📧 Email:', req.body.email);
    console.log('🔑 Senha:', req.body.password ? '***' : 'vazia');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Email ou senha não fornecidos');
      return res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    const iqService = new IQOptionService(io);
    console.log('🚀 Iniciando conexão com IQ Option...');
    
    const loginResult = await iqService.connect(email, password);
    console.log('📊 Resultado da conexão:', loginResult);
    
    if (loginResult.success) {
      console.log('✅ Login IQ Option bem-sucedido');
      res.json({ 
        success: true, 
        message: 'Conectado à IQ Option',
        balance: loginResult.balance
      });
    } else {
      console.log('❌ Falha no login IQ Option:', loginResult.message);
      res.status(400).json({ 
        success: false, 
        message: loginResult.message 
      });
    }
  } catch (error) {
    console.error('💥 Erro no servidor IQ Option:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor: ' + error.message 
    });
  }
});

// Rota para verificar se usuário tem tokens salvos
app.get('/api/deriv/tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Verificando tokens para usuário:', userId);
    
    // Verificar se o usuário tem tokens salvos
    const [rows] = await pool.execute(`
      SELECT demo_token, real_token, app_id 
      FROM deriv_tokens 
      WHERE user_id = ?
    `, [userId]);
    
    console.log('📊 Resultado da query:', rows);
    
    const tokens = rows[0];
    const hasTokens = tokens && tokens.demo_token && tokens.real_token && tokens.app_id;
    
    console.log('📊 Tokens encontrados:', hasTokens ? 'SIM' : 'NÃO');
    if (tokens) {
      console.log('🔑 Demo token:', tokens.demo_token ? '***' : 'vazio');
      console.log('🔑 Real token:', tokens.real_token ? '***' : 'vazio');
      console.log('🆔 App ID:', tokens.app_id || 'vazio');
    } else {
      console.log('❌ Nenhum token encontrado para o usuário:', userId);
    }
    
    res.json({ 
      success: true, 
      hasTokens: hasTokens,
      tokens: hasTokens ? {
        demo_token: tokens.demo_token,
        real_token: tokens.real_token,
        app_id: tokens.app_id
      } : null,
      message: hasTokens ? 'Tokens encontrados' : 'Tokens não encontrados'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar tokens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Rota para listar todas as tabelas (debug)
app.get('/api/debug/tables', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SHOW TABLES`);
    const tables = rows.map(row => Object.values(row)[0]);
    
    console.log('📋 Tabelas no banco:', tables);
    
    res.json({ 
      success: true, 
      tables: tables
    });
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Rota para ver todos os tokens salvos (debug)
app.get('/api/debug/tokens', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM deriv_tokens`);
    
    console.log('🔑 Tokens no banco:', rows);
    
    res.json({ 
      success: true, 
      tokens: rows
    });
  } catch (error) {
    console.error('❌ Erro ao listar tokens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Rota para salvar tokens no banco de dados
app.post('/api/deriv/save-tokens', async (req, res) => {
  try {
    const { userId, demoToken, realToken, appId } = req.body;
    console.log('💾 Salvando tokens para usuário:', userId);
    console.log('🔑 Demo token:', demoToken ? '***' : 'vazio');
    console.log('🔑 Real token:', realToken ? '***' : 'vazio');
    console.log('🆔 App ID:', appId);
    
    if (!userId || !demoToken || !realToken || !appId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }
    
    // Verificar se já existe registro para o usuário
    const [existingRows] = await pool.execute(
      `SELECT id FROM deriv_tokens WHERE user_id = ?`, 
      [userId]
    );
    
    if (existingRows.length > 0) {
      // Atualizar registro existente
      await pool.execute(`
        UPDATE deriv_tokens 
        SET demo_token = ?, real_token = ?, app_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [demoToken, realToken, appId, userId]);
      
      console.log('✅ Tokens atualizados para usuário:', userId);
    } else {
      // Inserir novo registro
      await pool.execute(`
        INSERT INTO deriv_tokens (user_id, demo_token, real_token, app_id)
        VALUES (?, ?, ?, ?)
      `, [userId, demoToken, realToken, appId]);
      
      console.log('✅ Tokens salvos para usuário:', userId);
    }
    
    res.json({ 
      success: true, 
      message: 'Tokens salvos com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao salvar tokens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Rota para login na Deriv
app.post('/api/deriv/login', async (req, res) => {
  try {
    console.log('🔗 Recebida requisição de login Deriv');
    console.log('📦 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('🔑 Token:', req.body.token ? '***' : 'vazia');
    console.log('🆔 App ID:', req.body.appId);
    
    const { token, appId, accountType, isReal } = req.body;
    
    if (!token || !appId) {
      console.log('❌ Token ou App ID não fornecidos');
      return res.status(400).json({ 
        success: false, 
        message: 'Token e App ID são obrigatórios' 
      });
    }
    
    console.log('📊 Tipo de conta:', accountType || 'real');
    console.log('🔒 É conta real:', isReal !== false);
    
    // Verificar se já está conectado com o mesmo token
    if (globalDerivService && globalDerivService.isConnected && globalDerivService.token === token) {
      console.log('✅ Já conectado com este token, reutilizando conexão');
      res.json({ 
        success: true, 
        message: 'Já conectado à Deriv',
        balance: globalDerivService.balance,
        currency: 'USD',
        simulated: false,
        accountType: accountType || 'real',
        isReal: isReal !== false
      });
      return;
    }
    
    // Usar instância global ou criar nova
    if (!globalDerivService) {
      globalDerivService = new DerivService(io);
    }
    
    console.log('🚀 Iniciando conexão com Deriv...');
    
    const loginResult = await globalDerivService.connect(token, appId);
    console.log('📊 Resultado da conexão:', loginResult);
    
    if (loginResult.success) {
      console.log('✅ Login Deriv bem-sucedido');
      res.json({ 
        success: true, 
        message: 'Conectado à Deriv com sucesso',
        balance: loginResult.balance,
        currency: loginResult.currency || 'USD',
        simulated: loginResult.simulated,
        accountType: accountType || 'real',
        isReal: isReal !== false
      });
    } else {
      console.log('❌ Falha no login Deriv:', loginResult.message);
      res.status(400).json({ 
        success: false, 
        message: loginResult.message 
      });
    }
  } catch (error) {
    console.error('💥 Erro no servidor Deriv:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor: ' + error.message 
    });
  }
});

// Rota para executar trades na Deriv
app.post('/api/deriv/trade', async (req, res) => {
  try {
    console.log('🔗 Recebida requisição de trade Deriv');
    console.log('📦 Body completo:', JSON.stringify(req.body, null, 2));
    
    const { tradeType, asset, contractType, amount, duration, userId } = req.body;
    
    if (!tradeType || !asset || !contractType || !amount || !duration) {
      console.log('❌ Parâmetros obrigatórios não fornecidos');
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os parâmetros são obrigatórios' 
      });
    }
    
    // Verificar se há instância conectada
    if (!globalDerivService || !globalDerivService.isConnected) {
      console.log('❌ DerivService não está conectado');
      return res.status(400).json({ 
        success: false, 
        message: 'Não conectado à Deriv. Faça login primeiro.' 
      });
    }
    
    console.log('🚀 Executando trade na Deriv...');
    
    const tradeResult = await globalDerivService.placeTrade(asset, contractType, amount, duration);
    console.log('📊 Resultado do trade:', tradeResult);
    
    if (tradeResult.success) {
      console.log('✅ Trade Deriv executado com sucesso');
      res.json({ 
        success: true, 
        message: 'Trade executado com sucesso',
        trade: tradeResult
      });
    } else {
      console.log('❌ Falha no trade Deriv:', tradeResult.message);
      res.status(400).json({ 
        success: false, 
        message: tradeResult.message 
      });
    }
  } catch (error) {
    console.error('💥 Erro no servidor Deriv trade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor: ' + error.message 
    });
  }
});

app.post('/api/trade/start', async (req, res) => {
  try {
    const { strategy, asset, amount, duration, userId } = req.body;
    const iqService = new IQOptionService(io);
    const tradingEngine = new TradingEngine(iqService, io);
    
    const result = await tradingEngine.startTrading({
      strategy,
      asset,
      amount,
      duration,
      userId
    });
    
    if (result.success) {
      // Emitir atualização para o usuário
      emitToUser(userId, 'trading-update', {
        status: 'trading',
        strategy,
        asset,
        amount,
        duration
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.post('/api/trade/stop', async (req, res) => {
  try {
    const { userId } = req.body;
    const iqService = new IQOptionService(io);
    const tradingEngine = new TradingEngine(iqService, io);
    
    const result = tradingEngine.stopTrading();
    
    if (result.success) {
      // Emitir atualização para o usuário
      emitToUser(userId, 'trading-update', {
        status: 'stopped'
      });
    }
    
    res.json({ success: true, message: 'Trading parado' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

app.get('/api/trade/status', (req, res) => {
  const iqService = new IQOptionService(io);
  const tradingEngine = new TradingEngine(iqService, io);
  res.json(tradingEngine.getStatus());
});

// Inicializar banco de dados
initializeDatabase();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor Zeus Trade rodando na porta ${PORT}`);
  console.log(`📊 Acesse: http://localhost:${PORT}`);
});