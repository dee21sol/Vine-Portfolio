import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Award,
  AlertTriangle
} from 'lucide-react'

const Analytics = () => {
  const { getAuthHeaders, API_BASE } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchAnalytics(selectedAccount)
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE}/accounts/`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts)
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0].id.toString())
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (accountId) => {
    try {
      const response = await fetch(`${API_BASE}/analytics/accounts/${accountId}/analytics`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const selectedAccountData = accounts.find(acc => acc.id.toString() === selectedAccount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed performance analysis and insights
          </p>
        </div>
      </div>

      {/* Account Filter */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Account Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name} ({account.base_currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create a trading account and add some trades to see analytics
            </p>
          </CardContent>
        </Card>
      ) : !analyticsData ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Key Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.analytics.win_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.analytics.closed_trades} closed trades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.analytics.profit_factor}</div>
                <p className="text-xs text-muted-foreground">
                  Gross profit / Gross loss
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg R-Multiple</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.analytics.avg_r_multiple}R</div>
                <p className="text-xs text-muted-foreground">
                  Risk-reward ratio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expectancy</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.analytics.expectancy}</div>
                <p className="text-xs text-muted-foreground">
                  Expected value per trade
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Consecutive Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Best Streak</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analyticsData.analytics.max_consecutive_wins}
                </div>
                <p className="text-muted-foreground">Consecutive winning trades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span>Worst Streak</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {analyticsData.analytics.max_consecutive_losses}
                </div>
                <p className="text-muted-foreground">Consecutive losing trades</p>
              </CardContent>
            </Card>
          </div>

          {/* Best and Worst Trades */}
          {(analyticsData.analytics.best_trade || analyticsData.analytics.worst_trade) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyticsData.analytics.best_trade && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <span>Best Trade</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{analyticsData.analytics.best_trade.instrument}</span>
                        <Badge variant="default">{analyticsData.analytics.best_trade.trade_type}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        +{/* P&L calculation would be done on backend */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analyticsData.analytics.worst_trade && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span>Worst Trade</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{analyticsData.analytics.worst_trade.instrument}</span>
                        <Badge variant="secondary">{analyticsData.analytics.worst_trade.trade_type}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {/* P&L calculation would be done on backend */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Performance by Instrument */}
          {analyticsData.performance_by_instrument.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Instrument</CardTitle>
                <CardDescription>
                  Breakdown of trading performance by asset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance_by_instrument.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium">{item.instrument}</div>
                        <Badge variant="outline">{item.trades} trades</Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`font-medium ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.pnl >= 0 ? '+' : ''}{item.pnl}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.win_rate}% win rate
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance by Risk Type */}
          {analyticsData.performance_by_risk_type.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Risk Type</CardTitle>
                <CardDescription>
                  Analysis of different risk categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance_by_risk_type.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium">{item.risk_type}</div>
                        <Badge variant="outline">{item.trades} trades</Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`font-medium ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.pnl >= 0 ? '+' : ''}{item.pnl}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.win_rate}% win rate
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default Analytics

