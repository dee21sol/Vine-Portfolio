# The Vine Portfolio - Deployment Guide

## Project Overview

**The Vine Portfolio** is a comprehensive trading journal and performance tracker application developed by Vine Analytics. It features multi-account management, advanced analytics, and sophisticated risk management tools for serious traders.

## Deployed Applications

### Frontend Application
- **URL**: https://njkheuym.manus.space
- **Technology**: React with modern UI components (shadcn/ui, Tailwind CSS)
- **Features**: 
  - User authentication and registration
  - Portfolio dashboard with aggregated metrics
  - Multi-account management
  - Trade entry and tracking
  - Advanced analytics and reporting
  - Risk management calculators
  - Responsive design for desktop and mobile

### Backend API
- **URL**: https://w5hni7c7jxvl.manus.space
- **Technology**: Flask with SQLAlchemy
- **Database**: SQLite (automatically created)
- **Features**:
  - JWT-based authentication
  - RESTful API endpoints
  - Multi-currency support
  - Partial entry/exit trade management
  - Cost tracking (commissions, spreads, swaps, slippage)
  - Advanced analytics calculations
  - Risk management tools
  - Data export functionality

## Demo Account

For testing purposes, you can create a demo account:
- **Email**: demo@vineanalytics.com
- **Password**: demo123456
- **Primary Currency**: USD

## Key Features Implemented

### 1. Multi-Account Portfolio Management
- Centralized dashboard showing aggregated portfolio metrics
- Individual account "windows" with detailed performance tracking
- Support for multiple currencies with automatic conversion
- Trading model classification (Risk-Free, Medium Risk, High Risk)

### 2. Advanced Trade Tracking
- Support for partial entries and exits
- Comprehensive cost tracking including:
  - Commissions
  - Spreads
  - Swaps/overnight fees
  - Slippage
- Strategy and setup tagging
- Risk type classification

### 3. Professional Analytics
- Win rate and profit factor calculations
- R-multiple analysis
- Expectancy calculations
- Consecutive win/loss streaks
- Performance by instrument and risk type
- Best and worst trade identification

### 4. Risk Management Tools
- Position size calculator
- Forex lot size calculator
- Stock shares calculator
- Risk suggestions based on recent performance
- Intelligent risk percentage recommendations

### 5. User Experience
- Professional, responsive design
- Intuitive navigation and workflow
- Real-time calculations and updates
- Mobile-friendly interface
- Dark/light theme support

## Technical Architecture

### Backend Structure
```
vine_portfolio/
├── src/
│   ├── main.py              # Flask application entry point
│   ├── models/              # Database models
│   │   ├── user.py         # User authentication model
│   │   ├── account.py      # Trading account model
│   │   ├── trade.py        # Trade tracking model
│   │   └── risk_type.py    # Risk classification model
│   └── routes/             # API endpoints
│       ├── auth.py         # Authentication routes
│       ├── accounts.py     # Account management
│       ├── trades.py       # Trade management
│       ├── analytics.py    # Analytics and reporting
│       └── risk_management.py # Risk tools
├── requirements.txt        # Python dependencies
└── README.md
```

### Frontend Structure
```
vine-portfolio-frontend/
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── Dashboard.jsx   # Portfolio overview
│   │   ├── Accounts.jsx    # Account management
│   │   ├── Trades.jsx      # Trade entry/management
│   │   ├── Analytics.jsx   # Performance analytics
│   │   └── RiskManagement.jsx # Risk calculators
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx # Authentication state
│   ├── App.jsx            # Main application component
│   └── main.jsx           # Application entry point
├── package.json           # Node.js dependencies
└── vite.config.js         # Build configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Account Management
- `GET /api/accounts/` - List user accounts
- `POST /api/accounts/` - Create new account
- `GET /api/accounts/{id}/dashboard` - Account dashboard data
- `GET /api/accounts/{id}/trades` - Account trades

### Trade Management
- `POST /api/accounts/{id}/trades` - Create new trade
- `PUT /api/trades/{id}/entries` - Add trade entry
- `PUT /api/trades/{id}/exits` - Add trade exit

### Analytics
- `GET /api/analytics/portfolio/dashboard` - Portfolio overview
- `GET /api/analytics/accounts/{id}/analytics` - Account analytics

### Risk Management
- `POST /api/risk/calculators/position-size` - Position size calculator
- `POST /api/risk/calculators/forex-lot-size` - Forex lot calculator
- `POST /api/risk/calculators/stock-shares` - Stock shares calculator
- `GET /api/risk/accounts/{id}/risk-suggestions` - Risk suggestions

## Database Schema

The application uses SQLite with the following key tables:
- **users**: User authentication and preferences
- **accounts**: Trading accounts with initial capital and targets
- **trades**: Individual trades with entries and exits
- **trade_entries**: Partial entry records
- **trade_exits**: Partial exit records
- **risk_types**: User-defined risk categories

## Security Features

- JWT-based authentication with secure token handling
- Password hashing using industry-standard methods
- CORS protection for API endpoints
- Input validation and sanitization
- Secure session management

## Performance Optimizations

- Efficient database queries with proper indexing
- Lazy loading of trade data
- Optimized frontend bundle with code splitting
- Responsive design for fast mobile loading
- Caching of calculated analytics

## Maintenance and Updates

The application is deployed on permanent URLs and will remain accessible. For updates or modifications:

1. Backend changes can be deployed by updating the Flask application
2. Frontend changes require rebuilding and redeploying the React application
3. Database migrations should be handled carefully to preserve user data

## Support and Documentation

For technical support or questions about The Vine Portfolio:
- Review the comprehensive feature documentation within the application
- Check the risk management guidelines in the Risk Tools section
- Refer to the analytics explanations in the Analytics dashboard

The application is now fully deployed and ready for use by traders who need professional-grade portfolio tracking and risk management tools.

