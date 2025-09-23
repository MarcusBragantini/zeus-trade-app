const { RSI } = require('technicalindicators');

class RSIStrategy {
  constructor() {
    this.name = 'RSI Strategy';
    this.period = 14;
    this.overbought = 70;
    this.oversold = 30;
    this.minCandles = 30;
  }

  analyze(candles) {
    if (candles.length < this.minCandles) {
      return 'hold';
    }

    try {
      // Extrair preços de fechamento
      const closes = candles.map(c => c.close);
      
      // Calcular RSI
      const rsiValues = RSI.calculate({
        values: closes,
        period: this.period
      });
      
      if (rsiValues.length < 2) {
        return 'hold';
      }
      
      const currentRSI = rsiValues[rsiValues.length - 1];
      const previousRSI = rsiValues[rsiValues.length - 2];
      
      if (!currentRSI || !previousRSI) {
        return 'hold';
      }
      
      // Gerar sinais baseados no RSI
      if (currentRSI < this.oversold && previousRSI >= this.oversold) {
        return 'call'; // Compra - mercado oversold
      } else if (currentRSI > this.overbought && previousRSI <= this.overbought) {
        return 'put'; // Venda - mercado overbought
      }
      
      return 'hold';
      
    } catch (error) {
      console.error('❌ Erro na análise RSI:', error);
      return 'hold';
    }
  }

  updateConfig(newConfig) {
    if (newConfig.period) this.period = newConfig.period;
    if (newConfig.overbought) this.overbought = newConfig.overbought;
    if (newConfig.oversold) this.oversold = newConfig.oversold;
  }

  getConfig() {
    return {
      period: this.period,
      overbought: this.overbought,
      oversold: this.oversold
    };
  }
}

module.exports = RSIStrategy;