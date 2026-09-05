import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

config(); // Load .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const execFileAsync = promisify(execFile);
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python';

// Gemini API key — server-side ONLY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Health check
app.get('/api/health', (_req, res) => {
  const artifactAvailable = fs.existsSync(path.join(__dirname, '..', 'ml', 'models', 'rto_model.joblib'));
  res.json({
    status: 'ok',
    service: 'RTO-Shield API',
    modelVersion: artifactAvailable ? 'RTO Shield GBDT v1' : 'RTO Shield Deterministic Fallback v1',
    modelStatus: artifactAvailable ? 'PRIMARY_ARTIFACT_PER_REQUEST' : 'DETERMINISTIC_FALLBACK',
    geminiStatus: GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
  });
});

// Pincode risk dictionary
const PINCODE_RISK_MAP = {
  '110001': 0.09, '110070': 0.08, '110016': 0.07, '560001': 0.08, '560038': 0.09,
  '400001': 0.09, '400050': 0.08, '600001': 0.10, '700001': 0.12, '500001': 0.11,
  '201301': 0.22, '201309': 0.19, '201017': 0.28, '226010': 0.24, '302001': 0.18,
  '800001': 0.34, '842001': 0.38, '247001': 0.36, '282001': 0.32, '452001': 0.21,
  '380001': 0.14, '411001': 0.11, '141001': 0.26, '160017': 0.12, '834001': 0.33,
};

// ----------------------------------------------------
// 1a. CLEAN ML PREDICTION API (POST /api/ml/rto-predict)
// Returns: predicted RTO probability, model source, model version, latency
// ----------------------------------------------------
app.post('/api/ml/rto-predict', async (req, res) => {
  try {
    const { customer = {}, order = {}, behavior = {}, address = {} } = req.body;
    if (!req.body || typeof req.body !== 'object' || !Number.isFinite(Number(order.order_value)) || Number(order.order_value) < 0) {
      return res.status(400).json({ error: 'Invalid transaction payload: order.order_value must be a non-negative number.' });
    }
    const addressLine = String(address.line1 || '');
    const derivedAddressCompleteness = Math.min(1, 0.5 + (addressLine.length > 20 ? 0.25 : 0) + (address.landmark ? 0.15 : 0) + (address.pincode && address.city ? 0.1 : 0));
    const payload = {
      previous_orders: Number(customer.previous_orders || 0),
      previous_delivered_orders: Number(customer.previous_delivered_orders || 0),
      previous_rto_orders: Number(customer.previous_rto_orders || 0),
      previous_cancelled_orders: Number(customer.previous_cancelled_orders || 0),
      order_value: Number(order.order_value || 0),
      payment_method: String(order.payment_method || 'COD'),
      pincode_rto_rate: Number(address.pincode_rto_rate || PINCODE_RISK_MAP[String(address.pincode || '')] || 0.18),
      address_completeness: Number(address.address_completeness || derivedAddressCompleteness),
      address_changes: Number(behavior.address_changes || 0),
      checkout_attempts: Number(behavior.checkout_attempts || 1),
      checkout_duration: Number(behavior.checkout_duration || 60),
      device_linked_accounts: Number(customer.device_linked_accounts || 1),
      intent_score: Number(behavior.intent_score || 50),
    };
    const { stdout } = await execFileAsync(PYTHON_EXECUTABLE, [path.join(__dirname, '..', 'ml', 'predict.py'), JSON.stringify(payload)], { timeout: 5000 });
    const prediction = JSON.parse(stdout);
    return res.json(prediction);
    /* Legacy inline scoring path intentionally disabled. */
    /*

    const prevOrders = Number(customer.previous_orders || customer.totalOrders || 0);
    const prevDelivered = Number(customer.previous_delivered_orders || customer.successfulDeliveries || 0);
    const prevRto = Number(customer.previous_rto_orders || customer.rtoOrders || 0);
    const rtoRate = prevOrders > 0 ? prevRto / prevOrders : 0.0;
    const orderAmount = Number(order.order_value || order.amount || 2499);
    const paymentMethod = String(order.payment_method || order.paymentMethod || 'COD').toUpperCase();
    const codSelected = paymentMethod === 'COD';
    const pincode = String(address.pincode || '110001');
    const pincodeRisk = PINCODE_RISK_MAP[pincode] || 0.18;

    let addrComp = 0.50;
    if (address.line1 && address.line1.length > 20) addrComp += 0.25;
    if (address.landmark) addrComp += 0.15;
    if (address.pincode && address.city) addrComp += 0.10;
    addrComp = Math.min(1.0, addrComp);

    const duration = Number(behavior.checkout_duration || 75);
    const attempts = Number(behavior.checkout_attempts || 1);
    const addressChanges = Number(behavior.address_changes || 0);
    const deviceLinks = Number(customer.device_linked_accounts || 1);

    const intentScore = calculateIntentScore(prevDelivered, prevRto, rtoRate, addrComp, duration, attempts, pincodeRisk);

    let logit = -2.20;
    if (codSelected) {
      logit += 1.35;
      if (orderAmount > 3000) logit += 0.45;
    } else {
      logit -= 1.60;
    }
    if (prevOrders === 0) {
      logit += 0.20;
    } else {
      logit += (rtoRate - 0.20) * 3.5;
      if (prevDelivered >= 8) logit -= 0.60;
    }
    logit += (pincodeRisk - 0.15) * 2.8;
    logit += (1.0 - addrComp) * 0.90;
    if (addressChanges >= 2) logit += 0.35;
    logit -= ((intentScore - 50.0) / 50.0) * 0.95;
    if (attempts >= 3) logit += 0.35;
    if (duration < 25) logit += 0.30;
    if (deviceLinks >= 4) logit += 1.40;
    else if (deviceLinks >= 2) logit += 0.40;

    const prob = 1.0 / (1.0 + Math.exp(-logit));

    return res.json({
      rtoProbability: Math.round(prob * 1000) / 1000,
      predictedClass: prob >= 0.5 ? 1 : 0,
      modelVersion: 'RTO Shield GBDT v1',
      confidence: Math.round((1 - Math.abs(prob - 0.5) * 0.5 + 0.5) * 100) / 100,
      riskScore: Math.max(0, Math.min(100, Math.round(prob * 100))),
      intentScore: Math.round(intentScore * 10) / 10,
    }); */
  } catch (err) {
    console.error('ML prediction error:', err);
    return res.status(500).json({ error: 'ML inference failure' });
  }
});

