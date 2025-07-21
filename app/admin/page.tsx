"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  LogOut, 
  User, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  Square,
  MoreHorizontal,
  Calendar,
  Phone,
  Mail,
  FileText,
  BarChart3,
  Copy
} from 'lucide-react'

interface Payment {
  id: string
  utr_number: string
  email_phone?: string
  screenshot_url?: string
  status: 'pending' | 'verified' | 'rejected'
  submitted_at: string
}

interface LoginData {
  email: string
  password: string
}

interface Website {
  id: string
  name: string
  created_at: string
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [updatingPayments, setUpdatingPayments] = useState(new Set<string>())
  
  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')
  const [selectedPayments, setSelectedPayments] = useState(new Set<string>())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  })

  const [websites, setWebsites] = useState<Website[]>([])
  const [newWebsiteName, setNewWebsiteName] = useState('')
  const [websiteError, setWebsiteError] = useState('')
  const [websiteLoading, setWebsiteLoading] = useState(false)
  const [copiedSiteId, setCopiedSiteId] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
    fetchWebsites()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
    
    if (user) {
      fetchPayments()
    }
  }

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
    } else {
      setPayments(data)
      updateStats(data)
    }
  }

  const updateStats = (paymentsData: Payment[]) => {
    setStats({
      total: paymentsData.length,
      pending: paymentsData.filter(p => p.status === 'pending').length,
      verified: paymentsData.filter(p => p.status === 'verified').length,
      rejected: paymentsData.filter(p => p.status === 'rejected').length
    })
  }

  const fetchWebsites = async () => {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setWebsites(data)
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError('')

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')) {
      setLoginError('Supabase is not configured. Please check your .env.local file and add your Supabase credentials.')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    })

    if (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        setLoginError('Cannot connect to Supabase. Please check your internet connection and Supabase configuration.')
      } else {
        setLoginError(error.message)
      }
    } else {
      setUser(data.user)
      fetchPayments()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setPayments([])
    setSelectedPayments(new Set())
  }

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    setWebsiteError('')
    setWebsiteLoading(true)
    if (!newWebsiteName.trim()) {
      setWebsiteError('Website name is required')
      setWebsiteLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('websites')
      .insert([{ name: newWebsiteName.trim() }])
      .select()
    if (error) {
      setWebsiteError(error.message)
    } else {
      setWebsites([data[0], ...websites])
      setNewWebsiteName('')
    }
    setWebsiteLoading(false)
  }

  const handleCopy = (siteId: string) => {
    navigator.clipboard.writeText(`<PaymentWidget siteId=\"${siteId}\" />`)
    setCopiedSiteId(siteId)
    setTimeout(() => setCopiedSiteId(null), 1500)
  }

  const updatePaymentStatus = async (paymentId: string, newStatus: 'pending' | 'verified' | 'rejected') => {
    setUpdatingPayments(prev => new Set(prev).add(paymentId))
    
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        fetchPayments()
      } else {
        console.error('Failed to update payment status')
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
    } finally {
      setUpdatingPayments(prev => {
        const newSet = new Set(prev)
        newSet.delete(paymentId)
        return newSet
      })
    }
  }

  const deletePayment = async (paymentId: string) => {
    setUpdatingPayments(prev => new Set(prev).add(paymentId))
    
    try {
      const response = await fetch('/api/delete-payment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
        }),
      })

      if (response.ok) {
        fetchPayments()
        setShowDeleteConfirm(null)
      } else {
        console.error('Failed to delete payment')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
    } finally {
      setUpdatingPayments(prev => {
        const newSet = new Set(prev)
        newSet.delete(paymentId)
        return newSet
      })
    }
  }

  const bulkUpdateStatus = async (status: 'verified' | 'rejected') => {
    if (selectedPayments.size === 0) return
    
    setUpdatingPayments(prev => new Set([...Array.from(prev), ...Array.from(selectedPayments)]))
    
    try {
      const promises = Array.from(selectedPayments).map(paymentId =>
        fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId, status })
        })
      )
      
      await Promise.all(promises)
      fetchPayments()
      setSelectedPayments(new Set())
    } catch (error) {
      console.error('Error bulk updating payments:', error)
    } finally {
      setUpdatingPayments(new Set())
    }
  }

  const bulkDelete = async () => {
    if (selectedPayments.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedPayments.size} payment(s)?`)) return
    
    setUpdatingPayments(prev => new Set([...Array.from(prev), ...Array.from(selectedPayments)]))
    
    try {
      const promises = Array.from(selectedPayments).map(paymentId =>
        fetch('/api/delete-payment', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId })
        })
      )
      
      await Promise.all(promises)
      fetchPayments()
      setSelectedPayments(new Set())
    } catch (error) {
      console.error('Error bulk deleting payments:', error)
    } finally {
      setUpdatingPayments(new Set())
    }
  }

  const toggleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      setSelectedPayments(new Set())
    } else {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)))
    }
  }

  const toggleSelectPayment = (paymentId: string) => {
    const newSelected = new Set(selectedPayments)
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId)
    } else {
      newSelected.add(paymentId)
    }
    setSelectedPayments(newSelected)
  }

  const getStatusBadge = (status: 'pending' | 'verified' | 'rejected') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'verified':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return null
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.utr_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (payment.email_phone && payment.email_phone.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const exportPayments = () => {
    const csvContent = [
      ['ID', 'UTR Number', 'Contact', 'Status', 'Submitted At', 'Screenshot URL'].join(','),
      ...filteredPayments.map(p => [
        p.id,
        p.utr_number,
        p.email_phone || '',
        p.status,
        new Date(p.submitted_at).toLocaleString(),
        p.screenshot_url || ''
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Admin Login</CardTitle>
            <p className="text-gray-600">Access your payment dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="krrishyogi18@gmail.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                  className="h-11"
                />
              </div>
              {loginError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  {loginError}
                </div>
              )}
              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">KrishPay™ Admin</h1>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Live Dashboard
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Websites Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Websites
            </CardTitle>
            <CardDescription>
              Manage your connected websites and get the payment widget code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddWebsite} className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                placeholder="New website name (e.g. myshop.com)"
                value={newWebsiteName}
                onChange={e => setNewWebsiteName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" className="h-11" disabled={websiteLoading}>
                {websiteLoading ? 'Adding...' : 'Add Website'}
              </Button>
            </form>
            {websiteError && <div className="text-red-600 text-sm mb-4">{websiteError}</div>}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Site ID</th>
                    <th className="px-4 py-2 text-left">Widget Code</th>
                  </tr>
                </thead>
                <tbody>
                  {websites.map(site => (
                    <tr key={site.id} className="border-b">
                      <td className="px-4 py-2 font-medium">{site.name}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{site.id}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-50 border px-2 py-1 rounded text-xs">{'<PaymentWidget siteId="' + site.id + '" />'}</code>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopy(site.id)}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {copiedSiteId === site.id && <span className="text-green-600 text-xs ml-2">Copied!</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {websites.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-gray-400 py-4">No websites added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Payments</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Verified</p>
                  <p className="text-3xl font-bold">{stats.verified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Rejected</p>
                  <p className="text-3xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by UTR or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={fetchPayments} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={exportPayments} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedPayments.size > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    {selectedPayments.size} payment(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => bulkUpdateStatus('verified')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={updatingPayments.size > 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify All
                    </Button>
                    <Button
                      onClick={() => bulkUpdateStatus('rejected')}
                      size="sm"
                      variant="destructive"
                      disabled={updatingPayments.size > 0}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject All
                    </Button>
                    <Button
                      onClick={bulkDelete}
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      disabled={updatingPayments.size > 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete All
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No payments found</p>
                {searchTerm || statusFilter !== 'all' ? (
                  <Button onClick={() => { setSearchTerm(''); setStatusFilter('all') }} variant="outline" className="mt-2">
                    Clear filters
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="h-6 w-6 p-0"
                >
                  {selectedPayments.size === filteredPayments.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm text-gray-600">
                  Select all ({filteredPayments.length} payments)
                </span>
              </div>

              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSelectPayment(payment.id)}
                        className="h-6 w-6 p-0 mt-1"
                      >
                        {selectedPayments.has(payment.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Payment Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Payment #{payment.id.slice(-8)}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              {getStatusBadge(payment.status)}
                              <span className="text-sm text-gray-500">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(payment.submitted_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-gray-700">UTR Number:</span>
                              <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {payment.utr_number}
                              </span>
                            </div>
                            
                            {payment.email_phone && (
                              <div>
                                <span className="font-medium text-gray-700">Contact:</span>
                                <span className="ml-2 text-sm flex items-center">
                                  {payment.email_phone.includes('@') ? (
                                    <>
                                      <Mail className="h-3 w-3 mr-1" />
                                      {payment.email_phone}
                                    </>
                                  ) : (
                                    <>
                                      <Phone className="h-3 w-3 mr-1" />
                                      {payment.email_phone}
                                    </>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            {payment.screenshot_url ? (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Payment Screenshot:</h4>
                                <div className="border rounded-lg p-2 bg-gray-50">
                                  <img
                                    src={payment.screenshot_url}
                                    alt="Payment screenshot"
                                    className="w-full h-32 object-contain rounded"
                                  />
                                  <div className="mt-2 text-center">
                                    <a
                                      href={payment.screenshot_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Full Size
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <FileText className="h-8 w-8 mx-auto mb-2" />
                                <p>No screenshot uploaded</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => updatePaymentStatus(payment.id, 'verified')}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                              disabled={updatingPayments.has(payment.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {updatingPayments.has(payment.id) ? 'Updating...' : 'Verify'}
                            </Button>
                            <Button
                              onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                              variant="destructive"
                              size="sm"
                              disabled={updatingPayments.has(payment.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {updatingPayments.has(payment.id) ? 'Updating...' : 'Reject'}
                            </Button>
                          </div>
                          
                          <Button
                            onClick={() => setShowDeleteConfirm(payment.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            disabled={updatingPayments.has(payment.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this payment? This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => deletePayment(showDeleteConfirm)}
                  variant="destructive"
                  className="flex-1"
                >
                  Delete Payment
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}