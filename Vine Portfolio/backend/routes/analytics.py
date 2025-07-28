from flask import Blueprint, request, jsonify
from src.models import db, Account, Trade, User
from src.routes.auth import require_auth
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/portfolio/dashboard', methods=['GET'])
@require_auth
def get_portfolio_dashboard():
    """Get main portfolio dashboard with aggregated data"""
    try:
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get all user accounts
        accounts = Account.query.filter_by(user_id=request.user_id).all()
        
        if not accounts:
            return jsonify({
                'portfolio': {
                    'total_accounts': 0,
                    'total_balance': 0,
                    'total_initial_capital': 0,
                    'total_pnl': 0,
                    'total_pnl_percentage': 0,
                    'max_drawdown': 0,
                    'total_open_trades': 0,
                    'total_closed_trades': 0
                },
                'accounts': [],
                'top_performers': [],
                'bottom_performers': []
            }), 200
        
        # Calculate portfolio metrics
        total_balance = 0
        total_initial_capital = 0
        total_open_trades = 0
        total_closed_trades = 0
        account_performances = []
        
        for account in accounts:
            # Get account trades
            trades = Trade.query.filter_by(account_id=account.id).all()
            closed_trades = [t for t in trades if t.status == 'Closed']
            open_trades = [t for t in trades if t.status == 'Open']
            
            # Calculate account P&L
            account_pnl = sum(t.calculate_net_pnl() for t in closed_trades)
            account.current_balance = float(account.initial_capital) + account_pnl
            
            # Convert to primary currency (simplified - assuming 1:1 for now)
            # In a real implementation, you'd use exchange rates here
            total_balance += account.current_balance
            total_initial_capital += float(account.initial_capital)
            total_open_trades += len(open_trades)
            total_closed_trades += len(closed_trades)
            
            # Store account performance for ranking
            account_pnl_percentage = account.calculate_pnl_percentage()
            account_performances.append({
                'account': account.to_dict(),
                'pnl': account_pnl,
                'pnl_percentage': account_pnl_percentage,
                'open_trades': len(open_trades),
                'closed_trades': len(closed_trades)
            })
        
        # Update account balances
        db.session.commit()
        
        # Calculate portfolio totals
        total_pnl = total_balance - total_initial_capital
        total_pnl_percentage = (total_pnl / total_initial_capital * 100) if total_initial_capital > 0 else 0
        
        # Calculate max drawdown (simplified)
        max_drawdown = max((acc['account']['max_drawdown'] or 0) for acc in account_performances) if account_performances else 0
        
        # Sort accounts by performance
        account_performances.sort(key=lambda x: x['pnl_percentage'], reverse=True)
        top_performers = account_performances[:3]
        bottom_performers = account_performances[-3:] if len(account_performances) > 3 else []
        
        portfolio_data = {
            'portfolio': {
                'total_accounts': len(accounts),
                'total_balance': round(total_balance, 2),
                'total_initial_capital': round(total_initial_capital, 2),
                'total_pnl': round(total_pnl, 2),
                'total_pnl_percentage': round(total_pnl_percentage, 2),
                'max_drawdown': round(max_drawdown, 2),
                'total_open_trades': total_open_trades,
                'total_closed_trades': total_closed_trades,
                'primary_currency': user.primary_currency
            },
            'accounts': account_performances,
            'top_performers': top_performers,
            'bottom_performers': bottom_performers
        }
        
        return jsonify(portfolio_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/accounts/<int:account_id>/analytics', methods=['GET'])
@require_auth
def get_account_analytics(account_id):
    """Get detailed analytics for a specific account"""
    try:
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        # Get all trades for this account
        trades = Trade.query.filter_by(account_id=account_id).all()
        closed_trades = [t for t in trades if t.status == 'Closed']
        
        if not closed_trades:
            return jsonify({
                'account': account.to_dict(),
                'analytics': {
                    'total_trades': len(trades),
                    'closed_trades': 0,
                    'win_rate': 0,
                    'profit_factor': 0,
                    'avg_r_multiple': 0,
                    'expectancy': 0,
                    'max_consecutive_wins': 0,
                    'max_consecutive_losses': 0,
                    'best_trade': None,
                    'worst_trade': None
                },
                'performance_by_instrument': [],
                'performance_by_risk_type': [],
                'monthly_performance': []
            }), 200
        
        # Calculate basic metrics
        winning_trades = [t for t in closed_trades if t.calculate_net_pnl() > 0]
        losing_trades = [t for t in closed_trades if t.calculate_net_pnl() <= 0]
        
        win_rate = (len(winning_trades) / len(closed_trades) * 100) if closed_trades else 0
        
        total_wins = sum(t.calculate_net_pnl() for t in winning_trades)
        total_losses = abs(sum(t.calculate_net_pnl() for t in losing_trades))
        profit_factor = total_wins / total_losses if total_losses > 0 else 0
        
        # R-multiples
        r_multiples = [t.calculate_r_multiple() for t in closed_trades if t.calculate_r_multiple() != 0]
        avg_r_multiple = sum(r_multiples) / len(r_multiples) if r_multiples else 0
        
        # Expectancy
        avg_win = total_wins / len(winning_trades) if winning_trades else 0
        avg_loss = total_losses / len(losing_trades) if losing_trades else 0
        expectancy = (win_rate / 100 * avg_win) - ((100 - win_rate) / 100 * avg_loss)
        
        # Consecutive wins/losses
        max_consecutive_wins = 0
        max_consecutive_losses = 0
        current_wins = 0
        current_losses = 0
        
        for trade in closed_trades:
            if trade.calculate_net_pnl() > 0:
                current_wins += 1
                current_losses = 0
                max_consecutive_wins = max(max_consecutive_wins, current_wins)
            else:
                current_losses += 1
                current_wins = 0
                max_consecutive_losses = max(max_consecutive_losses, current_losses)
        
        # Best and worst trades
        best_trade = max(closed_trades, key=lambda t: t.calculate_net_pnl()) if closed_trades else None
        worst_trade = min(closed_trades, key=lambda t: t.calculate_net_pnl()) if closed_trades else None
        
        # Performance by instrument
        instrument_performance = {}
        for trade in closed_trades:
            instrument = trade.instrument
            if instrument not in instrument_performance:
                instrument_performance[instrument] = {
                    'trades': 0,
                    'pnl': 0,
                    'wins': 0
                }
            instrument_performance[instrument]['trades'] += 1
            instrument_performance[instrument]['pnl'] += trade.calculate_net_pnl()
            if trade.calculate_net_pnl() > 0:
                instrument_performance[instrument]['wins'] += 1
        
        performance_by_instrument = []
        for instrument, data in instrument_performance.items():
            win_rate_instrument = (data['wins'] / data['trades'] * 100) if data['trades'] > 0 else 0
            performance_by_instrument.append({
                'instrument': instrument,
                'trades': data['trades'],
                'pnl': round(data['pnl'], 2),
                'win_rate': round(win_rate_instrument, 2)
            })
        
        # Performance by risk type
        risk_type_performance = {}
        for trade in closed_trades:
            risk_type = trade.risk_type.name if trade.risk_type else 'Unassigned'
            if risk_type not in risk_type_performance:
                risk_type_performance[risk_type] = {
                    'trades': 0,
                    'pnl': 0,
                    'wins': 0
                }
            risk_type_performance[risk_type]['trades'] += 1
            risk_type_performance[risk_type]['pnl'] += trade.calculate_net_pnl()
            if trade.calculate_net_pnl() > 0:
                risk_type_performance[risk_type]['wins'] += 1
        
        performance_by_risk_type = []
        for risk_type, data in risk_type_performance.items():
            win_rate_risk = (data['wins'] / data['trades'] * 100) if data['trades'] > 0 else 0
            performance_by_risk_type.append({
                'risk_type': risk_type,
                'trades': data['trades'],
                'pnl': round(data['pnl'], 2),
                'win_rate': round(win_rate_risk, 2)
            })
        
        analytics_data = {
            'account': account.to_dict(),
            'analytics': {
                'total_trades': len(trades),
                'closed_trades': len(closed_trades),
                'win_rate': round(win_rate, 2),
                'profit_factor': round(profit_factor, 2),
                'avg_r_multiple': round(avg_r_multiple, 2),
                'expectancy': round(expectancy, 2),
                'max_consecutive_wins': max_consecutive_wins,
                'max_consecutive_losses': max_consecutive_losses,
                'best_trade': best_trade.to_dict() if best_trade else None,
                'worst_trade': worst_trade.to_dict() if worst_trade else None
            },
            'performance_by_instrument': performance_by_instrument,
            'performance_by_risk_type': performance_by_risk_type
        }
        
        return jsonify(analytics_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/accounts/<int:account_id>/export', methods=['GET'])
@require_auth
def export_account_data(account_id):
    """Export account data as CSV"""
    try:
        account = Account.query.filter_by(id=account_id, user_id=request.user_id).first()
        if not account:
            return jsonify({'error': 'Account not found'}), 404
        
        trades = Trade.query.filter_by(account_id=account_id).all()
        
        # Prepare CSV data
        csv_data = []
        csv_data.append([
            'Trade ID', 'Trade Name', 'Instrument', 'Type', 'Status',
            'Entry Date', 'Entry Price', 'Exit Date', 'Exit Price',
            'Quantity', 'Stop Loss', 'Take Profit', 'Gross P&L',
            'Net P&L', 'Total Costs', 'R-Multiple', 'Notes'
        ])
        
        for trade in trades:
            # Get first entry and exit for simplicity
            first_entry = trade.entries[0] if trade.entries else None
            first_exit = trade.exits[0] if trade.exits else None
            
            csv_data.append([
                trade.id,
                trade.trade_name or '',
                trade.instrument,
                trade.trade_type,
                trade.status,
                first_entry.entry_date.isoformat() if first_entry else '',
                float(first_entry.entry_price) if first_entry else '',
                first_exit.exit_date.isoformat() if first_exit else '',
                float(first_exit.exit_price) if first_exit else '',
                float(first_entry.quantity) if first_entry else '',
                float(trade.stop_loss_price) if trade.stop_loss_price else '',
                float(trade.take_profit_price) if trade.take_profit_price else '',
                round(trade.calculate_gross_pnl(), 2),
                round(trade.calculate_net_pnl(), 2),
                round(trade.calculate_total_costs(), 2),
                round(trade.calculate_r_multiple(), 2),
                trade.notes or ''
            ])
        
        return jsonify({
            'csv_data': csv_data,
            'filename': f'{account.name}_trades_export.csv'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