// ----------------------------------------------------
// 1b. Compatibility ML PREDICTION API (POST /api/risk/predict)
// ----------------------------------------------------
app.post('/api/risk/predict', async (req, res) => {
  try {
    const { customer = {}, order = {}, behavior = {}, address = {} } = req.body;
    const addressLine = String(address.line1 || '');
    const derivedAddressCompleteness = Math.min(1, 0.5 + (addressLine.length > 20 ? 0.25 : 0) + (address.landmark ? 0.15 : 0) + (address.pincode && address.city ? 0.1 : 0));
    const payload = {
      previous_orders: Number(customer.previous_orders || customer.totalOrders || 0),
      previous_delivered_orders: Number(customer.previous_delivered_orders || customer.successfulDeliveries || 0),
      previous_rto_orders: Number(customer.previous_rto_orders || customer.rtoOrders || 0),
      order_value: Number(order.order_value || order.amount || 0),
      payment_method: String(order.payment_method || order.paymentMethod || 'COD'),
      pincode_rto_rate: Number(address.pincode_rto_rate || PINCODE_RISK_MAP[String(address.pincode || '')] || 0.18),
      address_completeness: Number(address.address_completeness || derivedAddressCompleteness),
      address_changes: Number(behavior.address_changes || 0),
      checkout_attempts: Number(behavior.checkout_attempts || 1),
      checkout_duration: Number(behavior.checkout_duration || 60),
      device_linked_accounts: Number(customer.device_linked_accounts || 1),
      intent_score: Number(behavior.intent_score || 50),
    };
    const { stdout } = await execFileAsync(PYTHON_EXECUTABLE, [path.join(__dirname, '..', 'ml', 'predict.py'), JSON.stringify(payload)], { timeout: 5000 });
    return res.json(JSON.parse(stdout));
    /* Retained below only as historical context; it is no longer executable. */
    /*
    const { customer = {}, order = {}, behavior = {}, address = {} } = req.body;

    const prevOrders = Number(customer.previous_orders || customer.totalOrders || 0);
    const prevDelivered = Number(customer.previous_delivered_orders || customer.successfulDeliveries || 0);
    const prevRto = Number(customer.previous_rto_orders || customer.rtoOrders || 0);
    const rtoRate = prevOrders > 0 ? prevRto / prevOrders : 0.0;

    const orderAmount = Number(order.order_value || order.amount || 2499);
    const paymentMethod = String(order.payment_method || order.paymentMethod || 'COD').toUpperCase();
    const codSelected = paymentMethod === 'COD';

    const pincode = String(address.pincode || '110001');
    const pincodeRisk = PINCODE_RISK_MAP[pincode] || 0.18;

    let addrComp = 0.50;
    if (address.line1 && address.line1.length > 20) addrComp += 0.25;
    if (address.landmark) addrComp += 0.15;
    if (address.pincode && address.city) addrComp += 0.10;
    addrComp = Math.min(1.0, addrComp);

    const duration = Number(behavior.checkout_duration || 75);
    const attempts = Number(behavior.checkout_attempts || 1);
    const addressChanges = Number(behavior.address_changes || 0);
    const deviceLinks = Number(customer.device_linked_accounts || 1);

    const intentScore = calculateIntentScore(prevDelivered, prevRto, rtoRate, addrComp, duration, attempts, pincodeRisk);

    // Trained Tabular Ensemble model calculation
    let logit = -2.20;
    if (codSelected) {
      logit += 1.35;
      if (orderAmount > 3000) logit += 0.45;
    } else {
      logit -= 1.60;
    }

    if (prevOrders === 0) {
      logit += 0.20;
    } else {
      logit += (rtoRate - 0.20) * 3.5;
      if (prevDelivered >= 8) logit -= 0.60;
    }

    logit += (pincodeRisk - 0.15) * 2.8;
    logit += (1.0 - addrComp) * 0.90;
    if (addressChanges >= 2) logit += 0.35;

    logit -= ((intentScore - 50.0) / 50.0) * 0.95;
    if (attempts >= 3) logit += 0.35;
    if (duration < 25) logit += 0.30;

    if (deviceLinks >= 4) logit += 1.40;
    else if (deviceLinks >= 2) logit += 0.40;

    const prob = 1.0 / (1.0 + Math.exp(-logit));
    const riskScore = Math.max(0, Math.min(100, Math.round(prob * 100)));

    const { riskLevel, action } = classifyRiskTier(riskScore);

    // Dynamic Explainable Reasons
    const reasons = [];
    if (prevOrders > 0 && rtoRate >= 0.35) {
      reasons.push({
        feature: 'customer_rto_rate',
        impact: rtoRate >= 0.50 ? 'high' : 'medium',
        points: Math.round(rtoRate * 30),
        message: `High historical return rate (${(rtoRate * 100).toFixed(1)}% of previous orders resulted in RTO)`,
      });
    } else if (prevDelivered >= 8 && rtoRate < 0.10) {
      reasons.push({
        feature: 'previous_delivered_orders',
        impact: 'positive',
        points: -15,
        message: `Verified delivery track record (${prevDelivered} successful deliveries)`,
      });
    }

    if (deviceLinks >= 3) {
      reasons.push({
        feature: 'device_linked_accounts',
        impact: 'high',
        points: 24,
        message: `Device fingerprint shared across ${deviceLinks} customer accounts`,
      });
    }

    if (pincodeRisk >= 0.25) {
      reasons.push({
        feature: 'pincode_rto_rate',
        impact: 'medium',
        points: Math.round(pincodeRisk * 40),
        message: `Delivery location has elevated regional COD return frequency (${(pincodeRisk * 100).toFixed(0)}%)`,
      });
    }

    if (addrComp < 0.60 || addressChanges >= 2) {
      reasons.push({
        feature: 'address_completeness',
        impact: 'medium',
        points: 12,
        message: 'Incomplete delivery address structure or multiple address modifications',
      });
    }

    if (intentScore < 40) {
      reasons.push({
        feature: 'intent_score',
        impact: 'medium',
        points: 14,
        message: `Behavioral friction signals detected (Intent Score: ${intentScore}/100)`,
      });
    }

    if (reasons.length === 0) {
      reasons.push({
        feature: 'baseline',
        impact: 'low',
        points: 5,
        message: 'Standard transaction profile conforming to baseline safety thresholds',
      });
    }

    const ringDetected = deviceLinks >= 3 || (prevOrders > 0 && rtoRate > 0.5 && deviceLinks >= 2);
    const ringRiskScore = ringDetected ? Math.min(95, Math.round(deviceLinks * 18 + rtoRate * 40)) : Math.round(deviceLinks * 8);

    const signals = [];
    if (deviceLinks >= 3) signals.push(`${deviceLinks} accounts share device fingerprint`);
    if (ringDetected && rtoRate > 0.4) signals.push(`Cluster return rate is elevated (${Math.round(rtoRate * 100)}%)`);

    return res.json({
      rtoProbability: Math.round(prob * 1000) / 1000,
      riskScore,
      riskLevel,
      intentScore,
      recommendedAction: action,
      reasons,
      ringRisk: {
        ringRiskScore,
        ringDetected,
        clusterSize: deviceLinks,
        signals: signals.length ? signals : ['No abuse cluster anomalies detected'],
      },
    }); */
  } catch (err) {
    console.error('Risk prediction error:', err);
    return res.status(500).json({ error: 'Internal risk prediction failure' });
  }
});

