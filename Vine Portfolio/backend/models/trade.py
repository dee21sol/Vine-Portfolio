from src.models.user import db
from datetime import datetime
from sqlalchemy import func

class Trade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    trade_name = db.Column(db.String(100), nullable=True)
    instrument = db.Column(db.String(50), nullable=False)
    trade_type = db.Column(db.String(10), nullable=False)  # 'Long' or 'Short'
    status = db.Column(db.String(20), nullable=False, default='Open')  # Open, Closed, Pending, Canceled
    stop_loss_price = db.Column(db.Numeric(15, 8), nullable=True)
    take_profit_price = db.Column(db.Numeric(15, 8), nullable=True)
    risk_type_id = db.Column(db.Integer, db.ForeignKey('risk_type.id'), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    entries = db.relationship('TradeEntry', backref='trade', lazy=True, cascade='all, delete-orphan')
    exits = db.relationship('TradeExit', backref='trade', lazy=True, cascade='all, delete-orphan')
    costs = db.relationship('TradeCost', backref='trade', lazy=True, cascade='all, delete-orphan')
    trade_tags = db.relationship('TradeStrategyTag', backref='trade', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Trade {self.instrument} {self.trade_type}>'

    def to_dict(self):
        return {
            'id': self.id,
            'account_id': self.account_id,
            'trade_name': self.trade_name,
            'instrument': self.instrument,
            'trade_type': self.trade_type,
            'status': self.status,
            'stop_loss_price': float(self.stop_loss_price) if self.stop_loss_price else None,
            'take_profit_price': float(self.take_profit_price) if self.take_profit_price else None,
            'risk_type_id': self.risk_type_id,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'entries': [entry.to_dict() for entry in self.entries],
            'exits': [exit.to_dict() for exit in self.exits],
            'costs': [cost.to_dict() for cost in self.costs],
            'strategy_tags': [tag.strategy_tag.name for tag in self.trade_tags]
        }

    def calculate_weighted_avg_entry(self):
        """Calculate weighted average entry price"""
        if not self.entries:
            return 0
        total_value = sum(float(entry.entry_price) * float(entry.quantity) for entry in self.entries)
        total_quantity = sum(float(entry.quantity) for entry in self.entries)
        return total_value / total_quantity if total_quantity > 0 else 0

    def calculate_weighted_avg_exit(self):
        """Calculate weighted average exit price"""
        if not self.exits:
            return 0
        total_value = sum(float(exit.exit_price) * float(exit.quantity) for exit in self.exits)
        total_quantity = sum(float(exit.quantity) for exit in self.exits)
        return total_value / total_quantity if total_quantity > 0 else 0

    def calculate_total_quantity_entered(self):
        """Calculate total quantity entered"""
        return sum(float(entry.quantity) for entry in self.entries)

    def calculate_total_quantity_exited(self):
        """Calculate total quantity exited"""
        return sum(float(exit.quantity) for exit in self.exits)

    def calculate_open_quantity(self):
        """Calculate remaining open quantity"""
        return self.calculate_total_quantity_entered() - self.calculate_total_quantity_exited()

    def calculate_total_costs(self):
        """Calculate total costs for this trade"""
        return sum(float(cost.amount) for cost in self.costs)

    def calculate_gross_pnl(self):
        """Calculate gross P&L (before costs)"""
        if not self.exits:
            return 0
        
        avg_entry = self.calculate_weighted_avg_entry()
        avg_exit = self.calculate_weighted_avg_exit()
        exited_quantity = self.calculate_total_quantity_exited()
        
        if self.trade_type.lower() == 'long':
            return (avg_exit - avg_entry) * exited_quantity
        else:  # Short
            return (avg_entry - avg_exit) * exited_quantity

    def calculate_net_pnl(self):
        """Calculate net P&L (after costs)"""
        return self.calculate_gross_pnl() - self.calculate_total_costs()

    def calculate_risk_amount(self):
        """Calculate risk amount based on stop loss"""
        if not self.stop_loss_price or not self.entries:
            return 0
        
        avg_entry = self.calculate_weighted_avg_entry()
        total_quantity = self.calculate_total_quantity_entered()
        
        if self.trade_type.lower() == 'long':
            return (avg_entry - float(self.stop_loss_price)) * total_quantity
        else:  # Short
            return (float(self.stop_loss_price) - avg_entry) * total_quantity

    def calculate_r_multiple(self):
        """Calculate R-multiple for closed trades"""
        risk_amount = self.calculate_risk_amount()
        if risk_amount <= 0:
            return 0
        return self.calculate_net_pnl() / risk_amount


class TradeEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    trade_id = db.Column(db.Integer, db.ForeignKey('trade.id'), nullable=False)
    entry_date = db.Column(db.DateTime, nullable=False)
    entry_price = db.Column(db.Numeric(15, 8), nullable=False)
    quantity = db.Column(db.Numeric(15, 8), nullable=False)
    commission = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trade_id': self.trade_id,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'entry_price': float(self.entry_price),
            'quantity': float(self.quantity),
            'commission': float(self.commission),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class TradeExit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    trade_id = db.Column(db.Integer, db.ForeignKey('trade.id'), nullable=False)
    exit_date = db.Column(db.DateTime, nullable=False)
    exit_price = db.Column(db.Numeric(15, 8), nullable=False)
    quantity = db.Column(db.Numeric(15, 8), nullable=False)
    commission = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    exit_reason = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trade_id': self.trade_id,
            'exit_date': self.exit_date.isoformat() if self.exit_date else None,
            'exit_price': float(self.exit_price),
            'quantity': float(self.quantity),
            'commission': float(self.commission),
            'exit_reason': self.exit_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class TradeCost(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    trade_id = db.Column(db.Integer, db.ForeignKey('trade.id'), nullable=False)
    cost_type = db.Column(db.String(50), nullable=False)  # Commission, Spread, Swap, Slippage
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'trade_id': self.trade_id,
            'cost_type': self.cost_type,
            'amount': float(self.amount),
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

