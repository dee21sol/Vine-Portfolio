import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'

// Components
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Accounts from './components/Accounts'
import AccountDetail from './components/AccountDetail'
import Trades from './components/Trades'
import Analytics from './components/Analytics'
import RiskManagement from './components/RiskManagement'
import Login from './components/Login'
import Register from './components/Register'

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/risk-management" element={<RiskManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App

