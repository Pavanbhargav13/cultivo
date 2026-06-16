// frontend/src/App.jsx
import React from 'react';
import { CropProvider, useCrop } from './context/CropContext.jsx';
import LandingPage from './components/LandingPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import DashboardView from './components/DashboardView.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import CropSelector from './components/CropSelector.jsx';
import ActuatorForm from './components/ActuatorForm.jsx';
import LogsChart from './components/LogsChart.jsx';

const AppContent = () => {
  const { activeView, subView } = useCrop();

  if (activeView === 'landing') {
    return <LandingPage />;
  }

  return (
    <div className="dashboard-workspace">
      <Sidebar />
      {subView === 'dashboard' && <DashboardView />}
      {subView === 'analytics' && <AnalyticsView />}
      {subView === 'crops' && <CropSelector />}
      {subView === 'controls' && <ActuatorForm />}
      {subView === 'logs' && <LogsChart />}
    </div>
  );
};

const App = () => {
  return (
    <CropProvider>
      <AppContent />
    </CropProvider>
  );
};

export default App;
