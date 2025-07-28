# The Vine Portfolio - Technical Specification

## Project Overview

**Application Name**: The Vine Portfolio  
**Company**: Vine Analytics  
**Type**: Web-based Trading Journal & Performance Tracker  
**Target Users**: Individual traders managing multiple trading accounts  

## Core Mission

Develop a comprehensive trading journal and performance tracker that provides:
- Centralized portfolio overview across multiple accounts
- Detailed individual account management
- Advanced trade tracking with partial entries/exits
- Sophisticated risk management tools
- Multi-currency support with aggregated reporting
- Comprehensive cost tracking and analytics

## Key Features Summary

### 1. Centralized Main Dashboard
- **Purpose**: Single view of entire trading portfolio
- **Key Metrics**:
  - Overall Portfolio P&L ($ and %)
  - Total Portfolio Balance (converted to primary currency)
  - Current Maximum Drawdown
  - Portfolio-level Progress visualization
  - Top/Bottom performing accounts
  - Open trades summary and risk exposure
- **Visualizations**:
  - Combined equity curve across all accounts
  - Overall portfolio drawdown curve
  - Capital allocation across accounts

### 2. Multi-Account Management
- **Account Properties**:
  - Name/Nickname, Broker, Base Currency
  - Initial Capital, Current Balance
  - Profit Target, Maximum Allowable Drawdown
  - Trading Model assignment (Risk-Free, Medium Risk, High Risk)
- **Individual Dashboards**: Dedicated analytics per account
- **Currency Handling**: Each account has base currency, main dashboard aggregates to user's primary reporting currency

### 3. Advanced Trade Management
- **Core Trade Data**:
  - Account linkage, Instrument, Long/Short
  - Entry/Exit dates and prices
  - Stop Loss, Take Profit targets
  - Calculated Risk % and R-multiple
- **Enhanced Features**:
  - **Partial Entries/Exits**: Support for scaling in/out of positions
  - **Weighted Average Calculations**: Automatic calculation of average entry/exit prices
  - **Cost Tracking**: Commissions, Spreads, Swaps/Financing, Slippage
  - **Strategy Tagging**: Custom tags for trading strategies/setups
  - **Risk Type Classification**: User-defined categories (T1, T2, T3, etc.)

### 4. Analytics & Reporting
- **Performance Metrics**:
  - Gross P&L vs Net P&L (after costs)
  - Average R-multiple, Expectancy, Sharpe Ratio
  - Profit Factor, Win Rate
  - Max Consecutive Wins/Losses
- **Filtering & Analysis**:
  - By account, instrument, date range, strategy tags
  - Cost analysis breakdown
  - Performance by Risk Type and Trading Model

### 5. Risk Management Tools
- **Position Size Calculators**:
  - Forex: Lot size calculation with pip values
  - Stocks: Share quantity calculation
  - Commodities: Contract calculation with multipliers
- **Intelligent Suggestions**:
  - Risk percentage recommendations based on account performance
  - Drawdown warnings and alerts
  - Trading model-specific guidance

### 6. Data Management & Security
- **User Control**:
  - Complete data export (CSV/JSON)
  - Account deletion and data privacy
- **Security**: Robust authentication and data encryption

## Technical Architecture

### Backend (Flask)
- **Framework**: Python Flask with SQLAlchemy ORM
- **Database**: PostgreSQL for production, SQLite for development
- **Authentication**: JWT-based authentication
- **API Design**: RESTful APIs with JSON responses

### Frontend (React)
- **Framework**: React with modern hooks
- **State Management**: Context API or Redux for complex state
- **UI Library**: Material-UI or similar for consistent design
- **Charts**: Chart.js or D3.js for visualizations
- **Responsive Design**: Mobile-first approach

### Database Schema (High-Level)

#### Users Table
- id, email, password_hash, primary_currency, created_at, updated_at

#### Accounts Table
- id, user_id, name, broker, base_currency, initial_capital, current_balance
- profit_target, max_drawdown, trading_model, created_at, updated_at

#### Trades Table
- id, account_id, instrument, trade_type, status
- entry_date, exit_date, notes, risk_type, strategy_tags
- created_at, updated_at

#### Trade_Entries Table (for partial entries)
- id, trade_id, entry_date, entry_price, quantity, commission

#### Trade_Exits Table (for partial exits)
- id, trade_id, exit_date, exit_price, quantity, commission, exit_reason

#### Trade_Costs Table
- id, trade_id, cost_type, amount, description

#### Risk_Types Table
- id, user_id, name, description, default_risk_percentage

#### Strategy_Tags Table
- id, user_id, name, description

## Key Calculations

### 1. Weighted Average Prices
```
Weighted Avg Entry = Σ(Entry Price × Quantity) / Σ(Quantity)
Weighted Avg Exit = Σ(Exit Price × Quantity) / Σ(Quantity)
```

### 2. P&L Calculations
```
Gross P&L = (Weighted Avg Exit - Weighted Avg Entry) × Total Quantity × Direction
Net P&L = Gross P&L - Total Costs
```

### 3. Risk Calculations
```
Risk Amount = Account Balance × Risk Percentage
Position Size = Risk Amount / (Entry Price - Stop Loss Price)
R-Multiple = (Exit Price - Entry Price) / (Entry Price - Stop Loss Price)
```

### 4. Portfolio Aggregation
```
Portfolio Value = Σ(Account Balance × Exchange Rate to Primary Currency)
Portfolio P&L = Σ(Account P&L × Exchange Rate to Primary Currency)
```

## Development Phases

### Phase 1: MVP Core Features
- User authentication
- Single account management
- Basic trade entry/exit
- Simple dashboard with P&L tracking

### Phase 2: Multi-Account Support
- Multiple account creation and management
- Account switching interface
- Aggregated portfolio dashboard

### Phase 3: Advanced Trade Management
- Partial entry/exit functionality
- Cost tracking implementation
- Strategy tagging system

### Phase 4: Analytics & Risk Tools
- Advanced performance metrics
- Risk management calculators
- Intelligent suggestions engine

### Phase 5: Polish & Deployment
- UI/UX refinements
- Performance optimization
- Production deployment

## API Endpoints (Planned)

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/profile

### Accounts
- GET /api/accounts
- POST /api/accounts
- PUT /api/accounts/:id
- DELETE /api/accounts/:id
- GET /api/accounts/:id/dashboard

### Trades
- GET /api/accounts/:id/trades
- POST /api/accounts/:id/trades
- PUT /api/trades/:id
- DELETE /api/trades/:id
- POST /api/trades/:id/entries
- POST /api/trades/:id/exits

### Analytics
- GET /api/accounts/:id/analytics
- GET /api/portfolio/analytics
- GET /api/accounts/:id/export
- GET /api/portfolio/export

### Risk Management
- POST /api/calculators/position-size
- POST /api/calculators/lot-size
- GET /api/accounts/:id/risk-suggestions

## Security Considerations

- Password hashing with bcrypt
- JWT token expiration and refresh
- Input validation and sanitization
- SQL injection prevention with ORM
- CORS configuration for frontend access
- HTTPS enforcement in production

## Deployment Strategy

- **Backend**: Deploy Flask app to cloud platform (Heroku, AWS, or DigitalOcean)
- **Frontend**: Deploy React build to static hosting (Netlify, Vercel, or S3)
- **Database**: Managed PostgreSQL instance
- **Environment Variables**: Secure configuration management

This specification provides the foundation for developing The Vine Portfolio application with all the advanced features requested in the original requirements.

