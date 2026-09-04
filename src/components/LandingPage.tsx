'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Shield, Zap, CreditCard, Globe, Lock, BarChart3,
  ArrowRight, Check, ChevronDown, ChevronUp, Smartphone,
  Server, FileCode, Clock, Users, Star, Menu, X
} from 'lucide-react'

const faqs = [
  { q: "PayBridge kya hai?", a: "PayBridge Gateway ek professional payment gateway platform hai jo Pakistan mein EasyPaisa aur JazzCash ko support karta hai. Ye merchants ko accept payments karne ki facility deta hai." },
  { q: "Kya main free mein start kar sakta hoon?", a: "Haan, hum sandbox/demo mode mein free testing provide karte hain. Real transactions ke liye authorized merchant credentials zaruri hain." },
  { q: "Integration kitna time leta hai?", a: "Hamari REST API documentation aur SDK examples ke saath aap 30 minute mein integration start kar sakte hain." },
  { q: "Security kaise ensure hoti hai?", a: "End-to-end encryption, CSRF protection, rate limiting, API request signing, aur webhook verification - sab included hai." },
  { q: "Desktop app available hai?", a: "Haan, Windows desktop dashboard bhi available hai jo REST API communicate karta hai." },
]

const features = [
  { icon: Shield, title: "Bank-Level Security", desc: "End-to-end encryption, CSRF protection, aur secure webhook verification" },
  { icon: Zap, title: "Lightning Fast", desc: "Optimized REST API with sub-second response times" },
  { icon: CreditCard, title: "EasyPaisa + JazzCash", desc: "Official authorized merchant API integration" },
  { icon: Globe, title: "Multi-User Support", desc: "Separate data, API keys, aur balance for every user" },
  { icon: BarChart3, title: "Real-time Analytics", desc: "Dashboard charts aur transaction insights" },
  { icon: Lock, title: "Role-Based Access", desc: "Admin aur User panels with strict permission separation" },
]

const steps = [
  { num: "01", title: "Register Account", desc: "Sign up and get your API credentials instantly" },
  { num: "02", title: "Integrate API", desc: "Use our REST API to create payment requests" },
  { num: "03", title: "Accept Payments", desc: "Customers pay via EasyPaisa or JazzCash" },
  { num: "04", title: "Track & Settle", desc: "Monitor transactions and receive settlements" },
]

export default function LandingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-sm">P</div>
              <span className="text-lg font-bold">PayBridge</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
              <a href="#features" className="hover:text-emerald-400 transition">Features</a>
              <a href="#how-it-works" className="hover:text-emerald-400 transition">How it Works</a>
              <a href="#api" className="hover:text-emerald-400 transition">API</a>
              <a href="#faq" className="hover:text-emerald-400 transition">FAQ</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className="text-gray-300 hover:text-white" onClick={() => onNavigate('login')}>Login</Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => onNavigate('register')}>Get Started</Button>
            </div>
            <button className="md:hidden text-white" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-[#0d1220] border-t border-white/10 px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-300 hover:text-emerald-400" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#how-it-works" className="block text-gray-300 hover:text-emerald-400" onClick={() => setMobileMenu(false)}>How it Works</a>
            <Separator className="bg-white/10" />
            <Button variant="ghost" className="w-full text-gray-300" onClick={() => { onNavigate('login'); setMobileMenu(false) }}>Login</Button>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => { onNavigate('register'); setMobileMenu(false) }}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-6 text-sm px-4 py-1">
            🇵🇰 Pakistan's Trusted Payment Gateway
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Accept Payments<br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">with PayBridge</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Professional payment gateway for EasyPaisa & JazzCash. 
            Secure, fast, and built for Pakistani businesses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg" onClick={() => onNavigate('register')}>
              Start Free <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg" onClick={() => onNavigate('docs')}>
              View API Docs
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> No Setup Fees</div>
            <div className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> 24/7 Uptime</div>
          </div>
        </div>
      </section>

      {/* Payment Methods Banner */}
      <section className="py-12 px-4 border-y border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          <div className="flex items-center gap-3 text-xl font-bold text-gray-300">
            <Smartphone className="text-emerald-400" size={28} />
            EasyPaisa
          </div>
          <div className="text-white/20">|</div>
          <div className="flex items-center gap-3 text-xl font-bold text-gray-300">
            <Smartphone className="text-emerald-400" size={28} />
            JazzCash
          </div>
          <div className="text-white/20">|</div>
          <div className="flex items-center gap-3 text-xl font-bold text-gray-300">
            <Server className="text-emerald-400" size={28} />
            REST API
          </div>
          <div className="text-white/20">|</div>
          <div className="flex items-center gap-3 text-xl font-bold text-gray-300">
            <Shield className="text-emerald-400" size={28} />
            PCI Ready
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Complete payment infrastructure for your business</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="bg-[#111827] border-white/10 hover:border-emerald-500/30 transition-all group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                    <f.icon className="text-emerald-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 bg-[#0d1220]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Get started in 4 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center relative">
                <div className="text-5xl font-black text-emerald-500/20 mb-4">{s.num}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
                {i < 3 && <ArrowRight className="hidden lg:block absolute top-8 -right-4 text-emerald-500/30" size={20} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Integration */}
      <section id="api" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">Developer API</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Powerful API</h2>
              <p className="text-gray-400 mb-6">
                Integrate payments in minutes with our REST API. 
                Full documentation, code examples, and SDK support.
              </p>
              <ul className="space-y-3 mb-8">
                {["RESTful JSON API", "API Key + Secret authentication", "Signed requests", "Webhook callbacks", "Sandbox environment", "Rate limiting"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check size={16} className="text-emerald-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => onNavigate('docs')}>
                <FileCode className="mr-2" size={18} /> View Documentation
              </Button>
            </div>
            <div className="bg-[#111827] rounded-2xl border border-white/10 p-6 font-mono text-sm overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-gray-500 text-xs">create-payment.sh</span>
              </div>
              <pre className="text-gray-300 overflow-x-auto"><code>{`curl -X POST https://api.paybridge.pk/v1/payment/create \\
  -H "Authorization: Bearer pk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "PKR",
    "order_id": "ORDER-1001",
    "method": "easypaisa",
    "customer_name": "Ahmed Khan",
    "customer_phone": "03211234567"
  }'

# Response:
{
  "success": true,
  "transaction_id": "TXN123456",
  "status": "pending",
  "payment_url": "https://pay.paybridge.pk/TXN123456"
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">Security</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-12">Your data and transactions are protected at every layer</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Lock, title: "Encryption", desc: "AES-256 at rest, TLS 1.3 in transit" },
              { icon: Shield, title: "CSRF Protection", desc: "Token-based request validation" },
              { icon: Zap, title: "Rate Limiting", desc: "DDoS protection & abuse prevention" },
              { icon: Clock, title: "Idempotency", desc: "Duplicate callback prevention" },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#111827] border border-white/10">
                <s.icon className="text-emerald-400 mx-auto mb-3" size={28} />
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-gray-400 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-[#0d1220]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden">
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-emerald-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-500 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-400 text-sm">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Start Accepting Payments?</h2>
          <p className="text-gray-400 mb-8">Join hundreds of businesses using PayBridge Gateway</p>
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-6 text-lg" onClick={() => onNavigate('register')}>
            Create Free Account <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-sm">P</div>
                <span className="text-lg font-bold">PayBridge</span>
              </div>
              <p className="text-gray-400 text-sm">Pakistan's trusted payment gateway for EasyPaisa and JazzCash.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-emerald-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition" onClick={(e) => { e.preventDefault(); onNavigate('docs') }}>API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-emerald-400 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Status Page</a></li>
              </ul>
            </div>
          </div>
          <Separator className="bg-white/10 mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2026 PayBridge Gateway. All rights reserved.</p>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-emerald-400" /> Made in Pakistan 🇵🇰
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
