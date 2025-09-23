const { MACD } = require('technicalindicators');

class MACDStrategy {
  constructor() {
    this.name = 'MACD Strategy';
    this.fastPeriod = 12;
    this.slowPeriod = 26;
    this.signalPeriod = 9;
    this.minCandles = 50;
  }

  analyze(candles) {
    if (candles.length < this.minCandles) {
      return 'hold';
    }

    try {
      // Extrair preços de fechamento
      const closes = candles.map(c => c.close);
      
      // Calcular MACD
      const macdResults = MACD.calculate({
        values: closes,
        fastPeriod: this.fastPeriod,
        slowPeriod: this.slowPeriod,
        signalPeriod: this.signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      
      if (macdResults.length < 2) {
        return 'hold';
      }
      
      const current = macdResults[macdResults.length - 1];
      const previous = macdResults[macdResults.length - 2];
      
      if (!current || !previous) {
        return 'hold';
      }
      
      // Gerar sinais baseados no cruzamento MACD
      if (current.MACD > current.signal && previous.MACD <= previous.signal) {
        return 'call'; // Cruzamento para cima - sinal de compra
      } else if (current.MACD < current.signal && previous.MACD >= previous.signal) {
        return 'put'; // Cruzamento para baixo - sinal de venda
      }
      
      return 'hold';
      
    } catch (error) {
      console.error('❌ Erro na análise MACD:', error);
      return 'hold';
    }
  }

  updateConfig(newConfig) {
    if (newConfig.fastPeriod) this.fastPeriod = newConfig.fastPeriod;
    if (newConfig.slowPeriod) this.slowPeriod = newConfig.slowPeriod;
    if (newConfig.signalPeriod) this.signalPeriod = newConfig.signalPeriod;
  }

  getConfig() {
    return {
      fastPeriod: this.fastPeriod,
      slowPeriod: this.slowPeriod,
      signalPeriod: this.signalPeriod
    };
  }
}

module.exports = MACDStrategy;