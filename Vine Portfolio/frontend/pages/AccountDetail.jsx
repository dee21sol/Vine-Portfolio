import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react'

const AccountDetail = () => {
  const { id } = useParams()
  const { getAuthHeaders, API_BASE } = useAuth()
  const [accountData, setAccountData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccountData()
  }, [id])

  const fetchAccountData = async () => {
    try {
      const response = await fetch(`${API_BASE}/accounts/${id}/dashboard`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setAccountData(data)
      }
    } catch (error) {
      console.error('Error fetching account data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Account not found</h2>
        <Link to="/accounts">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Accounts
          </Button>
        </Link>
      </div>
    )
  }

  const { account, analytics, recent_trades } = accountData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/accounts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{account.name}</h1>
            <p className="text-muted-foreground">
              {account.broker && `${account.broker} • `}
              {account.trading_model}
            </p>
          </div>
        </div>
        <Badge variant={account.trading_model === 'High Risk' ? 'destructive' : 
                       account.trading_model === 'Risk-Free' ? 'secondary' : 'default'}>
          {account.trading_model}
        </Badge>
      </div>

      {/* Account Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {account.base_currency} {account.current_balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Initial: {account.base_currency} {account.initial_capital.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {analytics.total_pnl >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              analytics.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analytics.total_pnl >= 0 ? '+' : ''}{analytics.total_pnl}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.pnl_percentage >= 0 ? '+' : ''}{analytics.pnl_percentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.win_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.closed_trades} closed trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg R-Multiple</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{analytics.avg_r_multiple}R</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{analytics.profit_factor}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Win</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              +{analytics.avg_win}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">
              {analytics.avg_loss}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>
            Latest trading activity for this account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent_trades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No trades recorded yet</p>
              <Link to="/trades">
                <Button>Add Your First Trade</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recent_trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      trade.status === 'Open' ? 'bg-blue-500' : 
                      trade.status === 'Closed' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{trade.instrument}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.trade_type} • {trade.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={trade.status === 'Open' ? 'secondary' : 'default'}>
                      {trade.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountDetail

