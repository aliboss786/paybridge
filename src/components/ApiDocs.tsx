import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Copy, Check, FileCode, ExternalLink } from 'lucide-react'

export default function ApiDocs({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [copiedIdx, setCopiedIdx] = useState('')

  const copyCode = (code: string, idx: string) => {
    navigator.clipboard.writeText(code)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(''), 2000)
  }

  const CodeBlock = ({ code, idx, lang }: { code: string; idx: string; lang?: string }) => (
    <div className="relative group my-3">
      <div className="bg-[#0d1220] rounded-xl border border-white/10 p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{lang || 'json'}</span>
          <button onClick={() => copyCode(code, idx)} className="text-gray-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition">
            {copiedIdx === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <pre className="text-sm text-gray-300 font-mono"><code>{code}</code></pre>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Top bar */}
      <div className="bg-[#111827] border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
          <ArrowLeft size={16} /> Home
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-sm">P</div>
          <span className="font-bold">PayBridge API Documentation</span>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-auto">v1.0</Badge>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Introduction */}
        <div>
          <h1 className="text-3xl font-bold mb-4">PayBridge API Reference</h1>
          <p className="text-gray-400 text-lg mb-6">
            The PayBridge API allows you to integrate EasyPaisa and JazzCash payments into your applications.
            All API requests must be authenticated with a valid API key and secret.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="bg-[#111827] border-white/10">
              <CardContent className="p-4">
                <div className="text-sm text-gray-400 mb-1">Base URL (Production)</div>
                <code className="text-emerald-400">https://api.paybridge.pk/api/v1</code>
              </CardContent>
            </Card>
            <Card className="bg-[#111827] border-white/10">
              <CardContent className="p-4">
                <div className="text-sm text-gray-400 mb-1">Base URL (Sandbox)</div>
                <code className="text-emerald-400">https://sandbox.paybridge.pk/api/v1</code>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Authentication */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileCode size={24} className="text-emerald-400" /> Authentication
          </h2>
          <p className="text-gray-400 mb-4">
            All API requests require authentication using your API key. Include it in the <code className="bg-white/10 px-1 rounded">Authorization</code> header:
          </p>
          <CodeBlock idx="auth" lang="http" code={`Authorization: Bearer pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json`} />

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-400 mt-4">
            <strong>⚠️ Security:</strong> Never expose your secret key (sk_live_*) in client-side code or public repositories.
          </div>
        </section>

        <Separator className="bg-white/10" />

        {/* Create Payment */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Create Payment</h2>
          <Card className="bg-[#111827] border-white/10 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">POST</Badge>
              <code>/api/v1/payment/create</code>
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold mb-2">Request Body</h3>
          <CodeBlock idx="create-req" lang="json" code={`{
  "amount": 5000,
  "currency": "PKR",
  "order_id": "ORDER-1001",
  "method": "easypaisa",
  "customer_name": "Ahmed Khan",
  "customer_email": "ahmed@example.com",
  "customer_phone": "03211234567",
  "callback_url": "https://your-site.com/payment/callback"
}`} />

          <h3 className="text-lg font-semibold mb-2 mt-6">Parameters</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-2 pr-4">Parameter</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Required</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>amount</code></td><td className="py-2 pr-4">number</td><td className="py-2 pr-4"><Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Yes</Badge></td><td className="py-2">Payment amount in PKR</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>currency</code></td><td className="py-2 pr-4">string</td><td className="py-2 pr-4">No</td><td className="py-2">Default: PKR</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>order_id</code></td><td className="py-2 pr-4">string</td><td className="py-2 pr-4"><Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Yes</Badge></td><td className="py-2">Your unique order identifier</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>method</code></td><td className="py-2 pr-4">string</td><td className="py-2 pr-4"><Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Yes</Badge></td><td className="py-2">easypaisa or jazzcash</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>customer_name</code></td><td className="py-2 pr-4">string</td><td className="py-2 pr-4">No</td><td className="py-2">Customer name</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>customer_email</code></td><td className="py-2 pr-4">string</td><td className="py-2 pr-4">No</td><td className="py-2">Customer email</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>customer_phone</code></td><td className="py-2 pr-4">string</td><td className="py-2 pr-4">No</td><td className="py-2">Customer phone (03XXXXXXXXX)</td></tr>
                <tr><td className="py-2 pr-4"><code>callback_url</code></td><td className="py-2 pr-4">string</td><td className="py-2 pr-4">No</td><td className="py-2">URL for payment status webhook</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold mb-2 mt-6">Response</h3>
          <CodeBlock idx="create-res" lang="json" code={`{
  "success": true,
  "transaction_id": "TXN1234567890",
  "status": "pending",
  "payment_url": "https://pay.paybridge.pk/TXN1234567890",
  "amount": 5000,
  "fee": 50,
  "net_amount": 4950
}`} />
        </section>

        <Separator className="bg-white/10" />

        {/* Payment Status */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Payment Status</h2>
          <Card className="bg-[#111827] border-white/10 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">GET</Badge>
              <code>/api/v1/payment/status/{'{transaction_id}'}</code>
            </CardContent>
          </Card>

          <CodeBlock idx="status-res" lang="json" code={`{
  "success": true,
  "transaction_id": "TXN1234567890",
  "order_id": "ORDER-1001",
  "status": "successful",
  "amount": 5000,
  "fee": 50,
  "net_amount": 4950,
  "payment_method": "easypaisa",
  "gateway_ref": "EP-REF-123456",
  "created_at": "2026-09-01T10:30:00Z"
}`} />
        </section>

        <Separator className="bg-white/10" />

        {/* Balance */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Get Balance</h2>
          <Card className="bg-[#111827] border-white/10 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">GET</Badge>
              <code>/api/v1/balance</code>
            </CardContent>
          </Card>

          <CodeBlock idx="balance-res" lang="json" code={`{
  "success": true,
  "balance": 45250.00,
  "currency": "PKR"
}`} />
        </section>

        <Separator className="bg-white/10" />

        {/* Transactions */}
        <section>
          <h2 className="text-2xl font-bold mb-4">List Transactions</h2>
          <Card className="bg-[#111827] border-white/10 mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">GET</Badge>
              <code>/api/v1/transactions?limit=20&offset=0</code>
            </CardContent>
          </Card>

          <CodeBlock idx="txns-res" lang="json" code={`{
  "success": true,
  "total": 150,
  "transactions": [
    {
      "transaction_id": "TXN1234567890",
      "order_id": "ORDER-1001",
      "amount": 5000,
      "fee": 50,
      "net_amount": 4950,
      "payment_method": "easypaisa",
      "status": "successful",
      "created_at": "2026-09-01T10:30:00Z"
    }
  ]
}`} />
        </section>

        <Separator className="bg-white/10" />

        {/* Callback/Webhook */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Callback / Webhook</h2>
          <p className="text-gray-400 mb-4">
            PayBridge sends POST requests to your callback_url when a payment status changes.
            You must verify the signature and idempotency before processing.
          </p>

          <CodeBlock idx="webhook-req" lang="json" code={`{
  "event": "payment.success",
  "transaction_id": "TXN1234567890",
  "order_id": "ORDER-1001",
  "amount": 5000,
  "currency": "PKR",
  "status": "successful",
  "gateway_ref": "EP-REF-123456",
  "signature": "sha256=xxxxxxxxxxxxxxx",
  "timestamp": "2026-09-01T10:35:00Z"
}`} />

          <h3 className="text-lg font-semibold mt-6 mb-2">Verification Steps</h3>
          <ol className="list-decimal list-inside text-gray-400 space-y-2">
            <li>Extract the <code className="bg-white/10 px-1 rounded">signature</code> from the webhook payload</li>
            <li>Compute HMAC-SHA256 of the payload body using your secret key</li>
            <li>Compare the computed signature with the received signature</li>
            <li>Check the <code className="bg-white/10 px-1 rounded">timestamp</code> to prevent replay attacks (reject if older than 5 minutes)</li>
            <li>Process the payment — use idempotency to prevent double-crediting</li>
          </ol>
        </section>

        <Separator className="bg-white/10" />

        {/* Error Codes */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Error Codes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">HTTP Status</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>INVALID_REQUEST</code></td><td className="py-2 pr-4">400</td><td className="py-2">Missing or invalid parameters</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>UNAUTHORIZED</code></td><td className="py-2 pr-4">401</td><td className="py-2">Invalid or missing API key</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>FORBIDDEN</code></td><td className="py-2 pr-4">403</td><td className="py-2">Insufficient permissions</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>NOT_FOUND</code></td><td className="py-2 pr-4">404</td><td className="py-2">Transaction not found</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>RATE_LIMITED</code></td><td className="py-2 pr-4">429</td><td className="py-2">Too many requests</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4"><code>INSUFFICIENT_BALANCE</code></td><td className="py-2 pr-4">422</td><td className="py-2">Not enough balance for cash-out</td></tr>
                <tr><td className="py-2 pr-4"><code>SERVER_ERROR</code></td><td className="py-2 pr-4">500</td><td className="py-2">Internal server error</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <Separator className="bg-white/10" />

        {/* Code Examples */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
          <Tabs defaultValue="php">
            <TabsList className="bg-[#111827]">
              <TabsTrigger value="php">PHP</TabsTrigger>
              <TabsTrigger value="js">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            <TabsContent value="php">
              <CodeBlock idx="php-ex" lang="php" code={`<?php
$ch = curl_init("https://api.paybridge.pk/api/v1/payment/create");

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer pk_live_xxxxxxxxxxxxxxxx",
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "amount" => 5000,
        "currency" => "PKR",
        "order_id" => "ORDER-" . time(),
        "method" => "easypaisa",
        "customer_name" => "Ahmed Khan",
        "customer_phone" => "03211234567",
        "callback_url" => "https://your-site.com/callback"
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
if ($result["success"]) {
    // Redirect user to payment page
    header("Location: " . $result["payment_url"]);
}
?>`} />
            </TabsContent>
            <TabsContent value="js">
              <CodeBlock idx="js-ex" lang="javascript" code={`const response = await fetch("https://api.paybridge.pk/api/v1/payment/create", {
  method: "POST",
  headers: {
    "Authorization": "Bearer pk_live_xxxxxxxxxxxxxxxx",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: 5000,
    currency: "PKR",
    order_id: "ORDER-" + Date.now(),
    method: "easypaisa",
    customer_name: "Ahmed Khan",
    customer_phone: "03211234567",
    callback_url: "https://your-site.com/callback"
  })
});

const data = await response.json();
if (data.success) {
  window.location.href = data.payment_url;
}`} />
            </TabsContent>
            <TabsContent value="curl">
              <CodeBlock idx="curl-ex" lang="bash" code={`curl -X POST https://api.paybridge.pk/api/v1/payment/create \\
  -H "Authorization: Bearer pk_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "PKR",
    "order_id": "ORDER-1001",
    "method": "easypaisa",
    "customer_name": "Ahmed Khan",
    "customer_phone": "03211234567",
    "callback_url": "https://your-site.com/callback"
  }'`} />
            </TabsContent>
          </Tabs>
        </section>

        <Separator className="bg-white/10" />

        {/* Status Codes */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Payment Statuses</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { status: 'pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', desc: 'Payment initiated, awaiting customer action' },
              { status: 'processing', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', desc: 'Payment being processed by gateway' },
              { status: 'successful', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', desc: 'Payment completed successfully' },
              { status: 'failed', color: 'bg-red-500/20 text-red-400 border-red-500/30', desc: 'Payment failed' },
              { status: 'cancelled', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', desc: 'Payment cancelled by customer' },
              { status: 'expired', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', desc: 'Payment link expired' },
              { status: 'refunded', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', desc: 'Payment refunded to customer' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#111827] border border-white/5">
                <Badge className={s.color}>{s.status}</Badge>
                <span className="text-sm text-gray-400">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
