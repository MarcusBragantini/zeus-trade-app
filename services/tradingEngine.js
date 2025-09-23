const EventEmitter = require('events');
const RSIStrategy = require('../strategies/rsiStrategy');
const MACDStrategy = require('../strategies/macdStrategy');
const MartingaleStrategy = require('../strategies/martingaleStrategy');

class TradingEngine extends EventEmitter {
  constructor(iqService, io) {
    super();
    this.iqService = iqService;
    this.io = io;
    this.isTrading = false;
    this.currentStrategy = null;
    this.tradingConfig = {};
    this.tradeHistory = [];
    this.analysisInterval = null;
  }

  async startTrading(config) {
    try {
      if (this.isTrading) {
        throw new Error('Trading já está em andamento');
      }

      this.tradingConfig = config;
      this.isTrading = true;
      
      // Selecionar estratégia
      switch(config.strategy.toLowerCase()) {
        case 'rsi':
          this.currentStrategy = new RSIStrategy();
          break;
        case 'macd':
          this.currentStrategy = new MACDStrategy();
          break;
        case 'martingale':
          this.currentStrategy = new MartingaleStrategy();
          break;
        default:
          throw new Error('Estratégia não suportada: ' + config.strategy);
      }
      
      console.log(`🚀 Iniciando trading com estratégia ${config.strategy} no ativo ${config.asset}`);
      
      // Iniciar loop de análise
      this.startAnalysisLoop();
      
      this.emit('tradingStarted', config);
      this.io.emit('tradingStatus', { 
        status: 'active', 
        config,
        message: 'Trading automático iniciado' 
      });
      
      return { 
        success: true, 
        message: 'Trading iniciado com sucesso',
        strategy: config.strategy,
        asset: config.asset
      };
      
    } catch (error) {
      this.emit('error', error);
      this.io.emit('tradingError', { error: error.message });
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  startAnalysisLoop() {
    this.analysisInterval = setInterval(async () => {
      if (!this.isTrading) return;
      
      try {
        // Obter dados em tempo real
        const candles = await this.iqService.getCandles(
          this.tradingConfig.asset, 
          1, // 1 minuto
          50
        );
        
        // Analisar com estratégia
        const signal = this.currentStrategy.analyze(candles);
        
        if (signal !== 'hold') {
          console.log(`📈 Sinal de ${signal.toUpperCase()} detectado para ${this.tradingConfig.asset}`);
          
          // Executar trade baseado no sinal
          const tradeResult = await this.iqService.placeTrade(
            this.tradingConfig.asset,
            signal,
            this.tradingConfig.amount,
            this.tradingConfig.duration || 1
          );
          
          if (tradeResult.success) {
            const tradeRecord = {
              timestamp: new Date(),
              asset: this.tradingConfig.asset,
              direction: signal,
              amount: this.tradingConfig.amount,
              tradeId: tradeResult.tradeId,
              strategy: this.tradingConfig.strategy
            };
            
            this.tradeHistory.push(tradeRecord);
            
            this.io.emit('newTrade', tradeRecord);
            this.emit('tradeExecuted', tradeRecord);
          }
        }
        
      } catch (error) {
        console.error('❌ Erro no loop de análise:', error);
        this.emit('error', error);
        this.io.emit('tradingError', { error: error.message });
      }
    }, 10000); // Analisar a cada 10 segundos
  }

  stopTrading() {
    this.isTrading = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    
    this.currentStrategy = null;
    
    console.log('🛑 Trading automático parado');
    this.emit('tradingStopped');
    this.io.emit('tradingStatus', { 
      status: 'inactive', 
      message: 'Trading automático parado' 
    });
  }

  getStatus() {
    return {
      isTrading: this.isTrading,
      strategy: this.tradingConfig.strategy,
      asset: this.tradingConfig.asset,
      amount: this.tradingConfig.amount,
      tradeCount: this.tradeHistory.length,
      recentTrades: this.tradeHistory.slice(-5),
      balance: this.iqService.getBalance()
    };
  }

  getTradeHistory() {
    return this.tradeHistory;
  }
}

module.exports = TradingEngine;