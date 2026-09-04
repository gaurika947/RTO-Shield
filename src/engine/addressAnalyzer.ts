import type { OrderAddress } from '../types/order';
import type { AddressAnalyzerResult, Evidence } from '../types/risk';
import { validatePincode } from '../data/pincodeMap';

// Generic/placeholder patterns
const GENERIC_PATTERNS = [
  /^x+$/i, /^y+$/i, /^z+$/i, /^test/i, /^abc/i, /^asdf/i,
  /^qwerty/i, /^sample/i, /^dummy/i, /^fake/i, /^na$/i,
  /^n\/a$/i, /^none$/i, /^\.+$/, /^-+$/,
];

const LANDMARK_KEYWORDS = [
  'near', 'opposite', 'behind', 'beside', 'next to', 'adjacent',
  'in front', 'across', 'mall', 'temple', 'school', 'hospital',
  'park', 'station', 'market', 'church', 'mosque', 'cinema',
  'tower', 'complex', 'plaza', 'circle', 'chowk',
];

const LOCALITY_KEYWORDS = [
  'sector', 'block', 'lane', 'gali', 'street', 'road', 'nagar',
  'colony', 'layout', 'phase', 'area', 'enclave', 'vihar',
  'puram', 'kunj', 'town', 'hills', 'west', 'east', 'north', 'south',
];

export function analyzeAddress(address: OrderAddress): AddressAnalyzerResult {
  const evidence: Evidence[] = [];
  const signals: string[] = [];
  let riskPoints = 0;
  let qualityPoints = 100;
  let confidenceFactors = 0;
  let confidenceSum = 0;

  const fullAddress = [address.line1, address.line2, address.landmark].filter(Boolean).join(' ');
  const line1 = address.line1.trim();

  // 1. Address length
  confidenceFactors++;
  if (line1.length < 10) {
    const penalty = 20;
    riskPoints += penalty;
    qualityPoints -= 25;
    signals.push('Very short address');
    evidence.push({ type: 'ADDRESS', signal: 'SHORT_ADDRESS', value: line1.length, contribution: 0, explanation: `Address line is only ${line1.length} characters` });
    confidenceSum += 0.8;
  } else if (line1.length < 20) {
    const penalty = 10;
    riskPoints += penalty;
    qualityPoints -= 12;
    signals.push('Short address');
    evidence.push({ type: 'ADDRESS', signal: 'SHORT_ADDRESS', value: line1.length, contribution: 0, explanation: `Address line is ${line1.length} characters — somewhat brief` });
    confidenceSum += 0.7;
  } else {
    confidenceSum += 0.9;
  }

  // 2. Number presence (house/building number)
  confidenceFactors++;
  const hasNumber = /\d/.test(line1);
  if (!hasNumber) {
    riskPoints += 15;
    qualityPoints -= 15;
    signals.push('Missing house/building number');
    evidence.push({ type: 'ADDRESS', signal: 'NO_HOUSE_NUMBER', value: 'absent', contribution: 0, explanation: 'No numeric house or building number found in address' });
    confidenceSum += 0.7;
  } else {
    confidenceSum += 0.9;
  }

  // 3. Landmark presence
  confidenceFactors++;
  const hasLandmark = address.landmark && address.landmark.trim().length > 2;
  const hasLandmarkInAddress = LANDMARK_KEYWORDS.some(kw => fullAddress.toLowerCase().includes(kw));
  if (!hasLandmark && !hasLandmarkInAddress) {
    riskPoints += 10;
    qualityPoints -= 10;
    signals.push('Missing landmark');
    evidence.push({ type: 'ADDRESS', signal: 'NO_LANDMARK', value: 'absent', contribution: 0, explanation: 'No landmark or reference point provided' });
    confidenceSum += 0.6;
  } else {
    confidenceSum += 0.9;
  }

  // 4. Locality presence
  confidenceFactors++;
  const hasLocality = LOCALITY_KEYWORDS.some(kw => fullAddress.toLowerCase().includes(kw));
  if (!hasLocality) {
    riskPoints += 10;
    qualityPoints -= 10;
    signals.push('Insufficient locality detail');
    evidence.push({ type: 'ADDRESS', signal: 'NO_LOCALITY', value: 'absent', contribution: 0, explanation: 'No recognizable locality/area identifier found' });
    confidenceSum += 0.6;
  } else {
    confidenceSum += 0.85;
  }

  // 5. Pincode format
  confidenceFactors++;
  const validPincodeFormat = /^\d{6}$/.test(address.pincode);
  if (!validPincodeFormat) {
    riskPoints += 15;
    qualityPoints -= 15;
    signals.push('Invalid pincode format');
    evidence.push({ type: 'ADDRESS', signal: 'INVALID_PINCODE', value: address.pincode, contribution: 0, explanation: `Pincode "${address.pincode}" is not a valid 6-digit format` });
    confidenceSum += 0.9;
  } else {
    confidenceSum += 0.95;
  }

  // 6. Pincode/city consistency
  if (validPincodeFormat && address.city) {
    confidenceFactors++;
    const pincodeCheck = validatePincode(address.pincode, address.city);
    if (!pincodeCheck.valid) {
      riskPoints += 20;
      qualityPoints -= 20;
      signals.push(`Pincode-city mismatch (expected ${pincodeCheck.expected})`);
      evidence.push({ type: 'ADDRESS', signal: 'PINCODE_CITY_MISMATCH', value: `${address.pincode} ≠ ${address.city}`, contribution: 0, explanation: `Pincode ${address.pincode} maps to ${pincodeCheck.expected}, but city is "${address.city}"` });
      confidenceSum += 0.95;
    } else {
      confidenceSum += 0.95;
    }
  }

  // 7. Generic/incomplete wording
  confidenceFactors++;
  const isGeneric = GENERIC_PATTERNS.some(p => p.test(line1.replace(/\s/g, '')));
  if (isGeneric) {
    riskPoints += 25;
    qualityPoints -= 30;
    signals.push('Generic/placeholder address text');
    evidence.push({ type: 'ADDRESS', signal: 'GENERIC_ADDRESS', value: line1, contribution: 0, explanation: `Address text "${line1}" appears to be a placeholder or generic entry` });
    confidenceSum += 0.95;
  } else {
    confidenceSum += 0.85;
  }

  // 8. Missing city or state
  confidenceFactors++;
  if (!address.city || address.city.trim().length < 2) {
    riskPoints += 10;
    qualityPoints -= 10;
    signals.push('Missing city');
    confidenceSum += 0.7;
  } else if (!address.state || address.state.trim().length < 2) {
    riskPoints += 5;
    qualityPoints -= 5;
    signals.push('Missing state');
    confidenceSum += 0.7;
  } else {
    confidenceSum += 0.9;
  }

  // Normalize
  const risk = Math.min(100, Math.max(0, riskPoints));
  const quality = Math.max(0, qualityPoints);
  const confidence = confidenceFactors > 0 ? confidenceSum / confidenceFactors : 0.5;

  // Set final contributions on evidence (will be weighted by riskEngine)
  for (const e of evidence) {
    e.contribution = risk; // raw contribution before weighting
  }

  return { risk, quality, confidence, signals, evidence };
}
