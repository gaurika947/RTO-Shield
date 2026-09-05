import { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { DecisionResult } from '../../types/risk';
import type { PaymentMethod } from '../../types/order';
import { calculateOrderTotal, validatePaymentAttempt } from '../../engine/paymentPolicy';

interface Props {
  orderAmount: number;
  productName: string;
  decision: DecisionResult;
  onOrderCompleted: (method: PaymentMethod, finalAmount: number) => void;
}

export const CheckoutPreview: React.FC<Props> = ({
  orderAmount,
  productName,
  decision,
  onOrderCompleted,
}) => {
  const policy = decision.paymentPolicy;

  // Selected payment method state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(() => {
    if (policy.codAvailable) {
      return policy.riskLevel === 'LOW' ? 'COD' : 'UPI';
    }
    return 'UPI';
  });

  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Automatically reset payment method if COD becomes unavailable (HIGH risk)
  useEffect(() => {
    if (!policy.codAvailable && selectedMethod === 'COD') {
      setSelectedMethod('UPI');
    }
    setValidationError(null);
  }, [policy.codAvailable, policy.riskLevel, selectedMethod]);

  // Dynamic Total Calculation from Central Policy
  const { subtotal, codFee, total: finalTotal } = calculateOrderTotal(
    orderAmount,
    selectedMethod,
    policy
  );

  const needsOTP = selectedMethod === 'COD' && decision.otpRequired && !otpVerified;

  const handlePlaceOrder = async () => {
    setValidationError(null);

    // Enforcement: Validate payment attempt against Central Payment Policy
    const validation = validatePaymentAttempt(policy, selectedMethod, orderAmount);
    if (!validation.valid) {
      setValidationError(validation.error || 'Payment method not permitted for this risk tier.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout/validate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskLevel: policy.riskLevel,
          paymentMethod: selectedMethod,
          orderAmount,
        }),
      });
      const serverValidation = await response.json();
      if (!response.ok || serverValidation.valid === false) {
        setValidationError(serverValidation.error || 'Payment validation is unavailable. Please retry.');
        return;
      }
      setIsProcessing(false);
      onOrderCompleted(selectedMethod, serverValidation.finalAmount ?? validation.finalAmount);
    } catch {
      setValidationError('Payment validation is unavailable. Please retry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateOTP = () => {
    setOtpValue('482910');
    setOtpVerified(true);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600" />
          <h4 className="text-sm font-semibold text-slate-900">Secure payment selection</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            policy.riskLevel === 'LOW'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : policy.riskLevel === 'MEDIUM'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {policy.riskLevel} RISK POLICY
          </span>
        </div>
      </div>

      {validationError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Payment Methods Selection */}
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payment Method
            </span>
              <span className="text-[11px] text-slate-500">
              {policy.riskLevel === 'LOW' && '✓ Frictionless COD available'}
              {policy.riskLevel === 'MEDIUM' && '₹50 convenience fee applies ONLY to COD'}
              {policy.riskLevel === 'HIGH' && 'COD restricted; UPI & Card active'}
            </span>
          </div>

          {/* UPI */}
          <button
            type="button"
            onClick={() => setSelectedMethod('UPI')}
            aria-pressed={selectedMethod === 'UPI'}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              selectedMethod === 'UPI'
                ? 'border-blue-500 bg-blue-50 text-slate-900 ring-1 ring-blue-500/30'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold flex items-center gap-2">
                  <span>UPI / instant payment</span>
                  {policy.riskLevel !== 'LOW' && (
                    <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                  No additional fee
                </div>
              </div>
            </div>
            <div aria-hidden="true" className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              selectedMethod === 'UPI' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
            }`}>
              {selectedMethod === 'UPI' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>

          {/* Card */}
          <button
            type="button"
            onClick={() => setSelectedMethod('CARD')}
            aria-pressed={selectedMethod === 'CARD'}
            className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              selectedMethod === 'CARD'
                ? 'border-blue-500 bg-blue-50 text-slate-900 ring-1 ring-blue-500/30'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Credit / Debit Card</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                  No additional fee
                </div>
              </div>
            </div>
            <div aria-hidden="true" className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              selectedMethod === 'CARD' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
            }`}>
              {selectedMethod === 'CARD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>

          {/* Cash on Delivery (COD) Options */}
          {policy.codAvailable ? (
            <button
              type="button"
              onClick={() => setSelectedMethod('COD')}
              aria-pressed={selectedMethod === 'COD'}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  selectedMethod === 'COD'
                  ? 'border-blue-500 bg-blue-50 text-slate-900 ring-1 ring-blue-500/30'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Cash on Delivery (COD)</div>
                  {policy.riskLevel === 'MEDIUM' ? (
                    <div className="text-[11px] text-amber-400 font-bold mt-0.5">
                      + ₹50 convenience fee
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Available normally — ₹0 fee
                    </div>
                  )}
                </div>
              </div>
              <div aria-hidden="true" className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedMethod === 'COD' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
              }`}>
                {selectedMethod === 'COD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          ) : (
            /* HIGH RISK: Do NOT show COD as a disabled-looking selectable option.
               Show clear informative explanation instead as specified! */
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs">
              <div className="flex items-start gap-2.5 text-slate-700">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-slate-800">
                    Cash on Delivery isn't available for this order.
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    COD is unavailable for this transaction based on current risk assessment. You can complete your purchase securely with instant confirmation using UPI or Credit/Debit Card.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OTP Verification Prompt if COD with OTP */}
          {selectedMethod === 'COD' && decision.otpRequired && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-xs text-amber-300 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Order Confirmation OTP Required for COD
                </div>
                {!otpVerified && (
                  <button
                    onClick={handleSimulateOTP}
                    type="button"
                    className="text-[10px] underline font-mono text-amber-400 hover:text-amber-200"
                  >
                    Simulate Auto-Fill OTP
                  </button>
                )}
              </div>
              {otpVerified ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Mobile number verified successfully
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpValue}
                    onChange={(e) => {
                      setOtpValue(e.target.value);
                      if (e.target.value.length === 6) setOtpVerified(true);
                    }}
                    className="w-36 rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">Sent via WhatsApp / SMS</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ORDER SUMMARY */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-5">
          <div className="space-y-3">
            <div className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Order Summary
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span className="truncate pr-2">Product: {productName}</span>
                <span className="font-mono text-slate-700">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Dynamic Convenience Fee line */}
              {selectedMethod === 'COD' && codFee > 0 ? (
                <div className="flex justify-between text-amber-400 font-medium">
                  <span>COD Convenience Fee</span>
                  <span className="font-mono font-bold">+ ₹{codFee}</span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-500">
                  <span>Payment Fee</span>
                  <span className="font-mono text-emerald-400 font-medium">₹0</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Shipping & Delivery</span>
                <span className="text-emerald-400 font-medium">FREE</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total:</span>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-slate-950">
                  ₹{finalTotal.toLocaleString('en-IN')}
                </span>
                {codFee > 0 && selectedMethod === 'COD' && (
                  <div className="text-[10px] text-amber-400 font-mono">
                    (Includes ₹{codFee} COD fee)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
            <button
              onClick={handlePlaceOrder}
              disabled={needsOTP || isProcessing}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                needsOTP
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isProcessing
                  ? 'bg-blue-600/80 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Gateway Authorization…</span>
                </>
              ) : needsOTP ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verify OTP to Confirm COD Order</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order with {selectedMethod} (₹{finalTotal})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>RTO Sense Dynamic Checkout Defense Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