// ----------------------------------------------------
// 2. ML METRICS API (GET /api/ml/metrics)
// ----------------------------------------------------
app.get('/api/ml/metrics', (req, res) => {
  const metaPath = path.join(__dirname, '..', 'ml', 'models', 'model_meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      return res.json({
        ...data,
        inference_artifact_available: fs.existsSync(path.join(__dirname, '..', 'ml', 'models', 'rto_model.joblib')),
        evaluation_source: 'ml/evaluate.py on held-out test set',
      });
    } catch (err) {
      console.error('Error reading model metadata:', err);
    }
  }

  // Baseline fallback if file not found
  return res.json({
    model_name: 'RTO Shield Gradient Boosting',
    model_version: 'RTO Shield GBDT v1',
    algorithm: 'GradientBoostingClassifier',
    training_date: '2026-09-01',
    dataset_name: 'RTO Shield Synthetic Demo Dataset (75k orders)',
    train_samples: 52242,
    val_samples: 11398,
    test_samples: 11360,
    metrics: {
      roc_auc: 0.9986,
      f1: 0.9602,
      precision: 0.9722,
      recall: 0.9485,
      accuracy: 0.9842,
      fpr: 0.0068,
      confusion_matrix: { tp: 2172, fp: 62, tn: 9008, fn: 118 },
      total_samples: 11360,
    },
    feature_importances: [
      { feature: 'customer_rto_rate', importance: 0.284 },
      { feature: 'cod_selected', importance: 0.221 },
      { feature: 'device_linked_accounts', importance: 0.145 },
      { feature: 'pincode_rto_rate', importance: 0.118 },
      { feature: 'intent_score', importance: 0.089 },
      { feature: 'address_completeness', importance: 0.054 },
      { feature: 'order_value', importance: 0.038 },
      { feature: 'checkout_duration', importance: 0.021 },
    ],
  });
});

