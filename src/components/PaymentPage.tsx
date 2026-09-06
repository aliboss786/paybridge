'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Smartphone, Shield, Lock, CheckCircle, XCircle, Clock, Loader2, ArrowRight, CreditCard, Fingerprint, RefreshCw, Search, Wifi, AlertTriangle } from 'lucide-react'

interface PaymentPageProps {
  transactionId: string
}

export default function PaymentPage({ transactionId }: PaymentPageProps) {
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [processing, setProcessing] = useState(false)
  const [phone, setPhone] = useState('')
  const [cnic, setCnic] = useState('')
  const [otp, setOtp] = useState('')
  const [correlationId, setCorrelationId] = useState('')
  const [demoOtp, setDemoOtp] = useState('')
  const [step, setStep] = useState<'select' | 'confirm' | 'otp' | 'processing' | 'success' | 'failed'>('select')
  const [errorMsg, setErrorMsg] = useState('')
  const [paymentMode, setPaymentMode] = useState<'collect' | 'redirect'>('collect')
  const [liveStatus, setLiveStatus] = useState<any>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchTransaction = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/payment/status/${transactionId}`)
      const data = await res.json()
      if (data.success) {
        setTransaction(data)
        if (data.status === 'successful') setStep('success')
        else if (data.status === 'failed') setStep('failed')
      }
    } catch { /* ignore */ }
  }, [transactionId])

  const checkLiveStatus = useCallback(async () => {
    setCheckingStatus(true)
    try {
      const res = await fetch(`/api/v1/payment/live-status/${transactionId}`)
      const data = await res.json()
      if (data.success) {
        setLiveStatus(data)
        // Update transaction status if it changed
        if (data.status !== transaction?.status) {
          fetchTransaction()
        }
      }
    } catch { /* ignore */ }
    setCheckingStatus(false)
  }, [transactionId, transaction?.status, fetchTransaction])

  // Auto-refresh for pending transactions
  useEffect(() => {
    if (!autoRefresh || !transaction || transaction.status !== 'pending') return

    const interval = setInterval(checkLiveStatus, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [autoRefresh, transaction, checkLiveStatus])

  useEffect(() => {
    fetchTransaction().finally(() => setLoading(false))
  }, [fetchTransaction])

  const handleInitiateCollect = async () => {
    if (!selectedMethod || !phone) return
    setProcessing(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/v1/payment/collect/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, phone, cnic }),
      })
      const data = await res.json()

      if (data.success && data.requiresOTP) {
        setCorrelationId(data.correlationId)
        if (data._demoOtp) setDemoOtp(data._demoOtp)
        setStep('otp')
      } else {
        setErrorMsg(data.error || 'Failed to initiate payment')
        setStep('failed')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStep('failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || !correlationId) return
    setProcessing(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/v1/payment/collect/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correlationId, otp }),
      })
      const data = await res.json()

      if (data.success) {
        setTransaction((prev: any) => ({ ...prev, status: 'successful', amount: data.amount || prev?.amount }))
        setStep('success')
      } else {
        setErrorMsg(data.error || 'OTP verification failed')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleRedirectPay = async () => {
    if (!selectedMethod) return
    setProcessing(true)
    setStep('processing')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/v1/payment/get-redirect/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod, phone }),
      })
      const data = await res.json()
      if (data.success && data.redirect_url && data.form_data) {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.redirect_url
        form.target = '_self'
        Object.entries(data.form_data).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
      } else {
        setErrorMsg(data.error || 'Payment processing failed')
        setStep('failed')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStep('failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={40} />
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-white">
        <Card className="bg-[#111827] border-white/10 max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto mb-4 text-red-400" size={48} />
            <h2 className="text-xl font-bold mb-2">Transaction Not Found</h2>
            <p className="text-gray-400 text-sm">The transaction ID is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
      <Card className="bg-[#111827] border-white/10 max-w-md w-full mx-4 relative z-10">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-lg">P</div>
              <span className="text-xl font-bold">PayBridge</span>
            </div>
            <p className="text-xs text-gray-400">Secure Payment Checkout</p>
          </div>

          <Separator className="bg-white/10 mb-6" />

          {/* Transaction Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Order ID</span>
              <span className="font-mono">{transaction.order_id || transactionId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Transaction ID</span>
              <span className="font-mono text-xs">{transaction.transaction_id || transactionId}</span>
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Amount</span>
              <span className="text-2xl font-bold text-emerald-400">Rs {transaction.amount?.toLocaleString()}</span>
            </div>
            {transaction.fee > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Processing Fee</span>
                <span className="text-gray-400">Rs {transaction.fee}</span>
              </div>
            )}
          </div>

          <Separator className="bg-white/10 mb-6" />

          {/* Live Status Panel */}
          {transaction?.status === 'pending' && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-yellow-400 animate-pulse" />
                  <span className="text-xs font-semibold text-yellow-400">LIVE STATUS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                  >
                    <RefreshCw size={12} className={autoRefresh ? 'animate-spin text-emerald-400' : 'text-gray-400'} />
                    {autoRefresh ? 'Auto' : 'Manual'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={checkLiveStatus}
                    disabled={checkingStatus}
                  >
                    {checkingStatus ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    Check Now
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1a2332] border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Clock size={16} className="text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Payment Pending</div>
                    <div className="text-sm font-medium">
                      Waiting for gateway confirmation...
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
                    PROCESSING
                  </Badge>
                </div>

                {liveStatus && (
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Checked</span>
                      <span>{new Date(liveStatus.updatedAt || liveStatus.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Elapsed</span>
                      <span>{liveStatus.minutesSinceCreation || 0} minutes</span>
                    </div>
                    {liveStatus.gatewayRef && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Gateway Ref</span>
                        <span className="font-mono text-[10px]">{liveStatus.gatewayRef}</span>
                      </div>
                    )}
                    {liveStatus.recommendation && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-300">{liveStatus.recommendation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP: Select Method & Mode */}
          {step === 'select' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Select Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedMethod('easypaisa')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedMethod === 'easypaisa'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <Smartphone className="mx-auto mb-2 text-emerald-400" size={24} />
                  <div className="font-semibold text-sm">EasyPaisa</div>
                </button>
                <button
                  onClick={() => setSelectedMethod('jazzcash')}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedMethod === 'jazzcash'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <Smartphone className="mx-auto mb-2 text-red-400" size={24} />
                  <div className="font-semibold text-sm">JazzCash</div>
                </button>
              </div>

              {selectedMethod && (
                <div className="space-y-3 mt-4">
                  {/* Payment Mode Toggle */}
                  <div className="space-y-2">
                    <Label className="text-sm">Payment Mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMode('collect')}
                        className={`p-3 rounded-lg border-2 transition-all text-center text-xs ${
                          paymentMode === 'collect'
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Fingerprint className="mx-auto mb-1 text-emerald-400" size={18} />
                        <div className="font-semibold">API Collect</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">OTP verification on this page</div>
                      </button>
                      <button
                        onClick={() => setPaymentMode('redirect')}
                        className={`p-3 rounded-lg border-2 transition-all text-center text-xs ${
                          paymentMode === 'redirect'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <CreditCard className="mx-auto mb-1 text-blue-400" size={18} />
                        <div className="font-semibold">Gateway Redirect</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Redirect to gateway page</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Mobile Number</Label>
                    <Input
                      placeholder="03XXXXXXXXX"
                      className="bg-[#1a2332] border-white/10"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      maxLength={11}
                    />
                  </div>

                  {paymentMode === 'collect' && (
                    <div className="space-y-2">
                      <Label className="text-sm">CNIC (Optional)</Label>
                      <Input
                        placeholder="42201-1234567-8"
                        className="bg-[#1a2332] border-white/10"
                        value={cnic}
                        onChange={e => setCnic(e.target.value)}
                        maxLength={15}
                      />
                    </div>
                  )}

                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                    onClick={paymentMode === 'collect' ? handleInitiateCollect : handleRedirectPay}
                    disabled={!selectedMethod || !phone || processing}
                  >
                    {processing ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : paymentMode === 'collect' ? (
                      <><Fingerprint size={16} className="mr-2" /> Send OTP & Pay</>
                    ) : (
                      <><Lock size={16} className="mr-2" /> Pay Rs {transaction.amount?.toLocaleString()}</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP: OTP Verification (API Collect) */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="text-emerald-400" size={28} />
                </div>
                <h3 className="font-semibold text-lg mb-1">Enter OTP</h3>
                <p className="text-gray-400 text-sm">
                  OTP sent to <span className="text-white font-medium">{transaction.customerPhone || phone}</span>
                </p>
                {demoOtp && (
                  <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-yellow-400">Demo OTP: <span className="font-mono font-bold text-yellow-300">{demoOtp}</span></p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">6-Digit OTP</Label>
                <Input
                  placeholder="Enter OTP"
                  className="bg-[#1a2332] border-white/10 text-center text-xl font-mono tracking-[0.5em]"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  autoFocus
                />
              </div>

              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                onClick={handleVerifyOtp}
                disabled={!otp || otp.length < 4 || processing}
              >
                {processing ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <><CheckCircle size={16} className="mr-2" /> Verify & Pay Rs {transaction.amount?.toLocaleString()}</>
                )}
              </Button>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                  <p className="text-xs text-red-400">{errorMsg}</p>
                </div>
              )}

              <div className="text-center">
                <button
                  className="text-xs text-gray-400 hover:text-white transition"
                  onClick={() => { setStep('select'); setOtp(''); setCorrelationId(''); setDemoOtp(''); setErrorMsg('') }}
                >
                  ← Change method or phone number
                </button>
              </div>
            </div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin text-emerald-400 mx-auto mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">Processing Payment</h3>
              <p className="text-gray-400 text-sm">Please wait while we process your payment...</p>
              <p className="text-xs text-gray-500 mt-2">Do not close this page</p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto mb-4 text-emerald-400" size={56} />
              <h3 className="font-semibold text-xl mb-2">Payment Successful!</h3>
              <p className="text-gray-400 text-sm mb-4">Your payment has been processed successfully.</p>
              <div className="bg-[#1a2332] rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-400">Amount</span><span>Rs {transaction.amount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Transaction ID</span><span className="font-mono text-xs">{transaction.transaction_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Status</span><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Successful</Badge></div>
              </div>
            </div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <div className="text-center py-8">
              <XCircle className="mx-auto mb-4 text-red-400" size={56} />
              <h3 className="font-semibold text-xl mb-2">Payment Failed</h3>
              <p className="text-gray-400 text-sm mb-4">{errorMsg || 'Your payment could not be processed.'}</p>
              <Button variant="outline" className="border-white/10" onClick={() => { setStep('select'); setSelectedMethod(''); setPhone(''); setOtp(''); setCnic(''); setErrorMsg(''); setDemoOtp('') }}>
                Try Again
              </Button>
            </div>
          )}

          {/* Security Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield size={12} /> Secured by PayBridge Gateway
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
