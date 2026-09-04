import { Heart, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ResponsibleAI() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500" /> Responsible AI
        </h2>
        <p className="text-sm text-gray-500 mt-1">Transparency, fairness, and honest limitations</p>
      </div>

      {/* No Unsupported Claims */}
      <div className="card border-l-4 border-l-amber-400">
        <h3 className="text-sm font-bold text-navy-800 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Honest Limitations
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>This is a hackathon prototype.</strong> We do NOT claim:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> "Our ML model has 97% accuracy"</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> "We saved ₹X crore in losses"</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> "Zero false positives"</li>
            <li className="flex items-start gap-2"><span className="text-red-500 font-bold">✗</span> Any metric not derived from actual labeled observations</li>
          </ul>
          <p className="mt-2">
            All metrics shown in the dashboard (precision, recall, F1, FPR) are computed from actual simulated
            transactions with labeled outcomes. If fewer than 5 observations exist, we display "Insufficient data"
            rather than fabricated numbers.
          </p>
        </div>
      </div>

      {/* What We Do */}
      <div className="card border-l-4 border-l-emerald-400">
        <h3 className="text-sm font-bold text-navy-800 flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> What We Actually Do
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Compute risk scores using a transparent, weighted formula</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Provide full explainability for every signal contribution</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Use graduated intervention (not binary block)</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Never accuse the customer of fraud</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Gracefully degrade when AI is unavailable</li>
          <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold">✓</span> Record every evaluation for audit purposes</li>
        </ul>
      </div>

      {/* Customer Experience */}
      <div className="card border-l-4 border-l-blue-400">
        <h3 className="text-sm font-bold text-navy-800 flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-blue-500" /> Customer-Safe Language
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-bold text-red-600 mb-2">WE NEVER SAY:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• "Your account is flagged for fraud"</li>
              <li>• "Suspicious activity detected"</li>
              <li>• "You are a high-risk customer"</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 mb-2">WE SAY INSTEAD:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• "Cash on Delivery isn't available for this order"</li>
              <li>• "Verify your mobile number to continue with COD"</li>
              <li>• "Save ₹30 with UPI payment"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gemini Positioning */}
      <div className="card border-l-4 border-l-purple-400">
        <h3 className="text-sm font-bold text-navy-800 mb-3">Gemini AI Transparency</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Role:</strong> Gemini is one of six intelligence signals (10% weight). It provides contextual address quality and intent assessment.</p>
          <p><strong>Fallback:</strong> If Gemini is unavailable, the system continues with 5 deterministic signals and reduced confidence. No evaluation is blocked.</p>
          <p><strong>API Key:</strong> The Gemini API key exists only in the server process (Express backend). It is never exposed to the browser.</p>
          <p><strong>Not a Decision Maker:</strong> Gemini provides one signal. The risk engine aggregates all signals. The decision engine applies merchant policy. Gemini alone cannot block a customer.</p>
        </div>
      </div>
    </div>
  );
}
