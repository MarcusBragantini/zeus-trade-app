class MartingaleStrategy {
  constructor() {
    this.name = 'Martingale Strategy';
    this.baseAmount = 10;
    this.multiplier = 2;
    this.maxConsecutiveLosses = 5;
    this.consecutiveLosses = 0;
    this.nextAmount = this.baseAmount;
    this.lastDirection = null;
  }

  analyze(candles) {
    // Martingale é mais sobre gerenciamento de risco do que análise
    // Esta é uma implementação simplificada
    if (candles.length < 10) {
      return 'hold';
    }

    // Estratégia básica baseada em tendência simples
    const recentCloses = candles.slice(-10).map(c => c.close);
    const avg = recentCloses.reduce((a, b) => a + b) / recentCloses.length;
    const lastClose = recentCloses[recentCloses.length - 1];
    
    if (lastClose > avg) {
      return 'call';
    } else {
      return 'put';
    }
  }

  getTradeAmount(lastTradeWin) {
    if (lastTradeWin) {
      this.consecutiveLosses = 0;
      this.nextAmount = this.baseAmount;
    } else {
      this.consecutiveLosses++;
      if (this.consecutiveLosses <= this.maxConsecutiveLosses) {
        this.nextAmount = this.baseAmount * Math.pow(this.multiplier, this.consecutiveLosses);
      } else {
        this.nextAmount = this.baseAmount;
        this.consecutiveLosses = 0;
      }
    }
    
    return this.nextAmount;
  }

  reset() {
    this.consecutiveLosses = 0;
    this.nextAmount = this.baseAmount;
  }

  updateConfig(newConfig) {
    if (newConfig.baseAmount) this.baseAmount = newConfig.baseAmount;
    if (newConfig.multiplier) this.multiplier = newConfig.multiplier;
    if (newConfig.maxConsecutiveLosses) this.maxConsecutiveLosses = newConfig.maxConsecutiveLosses;
  }

  getConfig() {
    return {
      baseAmount: this.baseAmount,
      multiplier: this.multiplier,
      maxConsecutiveLosses: this.maxConsecutiveLosses,
      currentConsecutiveLosses: this.consecutiveLosses
    };
  }
}

module.exports = MartingaleStrategy;