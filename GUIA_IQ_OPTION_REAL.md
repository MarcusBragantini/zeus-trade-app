# 🚀 Guia de Integração Real com IQ Option

## ✅ **Implementação Concluída**

A aplicação agora está integrada com a **API real da IQ Option**! Não mais simulações.

## 🔧 **Configuração Atual**

### Modo Practice (Conta Demo Real)
```env
IQ_OPTION_DEMO=true
IQ_OPTION_BALANCE_TYPE=PRACTICE
```

### Modo Real (Conta com Dinheiro Real)
```env
IQ_OPTION_DEMO=false
IQ_OPTION_BALANCE_TYPE=REAL
```

## 🎯 **Como Usar**

### 1. **Conectar à Sua Conta IQ Option**
- Use suas credenciais reais da IQ Option
- A aplicação se conectará à sua conta practice
- O saldo exibido será o saldo real da sua conta

### 2. **Funcionalidades Reais**
- ✅ **Saldo Real**: Exibe o saldo atual da sua conta
- ✅ **Trades Reais**: Executa trades na sua conta practice
- ✅ **Candles Reais**: Dados de mercado em tempo real
- ✅ **Resultados Reais**: Lucros/perdas reais

### 3. **Estratégias Funcionais**
- **RSI Strategy**: Análise técnica real
- **MACD Strategy**: Indicadores reais
- **Martingale Strategy**: Gerenciamento de risco real

## ⚠️ **Importante**

### Para Conta Practice:
- Use `IQ_OPTION_DEMO=true` no .env
- Saldo virtual da IQ Option
- Sem risco financeiro real

### Para Conta Real:
- Use `IQ_OPTION_DEMO=false` no .env
- **ATENÇÃO**: Dinheiro real em risco!
- Teste primeiro na conta practice

## 🔄 **Alterar Modo**

1. **Edite o arquivo .env**:
   ```env
   # Para Practice (recomendado)
   IQ_OPTION_DEMO=true
   
   # Para Real (cuidado!)
   IQ_OPTION_DEMO=false
   ```

2. **Reinicie o servidor**:
   ```bash
   # Parar servidor
   taskkill /F /IM node.exe
   
   # Iniciar novamente
   node server.js
   ```

## 📊 **Logs de Debug**

O servidor agora mostra logs detalhados:
```
🔗 Conectando à IQ Option como seu@email.com
✅ Conectado à IQ Option com sucesso
💰 Configurando conta: PRACTICE
💰 Saldo atual: R$ 10.000,00
📊 Executando trade real: EURUSD CALL R$10 1min
✅ Trade executado com ID: 123456789
🎯 Trade 123456789: WIN - R$8.50
```

## 🚨 **Avisos de Segurança**

1. **Sempre teste na conta practice primeiro**
2. **Use valores pequenos inicialmente**
3. **Monitore os trades constantemente**
4. **Tenha uma estratégia de stop-loss**
5. **Nunca invista mais do que pode perder**

## 🎉 **Pronto para Usar!**

Agora você tem:
- ✅ Conexão real com IQ Option
- ✅ Saldo real da sua conta
- ✅ Trades reais executados
- ✅ Dados de mercado reais
- ✅ Resultados reais

**Teste com sua conta practice e me diga como está funcionando!** 🚀

