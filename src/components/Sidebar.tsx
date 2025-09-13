import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  Building2, 
  Users, 
  DoorOpen, 
  Package, 
  Gift, 
  UserCog, 
  DollarSign, 
  BarChart3,
  Receipt,
  LogOut,
  CheckSquare,
  ShoppingCart,
  Clock,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { Branch } from '../types';
import NotificationSystem from './NotificationSystem';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [branches] = useLocalStorage<Branch[]>('branches', []);
  
  const currentBranch = branches.find(branch => branch.id === user?.branch_id);

  const modules = [
    { id: 'dashboard', name: 'لوحة التحكم', icon: BarChart3, roles: ['admin', 'manager', 'employee', 'reception'] },
    { id: 'session-manager', name: 'إدارة الجلسات', icon: Receipt, roles: ['admin', 'manager', 'reception'] },
    { id: 'branches', name: 'الفروع', icon: Building2, roles: ['admin', 'manager'] },
    { id: 'rooms', name: 'الغرف والحجوزات', icon: DoorOpen, roles: ['admin', 'manager', 'reception'] },
    { id: 'clients', name: 'العملاء والعضويات', icon: Users, roles: ['admin', 'manager', 'reception'] },
    { id: 'inventory', name: 'المخزون والموردين', icon: Package, roles: ['admin', 'manager', 'employee'] },
    { id: 'purchases', name: 'إدارة المشتريات', icon: ShoppingCart, roles: ['admin', 'manager', 'employee'] },
    { id: 'maintenance', name: 'إدارة الصيانة', icon: Package, roles: ['admin', 'manager', 'employee'] },
    { id: 'loyalty', name: 'برنامج الولاء', icon: Gift, roles: ['admin', 'manager', 'reception'] },
    { id: 'employees', name: 'إدارة الموظفين', icon: UserCog, roles: ['admin', 'manager'] },
    { id: 'tasks', name: 'إدارة المهام', icon: CheckSquare, roles: ['admin', 'manager', 'employee', 'reception'] },
    { id: 'shifts', name: 'إدارة الورديات', icon: Clock, roles: ['admin', 'manager'] },
    { id: 'finance', name: 'الإدارة المالية', icon: DollarSign, roles: ['admin', 'manager'] },
    { id: 'reports', name: 'التقارير', icon: BarChart3, roles: ['admin', 'manager'] },
  ];

  const filteredModules = modules.filter(module => 
    module.roles.includes(user?.role || 'employee')
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative lg:translate-x-0 
        w-80 bg-white border-l border-gray-200 flex flex-col h-full z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        top-0 right-0 lg:top-auto lg:right-auto
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="إغلاق القائمة"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-bold text-gray-800">القائمة الرئيسية</h2>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 text-right">شغف للعمل المشترك</h1>
          <p className="text-sm text-gray-600 text-right mt-1">
            {currentBranch ? currentBranch.name : 'نظام إدارة شامل'}
          </p>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    onModuleChange(module.id);
                    // Close sidebar on mobile after selection
                    onClose();
                  }}
                  className={`
                    w-full flex items-center justify-end px-4 py-3 rounded-lg text-right
                    transition-colors duration-200
                    ${activeModule === module.id 
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }
                  `}
                >
                  <span className="mr-3">{module.name}</span>
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-200 bg-white">
          {/* User Profile Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
            <div className="flex items-center justify-end gap-3 mb-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{user?.email}</p>
              </div>
              {/* User Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            {/* User Role Badge */}
            <div className="flex justify-end">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {user?.role === 'admin' ? 'مدير عام' : 
                 user?.role === 'manager' ? 'مدير فرع' : 
                 user?.role === 'reception' ? 'استقبال' : 'موظف'}
              </span>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={logout}
              className="flex-1 justify-end"
            >
              <span className="mr-2">تسجيل الخروج</span>
              <LogOut className="h-4 w-4 ml-2" />
            </Button>
            {/* Notification System with better positioning */}
            <div className="flex-shrink-0">
              <NotificationSystem />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;