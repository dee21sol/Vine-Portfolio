import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  Calculator, 
  Shield, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  Target,
  Info
} from 'lucide-react'

const RiskManagement = () => {
  const { getAuthHeaders, API_BASE } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [riskSuggestions, setRiskSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)

  // Position Size Calculator
  const [positionCalc, setPositionCalc] = useState({
    account_balance: '',
    risk_percentage: '',
    entry_price: '',
    stop_loss_price: '',
    take_profit_price: ''
  })
  const [positionResult, setPositionResult] = useState(null)

  // Forex Calculator
  const [forexCalc, setForexCalc] = useState({
    account_balance: '',
    risk_percentage: '',
    stop_loss_pips: '',
    currency_pair: 'EURUSD',
    account_currency: 'USD'
  })
  const [forexResult, setForexResult] = useState(null)

  // Stock Calculator
  const [stockCalc, setStockCalc] = useState({
    account_balance: '',
    risk_percentage: '',
    entry_price: '',
    stop_loss_price: ''
  })
  const [stockResult, setStockResult] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchRiskSuggestions(selectedAccount)
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

  const fetchRiskSuggestions = async (accountId) => {
    try {
      const response = await fetch(`${API_BASE}/risk/accounts/${accountId}/risk-suggestions`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setRiskSuggestions(data)
      }
    } catch (error) {
      console.error('Error fetching risk suggestions:', error)
    }
  }

  const calculatePositionSize = async () => {
    try {
      const response = await fetch(`${API_BASE}/risk/calculators/position-size`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(positionCalc)
      })

      if (response.ok) {
        const data = await response.json()
        setPositionResult(data)
      }
    } catch (error) {
      console.error('Error calculating position size:', error)
    }
  }

  const calculateForexLotSize = async () => {
    try {
      const response = await fetch(`${API_BASE}/risk/calculators/forex-lot-size`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(forexCalc)
      })

      if (response.ok) {
        const data = await response.json()
        setForexResult(data)
      }
    } catch (error) {
      console.error('Error calculating forex lot size:', error)
    }
  }

  const calculateStockShares = async () => {
    try {
      const response = await fetch(`${API_BASE}/risk/calculators/stock-shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(stockCalc)
      })

      if (response.ok) {
        const data = await response.json()
        setStockResult(data)
      }
    } catch (error) {
      console.error('Error calculating stock shares:', error)
    }
  }

  const selectedAccountData = accounts.find(acc => acc.id.toString() === selectedAccount)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Risk Management</h1>
          <p className="text-muted-foreground">
            Calculate position sizes and manage trading risk
          </p>
        </div>
      </div>

      {/* Account Selection & Risk Suggestions */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Account Risk Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
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
              </div>
              
              {selectedAccountData && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Balance:</span>
                    <span className="font-medium">
                      {selectedAccountData.base_currency} {selectedAccountData.current_balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Trading Model:</span>
                    <Badge variant={selectedAccountData.trading_model === 'High Risk' ? 'destructive' : 
                                   selectedAccountData.trading_model === 'Risk-Free' ? 'secondary' : 'default'}>
                      {selectedAccountData.trading_model}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {riskSuggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Risk Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {riskSuggestions.suggestions.map((suggestion, index) => (
                  <Alert key={index} variant={
                    suggestion.type === 'warning' ? 'destructive' :
                    suggestion.type === 'positive' ? 'default' : 'default'
                  }>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{suggestion.message}</span>
                      {suggestion.suggested_risk && (
                        <Badge variant="outline">
                          {suggestion.suggested_risk}%
                        </Badge>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
                
                {riskSuggestions.recent_performance && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Recent Performance</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Trades Analyzed:</span>
                        <span className="ml-2 font-medium">{riskSuggestions.recent_performance.trades_analyzed}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Win Rate:</span>
                        <span className="ml-2 font-medium">{riskSuggestions.recent_performance.win_rate}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Risk Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Position Size Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Position Size Calculator</span>
            </CardTitle>
            <CardDescription>
              Calculate optimal position size based on risk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Balance</Label>
              <Input
                type="number"
                placeholder="10000"
                value={positionCalc.account_balance}
                onChange={(e) => setPositionCalc({...positionCalc, account_balance: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Risk Percentage (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="1"
                value={positionCalc.risk_percentage}
                onChange={(e) => setPositionCalc({...positionCalc, risk_percentage: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Entry Price</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="100.00"
                  value={positionCalc.entry_price}
                  onChange={(e) => setPositionCalc({...positionCalc, entry_price: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Stop Loss</Label>
                <Input
                  type="number"
                  step="0.00001"
                  placeholder="95.00"
                  value={positionCalc.stop_loss_price}
                  onChange={(e) => setPositionCalc({...positionCalc, stop_loss_price: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Take Profit (Optional)</Label>
              <Input
                type="number"
                step="0.00001"
                placeholder="110.00"
                value={positionCalc.take_profit_price}
                onChange={(e) => setPositionCalc({...positionCalc, take_profit_price: e.target.value})}
              />
            </div>
            
            <Button onClick={calculatePositionSize} className="w-full">
              Calculate Position Size
            </Button>
            
            {positionResult && (
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk Amount:</span>
                  <span className="font-medium">${positionResult.risk_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Position Size:</span>
                  <span className="font-medium">{positionResult.position_size} units</span>
                </div>
                {positionResult.r_multiple && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">R-Multiple:</span>
                    <span className="font-medium">{positionResult.r_multiple}R</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forex Lot Size Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Forex Lot Calculator</span>
            </CardTitle>
            <CardDescription>
              Calculate forex lot size based on pip risk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Balance</Label>
              <Input
                type="number"
                placeholder="10000"
                value={forexCalc.account_balance}
                onChange={(e) => setForexCalc({...forexCalc, account_balance: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Risk Percentage (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="1"
                value={forexCalc.risk_percentage}
                onChange={(e) => setForexCalc({...forexCalc, risk_percentage: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Stop Loss (Pips)</Label>
              <Input
                type="number"
                placeholder="20"
                value={forexCalc.stop_loss_pips}
                onChange={(e) => setForexCalc({...forexCalc, stop_loss_pips: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Currency Pair</Label>
              <Select value={forexCalc.currency_pair} onValueChange={(value) => setForexCalc({...forexCalc, currency_pair: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EURUSD">EUR/USD</SelectItem>
                  <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                  <SelectItem value="AUDUSD">AUD/USD</SelectItem>
                  <SelectItem value="USDCAD">USD/CAD</SelectItem>
                  <SelectItem value="USDCHF">USD/CHF</SelectItem>
                  <SelectItem value="USDJPY">USD/JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={calculateForexLotSize} className="w-full">
              Calculate Lot Size
            </Button>
            
            {forexResult && (
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk Amount:</span>
                  <span className="font-medium">${forexResult.risk_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Lot Size:</span>
                  <span className="font-medium">{forexResult.lot_display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk per Pip:</span>
                  <span className="font-medium">${forexResult.risk_per_pip}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Shares Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Stock Shares Calculator</span>
            </CardTitle>
            <CardDescription>
              Calculate number of shares for stock trading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Balance</Label>
              <Input
                type="number"
                placeholder="10000"
                value={stockCalc.account_balance}
                onChange={(e) => setStockCalc({...stockCalc, account_balance: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Risk Percentage (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="1"
                value={stockCalc.risk_percentage}
                onChange={(e) => setStockCalc({...stockCalc, risk_percentage: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Entry Price</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={stockCalc.entry_price}
                onChange={(e) => setStockCalc({...stockCalc, entry_price: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Stop Loss Price</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="145.00"
                value={stockCalc.stop_loss_price}
                onChange={(e) => setStockCalc({...stockCalc, stop_loss_price: e.target.value})}
              />
            </div>
            
            <Button onClick={calculateStockShares} className="w-full">
              Calculate Shares
            </Button>
            
            {stockResult && (
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Shares:</span>
                  <span className="font-medium">{stockResult.shares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Investment:</span>
                  <span className="font-medium">${stockResult.total_investment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Actual Risk:</span>
                  <span className="font-medium">${stockResult.actual_risk} ({stockResult.actual_risk_percentage}%)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Management Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Risk Management Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Conservative Approach</h4>
              <p className="text-sm text-muted-foreground">
                Risk 0.5-1% of account per trade. Suitable for beginners and steady growth.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Moderate Approach</h4>
              <p className="text-sm text-muted-foreground">
                Risk 1-2% of account per trade. Balanced approach for experienced traders.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Aggressive Approach</h4>
              <p className="text-sm text-muted-foreground">
                Risk 2-5% of account per trade. Higher risk, higher reward for experts only.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RiskManagement

