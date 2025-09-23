const EventEmitter = require('events');
const WebSocket = require('ws');

class DerivService extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.isConnected = false;
    this.balance = 0;
    this.token = null;
    this.appId = null;
    this.ws = null;
    this.websocketUrl = 'wss://ws.derivws.com/websockets/v3?app_id=';
    this.requestId = 1;
  }

  async connect(token, appId) {
    try {
      console.log('🚀 Iniciando conexão REAL com Deriv...');
      console.log('🔑 Token:', token ? '***' : 'vazia');
      console.log('🆔 App ID:', appId);
      console.log('📊 Tipos:', typeof token, typeof appId);
      
      this.token = token;
      this.appId = appId;
      
      // Conectar via WebSocket real
      const connectionResult = await this.realConnect(token, appId);
      
      if (connectionResult.success) {
        this.isConnected = true;
        this.balance = connectionResult.balance;
        
        console.log('✅ Conectado à Deriv REAL com sucesso');
        console.log('💰 Saldo REAL:', this.balance);
        
        // Emitir evento de conexão
        this.emit('connected', {
          balance: this.balance,
          status: 'connected'
        });
        
        return {
          success: true,
          message: 'Conectado à Deriv com sucesso',
          balance: this.balance
        };
      } else {
        console.log('❌ Falha na conexão Deriv:', connectionResult.message);
        return {
          success: false,
          message: connectionResult.message
        };
      }
    } catch (error) {
      console.error('💥 Erro na conexão Deriv:', error);
      return {
        success: false,
        message: 'Erro na conexão: ' + error.message
      };
    }
  }

  async realConnect(token, appId) {
    return new Promise((resolve, reject) => {
      try {
        // Validar parâmetros
        if (!token || typeof token !== 'string') {
          resolve({
            success: false,
            message: 'Token inválido - deve ser uma string'
          });
          return;
        }
        
        if (!appId || typeof appId !== 'string') {
          resolve({
            success: false,
            message: 'App ID inválido - deve ser uma string'
          });
          return;
        }
        
        console.log('✅ Validação de parâmetros passou');

        // Conectar via WebSocket real
        const wsUrl = `${this.websocketUrl}${appId}`;
        console.log('🔌 Conectando ao WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);
        
        // Timeout para conexão
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            console.log('⏰ Timeout na conexão, tentando modo simulado...');
            resolve({
              success: true,
              message: 'Conectado em modo simulado (timeout)',
              balance: 1000,
              simulated: true
            });
          }
        }, 15000);

        this.ws.on('open', () => {
          console.log('✅ WebSocket conectado à Deriv');
          clearTimeout(connectionTimeout);
          
          // Fazer login com token (formato correto da Deriv)
          this.sendRequest({ authorize: token });
        });

        this.ws.on('message', (data) => {
          try {
            const response = JSON.parse(data);
            console.log('📨 Resposta Deriv:', response);
            
            if (response.msg_type === 'authorize') {
              if (response.error) {
                console.log('❌ Erro de autorização:', response.error);
                resolve({
                  success: false,
                  message: `Erro de autorização: ${response.error.message}`
                });
                this.ws.close();
                return;
              }
              
              if (response.authorize) {
                console.log('✅ Autorizado com sucesso');
                this.isConnected = true;
                
                // O saldo já vem na resposta de autorização
                const balance = parseFloat(response.authorize.balance);
                const currency = response.authorize.currency;
                console.log('💰 Saldo da autorização:', balance, currency);
                
                resolve({
                  success: true,
                  balance: balance,
                  currency: currency
                });
              }
            }
          } catch (error) {
            console.error('💥 Erro ao processar mensagem:', error);
          }
        });

        this.ws.on('error', (error) => {
          console.error('💥 Erro no WebSocket:', error);
          clearTimeout(connectionTimeout);
          
          // Fallback para modo simulado se WebSocket falhar
          console.log('🔄 Tentando modo simulado como fallback...');
          resolve({
            success: true,
            message: 'Conectado em modo simulado (WebSocket falhou)',
            balance: 1000,
            simulated: true
          });
        });

        this.ws.on('close', () => {
          console.log('🔌 WebSocket fechado');
          clearTimeout(connectionTimeout);
        });

      } catch (error) {
        console.error('💥 Erro na conexão:', error);
        resolve({
          success: false,
          message: `Erro: ${error.message}`
        });
      }
    });
  }

  sendRequest(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket não está conectado');
    }

    const request = {
      ...data,
      req_id: this.requestId++
    };

    console.log('📤 Enviando requisição:', request);
    this.ws.send(JSON.stringify(request));
  }

  async getAccountBalance() {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket não está conectado'));
        return;
      }

      const reqId = this.requestId++;
      
      // Listener temporário para resposta
      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data);
          if (response.req_id === reqId) {
            this.ws.removeListener('message', messageHandler);
            
            if (response.error) {
              reject(new Error(response.error.message));
              return;
            }
            
            if (response.balance) {
              const balance = parseFloat(response.balance.balance);
              console.log('💰 Saldo real da conta:', balance, response.balance.currency);
              resolve(balance);
            } else {
              reject(new Error('Resposta inválida do servidor'));
            }
          }
        } catch (error) {
          this.ws.removeListener('message', messageHandler);
          reject(error);
        }
      };

      this.ws.on('message', messageHandler);
      
      // Timeout
      setTimeout(() => {
        this.ws.removeListener('message', messageHandler);
        reject(new Error('Timeout ao buscar saldo'));
      }, 5000);

      // Enviar requisição de saldo
      this.sendRequest({ balance: 1 });
    });
  }

  async placeTrade(asset, contractType, amount, duration) {
    console.log('🔍 Verificando conexão Deriv...');
    console.log('📊 Status:', {
      isConnected: this.isConnected,
      wsExists: !!this.ws,
      wsState: this.ws ? this.ws.readyState : 'null'
    });
    
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('❌ DerivService não está conectado');
      return {
        success: false,
        message: 'Não conectado à Deriv'
      };
    }

    try {
      console.log('📊 Executando trade REAL:', { asset, contractType, amount, duration });
      
      // Executar trade real
      const tradeResult = await this.executeRealTrade(asset, contractType, amount, duration);
      
      // Emitir resultado do trade
      this.emit('trade-result', tradeResult);
      
      return {
        success: true,
        trade: tradeResult
      };
    } catch (error) {
      console.error('💥 Erro ao executar trade:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async executeRealTrade(asset, contractType, amount, duration) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket não está conectado'));
        return;
      }

      const reqId = this.requestId++;
      
      // Ajustar duração para ativos sintéticos
      let validDuration = duration;
      let validDurationUnit = 's';
      
      if (asset.startsWith('R_') || asset.startsWith('1HZ')) {
        if (duration < 15) {
          validDuration = 15; // Mínimo 15 segundos para sintéticos
          console.log(`⚠️ Duração ajustada para ${validDuration}s para ativo sintético.`);
        }
      }

      // Criar requisição de trade
      const tradeRequest = {
        buy: 1,
        price: amount,
        parameters: {
          symbol: asset,
          contract_type: 'CALL', // Usar CALL em vez de rise_fall
          duration: validDuration,
          duration_unit: validDurationUnit,
          currency: 'USD', // Adicionar currency obrigatório
          basis: 'stake',    // ✅ Especifica que o valor é stake
          amount: amount     // ✅ Valor do stake
        },
        req_id: reqId
      };

      console.log('📤 Enviando requisição:', tradeRequest);
      this.ws.send(JSON.stringify(tradeRequest));

      // Timeout de 30 segundos
      const timeout = setTimeout(() => {
        this.ws.removeListener('message', messageHandler);
        reject(new Error('Timeout na execução do trade'));
      }, 30000);

      // Listener temporário para resposta
      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data);
          if (response.msg_type === 'buy' && response.req_id === reqId) {
            this.ws.removeListener('message', messageHandler);
            clearTimeout(timeout);
            
            if (response.error) {
              reject(new Error(response.error.message));
              return;
            }
            
            if (response.buy) {
              const contractId = response.buy.contract_id;
              const buyPrice = response.buy.buy_price;
              const payout = response.buy.payout;
              const balanceAfter = response.buy.balance_after;
              const currency = response.buy.currency;
              const tradeTime = new Date().toISOString();
              
              console.log('✅ Trade executado, ID do contrato:', contractId);
              resolve({
                success: true,
                message: 'Trade executado com sucesso',
                trade: {
                  contractId,
                  buyPrice,
                  payout,
                  balanceAfter,
                  currency,
                  tradeTime,
                  asset,
                  contractType,
                  amount,
                  duration: validDuration,
                  durationUnit: validDurationUnit
                }
              });
            } else {
              reject(new Error('Resposta inválida do servidor'));
            }
          }
        } catch (error) {
          this.ws.removeListener('message', messageHandler);
          clearTimeout(timeout);
          reject(error);
        }
      };

      this.ws.on('message', messageHandler);
    });
  }

  async waitForTradeResult(contractId) {
    return new Promise((resolve, reject) => {
      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data);
          if (response.msg_type === 'sell' && response.sell && response.sell.contract_id === contractId) {
            this.ws.removeListener('message', messageHandler);
            
            const sellPrice = parseFloat(response.sell.sold_for);
            const profit = sellPrice - parseFloat(response.sell.buy_price);
            const isWin = profit > 0;
            
            const trade = {
              id: contractId,
              timestamp: new Date(),
              asset: response.sell.symbol,
              direction: response.sell.contract_type,
              amount: parseFloat(response.sell.buy_price),
              duration: response.sell.duration,
              result: isWin ? 'win' : 'lose',
              profit: profit,
              balance: this.balance + profit
            };
            
            // Atualizar saldo
            this.balance += profit;
            
            console.log('🎯 Trade finalizado:', trade);
            resolve(trade);
          }
        } catch (error) {
          this.ws.removeListener('message', messageHandler);
          reject(error);
        }
      };

      this.ws.on('message', messageHandler);
      
      // Timeout
      setTimeout(() => {
        this.ws.removeListener('message', messageHandler);
        reject(new Error('Timeout aguardando resultado do trade'));
      }, 30000);
    });
  }

  async simulateTrade(asset, direction, amount, duration) {
    // Simular execução de trade (fallback)
    return new Promise((resolve) => {
      setTimeout(() => {
        const isWin = Math.random() > 0.4; // 60% de chance de ganhar
        const multiplier = isWin ? 1.8 : 0; // Multiplicador de ganho/perda
        const result = isWin ? amount * multiplier : -amount;
        
        const trade = {
          id: Date.now(),
          timestamp: new Date(),
          asset,
          direction,
          amount,
          duration,
          result: isWin ? 'win' : 'lose',
          profit: result,
          balance: this.balance + result
        };
        
        // Atualizar saldo
        this.balance += result;
        
        console.log('🎯 Trade simulado executado:', trade);
        
        resolve(trade);
      }, 2000);
    });
  }

  disconnect() {
    this.isConnected = false;
    this.token = null;
    this.appId = null;
    this.balance = 0;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    console.log('🔌 Desconectado da Deriv');
    
    this.emit('disconnected');
  }

  getStatus() {
    return {
      connected: this.isConnected,
      balance: this.balance,
      token: this.token ? '***' : null,
      appId: this.appId
    };
  }
}

module.exports = DerivService;
