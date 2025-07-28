from src.models.user import db
from datetime import datetime

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    broker = db.Column(db.String(100), nullable=True)
    base_currency = db.Column(db.String(3), nullable=False, default='USD')
    initial_capital = db.Column(db.Numeric(15, 2), nullable=False)
    current_balance = db.Column(db.Numeric(15, 2), nullable=False)
    profit_target = db.Column(db.Numeric(5, 2), nullable=True)  # Percentage
    max_drawdown = db.Column(db.Numeric(5, 2), nullable=True)   # Percentage
    trading_model = db.Column(db.String(50), nullable=False, default='Medium Risk')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trades = db.relationship('Trade', backref='account', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Account {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'broker': self.broker,
            'base_currency': self.base_currency,
            'initial_capital': float(self.initial_capital),
            'current_balance': float(self.current_balance),
            'profit_target': float(self.profit_target) if self.profit_target else None,
            'max_drawdown': float(self.max_drawdown) if self.max_drawdown else None,
            'trading_model': self.trading_model,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def calculate_pnl(self):
        """Calculate account P&L"""
        return float(self.current_balance - self.initial_capital)

    def calculate_pnl_percentage(self):
        """Calculate account P&L percentage"""
        if self.initial_capital == 0:
            return 0
        return float((self.current_balance - self.initial_capital) / self.initial_capital * 100)

    def calculate_current_drawdown(self):
        """Calculate current drawdown from peak"""
        # This would need to be calculated based on trade history
        # For now, return a simple calculation
        peak_balance = max(float(self.current_balance), float(self.initial_capital))
        if peak_balance == 0:
            return 0
        return float((peak_balance - self.current_balance) / peak_balance * 100)

