# Zeus Trade App 🚀

Sistema profissional de trade automático integrado com IQ Option - Plataforma completa de trading automatizado com interface web moderna.

## 📋 Funcionalidades

- ✅ **Autenticação Completa**: Sistema de login/registro com JWT
- ✅ **Conexão IQ Option**: Integração direta com a plataforma IQ Option
- ✅ **Trading Automatizado**: Múltiplas estratégias (RSI, MACD, Martingale)
- ✅ **Tempo Real**: Atualizações via Socket.io
- ✅ **Interface Moderna**: Design responsivo e intuitivo
- ✅ **Gráficos Interativos**: Visualização de performance em tempo real
- ✅ **Gerenciamento de Risco**: Controles avançados de trading
- ✅ **Banco de Dados MySQL**: Persistência completa de dados

## 🚀 Instalação Rápida

1. **Clone e instale dependências**
```bash
git clone <seu-repositorio>
cd zeus-trade-app
npm install
```

2. **Configure o banco de dados**
```bash
# Crie um banco MySQL chamado 'zeus_trade'
mysql -u root -p
CREATE DATABASE zeus_trade;
```

3. **Configure as variáveis de ambiente**
```bash
# Copie e edite o arquivo de configuração
cp config.example.env .env
# Edite o .env com suas configurações
```

4. **Inicie o servidor**
```bash
npm start
# ou para desenvolvimento
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:3000
```

## 🔧 Configuração Detalhada

### Variáveis de Ambiente (.env)

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=zeus_trade

# JWT Secret (gere uma chave segura)
JWT_SECRET=sua_chave_jwt_muito_segura

# Porta do Servidor
PORT=3000
```

### Usuário Admin Padrão

- **Email**: admin@zeustrade.com
- **Senha**: admin123

## 🎯 Como Usar

### 1. Registro/Login
- Acesse a aplicação
- Clique em "Cadastre-se" para criar uma conta
- Ou use o login admin padrão

### 2. Conectar IQ Option
- Faça login na aplicação
- Vá para a seção "Trading"
- Insira suas credenciais da IQ Option
- Clique em "Conectar à IQ Option"

### 3. Configurar Trading
- Selecione a estratégia desejada
- Escolha o ativo (EUR/USD, BTC/USD, etc.)
- Defina o valor por trade
- Configure a duração

### 4. Iniciar Trading
- Clique em "Iniciar Trading"
- Acompanhe os resultados em tempo real
- Use "Parar Trading" quando necessário

## 📊 Estratégias Implementadas

- **RSI Strategy**: Baseada em Relative Strength Index - Ideal para mercados laterais
- **MACD Strategy**: Moving Average Convergence Divergence - Eficaz em mercados com tendência
- **Martingale Strategy**: Gerenciamento de risco avançado - Alto risco, alta recompensa

## 📊 Estrutura do Projeto

```
zeus-trade-app/
├── config/
│   └── database.js          # Configuração do banco
├── models/
│   ├── User.js             # Modelo de usuário
│   ├── Trade.js            # Modelo de trade
│   └── Subscription.js     # Modelo de assinatura
├── routes/
│   ├── auth.js             # Rotas de autenticação
│   ├── trade.js            # Rotas de trading
│   └── admin.js            # Rotas administrativas
├── services/
│   ├── iqoption.js         # Serviço IQ Option
│   ├── tradingEngine.js    # Motor de trading
│   └── strategyManager.js  # Gerenciador de estratégias
├── strategies/
│   ├── rsiStrategy.js      # Estratégia RSI
│   ├── macdStrategy.js     # Estratégia MACD
│   └── martingaleStrategy.js # Estratégia Martingale
├── zeus.html              # Interface principal
├── server.js              # Servidor principal
└── package.json           # Dependências
```

## 🚨 Avisos Importantes

- **Risco Financeiro**: Trading envolve riscos. Use apenas capital que pode perder
- **Teste Primeiro**: Sempre teste em conta demo antes de usar dinheiro real
- **Monitoramento**: Monitore suas operações regularmente
- **Backup**: Faça backup regular dos dados importantes

## 🔒 Segurança

- Senhas são criptografadas com bcrypt
- Tokens JWT para autenticação
- Validação de entrada em todas as rotas
- CORS configurado adequadamente

## 📈 Monitoramento

A aplicação inclui:
- Logs detalhados no console
- Notificações em tempo real
- Gráficos de performance
- Histórico completo de trades

## 🤝 Suporte

Para suporte técnico:
- Verifique os logs do servidor
- Consulte a documentação da API
- Teste em ambiente de desenvolvimento primeiro

---

**⚠️ Disclaimer**: Este software é para fins educacionais. O trading automatizado envolve riscos significativos. Use por sua própria conta e risco.
