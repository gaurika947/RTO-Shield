import { Heart, Shield, AlertTriangle, CheckCircle2, Lock, Cpu } from 'lucide-react';

export default function ResponsibleAI() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500" /> Responsible AI & Governance
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Transparency, ethical fraud prevention, PII minimization, and honest limitation disclosures.
        </p>
      </div>

      {/* Honest Limitations & No Unsupported Claims */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-slate-800">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Honest Limitations & Synthetic Benchmark Disclosures
        </h3>
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            <strong>RTO-Shield is a prototype decision intelligence engine.</strong> We maintain total transparency about what this system is and is not:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold">✗</span>
              <span><strong>No unsupported production claims:</strong> Benchmark test metrics (98.3% accuracy, 0.998 AUC) are measured on a 11,360-sample held-out synthetic split, not real-world merchant production traffic.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold">✗</span>
              <span><strong>No fabricated financial savings:</strong> Financial exposure figures are estimated projections based on configurable merchant unit economics, not live audited balances.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold">✗</span>
              <span><strong>Zero false positive myth:</strong> Every probabilistic fraud model has trade-offs. We explicitly document false positive rates (0.9% on test split) and false negative rates (4.8%) across threshold sweeps.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-600 font-bold">✗</span>
              <span><strong>Not a live payment gateway:</strong> This is a decision and policy layer that interfaces with checkout workflows. It is not connected to live banking rails or live Razorpay webhooks.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* What We Actually Do */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What RTO-Shield Genuinely Implements
        </h3>
        <ul className="space-y-2.5 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>7-Signal Risk Architecture:</strong> Independent evaluation across Address Intelligence, Order History, Network/Device Graph, Velocity, Behavior, Trained GBDT ML, and AI Context.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>Server-Authoritative Enforcement:</strong> The client cannot tamper with risk levels or payable amounts. Decisions are secured with HMAC tokens.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>Full Explainability:</strong> Every risk score breaks down into transparent signal contributions with concrete evidential reasons.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>Graduated Nudges over Binary Blocks:</strong> Low-risk buyers experience zero friction (₹0 COD fee); medium-risk buyers receive a ₹50 fee or prepaid recommendation; only high-risk orders restrict COD.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>Graceful Fallback:</strong> If ML or AI services are offline, the system seamlessly continues using deterministic fallback logic without blocking customer checkouts.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>Cryptographic Provenance:</strong> Model artifact SHA-256 hash (`921353523dda...`) and 28-feature canonical schema version are verified on startup and displayed on the status page.</span>
          </li>
        </ul>
      </div>

      {/* Privacy and PII Protection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-indigo-600" /> Privacy & PII Minimization
        </h3>
        <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
          <p>
            Customer privacy is protected by design. Before any transaction context is sent to external LLMs (Google Gemini), all sensitive PII is automatically sanitized server-side:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <strong className="block text-slate-900 mb-1">Phone Numbers</strong>
              <span>Masked to non-reversible hashes or redacting pattern `[PHONE_MASKED]`</span>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <strong className="block text-slate-900 mb-1">Email Addresses</strong>
              <span>Full addresses stripped and replaced with `[EMAIL_MASKED]`</span>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <strong className="block text-slate-900 mb-1">Door / Flat Numbers</strong>
              <span>Specific premise numbers redacted; city/state/pincode preserved for deliverability analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer-Safe Language Policy */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-600" /> Customer-Safe Language Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
            <p className="font-bold text-rose-700 mb-2 uppercase tracking-wider">NEVER SHOWN TO CUSTOMERS:</p>
            <ul className="space-y-1.5 text-slate-700">
              <li>• "Your account has been flagged for fraud"</li>
              <li>• "Suspicious syndicate activity detected"</li>
              <li>• "Risk score: 85/100 (HIGH RISK)"</li>
              <li>• "You have a high return probability"</li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="font-bold text-emerald-700 mb-2 uppercase tracking-wider">SHOWN INSTEAD (NEUTRAL NUDGES):</p>
            <ul className="space-y-1.5 text-slate-700">
              <li>• "Cash on Delivery isn't available for this order"</li>
              <li>• "Verify your mobile number to continue with COD"</li>
              <li>• "Save ₹50 by completing payment via UPI or Card"</li>
              <li>• "Frictionless checkout active"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gemini AI Role */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-purple-600" /> Gemini AI Contextual Intelligence Role
        </h3>
        <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
          <p><strong>Optional Intelligence Signal:</strong> Gemini is strictly an advisory signal providing qualitative address structure and intent explanations. It is weighted at 5% within the risk formula.</p>
          <p><strong>Not a Single Point of Failure:</strong> If Gemini is unavailable, unconfigured, or times out (5-second hard limit), the checkout flow proceeds uninterrupted using the 6 deterministic and ML signals.</p>
          <p><strong>Zero Authority over Checkout:</strong> Gemini alone can never block an order, authorize a transaction, or alter payable fees. Final decisions are governed strictly by the merchant policy engine.</p>
        </div>
      </div>
    </div>
  );
}
