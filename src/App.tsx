import React, { useState, useEffect } from 'react';
import { AuthContext, useAuthState } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import LoginForm from './components/LoginForm';
import Dashboard from './components/modules/Dashboard';
import Branches from './components/modules/Branches';
import Rooms from './components/modules/Rooms';
import Clients from './components/modules/Clients';
import Inventory from './components/modules/Inventory';
import Employees from './components/modules/Employees';
import Finance from './components/modules/Finance';
import Loyalty from './components/modules/Loyalty';
import Reports from './components/modules/Reports';
import { SessionInvoiceManager } from './components/modules/SessionInvoiceManager';
import Tasks from './components/modules/Tasks';
import Purchases from './components/modules/Purchases';
import ShiftManagement from './components/modules/ShiftManagement';
import Maintenance from './components/modules/Maintenance';

function AppContent() {
  const { user, loading } = useAuthState();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobile-optimized rendering
  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'branches':
        return <Branches />;
      case 'rooms':
        return <Rooms />;
      case 'clients':
        return <Clients />;
      case 'inventory':
        return <Inventory />;
      case 'loyalty':
        return <Loyalty />;
      case 'employees':
        return <Employees />;
      case 'finance':
        return <Finance />;
      case 'reports':
        return <Reports />;
      case 'session-manager':
        return <SessionInvoiceManager />;
      case 'tasks':
        return <Tasks />;
      case 'shifts':
        return <ShiftManagement />;
      case 'purchases':
        return <Purchases />;
      case 'maintenance':
        return <Maintenance />;
      default:
        return <Dashboard />;
    }
  };

  // Limit loading screen to maximum 3 seconds
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  if (loading && showLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl mb-6 max-w-sm mx-auto animate-pulse">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl font-bold">ش</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">شغف للعمل المشترك</h2>
            <p className="text-gray-600">جاري تحضير النظام...</p>
            <div className="mt-4 bg-blue-600 h-1 rounded-full animate-pulse"></div>
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-solid mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold text-lg">جاري تحضير النظام...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-gray-50 relative" dir="rtl">
      {/* Mobile Header with Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="فتح القائمة"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">شغف للعمل المشترك</h1>
      </div>

      <Sidebar 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 overflow-auto lg:mr-0 pt-16 lg:pt-0">
        {renderModule()}
      </main>
    </div>
  );
}

function App() {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      <AppContent />
    </AuthContext.Provider>
  );
}

export default App;