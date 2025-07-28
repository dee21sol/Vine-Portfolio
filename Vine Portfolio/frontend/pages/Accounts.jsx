import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Plus, 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Edit,
  DollarSign,
  Target,
  AlertTriangle
} from 'lucide-react'

const Accounts = () => {
  const { getAuthHeaders, API_BASE } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    broker: '',
    base_currency: 'USD',
    initial_capital: '',
    profit_target: '',
    max_drawdown: '',
    trading_model: 'Medium Risk'
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']
  const tradingModels = ['Risk-Free', 'Medium Risk', 'High Risk']

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_BASE}/accounts/`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE}/accounts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: formData.name,
          broker: formData.broker,
          base_currency: formData.base_currency,
          initial_capital: parseFloat(formData.initial_capital),
          profit_target: formData.profit_target ? parseFloat(formData.profit_target) : null,
          max_drawdown: formData.max_drawdown ? parseFloat(formData.max_drawdown) : null,
          trading_model: formData.trading_model
        })
      })

      const data = await response.json()

      if (response.ok) {
        setAccounts([...accounts, data.account])
        setShowCreateDialog(false)
        setFormData({
          name: '',
          broker: '',
          base_currency: 'USD',
          initial_capital: '',
          profit_target: '',
          max_drawdown: '',
          trading_model: 'Medium Risk'
        })
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const calculatePnL = (account) => {
    const pnl = account.current_balance - account.initial_capital
    const percentage = (pnl / account.initial_capital) * 100
    return { pnl, percentage }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Trading Accounts</h1>
          <p className="text-muted-foreground">
            Manage your trading accounts and track performance
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Trading Account</DialogTitle>
              <DialogDescription>
                Add a new trading account to track your performance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Stocks, Forex Trading"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="broker">Broker</Label>
                <Input
                  id="broker"
                  placeholder="e.g., Interactive Brokers, TD Ameritrade"
                  value={formData.broker}
                  onChange={(e) => setFormData({...formData, broker: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select value={formData.base_currency} onValueChange={(value) => setFormData({...formData, base_currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="initial_capital">Initial Capital *</Label>
                  <Input
                    id="initial_capital"
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    value={formData.initial_capital}
                    onChange={(e) => setFormData({...formData, initial_capital: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trading_model">Trading Model</Label>
                <Select value={formData.trading_model} onValueChange={(value) => setFormData({...formData, trading_model: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profit_target">Profit Target (%)</Label>
                  <Input
                    id="profit_target"
                    type="number"
                    step="0.1"
                    placeholder="20"
                    value={formData.profit_target}
                    onChange={(e) => setFormData({...formData, profit_target: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_drawdown">Max Drawdown (%)</Label>
                  <Input
                    id="max_drawdown"
                    type="number"
                    step="0.1"
                    placeholder="10"
                    value={formData.max_drawdown}
                    onChange={(e) => setFormData({...formData, max_drawdown: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trading Accounts</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first trading account to start tracking your performance
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const { pnl, percentage } = calculatePnL(account)
            const isProfit = pnl >= 0
            
            return (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <Badge variant={account.trading_model === 'High Risk' ? 'destructive' : 
                                   account.trading_model === 'Risk-Free' ? 'secondary' : 'default'}>
                      {account.trading_model}
                    </Badge>
                  </div>
                  {account.broker && (
                    <CardDescription>{account.broker}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Balance */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Balance</span>
                    </div>
                    <span className="font-semibold">
                      {account.base_currency} {account.current_balance.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* P&L */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isProfit ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">P&L</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{pnl.toFixed(2)}
                      </div>
                      <div className={`text-sm ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Targets */}
                  {account.profit_target && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Target</span>
                      </div>
                      <span className="text-sm">{account.profit_target}%</span>
                    </div>
                  )}
                  
                  {account.max_drawdown && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Max DD</span>
                      </div>
                      <span className="text-sm">{account.max_drawdown}%</span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link to={`/accounts/${account.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Accounts