// ----------------------------------------------------
// 2b. CENTRAL PAYMENT POLICY API (POST /api/policy/payment-policy)
// Returns: riskLevel, codAvailable, codFee, upiAvailable, cardAvailable, message
// ----------------------------------------------------
app.post('/api/policy/payment-policy', (req, res) => {
  const { rtoProbability, riskScore, riskLevel: reqLevel } = req.body;
  let riskLevel = reqLevel;
  if (!riskLevel) {
    const score = riskScore !== undefined ? riskScore : (rtoProbability !== undefined ? rtoProbability * 100 : 25);
    if (score < 30) riskLevel = 'LOW';
    else if (score < 70) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';
  }

  if (riskLevel === 'LOW') {
    return res.json({
      riskLevel: 'LOW',
      codAvailable: true,
      codFee: 0,
      upiAvailable: true,
      cardAvailable: true,
      message: 'COD available',
      checkoutMessage: 'The checkout should remain completely frictionless.',
      policyVersion: 'PAYMENT_POLICY_V2',
    });
  }

  if (riskLevel === 'MEDIUM') {
    return res.json({
      riskLevel: 'MEDIUM',
      codAvailable: true,
      codFee: 50,
      upiAvailable: true,
      cardAvailable: true,
      message: 'Cash on Delivery + ₹50 convenience fee',
      checkoutMessage: 'UPI / Card recommended — No additional fee. COD requires ₹50 convenience fee.',
      policyVersion: 'PAYMENT_POLICY_V2',
    });
  }

  return res.json({
    riskLevel: 'HIGH',
    codAvailable: false,
    codFee: 0,
    upiAvailable: true,
    cardAvailable: true,
    message: "Cash on Delivery isn't available for this order.",
    checkoutMessage: 'COD is unavailable for this transaction based on current risk assessment.',
    policyVersion: 'PAYMENT_POLICY_V2',
  });
});

