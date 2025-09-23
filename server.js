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
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

// Inicializar serviços
const { initializeDatabase } = require('./config/database');
const IQOptionService = require('./services/iqoption');
const TradingEngine = require('./services/tradingEngine');

// Rotas de API para o frontend
app.post('/api/iqoption/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const iqService = new IQOptionService(io);
    const loginResult = await iqService.connect(email, password);
    
    if (loginResult.success) {
      res.json({ 
        success: true, 
        message: 'Conectado à IQ Option',
        balance: loginResult.balance
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: loginResult.message 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
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
    const iqService = new IQOptionService(io);
    const tradingEngine = new TradingEngine(iqService, io);
    tradingEngine.stopTrading();
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