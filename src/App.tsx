import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useRiskStore } from './store/riskStore';
import { useSettingsStore } from './store/settingsStore';

// Main Navigation Pages
import Overview from './pages/Overview';
import Checkout from './pages/Checkout';
import LiveRisk from './pages/LiveRisk';
import NetworkSentinel from './pages/NetworkSentinel';
import VelocityMonitor from './pages/VelocityMonitor';
import RTOAnalytics from './pages/RTOAnalytics';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';

// Extended & Sub-Navigation Pages
import Transactions from './pages/Transactions';
import PolicySimulator from './pages/PolicySimulator';
import Customers from './pages/Customers';
import Architecture from './pages/Architecture';
import ResponsibleAI from './pages/ResponsibleAI';
import Feedback from './pages/Feedback';

export default function App() {
  const loadStore = useRiskStore((s) => s.loadFromStorage);
  const loadSettings = useSettingsStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadStore();
    loadSettings();
  }, [loadStore, loadSettings]);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        {/* Primary Pages */}
        <Route path="/overview" element={<Overview />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/live-risk" element={<LiveRisk />} />
        <Route path="/network" element={<NetworkSentinel />} />
        <Route path="/velocity" element={<VelocityMonitor />} />
        <Route path="/analytics" element={<RTOAnalytics />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/settings" element={<Settings />} />

        {/* Deep Dive & Supporting Modules */}
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/simulator" element={<PolicySimulator />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/responsible-ai" element={<ResponsibleAI />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* Backward Compatibility Redirects */}
        <Route path="/risk-intelligence" element={<Navigate to="/live-risk" replace />} />
        <Route path="/abuse-sentinel" element={<Navigate to="/network" replace />} />
        <Route path="/insights" element={<Navigate to="/analytics" replace />} />
      </Routes>
    </AppLayout>
  );
}
