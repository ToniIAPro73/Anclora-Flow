import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Clients from './pages/Clients/Clients';
import Invoices from './pages/Invoices/Invoices';
import Expenses from './pages/Expenses/Expenses';
import { SubscriptionsPage } from './pages/Subscriptions/SubscriptionsPage';
import Budget from './pages/Budget/Budget';
import Assistant from './pages/Assistant/Assistant';
import Settings from './pages/Settings/Settings';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Fallbacks for other routes while migrating */}
          <Route path="/calendar" element={<div>Calendario (En desarrollo)</div>} />
          <Route path="/reports" element={<div>Informes (En desarrollo)</div>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
