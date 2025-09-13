import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { apiClient } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Plus, Edit, Trash2, User, Mail, Phone, Calendar, 
  DollarSign, UserCheck, UserCog, Users, TrendingUp,
  Calculator, Clock, CheckCircle, AlertTriangle,
  Building2, Star, CreditCard, FileText, Receipt
} from 'lucide-react';
import { User as Employee, FinancialAdjustment } from '../../types';
import { formatDateOnly } from '../../lib/utils';
import FinancialAdjustmentModal from '../FinancialAdjustmentModal';
import PayslipModal from '../PayslipModal';

const Employees: React.FC = () => {
  const { user } = useAuth();
  
  const [allEmployees, setAllEmployees] = useLocalStorage<Employee[]>('users', []);
  const [allAdjustments, setAllAdjustments] = useLocalStorage<FinancialAdjustment[]>('financial_adjustments', []);
  const [allNotifications, setAllNotifications] = useLocalStorage('notifications', []);
  const [allSystemUsers, setAllSystemUsers] = useState<Employee[]>([]);
  const [allBranches] = useLocalStorage('branches', []);

  // Available roles configuration
  const availableRoles = [
    {
      value: 'admin',
      label: 'مدير عام',
      description: 'صلاحيات كاملة على النظام وجميع الفروع',
      color: 'bg-red-100 text-red-800',
      icon: <Star className="h-4 w-4" />
    },
    {
      value: 'manager',
      label: 'مدير فرع',
      description: 'إدارة كاملة للفرع الواحد',
      color: 'bg-blue-100 text-blue-800',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      value: 'reception',
      label: 'موظف استقبال',
      description: 'إدارة الحجوزات والعملاء والجلسات',
      color: 'bg-green-100 text-green-800',
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      value: 'employee',
      label: 'موظف',
      description: 'الوصول الأساسي للمهام والحضور والانصراف',
      color: 'bg-gray-100 text-gray-800',
      icon: <User className="h-4 w-4" />
    }
  ];

  // Filter by branch
  const employees = allEmployees.filter(emp => emp.branch_id === user?.branch_id);
  const adjustments = allAdjustments.filter(adj => adj.branch_id === user?.branch_id);

  const [activeTab, setActiveTab] = useState<'employees' | 'adjustments' | 'roles'>('employees');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeForAdjustment, setSelectedEmployeeForAdjustment] = useState<Employee | null>(null);
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);
  const [loadingRoleUpdate, setLoadingRoleUpdate] = useState<string | null>(null);

  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: 'employee' as Employee['role'],
    salary: '',
    hire_date: ''
  });

  // Statistics
  const employeeStats = React.useMemo(() => {
    const totalBonuses = adjustments
      .filter(adj => adj.type === 'bonus' && adj.status === 'approved')
      .reduce((sum, adj) => sum + adj.amount, 0);
    
    const totalDeductions = adjustments
      .filter(adj => adj.type === 'deduction' && adj.status === 'approved')
      .reduce((sum, adj) => sum + adj.amount, 0);

    const pendingAdjustments = adjustments.filter(adj => adj.status === 'pending').length;

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.created_at).length, // Assuming all in demo are active
      totalBonuses,
      totalDeductions,
      pendingAdjustments
    };
  }, [employees, adjustments]);

  // Fetch all users for role management (admin only)
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchAllUsers = async () => {
        try {
          const users = await apiClient.getAllUsers();
          setAllSystemUsers(users);
        } catch (error) {
          console.error('Error fetching users:', error);
          // Fallback to local storage data
          setAllSystemUsers(allEmployees);
        }
      };
      fetchAllUsers();
    }
  }, [user?.role, allEmployees]);

  // Handle role update
  const handleRoleUpdate = async (userId: string, newRole: Employee['role']) => {
    if (userId === user?.id) {
      alert('لا يمكن تغيير دورك الخاص');
      return;
    }

    if (!confirm(`هل أنت متأكد من تغيير دور هذا المستخدم إلى "${getRoleLabel(newRole)}"؟`)) {
      return;
    }

    try {
      setLoadingRoleUpdate(userId);
      
      await apiClient.updateUserRole(userId, newRole);
      
      // Update local state
      setAllSystemUsers(allSystemUsers.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      // Also update allEmployees if this user is in there
      setAllEmployees(allEmployees.map(emp => 
        emp.id === userId ? { ...emp, role: newRole } : emp
      ));
      
      alert(`تم تغيير دور المستخدم إلى "${getRoleLabel(newRole)}" بنجاح!`);
      
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('حدث خطأ أثناء تحديث دور المستخدم');
    } finally {
      setLoadingRoleUpdate(null);
    }
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employeeData = {
      ...employeeFormData,
      salary: employeeFormData.salary ? parseFloat(employeeFormData.salary) : undefined
    };

    if (editingEmployee) {
      setAllEmployees(allEmployees.map(emp => 
        emp.id === editingEmployee.id 
          ? { ...emp, ...employeeData }
          : emp
      ));
    } else {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        ...employeeData,
        created_at: new Date().toISOString()
      };
      setAllEmployees([...allEmployees, newEmployee]);
    }
    
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    setEmployeeFormData({
      name: '', email: '', username: '', password: '', phone: '', role: 'employee', salary: '', hire_date: ''
    });
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeFormData({
      name: employee.name,
      email: employee.email,
      username: employee.username || '',
      password: '', // Don't show existing password
      phone: employee.phone || '',
      role: employee.role,
      salary: employee.salary?.toString() || '',
      hire_date: employee.hire_date || ''
    });
    setShowEmployeeForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      setAllEmployees(allEmployees.filter(emp => emp.id !== id));
    }
  };

  const handleFinancialAdjustment = (employee: Employee) => {
    setSelectedEmployeeForAdjustment(employee);
    setShowAdjustmentModal(true);
  };

  const handleShowPayslip = (employee: Employee) => {
    setSelectedEmployeeForPayslip(employee);
    setShowPayslipModal(true);
  };

  const handleAdjustmentSubmit = (adjustmentData: Omit<FinancialAdjustment, 'id' | 'created_at' | 'status' | 'processed_date'>) => {
    // Create new financial adjustment
    const newAdjustment: FinancialAdjustment = {
      id: Date.now().toString(),
      ...adjustmentData,
      approved_by: user?.id || '1',
      approved_by_name: user?.name || 'مدير النظام',
      status: 'approved', // Auto-approve for demo
      processed_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    setAllAdjustments([...allAdjustments, newAdjustment]);

    // Create notification for employee
    const notification = {
      id: `adjustment-${newAdjustment.id}`,
      type: newAdjustment.type === 'bonus' ? 'success' : 'warning',
      title: newAdjustment.type === 'bonus' ? 'تم إضافة بونص' : 'تم تطبيق خصم',
      message: `${newAdjustment.type === 'bonus' ? '+' : '-'}${newAdjustment.amount} ج.م - ${newAdjustment.reason}`,
      timestamp: new Date().toISOString(),
      read: false,
      targetEmployeeId: adjustmentData.employee_id
    };

    setAllNotifications(prev => [...prev, notification]);

    setShowAdjustmentModal(false);
    setSelectedEmployeeForAdjustment(null);
    
    alert(`تم ${newAdjustment.type === 'bonus' ? 'إضافة البونص' : 'تطبيق الخصم'} بنجاح وإرسال إشعار للموظف!`);
  };

  // Filter employees based on user role
  const filteredEmployees = user?.role === 'admin' || user?.role === 'manager' 
    ? employees 
    : employees.filter(emp => emp.id === user?.id);

  // Check if user can manage all employees
  const canManageAllEmployees = user?.role === 'admin' || user?.role === 'manager';
  
  // Check if user can manage specific employee
  const canManageEmployee = (employeeId: string) => {
    return canManageAllEmployees || employeeId === user?.id;
  };

  // Get page title and description based on role
  const getPageInfo = () => {
    if (canManageAllEmployees) {
      return {
        title: 'إدارة الموظفين',
        description: 'إدارة الموظفين والتعديلات المالية'
      };
    } else {
      return {
        title: 'الملف الشخصي',
        description: 'عرض البيانات الشخصية وكشف المرتب'
      };
    }
  };

  const pageInfo = getPageInfo();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير عام';
      case 'manager': return 'مدير فرع';
      case 'reception': return 'استقبال';
      case 'employee': return 'موظف';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'reception': return 'bg-green-100 text-green-800';
      case 'employee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeAdjustments = (employeeId: string) => {
    return adjustments.filter(adj => adj.employee_id === employeeId);
  };

  const getEmployeeTotalBonus = (employeeId: string) => {
    return adjustments
      .filter(adj => adj.employee_id === employeeId && adj.type === 'bonus' && adj.status === 'approved')
      .reduce((sum, adj) => sum + adj.amount, 0);
  };

  const getEmployeeTotalDeductions = (employeeId: string) => {
    return adjustments
      .filter(adj => adj.employee_id === employeeId && adj.type === 'deduction' && adj.status === 'approved')
      .reduce((sum, adj) => sum + adj.amount, 0);
  };

  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['إدارة النظام', 'جميع الفروع', 'المستخدمين', 'التقارير الشاملة'];
      case 'manager':
        return ['إدارة الفرع', 'الموظفين', 'المالية', 'التقارير'];
      case 'reception':
        return ['الحجوزات', 'العملاء', 'الجلسات', 'الولاء'];
      case 'employee':
        return ['المهام', 'الحضور', 'الملف الشخصي'];
      default:
        return [];
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          {canManageAllEmployees && (
            <Button 
              onClick={() => setShowEmployeeForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة موظف جديد
            </Button>
          )}
          
          {canManageAllEmployees && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'employees' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                الموظفين ({employees.length})
              </button>
              <button
                onClick={() => setActiveTab('adjustments')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'adjustments' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                التعديلات المالية ({adjustments.length})
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('roles')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'roles' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  إدارة الأدوار ({allSystemUsers.length})
                </button>
              )}
            </div>
          )}
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">{pageInfo.title}</h1>
          <p className="text-gray-600 text-right">{pageInfo.description}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {canManageAllEmployees && activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">إجمالي الموظفين</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-blue-600">{employeeStats.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">إجمالي البونصات</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-green-600">
                {employeeStats.totalBonuses.toLocaleString('ar-EG')} ج.م
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">إجمالي الخصومات</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-red-600">
                {employeeStats.totalDeductions.toLocaleString('ar-EG')} ج.م
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">تعديلات معلقة</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-orange-600">{employeeStats.pendingAdjustments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">صافي التعديلات</CardTitle>
              <Calculator className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold text-right ${
                (employeeStats.totalBonuses - employeeStats.totalDeductions) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(employeeStats.totalBonuses - employeeStats.totalDeductions).toLocaleString('ar-EG')} ج.م
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Form */}
      {showEmployeeForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emp-name" className="text-right block mb-2">الاسم الكامل *</Label>
                  <Input
                    id="emp-name"
                    value={employeeFormData.name}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                    placeholder="الاسم الكامل"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="emp-email" className="text-right block mb-2">البريد الإلكتروني *</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                    placeholder="employee@shaghaf.eg"
                    required
                    className="text-right"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emp-username" className="text-right block mb-2">اسم المستخدم *</Label>
                  <Input
                    id="emp-username"
                    value={employeeFormData.username}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, username: e.target.value })}
                    placeholder="username"
                    required
                    className="text-right"
                  />
                  <p className="text-xs text-gray-500 text-right mt-1">
                    سيتم استخدامه لتسجيل الدخول
                  </p>
                </div>
                <div>
                  <Label htmlFor="emp-password" className="text-right block mb-2">
                    كلمة المرور {editingEmployee ? '(اتركها فارغة للإبقاء على الحالية)' : '*'}
                  </Label>
                  <Input
                    id="emp-password"
                    type="password"
                    value={employeeFormData.password}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                    placeholder="••••••••"
                    required={!editingEmployee}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emp-phone" className="text-right block mb-2">رقم الهاتف</Label>
                  <Input
                    id="emp-phone"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    placeholder="01234567890"
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="emp-role" className="text-right block mb-2">الدور الوظيفي *</Label>
                  <select
                    id="emp-role"
                    value={employeeFormData.role}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value as Employee['role'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    required
                  >
                    <option value="employee">موظف</option>
                    <option value="reception">استقبال</option>
                    {(user?.role === 'admin') && (
                      <>
                        <option value="manager">مدير فرع</option>
                        <option value="admin">مدير عام</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emp-salary" className="text-right block mb-2">الراتب الأساسي (ج.م)</Label>
                  <Input
                    id="emp-salary"
                    type="number"
                    step="0.01"
                    value={employeeFormData.salary}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: e.target.value })}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="emp-hire-date" className="text-right block mb-2">تاريخ التعيين</Label>
                  <Input
                    id="emp-hire-date"
                    type="date"
                    value={employeeFormData.hire_date}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, hire_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowEmployeeForm(false);
                  setEditingEmployee(null);
                  setEmployeeFormData({
                    name: '', email: '', username: '', password: '', phone: '', role: 'employee', salary: '', hire_date: ''
                  });
                }}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'حفظ التغييرات' : 'إضافة الموظف'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Employees Tab */}
      {(activeTab === 'employees' || !canManageAllEmployees) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => {
            const totalBonus = getEmployeeTotalBonus(employee.id);
            const totalDeductions = getEmployeeTotalDeductions(employee.id);
            const employeeAdjustments = getEmployeeAdjustments(employee.id);
            
            return (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleShowPayslip(employee)}
                        className="text-purple-600 hover:bg-purple-50"
                        title="عرض كشف المرتب"
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                      
                      {canManageEmployee(employee.id) && canManageAllEmployees && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(employee)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleFinancialAdjustment(employee)}
                            className="text-green-600 hover:bg-green-50"
                            title="إدارة التعديلات المالية"
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <Badge className={getRoleColor(employee.role)}>
                        {getRoleLabel(employee.role)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2" dir="ltr">{employee.email}</span>
                      <Mail className="h-4 w-4" />
                    </div>
                    {employee.phone && (
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2" dir="ltr">{employee.phone}</span>
                        <Phone className="h-4 w-4" />
                      </div>
                    )}
                    {employee.salary && (
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2">{employee.salary.toLocaleString('ar-EG')} ج.م</span>
                        <DollarSign className="h-4 w-4" />
                      </div>
                    )}
                    
                    {/* Financial Adjustments Summary */}
                    {(totalBonus > 0 || totalDeductions > 0) && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-right mb-2">التعديلات المالية:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {totalBonus > 0 && (
                            <div className="bg-green-50 p-2 rounded text-center">
                              <div className="text-sm font-semibold text-green-700">+{totalBonus.toFixed(2)} ج.م</div>
                              <p className="text-xs text-green-600">بونصات</p>
                            </div>
                          )}
                          {totalDeductions > 0 && (
                            <div className="bg-red-50 p-2 rounded text-center">
                              <div className="text-sm font-semibold text-red-700">-{totalDeductions.toFixed(2)} ج.م</div>
                              <p className="text-xs text-red-600">خصومات</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <Badge className="bg-purple-100 text-purple-800">
                            {employeeAdjustments.length} تعديل
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Financial Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          {adjustments
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((adjustment) => (
              <Card key={adjustment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge className={
                        adjustment.type === 'bonus' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }>
                        {adjustment.type === 'bonus' ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            بونص
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                            خصم
                          </>
                        )}
                      </Badge>
                      
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {adjustment.status === 'approved' ? 'مطبق' : 'معلق'}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">{adjustment.employee_name}</h3>
                      <p className="text-gray-600 text-sm">
                        {adjustment.approved_by_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-end">
                      <span className={`text-xl font-bold ${
                        adjustment.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {adjustment.type === 'bonus' ? '+' : '-'}{adjustment.amount.toFixed(2)} ج.م
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{adjustment.reason}</span>
                      <FileText className="h-4 w-4" />
                    </div>
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{formatDateOnly(adjustment.created_at)}</span>
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>

                  {adjustment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700 text-right">
                        <strong>ملاحظات:</strong> {adjustment.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
          {adjustments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calculator className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تعديلات مالية</h3>
              <p className="text-gray-500">لم يتم إجراء أي تعديلات مالية على الموظفين بعد</p>
            </div>
          )}
        </div>
      )}

      {/* Roles Management Tab - Admin Only */}
      {activeTab === 'roles' && user?.role === 'admin' && (
        <div className="space-y-6">
          {/* Available Roles Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {availableRoles.map((role) => (
              <Card key={role.value} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-right">
                    <Badge className={role.color}>
                      {role.icon}
                      <span className="mr-2">{role.label}</span>
                    </Badge>
                    <CardTitle className="text-lg mt-2">{role.label}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 text-right mb-2">الصلاحيات:</p>
                    {getPermissionsForRole(role.value).map((permission, idx) => (
                      <div key={idx} className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2">{permission}</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-lg font-bold text-gray-800">
                      {allSystemUsers.filter(u => u.role === role.value).length}
                    </span>
                    <p className="text-xs text-gray-500">مستخدم</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Users Role Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">إدارة أدوار المستخدمين</CardTitle>
              <p className="text-sm text-gray-600 text-right">
                يمكن للمديرين العامين فقط تعديل أدوار المستخدمين
              </p>
            </CardHeader>
            <CardContent>
              {allSystemUsers.length > 0 ? (
                <div className="space-y-4">
                  {allSystemUsers.map((systemUser) => (
                    <Card key={systemUser.id} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3">
                            <Badge className={getRoleColor(systemUser.role)}>
                              {getRoleLabel(systemUser.role)}
                            </Badge>
                            
                            {systemUser.id === user?.id && (
                              <Badge variant="secondary">أنت</Badge>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <h3 className="font-semibold text-lg">{systemUser.name}</h3>
                            <p className="text-sm text-gray-600">{systemUser.email}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            {systemUser.id === user?.id ? (
                              <span className="text-sm text-gray-500 italic">
                                لا يمكن تعديل دورك الخاص
                              </span>
                            ) : (
                              <div className="flex gap-2">
                                <select
                                  value={systemUser.role}
                                  onChange={(e) => handleRoleUpdate(systemUser.id, e.target.value as Employee['role'])}
                                  disabled={loadingRoleUpdate === systemUser.id}
                                  className="px-3 py-2 border border-gray-300 rounded-md text-right bg-white"
                                >
                                  <option value="employee">موظف</option>
                                  <option value="reception">استقبال</option>
                                  <option value="manager">مدير فرع</option>
                                  <option value="admin">مدير عام</option>
                                </select>
                                
                                {loadingRoleUpdate === systemUser.id && (
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-left">
                            <p className="text-sm text-gray-500">الفرع:</p>
                            <p className="text-sm font-medium">
                              {(() => {
                                const branch = allBranches.find((b: any) => b.id === systemUser.branch_id);
                                return branch?.name || 'فرع غير معروف';
                              })()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Permissions Preview */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 text-right mb-2">الصلاحيات الحالية:</p>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {getPermissionsForRole(systemUser.role).slice(0, 3).map((permission, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {getPermissionsForRole(systemUser.role).length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{getPermissionsForRole(systemUser.role).length - 3} أخرى
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">جاري تحميل بيانات المستخدمين...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State for Employees */}
      {(activeTab === 'employees' || !canManageAllEmployees) && filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <UserCog className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {canManageAllEmployees ? 'لا يوجد موظفين في هذا الفرع' : 'لا توجد بيانات'}
          </h3>
          <p className="text-gray-500 mb-4">
            {canManageAllEmployees ? 'ابدأ بإضافة الموظف الأول لهذا الفرع' : 'تعذر العثور على بياناتك الشخصية'}
          </p>
          {canManageAllEmployees && (
            <Button onClick={() => setShowEmployeeForm(true)}>
              إضافة موظف جديد
            </Button>
          )}
        </div>
      )}

      {/* Financial Adjustment Modal */}
      {selectedEmployeeForAdjustment && (
        <FinancialAdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => {
            setShowAdjustmentModal(false);
            setSelectedEmployeeForAdjustment(null);
          }}
          employee={selectedEmployeeForAdjustment}
          onSubmit={handleAdjustmentSubmit}
        />
      )}

      {/* Payslip Modal */}
      {selectedEmployeeForPayslip && (
        <PayslipModal
          isOpen={showPayslipModal}
          onClose={() => {
            setShowPayslipModal(false);
            setSelectedEmployeeForPayslip(null);
          }}
          employee={selectedEmployeeForPayslip}
          adjustments={adjustments.filter(adj => adj.employee_id === selectedEmployeeForPayslip.id)}
          selectedMonth={new Date().toISOString().slice(0, 7)} // Current month
        />
      )}
    </div>
  );
};

export default Employees;