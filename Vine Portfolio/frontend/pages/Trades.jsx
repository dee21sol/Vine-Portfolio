import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { Textarea } from './ui/textarea'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react'

const Trades = () => {
  const { getAuthHeaders, API_BASE } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [formData, setFormData] = useState({
    account_id: '',
    instrument: '',
    trade_type: 'Long',
    entry_price: '',
    quantity: '',
    stop_loss_price: '',
    take_profit_price: '',
    entry_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchTrades(selectedAccount)
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

  const fetchTrades = async (accountId) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/${accountId}/trades`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setTrades(data.trades)
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE}/accounts/${formData.account_id}/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          instrument: formData.instrument,
          trade_type: formData.trade_type,
          entry_price: parseFloat(formData.entry_price),
          quantity: parseFloat(formData.quantity),
          stop_loss_price: formData.stop_loss_price ? parseFloat(formData.stop_loss_price) : null,
          take_profit_price: formData.take_profit_price ? parseFloat(formData.take_profit_price) : null,
          entry_date: formData.entry_date,
          notes: formData.notes
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTrades([data.trade, ...trades])
        setShowCreateDialog(false)
        setFormData({
          account_id: '',
          instrument: '',
          trade_type: 'Long',
          entry_price: '',
          quantity: '',
          stop_loss_price: '',
          take_profit_price: '',
          entry_date: new Date().toISOString().split('T')[0],
          notes: ''
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Trades</h1>
          <p className="text-muted-foreground">
            Track and manage your trading activity
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button disabled={accounts.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Trade</DialogTitle>
              <DialogDescription>
                Record a new trade entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="account">Account *</Label>
                <Select value={formData.account_id} onValueChange={(value) => setFormData({...formData, account_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instrument">Instrument *</Label>
                  <Input
                    id="instrument"
                    placeholder="e.g., AAPL, EUR/USD"
                    value={formData.instrument}
                    onChange={(e) => setFormData({...formData, instrument: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="trade_type">Type *</Label>
                  <Select value={formData.trade_type} onValueChange={(value) => setFormData({...formData, trade_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long">Long</SelectItem>
                      <SelectItem value="Short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_price">Entry Price *</Label>
                  <Input
                    id="entry_price"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.entry_price}
                    onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.00001"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stop_loss">Stop Loss</Label>
                  <Input
                    id="stop_loss"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.stop_loss_price}
                    onChange={(e) => setFormData({...formData, stop_loss_price: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="take_profit">Take Profit</Label>
                  <Input
                    id="take_profit"
                    type="number"
                    step="0.00001"
                    placeholder="0.00"
                    value={formData.take_profit_price}
                    onChange={(e) => setFormData({...formData, take_profit_price: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entry_date">Entry Date</Label>
                <Input
                  id="entry_date"
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Trade rationale, setup, emotions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Trade'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Filter */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filter by Account</span>
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

      {/* Trades List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trading Accounts</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create a trading account first to start recording trades
            </p>
            <Button onClick={() => window.location.href = '/accounts'}>
              Create Account
            </Button>
          </CardContent>
        </Card>
      ) : trades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trades Yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start recording your trades for {selectedAccountData?.name}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Trade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Trades for {selectedAccountData?.name}
            </CardTitle>
            <CardDescription>
              {trades.length} trades recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      trade.status === 'Open' ? 'bg-blue-500' : 
                      trade.status === 'Closed' ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{trade.instrument}</p>
                        <Badge variant={trade.trade_type === 'Long' ? 'default' : 'secondary'}>
                          {trade.trade_type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {trade.entries.length > 0 && (
                          <>
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{trade.entries[0].entry_price}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(trade.entries[0].entry_date).toLocaleDateString()}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={trade.status === 'Open' ? 'secondary' : 'default'}>
                      {trade.status}
                    </Badge>
                    {trade.status === 'Closed' && (
                      <div className="text-right">
                        <div className={`font-medium ${
                          trade.calculate_net_pnl && trade.calculate_net_pnl() >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {/* P&L would be calculated on backend */}
                          P&L: --
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Trades

