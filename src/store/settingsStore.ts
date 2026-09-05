import { create } from 'zustand';
import type { MerchantSettings, RiskWeights } from '../types/risk';
import { saveState, loadState, SETTINGS_KEY } from '../data/persistence';
import { STANDARD_RISK_WEIGHTS, RISK_THRESHOLDS } from '../engine/riskPolicy';

const DEFAULT_WEIGHTS: RiskWeights = {
  ml: STANDARD_RISK_WEIGHTS.ml,
  history: STANDARD_RISK_WEIGHTS.history,
  network: STANDARD_RISK_WEIGHTS.network,
  velocity: STANDARD_RISK_WEIGHTS.velocity,
  address: STANDARD_RISK_WEIGHTS.address,
  behavior: STANDARD_RISK_WEIGHTS.behavior,
  ai: STANDARD_RISK_WEIGHTS.ai,
};

export const DEFAULT_SETTINGS: MerchantSettings = {
  mediumThreshold: RISK_THRESHOLDS.LOW_MAX,
  highThreshold: RISK_THRESHOLDS.MEDIUM_MAX,
  criticalThreshold: 85,
  codFee: 50,
  upiDiscount: 30,
  otpRequired: true,
  weights: DEFAULT_WEIGHTS,
  riskEngineVersion: 'RISK_ENGINE_V3',
  policyVersion: 'POLICY_V3',
  policyCounter: 1,
  aiEnabled: true,
  interventionStrategy: 'balanced',
  averageForwardShippingCost: 0,
  averageReverseShippingCost: 0,
  averageRtoProcessingCost: 0,
  averageHandlingCost: 0,
};

interface SettingsActions {
  updateSettings: (partial: Partial<MerchantSettings>) => void;
  updateWeights: (weights: Partial<RiskWeights>) => void;
  resetSettings: () => void;
  loadFromStorage: () => void;
}

type SettingsStore = MerchantSettings & SettingsActions;

function persistSettings(settings: MerchantSettings) {
  saveState(SETTINGS_KEY, settings);
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...DEFAULT_SETTINGS,

  updateSettings: (partial) => set((state) => {
    const newCounter = state.policyCounter + 1;
    const newSettings = {
      ...state,
      ...partial,
      policyCounter: newCounter,
      policyVersion: `POLICY_V${newCounter}`,
    };
    persistSettings(newSettings);
    return newSettings;
  }),

  updateWeights: (weights) => set((state) => {
    const newCounter = state.policyCounter + 1;
    const newSettings = {
      ...state,
      weights: { ...state.weights, ...weights },
      policyCounter: newCounter,
      policyVersion: `POLICY_V${newCounter}`,
    };
    persistSettings(newSettings);
    return newSettings;
  }),

  resetSettings: () => {
    persistSettings(DEFAULT_SETTINGS);
    set(DEFAULT_SETTINGS);
  },

  loadFromStorage: () => {
    const saved = loadState<MerchantSettings>(SETTINGS_KEY);
    if (saved) {
      set({ ...DEFAULT_SETTINGS, ...saved });
    }
  },
}));
