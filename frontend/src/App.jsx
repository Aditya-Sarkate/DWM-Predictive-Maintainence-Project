import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DataExplorer from './pages/DataExplorer';
import DataWarehouse from './pages/DataWarehouse';
import StarSchemaView from './pages/StarSchemaView';
import EtlPipelineView from './pages/EtlPipelineView';
import OlapAnalysis from './pages/OlapAnalysis';
import DataMiningView from './pages/DataMiningView';
import AnalyticsView from './pages/AnalyticsView';
import FailurePredictor from './pages/FailurePredictor';
import SystemDocumentation from './pages/SystemDocumentation';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'explorer':
        return <DataExplorer />;
      case 'warehouse':
      case 'starschema':
      case 'etl':
        return <DataWarehouse />;
      case 'olap':
        return <OlapAnalysis />;
      case 'mining':
        return <DataMiningView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'predictor':
        return <FailurePredictor />;
      case 'about':
        return <SystemDocumentation />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-gray-800 flex flex-col font-sans">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser.role} />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)] bg-slate-100">
          <div className="max-w-7xl mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}

