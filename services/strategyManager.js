const fs = require('fs');
const path = require('path');

class StrategyManager {
  constructor() {
    this.strategies = new Map();
    this.loadStrategies();
  }

  loadStrategies() {
    const strategiesPath = path.join(__dirname, '../strategies');
    
    try {
      const files = fs.readdirSync(strategiesPath);
      
      files.forEach(file => {
        if (file.endsWith('Strategy.js')) {
          const strategyName = file.replace('Strategy.js', '').toLowerCase();
          const StrategyClass = require(path.join(strategiesPath, file));
          this.strategies.set(strategyName, StrategyClass);
        }
      });
      
      console.log(`✅ ${this.strategies.size} estratégias carregadas:`, 
        Array.from(this.strategies.keys()).join(', '));
        
    } catch (error) {
      console.error('❌ Erro ao carregar estratégias:', error);
    }
  }

  getStrategy(name) {
    const strategyName = name.toLowerCase();
    
    if (!this.strategies.has(strategyName)) {
      throw new Error(`Estratégia não encontrada: ${name}`);
    }
    
    const StrategyClass = this.strategies.get(strategyName);
    return new StrategyClass();
  }

  listStrategies() {
    return Array.from(this.strategies.keys()).map(name => ({
      name: name.toUpperCase(),
      description: this.getStrategyDescription(name)
    }));
  }

  getStrategyDescription(name) {
    const descriptions = {
      'rsi': 'Estratégia baseada no Índice de Força Relativa (RSI)',
      'macd': 'Estratégia baseada na Convergência/Divergência de Médias Móveis',
      'martingale': 'Estratégia de gerenciamento de risco com progressão'
    };
    
    return descriptions[name.toLowerCase()] || 'Estratégia de trading automatizado';
  }

  validateStrategyConfig(strategyName, config) {
    const validations = {
      'rsi': () => this.validateRSIConfig(config),
      'macd': () => this.validateMACDConfig(config),
      'martingale': () => this.validateMartingaleConfig(config)
    };
    
    const validator = validations[strategyName.toLowerCase()];
    return validator ? validator() : { valid: true, errors: [] };
  }

  validateRSIConfig(config) {
    const errors = [];
    
    if (!config.period || config.period < 5 || config.period > 30) {
      errors.push('Período RSI deve estar entre 5 e 30');
    }
    
    if (!config.overbought || config.overbought < 60 || config.overbought > 80) {
      errors.push('Nível overbought deve estar entre 60 e 80');
    }
    
    if (!config.oversold || config.oversold < 20 || config.oversold > 40) {
      errors.push('Nível oversold deve estar entre 20 e 40');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateMACDConfig(config) {
    const errors = [];
    // Implementar validações específicas para MACD
    return { valid: errors.length === 0, errors };
  }

  validateMartingaleConfig(config) {
    const errors = [];
    // Implementar validações específicas para Martingale
    return { valid: errors.length === 0, errors };
  }
}

module.exports = StrategyManager;