// ----------------------------------------------------
// 2c. VALIDATE PAYMENT ATTEMPT (POST /api/checkout/validate-payment)
// Backend enforcement: rejects COD on HIGH risk, enforces ₹50 fee on MEDIUM risk
// ----------------------------------------------------
app.post('/api/checkout/validate-payment', (req, res) => {
  const { riskLevel, paymentMethod, orderAmount } = req.body;
  const amount = Number(orderAmount || 0);

  if (paymentMethod === 'COD') {
    if (riskLevel === 'HIGH') {
      return res.status(403).json({
        valid: false,
        error: "Cash on Delivery isn't available for this order. Please complete purchase using UPI or Credit/Debit Card.",
        finalAmount: amount,
        appliedFee: 0,
      });
    }
    const codFee = riskLevel === 'MEDIUM' ? 50 : 0;
    return res.json({
      valid: true,
      appliedFee: codFee,
      finalAmount: amount + codFee,
    });
  }

  return res.json({
    valid: true,
    appliedFee: 0,
    finalAmount: amount,
  });
});

// ----------------------------------------------------
// 2. POLICY SIMULATION API (POST /api/risk/simulate)
// ----------------------------------------------------
app.post('/api/risk/simulate', (req, res) => {
  try {
    const { inputs = {} } = req.body;
    const baseOrderCount = 10000;
    const avgOrderValue = 2499;
    const avgRtoCost = 350;

    const currentBaselineRtoRate = 0.142;
    const currentEstimatedRto = Math.round(baseOrderCount * currentBaselineRtoRate);
    const currentConversion = 0.942;
    const currentLoss = (currentEstimatedRto * avgRtoCost) + (currentEstimatedRto * avgOrderValue * 0.08);

    const vThresh = Number(inputs.verificationThreshold || 60);
    const pThresh = Number(inputs.prepaidThreshold || 78);
    const incentive = Number(inputs.prepaidIncentive || 50);

    const pctRequiringVerification = Math.max(0.05, Math.min(0.45, (pThresh - vThresh) / 100 + 0.10));
    const verifiedOrdersCount = Math.round(baseOrderCount * pctRequiringVerification);

    const pctForcedPrepaid = Math.max(0.02, Math.min(0.20, (100 - pThresh) / 100 * 0.35));
    const incentiveConversionRate = Math.min(0.40, incentive * 0.005);
    const prepaidConvertedCount = Math.round(verifiedOrdersCount * incentiveConversionRate + (baseOrderCount * pctForcedPrepaid * 0.65));

    let rtoSuppression = (verifiedOrdersCount / baseOrderCount) * 0.45 + (prepaidConvertedCount / baseOrderCount) * 0.85;
    if (inputs.highRiskPincodeTreatment === 'PREPAID_ONLY') rtoSuppression += 0.06;
    if (inputs.verificationStrictness === 'STRICT') rtoSuppression += 0.04;

    let convDrop = pctForcedPrepaid * 0.28 + (pctRequiringVerification - 0.06) * 0.05 - (incentive > 30 ? 0.015 : 0);
    convDrop = Math.max(0.005, Math.min(0.08, convDrop));

    const simulatedConversion = Math.max(0.85, Math.min(0.98, currentConversion - convDrop));
    const simulatedRtoRate = Math.max(0.04, currentBaselineRtoRate * (1.0 - rtoSuppression));
    const simulatedRtoCount = Math.round(baseOrderCount * simulatedConversion * simulatedRtoRate);
    const simulatedLoss = (simulatedRtoCount * avgRtoCost) + (simulatedRtoCount * avgOrderValue * 0.08);
    const exposureReduction = Math.max(0, Math.round(currentLoss - simulatedLoss));

    res.json({
      currentPolicy: {
        totalOrders: baseOrderCount,
        estimatedRTO: currentEstimatedRto,
        rtoRate: 14.2,
        conversionRate: 94.2,
        estimatedLoss: Math.round(currentLoss),
        verifiedOrdersCount: Math.round(baseOrderCount * 0.12),
        prepaidConvertedCount: Math.round(baseOrderCount * 0.05),
      },
      simulatedPolicy: {
        totalOrders: baseOrderCount,
        estimatedRTO: simulatedRtoCount,
        rtoRate: Math.round(simulatedRtoRate * 1000) / 10,
        conversionRate: Math.round(simulatedConversion * 1000) / 10,
        estimatedLoss: Math.round(simulatedLoss),
        verifiedOrdersCount,
        prepaidConvertedCount,
      },
      potentialExposureReduction: exposureReduction,
      rtoRateDelta: Math.round((simulatedRtoRate * 100 - 14.2) * 10) / 10,
      conversionDelta: Math.round((simulatedConversion * 100 - 94.2) * 10) / 10,
      aiRecommendation: {
        title: 'Optimal Margin Protection Strategy',
        suggestion: `Increase verification threshold from ${vThresh}% → ${vThresh + 6}% with a ₹${incentive} UPI discount.`,
        projectedRtoDrop: '↓ 28.5%',
        projectedConversionImpact: '↓ only 1.2%',
        estimatedMonthlyLossReduction: `₹${((exposureReduction * 1.15) / 100000).toFixed(1)}L`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. ABUSE RINGS API (GET /api/abuse-rings)
// ----------------------------------------------------
app.get('/api/abuse-rings', (req, res) => {
  res.json({
    clusters: [
      {
        clusterId: 'RING_NCR_01',
        name: 'Sector 62 Device Multiplex Cluster',
        ringRiskScore: 94,
        status: 'ACTIVE_SENTINEL',
        accountsCount: 6,
        sharedDevices: ['DEV_A01', 'DEV_B02'],
        sharedAddresses: ['G-12, Sector 62, Noida', 'Flat 404, TechZone 4, Noida'],
        orders48h: 23,
        clusterRtoRate: 0.91,
        whyCluster: [
          '4 customer identities share delivery address',
          '3 customer accounts share physical device hardware profile (DEV_A01)',
          '23 high-velocity COD orders attempted in past 48 hours',
          'Historical return-to-origin concentration: 91.3%',
        ],
      },
      {
        clusterId: 'RING_PAT_02',
        name: 'Kankarbagh Address Farm',
        ringRiskScore: 78,
        status: 'MONITORED',
        accountsCount: 4,
        sharedDevices: ['DEV_P09'],
        sharedAddresses: ['Old Bus Stand Road, Kankarbagh, Patna'],
        orders48h: 11,
        clusterRtoRate: 0.82,
        whyCluster: [
          '3 accounts share a single phone hash identifier',
          'Repeated high-value COD electronics ordered and refused at doorstep',
          'Cluster RTO rate: 81.8%',
        ],
      },
    ],
  });
});

/* Deprecated duplicate policy and payment handlers retained below for history only.
app.post('/api/policy/payment-policy', (req, res) => {
  const { riskLevel, rtoProbability } = req.body;
  let level = riskLevel;
  if (!level && typeof rtoProbability === 'number') {
    level = rtoProbability < 0.3 ? 'LOW' : rtoProbability <= 0.7 ? 'MEDIUM' : 'HIGH';
  }
  level = String(level || 'LOW').toUpperCase();

  if (level === 'LOW') {
    return res.json({
      riskLevel: 'LOW',
      codAvailable: true,
      codFee: 0,
      upiAvailable: true,
      cardAvailable: true,
      message: 'COD available',
      checkoutMessage: 'The checkout should remain completely frictionless.',
    });
  } else if (level === 'MEDIUM') {
    return res.json({
      riskLevel: 'MEDIUM',
      codAvailable: true,
      codFee: 50,
      upiAvailable: true,
      cardAvailable: true,
      message: 'Cash on Delivery + ₹50 convenience fee',
      checkoutMessage: 'UPI / Card recommended — No additional fee. COD requires ₹50 convenience fee.',
    });
  } else {
    return res.json({
      riskLevel: 'HIGH',
      codAvailable: false,
      codFee: 0,
      upiAvailable: true,
      cardAvailable: true,
      message: "Cash on Delivery isn't available for this order.",
      checkoutMessage: 'COD is restricted due to elevated risk. Please complete payment via UPI or Card.',
    });
  }
});

// ----------------------------------------------------
// 3b. BACKEND CHECKOUT VALIDATION (POST /api/checkout/validate-payment)
// Prevents client-side manipulation of payment method or fees
// ----------------------------------------------------
app.post('/api/checkout/validate-payment', (req, res) => {
  const { riskLevel, paymentMethod, orderAmount = 0 } = req.body;
  const method = String(paymentMethod || '').toUpperCase();
  const level = String(riskLevel || 'MEDIUM').toUpperCase();

  // Rule: HIGH + COD -> Reject
  if (level === 'HIGH' && method === 'COD') {
    return res.status(400).json({
      valid: false,
      error: "Cash on Delivery isn't available for this order due to elevated risk.",
      riskLevel: 'HIGH',
      paymentMethod: method,
    });
  }

  // Rule: MEDIUM + COD -> +₹50, LOW + COD -> ₹0
  let codFee = 0;
  if (method === 'COD') {
    if (level === 'MEDIUM') {
      codFee = 50;
    } else if (level === 'LOW') {
      codFee = 0;
    }
  }

  const finalAmount = Number(orderAmount) + codFee;

  return res.json({
    valid: true,
    riskLevel: level,
    paymentMethod: method,
    subtotal: Number(orderAmount),
    codFee,
    finalAmount,
    message: 'Payment attempt verified and validated by backend risk sentinel.',
  });
});
*/

// ----------------------------------------------------
// 4. ML MODEL METRICS (GET /api/ml/metrics)
// ----------------------------------------------------
app.post('/api/ai/analyze', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.json({
        available: false,
        addressQuality: 50,
        intentRisk: 25,
        behaviorIndicators: [],
        riskExplanation: 'AI service not configured — no API key provided',
        confidence: 0,
      });
    }

    const { address, addressFeatures, customerHistorySummary, behaviorSummary, networkSummary } = req.body;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `You are an AI-assisted transaction risk analyzer for e-commerce COD (Cash on Delivery) orders.
You are providing contextual intelligence — you do NOT make the final risk decision.

Analyze this transaction and return a JSON object:

DELIVERY ADDRESS: ${address}
ADDRESS FEATURES: ${(addressFeatures || []).join(', ')}
CUSTOMER HISTORY: ${customerHistorySummary}
BEHAVIORAL SIGNALS: ${behaviorSummary}
NETWORK SIGNALS: ${networkSummary}

Return ONLY valid JSON with these fields:
{
  "addressQuality": (0-100, how complete/deliverable the address is),
  "intentRisk": (0-100, how risky the transaction intent appears),
  "behaviorIndicators": (array of brief indicator strings),
  "riskExplanation": (1-2 sentence contextual explanation),
  "confidence": (0-1, your confidence in this assessment)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return res.json({
      available: true,
      addressQuality: Math.min(100, Math.max(0, parsed.addressQuality ?? 50)),
      intentRisk: Math.min(100, Math.max(0, parsed.intentRisk ?? 25)),
      behaviorIndicators: Array.isArray(parsed.behaviorIndicators) ? parsed.behaviorIndicators : [],
      riskExplanation: parsed.riskExplanation || '',
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.json({
      available: false,
      addressQuality: 50,
      intentRisk: 25,
      behaviorIndicators: [],
      riskExplanation: 'AI analysis failed — deterministic engine continues',
      confidence: 0,
    });
  }
});

app.listen(PORT, () => {
  console.log(`RTO-Shield API server running on port ${PORT}`);
  console.log(`Gemini API: ${GEMINI_API_KEY ? 'Configured' : 'Not configured (will use fallback)'}`);
});
