from flask import Blueprint, request, jsonify
from src.models import db, Trade, TradeEntry, TradeExit, TradeCost, Account, StrategyTag, TradeStrategyTag
from src.routes.auth import require_auth
from datetime import datetime

trades_bp = Blueprint('trades', __name__)

@trades_bp.route('/accounts/<int:account_id>/trades', methods=['GET'])
@require_auth
def get_trades(account_id):
    """Get all trades for a specific account"""
    try:
        # Verify account belongs to user
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        # Get query parameters for filtering
        status = request.args.get('status')
        instrument = request.args.get('instrument')
        trade_type = request.args.get('trade_type')
        
        # Build query
        query = Trade.query.filter_by(account_id=account_id)
        
        if status:
            query = query.filter_by(status=status)
        if instrument:
            query = query.filter(Trade.instrument.ilike(f'%{instrument}%'))
        if trade_type:
            query = query.filter_by(trade_type=trade_type)
        
        trades = query.order_by(Trade.created_at.desc()).all()
        
        return jsonify({
            'trades': [trade.to_dict() for trade in trades]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/accounts/<int:account_id>/trades', methods=['POST'])
@require_auth
def create_trade(account_id):
    """Create a new trade"""
    try:
        # Verify account belongs to user
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        data = request.get_json()
        
        if not data or not data.get('instrument') or not data.get('trade_type'):
            return jsonify({'error': 'Instrument and trade type are required'}), 400
        
        # Create trade
        trade = Trade(
            account_id=account_id,
            trade_name=data.get('trade_name'),
            instrument=data['instrument'],
            trade_type=data['trade_type'],
            status=data.get('status', 'Open'),
            stop_loss_price=float(data['stop_loss_price']) if data.get('stop_loss_price') else None,
            take_profit_price=float(data['take_profit_price']) if data.get('take_profit_price') else None,
            risk_type_id=data.get('risk_type_id'),
            notes=data.get('notes')
        )
        
        db.session.add(trade)
        db.session.flush()  # Get the trade ID
        
        # Add initial entry if provided
        if data.get('entry_price') and data.get('quantity'):
            entry = TradeEntry(
                trade_id=trade.id,
                entry_date=datetime.fromisoformat(data['entry_date']) if data.get('entry_date') else datetime.utcnow(),
                entry_price=float(data['entry_price']),
                quantity=float(data['quantity']),
                commission=float(data.get('commission', 0))
            )
            db.session.add(entry)
        
        # Add strategy tags if provided
        if data.get('strategy_tags'):
            for tag_id in data['strategy_tags']:
                trade_tag = TradeStrategyTag(trade_id=trade.id, strategy_tag_id=tag_id)
                db.session.add(trade_tag)
        
        # Add costs if provided
        if data.get('costs'):
            for cost_data in data['costs']:
                cost = TradeCost(
                    trade_id=trade.id,
                    cost_type=cost_data['cost_type'],
                    amount=float(cost_data['amount']),
                    description=cost_data.get('description')
                )
                db.session.add(cost)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Trade created successfully',
            'trade': trade.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/trades/<int:trade_id>', methods=['GET'])
@require_auth
def get_trade(trade_id):
    """Get specific trade details"""
    try:
        trade = Trade.query.join(Account).filter(
            Trade.id == trade_id,
            Account.user_id == request.user_id
        ).first()
        
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        return jsonify({'trade': trade.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/trades/<int:trade_id>', methods=['PUT'])
@require_auth
def update_trade(trade_id):
    """Update trade details"""
    try:
        trade = Trade.query.join(Account).filter(
            Trade.id == trade_id,
            Account.user_id == request.user_id
        ).first()
        
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update trade fields
        if 'trade_name' in data:
            trade.trade_name = data['trade_name']
        if 'instrument' in data:
            trade.instrument = data['instrument']
        if 'trade_type' in data:
            trade.trade_type = data['trade_type']
        if 'status' in data:
            trade.status = data['status']
        if 'stop_loss_price' in data:
            trade.stop_loss_price = float(data['stop_loss_price']) if data['stop_loss_price'] else None
        if 'take_profit_price' in data:
            trade.take_profit_price = float(data['take_profit_price']) if data['take_profit_price'] else None
        if 'risk_type_id' in data:
            trade.risk_type_id = data['risk_type_id']
        if 'notes' in data:
            trade.notes = data['notes']
        
        trade.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Trade updated successfully',
            'trade': trade.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/trades/<int:trade_id>', methods=['DELETE'])
@require_auth
def delete_trade(trade_id):
    """Delete trade"""
    try:
        trade = Trade.query.join(Account).filter(
            Trade.id == trade_id,
            Account.user_id == request.user_id
        ).first()
        
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        db.session.delete(trade)
        db.session.commit()
        
        return jsonify({'message': 'Trade deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/trades/<int:trade_id>/entries', methods=['POST'])
@require_auth
def add_trade_entry(trade_id):
    """Add a new entry to an existing trade (for partial entries)"""
    try:
        trade = Trade.query.join(Account).filter(
            Trade.id == trade_id,
            Account.user_id == request.user_id
        ).first()
        
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        data = request.get_json()
        
        if not data or not data.get('entry_price') or not data.get('quantity'):
            return jsonify({'error': 'Entry price and quantity are required'}), 400
        
        entry = TradeEntry(
            trade_id=trade_id,
            entry_date=datetime.fromisoformat(data['entry_date']) if data.get('entry_date') else datetime.utcnow(),
            entry_price=float(data['entry_price']),
            quantity=float(data['quantity']),
            commission=float(data.get('commission', 0))
        )
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Entry added successfully',
            'entry': entry.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/trades/<int:trade_id>/exits', methods=['POST'])
@require_auth
def add_trade_exit(trade_id):
    """Add a new exit to an existing trade (for partial exits)"""
    try:
        trade = Trade.query.join(Account).filter(
            Trade.id == trade_id,
            Account.user_id == request.user_id
        ).first()
        
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        data = request.get_json()
        
        if not data or not data.get('exit_price') or not data.get('quantity'):
            return jsonify({'error': 'Exit price and quantity are required'}), 400
        
        # Check if we have enough open quantity
        open_quantity = trade.calculate_open_quantity()
        exit_quantity = float(data['quantity'])
        
        if exit_quantity > open_quantity:
            return jsonify({'error': f'Cannot exit {exit_quantity} units. Only {open_quantity} units are open.'}), 400
        
        exit_trade = TradeExit(
            trade_id=trade_id,
            exit_date=datetime.fromisoformat(data['exit_date']) if data.get('exit_date') else datetime.utcnow(),
            exit_price=float(data['exit_price']),
            quantity=exit_quantity,
            commission=float(data.get('commission', 0)),
            exit_reason=data.get('exit_reason')
        )
        
        db.session.add(exit_trade)
        
        # Update trade status if fully closed
        if trade.calculate_open_quantity() - exit_quantity <= 0:
            trade.status = 'Closed'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Exit added successfully',
            'exit': exit_trade.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/trades/<int:trade_id>/costs', methods=['POST'])
@require_auth
def add_trade_cost(trade_id):
    """Add a cost to a trade"""
    try:
        trade = Trade.query.join(Account).filter(
            Trade.id == trade_id,
            Account.user_id == request.user_id
        ).first()
        
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404
        
        data = request.get_json()
        
        if not data or not data.get('cost_type') or not data.get('amount'):
            return jsonify({'error': 'Cost type and amount are required'}), 400
        
        cost = TradeCost(
            trade_id=trade_id,
            cost_type=data['cost_type'],
            amount=float(data['amount']),
            description=data.get('description')
        )
        
        db.session.add(cost)
        db.session.commit()
        
        return jsonify({
            'message': 'Cost added successfully',
            'cost': cost.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

