from flask import Blueprint, request, jsonify
from src.models import db, RiskType, StrategyTag, Account
from src.routes.auth import require_auth
from datetime import datetime
import math

risk_bp = Blueprint('risk', __name__)

@risk_bp.route('/risk-types', methods=['GET'])
@require_auth
def get_risk_types():
    """Get all risk types for the user"""
    try:
        risk_types = RiskType.query.filter_by(user_id=request.user_id).all()
        return jsonify({
            'risk_types': [rt.to_dict() for rt in risk_types]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@risk_bp.route('/risk-types', methods=['POST'])
@require_auth
def create_risk_type():
    """Create a new risk type"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        risk_type = RiskType(
            user_id=request.user_id,
            name=data['name'],
            description=data.get('description'),
            default_risk_percentage=float(data['default_risk_percentage']) if data.get('default_risk_percentage') else None
        )
        
        db.session.add(risk_type)
        db.session.commit()
        
        return jsonify({
            'message': 'Risk type created successfully',
            'risk_type': risk_type.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@risk_bp.route('/strategy-tags', methods=['GET'])
@require_auth
def get_strategy_tags():
    """Get all strategy tags for the user"""
    try:
        tags = StrategyTag.query.filter_by(user_id=request.user_id).all()
        return jsonify({
            'strategy_tags': [tag.to_dict() for tag in tags]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@risk_bp.route('/strategy-tags', methods=['POST'])
@require_auth
def create_strategy_tag():
    """Create a new strategy tag"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        tag = StrategyTag(
            user_id=request.user_id,
            name=data['name'],
            description=data.get('description')
        )
        
        db.session.add(tag)
        db.session.commit()
        
        return jsonify({
            'message': 'Strategy tag created successfully',
            'strategy_tag': tag.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@risk_bp.route('/calculators/position-size', methods=['POST'])
@require_auth
def calculate_position_size():
    """Calculate position size based on risk parameters"""
    try:
        data = request.get_json()
        
        required_fields = ['account_balance', 'risk_percentage', 'entry_price', 'stop_loss_price']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Account balance, risk percentage, entry price, and stop loss price are required'}), 400
        
        account_balance = float(data['account_balance'])
        risk_percentage = float(data['risk_percentage'])
        entry_price = float(data['entry_price'])
        stop_loss_price = float(data['stop_loss_price'])
        
        # Calculate risk amount
        risk_amount = account_balance * (risk_percentage / 100)
        
        # Calculate price difference
        price_diff = abs(entry_price - stop_loss_price)
        
        if price_diff == 0:
            return jsonify({'error': 'Entry price and stop loss price cannot be the same'}), 400
        
        # Calculate position size
        position_size = risk_amount / price_diff
        
        # Calculate R-multiple if take profit is provided
        r_multiple = None
        if data.get('take_profit_price'):
            take_profit_price = float(data['take_profit_price'])
            profit_diff = abs(take_profit_price - entry_price)
            r_multiple = profit_diff / price_diff
        
        result = {
            'risk_amount': round(risk_amount, 2),
            'position_size': round(position_size, 2),
            'price_difference': round(price_diff, 4),
            'r_multiple': round(r_multiple, 2) if r_multiple else None
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@risk_bp.route('/calculators/forex-lot-size', methods=['POST'])
@require_auth
def calculate_forex_lot_size():
    """Calculate Forex lot size"""
    try:
        data = request.get_json()
        
        required_fields = ['account_balance', 'risk_percentage', 'stop_loss_pips', 'currency_pair']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Account balance, risk percentage, stop loss pips, and currency pair are required'}), 400
        
        account_balance = float(data['account_balance'])
        risk_percentage = float(data['risk_percentage'])
        stop_loss_pips = float(data['stop_loss_pips'])
        currency_pair = data['currency_pair'].upper()
        account_currency = data.get('account_currency', 'USD').upper()
        
        # Calculate risk amount
        risk_amount = account_balance * (risk_percentage / 100)
        
        # Pip values for major pairs (simplified)
        pip_values = {
            'EURUSD': 10,  # $10 per pip for 1 standard lot
            'GBPUSD': 10,
            'AUDUSD': 10,
            'NZDUSD': 10,
            'USDCAD': 10,
            'USDCHF': 10,
            'USDJPY': 10,
        }
        
        # Get pip value (simplified - in real implementation, this would use current exchange rates)
        pip_value = pip_values.get(currency_pair, 10)
        
        # Calculate lot size
        risk_per_pip = risk_amount / stop_loss_pips
        lot_size = risk_per_pip / pip_value
        
        # Determine lot type
        if lot_size >= 1:
            lot_type = "Standard"
            lot_display = f"{lot_size:.2f} Standard Lots"
        elif lot_size >= 0.1:
            lot_type = "Mini"
            lot_display = f"{lot_size * 10:.2f} Mini Lots"
        else:
            lot_type = "Micro"
            lot_display = f"{lot_size * 100:.2f} Micro Lots"
        
        result = {
            'risk_amount': round(risk_amount, 2),
            'lot_size': round(lot_size, 4),
            'lot_type': lot_type,
            'lot_display': lot_display,
            'pip_value': pip_value,
            'risk_per_pip': round(risk_per_pip, 2)
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@risk_bp.route('/calculators/stock-shares', methods=['POST'])
@require_auth
def calculate_stock_shares():
    """Calculate number of shares for stock trading"""
    try:
        data = request.get_json()
        
        required_fields = ['account_balance', 'risk_percentage', 'entry_price', 'stop_loss_price']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Account balance, risk percentage, entry price, and stop loss price are required'}), 400
        
        account_balance = float(data['account_balance'])
        risk_percentage = float(data['risk_percentage'])
        entry_price = float(data['entry_price'])
        stop_loss_price = float(data['stop_loss_price'])
        
        # Calculate risk amount
        risk_amount = account_balance * (risk_percentage / 100)
        
        # Calculate price difference
        price_diff = abs(entry_price - stop_loss_price)
        
        if price_diff == 0:
            return jsonify({'error': 'Entry price and stop loss price cannot be the same'}), 400
        
        # Calculate number of shares
        shares = math.floor(risk_amount / price_diff)
        
        # Calculate actual risk amount with whole shares
        actual_risk = shares * price_diff
        actual_risk_percentage = (actual_risk / account_balance) * 100
        
        # Calculate total investment
        total_investment = shares * entry_price
        
        result = {
            'shares': shares,
            'risk_amount': round(risk_amount, 2),
            'actual_risk': round(actual_risk, 2),
            'actual_risk_percentage': round(actual_risk_percentage, 2),
            'total_investment': round(total_investment, 2),
            'price_difference': round(price_diff, 2)
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@risk_bp.route('/accounts/<int:account_id>/risk-suggestions', methods=['GET'])
@require_auth
def get_risk_suggestions(account_id):
    """Get intelligent risk suggestions for an account"""
    try:
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        # Get recent trades for analysis
        from src.models import Trade
        recent_trades = Trade.query.filter_by(account_id=account_id).filter_by(status='Closed').order_by(Trade.updated_at.desc()).limit(10).all()
        
        suggestions = []
        
        if not recent_trades:
            suggestions.append({
                'type': 'info',
                'message': 'No recent trades found. Start with conservative risk (1% per trade).',
                'suggested_risk': 1.0
            })
        else:
            # Calculate recent performance
            recent_pnl = sum(t.calculate_net_pnl() for t in recent_trades)
            winning_trades = [t for t in recent_trades if t.calculate_net_pnl() > 0]
            win_rate = len(winning_trades) / len(recent_trades) * 100
            
            # Current drawdown
            current_drawdown = account.calculate_current_drawdown()
            
            # Generate suggestions based on performance
            if current_drawdown > 5:
                suggestions.append({
                    'type': 'warning',
                    'message': f'Account is in {current_drawdown:.1f}% drawdown. Consider reducing risk.',
                    'suggested_risk': 0.5
                })
            elif win_rate < 40:
                suggestions.append({
                    'type': 'caution',
                    'message': f'Recent win rate is {win_rate:.1f}%. Consider reducing risk until performance improves.',
                    'suggested_risk': 0.75
                })
            elif win_rate > 70 and recent_pnl > 0:
                suggestions.append({
                    'type': 'positive',
                    'message': f'Strong recent performance ({win_rate:.1f}% win rate). You may consider slightly increasing risk.',
                    'suggested_risk': 1.5
                })
            else:
                suggestions.append({
                    'type': 'neutral',
                    'message': 'Performance is stable. Maintain current risk level.',
                    'suggested_risk': 1.0
                })
            
            # Trading model specific suggestions
            if account.trading_model == 'High Risk':
                suggestions.append({
                    'type': 'info',
                    'message': 'High Risk mode: Consider 2-3% risk per trade for aggressive growth.',
                    'suggested_risk': 2.5
                })
            elif account.trading_model == 'Risk-Free':
                suggestions.append({
                    'type': 'info',
                    'message': 'Risk-Free mode: Keep risk minimal (0.1-0.5% per trade).',
                    'suggested_risk': 0.25
                })
        
        return jsonify({
            'account': account.to_dict(),
            'suggestions': suggestions,
            'current_drawdown': account.calculate_current_drawdown(),
            'recent_performance': {
                'trades_analyzed': len(recent_trades),
                'win_rate': round(win_rate, 1) if recent_trades else 0,
                'total_pnl': round(sum(t.calculate_net_pnl() for t in recent_trades), 2) if recent_trades else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

