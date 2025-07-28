import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  BarChart3,
  Plus,
  Eye
} from 'lucide-react'

const Dashboard = () => {
  const { getAuthHeaders, API_BASE } = useAuth()
  const [portfolioData, setPortfolioData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolioData()
  }, [])

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics/portfolio/dashboard`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setPortfolioData(data)
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const portfolio = portfolioData?.portfolio || {}
  const accounts = portfolioData?.accounts || []
  const topPerformers = portfolioData?.top_performers || []
  const bottomPerformers = portfolioData?.bottom_performers || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio Overview</h1>
          <p className="text-muted-foreground">
            Track your trading performance across all accounts
          </p>
        </div>
        <Link to="/accounts">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </Link>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio.primary_currency} {portfolio.total_balance?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Initial: {portfolio.primary_currency} {portfolio.total_initial_capital?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {portfolio.total_pnl >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              portfolio.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolio.total_pnl >= 0 ? '+' : ''}{portfolio.total_pnl?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolio.total_pnl_percentage >= 0 ? '+' : ''}{portfolio.total_pnl_percentage?.toFixed(2) || '0.00'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.total_accounts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {portfolio.total_open_trades || 0} open trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {portfolio.max_drawdown?.toFixed(2) || '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolio.total_closed_trades || 0} closed trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Performance */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span>Top Performers</span>
              </CardTitle>
              <CardDescription>
                Best performing accounts by percentage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPerformers.slice(0, 3).map((account, index) => (
                <div key={account.account.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{account.account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.account.trading_model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      account.pnl_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {account.pnl_percentage >= 0 ? '+' : ''}{account.pnl_percentage.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {account.closed_trades} trades
                    </p>
                  </div>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No performance data available yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Account Overview</span>
              </CardTitle>
              <CardDescription>
                Quick view of all your trading accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accounts.slice(0, 4).map((account) => (
                <div key={account.account.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="font-medium">{account.account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.account.base_currency} {account.account.current_balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={account.pnl_percentage >= 0 ? 'default' : 'destructive'}>
                      {account.pnl_percentage >= 0 ? '+' : ''}{account.pnl_percentage.toFixed(1)}%
                    </Badge>
                    <Link to={`/accounts/${account.account.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No trading accounts yet
                  </p>
                  <Link to="/accounts">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Account
                    </Button>
                  </Link>
                </div>
              )}
              {accounts.length > 4 && (
                <div className="text-center pt-2">
                  <Link to="/accounts">
                    <Button variant="outline" size="sm">
                      View All Accounts
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your trading portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/accounts">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <Briefcase className="w-6 h-6" />
                <span>Manage Accounts</span>
              </Button>
            </Link>
            <Link to="/trades">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <TrendingUp className="w-6 h-6" />
                <span>Add Trade</span>
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                <BarChart3 className="w-6 h-6" />
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard

