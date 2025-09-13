// Mock data for WebContainer environment
// This file centralizes all mock data to ensure consistency across the application

export const mockUsers = [
  {
    id: '1',
    name: 'مدير النظام',
    email: 'admin@shaghaf.eg',
    username: 'admin',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'admin',
    branch_id: '1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'مدير الفرع',
    email: 'manager@shaghaf.eg',
    username: 'manager',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'manager',
    branch_id: '1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'موظف الاستقبال',
    email: 'reception@shaghaf.eg',
    username: 'reception',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'reception',
    branch_id: '1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'أحمد محمود',
    email: 'ahmed@shaghaf.eg',
    username: 'ahmed',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'employee',
    branch_id: '1',
    phone: '+20101234567',
    salary: 4500,
    hire_date: '2024-03-01',
    is_active: true,
    created_at: '2024-03-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'فاطمة علي',
    email: 'fatma@shaghaf.eg',
    username: 'fatma',
    password_hash: '$2a$10$dummy.hash.for.development',
    role: 'employee',
    branch_id: '1',
    phone: '+20102345678',
    salary: 4200,
    hire_date: '2024-04-15',
    is_active: true,
    created_at: '2024-04-15T00:00:00Z'
  }
];

export const mockBranches = [
  {
    id: '1',
    name: 'الفرع الرئيسي',
    address: 'شارع التحرير، وسط البلد، القاهرة',
    phone: '+20101234567',
    email: 'main@shaghaf.eg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'فرع الإسكندرية',
    address: 'شارع الكورنيش، الإسكندرية',
    phone: '+20102345678',
    email: 'alexandria@shaghaf.eg',
    is_active: true,
    created_at: '2024-02-01T00:00:00Z'
  }
];

// Available roles with their Arabic labels and descriptions
export const availableRoles = [
  {
    value: 'admin',
    label: 'مدير عام',
    description: 'صلاحيات كاملة على النظام وجميع الفروع',
    color: 'bg-red-100 text-red-800',
    permissions: ['all']
  },
  {
    value: 'manager',
    label: 'مدير فرع',
    description: 'إدارة كاملة للفرع الواحد',
    color: 'bg-blue-100 text-blue-800',
    permissions: ['branch_management', 'employee_management', 'financial_management', 'reports']
  },
  {
    value: 'reception',
    label: 'موظف استقبال',
    description: 'إدارة الحجوزات والعملاء والجلسات',
    color: 'bg-green-100 text-green-800',
    permissions: ['bookings', 'clients', 'sessions', 'basic_reports']
  },
  {
    value: 'employee',
    label: 'موظف',
    description: 'الوصول الأساسي للمهام والحضور والانصراف',
    color: 'bg-gray-100 text-gray-800',
    permissions: ['tasks', 'attendance', 'personal_profile']
  }
];

// Function to get role info
export const getRoleInfo = (roleValue: string) => {
  return availableRoles.find(role => role.value === roleValue) || availableRoles[3]; // Default to employee
};