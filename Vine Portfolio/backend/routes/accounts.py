from flask import Blueprint, request, jsonify
from src.models import db, Account, Trade
from src.routes.auth import require_auth
from datetime import datetime

accounts_bp = Blueprint('accounts', __name__)

@accounts_bp.route('/', methods=['GET'])
@require_auth
def get_accounts():
    """Get all accounts for the authenticated user"""
    try:
        accounts = Account.query.filter_by(user_id=request.user_id).all()
        return jsonify({
            'accounts': [account.to_dict() for account in accounts]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accounts_bp.route('/', methods=['POST'])
@require_auth
def create_account():
    """Create a new trading account"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name') or not data.get('initial_capital'):
            return jsonify({'error': 'Name and initial capital are required'}), 400
        
        account = Account(
            user_id=request.user_id,
            name=data['name'],
            broker=data.get('broker', ''),
            base_currency=data.get('base_currency', 'USD'),
            initial_capital=float(data['initial_capital']),
            current_balance=float(data['initial_capital']),  # Start with initial capital
            profit_target=float(data['profit_target']) if data.get('profit_target') else None,
            max_drawdown=float(data['max_drawdown']) if data.get('max_drawdown') else None,
            trading_model=data.get('trading_model', 'Medium Risk')
        )
        
        db.session.add(account)
        db.session.commit()
        
        return jsonify({
            'message': 'Account created successfully',
            'account': account.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@accounts_bp.route('/<int:account_id>', methods=['GET'])
@require_auth
def get_account(account_id):
    """Get specific account details"""
    try:
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        return jsonify({'account': account.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@accounts_bp.route('/<int:account_id>', methods=['PUT'])
@require_auth
def update_account(account_id):
    """Update account details"""
    try:
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update account fields
        if 'name' in data:
            account.name = data['name']
        if 'broker' in data:
            account.broker = data['broker']
        if 'base_currency' in data:
            account.base_currency = data['base_currency']
        if 'profit_target' in data:
            account.profit_target = float(data['profit_target']) if data['profit_target'] else None
        if 'max_drawdown' in data:
            account.max_drawdown = float(data['max_drawdown']) if data['max_drawdown'] else None
        if 'trading_model' in data:
            account.trading_model = data['trading_model']
        
        account.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Account updated successfully',
            'account': account.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@accounts_bp.route('/<int:account_id>', methods=['DELETE'])
@require_auth
def delete_account(account_id):
    """Delete account and all associated trades"""
    try:
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        db.session.delete(account)
        db.session.commit()
        
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@accounts_bp.route('/<int:account_id>/dashboard', methods=['GET'])
@require_auth
def get_account_dashboard(account_id):
    """Get account dashboard with analytics"""
    try:
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        # Get all trades for this account
        trades = Trade.query.filter_by(account_id=account_id).all()
        
        # Calculate analytics
        total_trades = len(trades)
        closed_trades = [t for t in trades if t.status == 'Closed']
        open_trades = [t for t in trades if t.status == 'Open']
        
        # P&L calculations
        total_pnl = sum(t.calculate_net_pnl() for t in closed_trades)
        total_gross_pnl = sum(t.calculate_gross_pnl() for t in closed_trades)
        total_costs = sum(t.calculate_total_costs() for t in trades)
        
        # Win rate
        winning_trades = [t for t in closed_trades if t.calculate_net_pnl() > 0]
        win_rate = (len(winning_trades) / len(closed_trades) * 100) if closed_trades else 0
        
        # Average win/loss
        avg_win = sum(t.calculate_net_pnl() for t in winning_trades) / len(winning_trades) if winning_trades else 0
        losing_trades = [t for t in closed_trades if t.calculate_net_pnl() <= 0]
        avg_loss = sum(t.calculate_net_pnl() for t in losing_trades) / len(losing_trades) if losing_trades else 0
        
        # R-multiples
        r_multiples = [t.calculate_r_multiple() for t in closed_trades if t.calculate_r_multiple() != 0]
        avg_r_multiple = sum(r_multiples) / len(r_multiples) if r_multiples else 0
        
        # Profit factor
        total_wins = sum(t.calculate_net_pnl() for t in winning_trades)
        total_losses = abs(sum(t.calculate_net_pnl() for t in losing_trades))
        profit_factor = total_wins / total_losses if total_losses > 0 else 0
        
        # Update account balance based on trades
        account.current_balance = float(account.initial_capital) + total_pnl
        db.session.commit()
        
        dashboard_data = {
            'account': account.to_dict(),
            'analytics': {
                'total_trades': total_trades,
                'closed_trades': len(closed_trades),
                'open_trades': len(open_trades),
                'total_pnl': round(total_pnl, 2),
                'total_gross_pnl': round(total_gross_pnl, 2),
                'total_costs': round(total_costs, 2),
                'pnl_percentage': account.calculate_pnl_percentage(),
                'current_drawdown': account.calculate_current_drawdown(),
                'win_rate': round(win_rate, 2),
                'avg_win': round(avg_win, 2),
                'avg_loss': round(avg_loss, 2),
                'avg_r_multiple': round(avg_r_multiple, 2),
                'profit_factor': round(profit_factor, 2)
            },
            'recent_trades': [t.to_dict() for t in trades[-10:]]  # Last 10 trades
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

