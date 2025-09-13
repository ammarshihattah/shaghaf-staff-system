import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { apiClient } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, Clock, Calendar, Users, Building2, User, Send } from 'lucide-react';
import { Shift, EmployeeShift, User as EmployeeUser, Branch } from '../../types';
import { formatDateOnly, formatTimeOnly } from '../../lib/utils';
import DayShiftAssignmentModal from '../DayShiftAssignmentModal';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import arEG from 'date-fns/locale/ar-EG';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'ar-EG': arEG,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const ShiftManagement: React.FC = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useLocalStorage<Shift[]>('shifts', []);
  const [employeeShifts, setEmployeeShifts] = useLocalStorage<EmployeeShift[]>('employee_shifts', []);
  const [employees] = useLocalStorage<EmployeeUser[]>('users', []); // Assuming 'users' are employees
  const [branches] = useLocalStorage<Branch[]>('branches', []);

  const [activeTab, setActiveTab] = useState<'shifts' | 'calendar' | 'employee-shifts'>('shifts');
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftFormData, setShiftFormData] = useState({
    name: '',
    type: 'morning' as Shift['type'],
    start_time: '',
    end_time: '',
    days_of_week: [] as number[],
    is_active: true
  });

  const [showAssignShiftModal, setShowAssignShiftModal] = useState(false);
  const [assignShiftFormData, setAssignShiftFormData] = useState({
    employee_id: '',
    shift_id: '',
    assignment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [showDayAssignmentModal, setShowDayAssignmentModal] = useState(false);

  // Filter data by current user's branch
  const currentBranchShifts = shifts.filter(s => s.branch_id === user?.branch_id);
  const currentBranchEmployees = employees.filter(e => e.branch_id === user?.branch_id);
  const currentBranchEmployeeShifts = employeeShifts.filter(es => {
    const employee = employees.find(e => e.id === es.employee_id);
    return employee?.branch_id === user?.branch_id;
  });

  // Fetch initial data (for WebContainer, this will load mock data)
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const fetchedShifts = await apiClient.getShifts(user?.branch_id);
        setShifts(fetchedShifts);
      } catch (error) {
        console.error('Error fetching shifts:', error);
      }
    };
    const fetchEmployeeShifts = async () => {
      try {
        const fetchedEmployeeShifts = await apiClient.getEmployeeShifts(user?.branch_id);
        setEmployeeShifts(fetchedEmployeeShifts);
      } catch (error) {
        console.error('Error fetching employee shifts:', error);
      }
    };
    fetchShifts();
    fetchEmployeeShifts();
  }, [user?.branch_id]);

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...shiftFormData, branch_id: user?.branch_id || '1' };
      
      if (editingShift) {
        try {
          // Try API first
          const updatedShift = await apiClient.updateShift(editingShift.id, data);
          setShifts(shifts.map(s => s.id === updatedShift.id ? updatedShift : s));
        } catch (apiError) {
          console.warn('API call failed, updating locally:', apiError);
          // Fallback to local storage
          const updatedShift = {
            ...editingShift,
            ...data,
            updated_at: new Date().toISOString()
          };
          setShifts(shifts.map(s => s.id === editingShift.id ? updatedShift : s));
        }
      } else {
        try {
          // Try API first
          const newShift = await apiClient.createShift(data);
          setShifts([...shifts, newShift]);
        } catch (apiError) {
          console.warn('API call failed, creating locally:', apiError);
          // Fallback to local storage
          const newShift = {
            id: Date.now().toString(),
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setShifts([...shifts, newShift]);
        }
      }
      
      // Reset form and close modal
      setShowShiftForm(false);
      setEditingShift(null);
      setShiftFormData({ name: '', type: 'morning', start_time: '', end_time: '', days_of_week: [], is_active: true });
      
      alert(editingShift ? 'تم تحديث الوردية بنجاح! ✅' : 'تم إضافة الوردية بنجاح! ✅');
    } catch (error) {
      console.error('Error saving shift:', error);
      alert(`خطأ في حفظ الوردية: ${(error as Error).message}`);
    }
  };

  const handleShiftEdit = (shift: Shift) => {
    setEditingShift(shift);
    setShiftFormData({
      name: shift.name,
      type: shift.type,
      start_time: shift.start_time,
      end_time: shift.end_time,
      days_of_week: shift.days_of_week,
      is_active: shift.is_active
    });
    setShowShiftForm(true);
  };

  const handleShiftDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الوردية؟')) {
      try {
        try {
          // Try API first
          await apiClient.deleteShift(id);
          setShifts(shifts.filter(s => s.id !== id));
        } catch (apiError) {
          console.warn('API call failed, deleting locally:', apiError);
          // Fallback to local storage
          setShifts(shifts.filter(s => s.id !== id));
        }
        
        alert('تم حذف الوردية بنجاح! ✅');
      } catch (error) {
        console.error('Error deleting shift:', error);
        alert(`خطأ في حذف الوردية: ${(error as Error).message}`);
      }
    }
  };

  const handleAssignShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      try {
        // Try API first
        const newEmployeeShift = await apiClient.createEmployeeShift(assignShiftFormData);
        setEmployeeShifts([...employeeShifts, newEmployeeShift]);
      } catch (apiError) {
        console.warn('API call failed, creating locally:', apiError);
        // Fallback to local storage
        const newEmployeeShift = {
          id: Date.now().toString(),
          ...assignShiftFormData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setEmployeeShifts([...employeeShifts, newEmployeeShift]);
      }
      
      setShowAssignShiftModal(false);
      setAssignShiftFormData({ employee_id: '', shift_id: '', assignment_date: new Date().toISOString().split('T')[0], notes: '' });
      alert('تم تعيين الوردية بنجاح! ✅');
    } catch (error) {
      console.error('Error assigning shift:', error);
      alert(`خطأ في تعيين الوردية: ${(error as Error).message}`);
    }
  };

  const handleEmployeeShiftDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التعيين؟')) {
      try {
        try {
          // Try API first
          await apiClient.deleteEmployeeShift(id);
          setEmployeeShifts(employeeShifts.filter(es => es.id !== id));
        } catch (apiError) {
          console.warn('API call failed, deleting locally:', apiError);
          // Fallback to local storage
          setEmployeeShifts(employeeShifts.filter(es => es.id !== id));
        }
        
        alert('تم حذف التعيين بنجاح! ✅');
      } catch (error) {
        console.error('Error deleting employee shift:', error);
        alert(`خطأ في حذف تعيين الوردية: ${(error as Error).message}`);
      }
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedCalendarDate(date);
    setShowDayAssignmentModal(true);
  };
  
  const handleDayAssignmentsSave = async (assignmentsData: Array<{
    shift_id: string;
    employee_id: string | null;
    assignment_date: string;
    notes?: string;
  }>) => {
    try {
      // Process each assignment
      for (const assignment of assignmentsData) {
        if (assignment.employee_id) {
          // Check if assignment already exists
          const existingAssignment = employeeShifts.find(es => 
            es.shift_id === assignment.shift_id && es.assignment_date === assignment.assignment_date
          );
          
          if (existingAssignment) {
            // Update existing assignment
            try {
              const updated = await apiClient.updateEmployeeShift(existingAssignment.id, {
                employee_id: assignment.employee_id,
                notes: assignment.notes
              });
              setEmployeeShifts(employeeShifts.map(es => 
                es.id === existingAssignment.id ? updated : es
              ));
            } catch (apiError) {
              console.warn('API call failed, updating locally:', apiError);
              const updated = {
                ...existingAssignment,
                employee_id: assignment.employee_id,
                notes: assignment.notes,
                updated_at: new Date().toISOString()
              };
              setEmployeeShifts(employeeShifts.map(es => 
                es.id === existingAssignment.id ? updated : es
              ));
            }
          } else {
            // Create new assignment
            try {
              const newEmployeeShift = await apiClient.createEmployeeShift({
                employee_id: assignment.employee_id,
                shift_id: assignment.shift_id,
                assignment_date: assignment.assignment_date,
                notes: assignment.notes
              });
              setEmployeeShifts([...employeeShifts, newEmployeeShift]);
            } catch (apiError) {
              console.warn('API call failed, creating locally:', apiError);
              const newEmployeeShift = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                employee_id: assignment.employee_id,
                shift_id: assignment.shift_id,
                assignment_date: assignment.assignment_date,
                notes: assignment.notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setEmployeeShifts([...employeeShifts, newEmployeeShift]);
            }
          }
        } else {
          // Remove assignment if employee_id is null
          const existingAssignment = employeeShifts.find(es => 
            es.shift_id === assignment.shift_id && es.assignment_date === assignment.assignment_date
          );
          
          if (existingAssignment) {
            try {
              await apiClient.deleteEmployeeShift(existingAssignment.id);
              setEmployeeShifts(employeeShifts.filter(es => es.id !== existingAssignment.id));
            } catch (apiError) {
              console.warn('API call failed, deleting locally:', apiError);
              setEmployeeShifts(employeeShifts.filter(es => es.id !== existingAssignment.id));
            }
          }
        }
      }
      
      setShowDayAssignmentModal(false);
      alert('تم حفظ تعيينات الورديات بنجاح! ✅');
    } catch (error) {
      console.error('Error saving shift assignments:', error);
      alert(`خطأ في حفظ التعيينات: ${(error as Error).message}`);
    }
  };

  const calendarEvents = useMemo(() => {
    return currentBranchEmployeeShifts.map(es => {
      const employee = currentBranchEmployees.find(emp => emp.id === es.employee_id);
      const shift = currentBranchShifts.find(s => s.id === es.shift_id);
      if (!employee || !shift) return null;

      const startDateTime = new Date(`${es.assignment_date}T${shift.start_time}:00`);
      const endDateTime = new Date(`${es.assignment_date}T${shift.end_time}:00`);
      // Handle shifts that cross midnight
      if (shift.start_time > shift.end_time) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      return {
        id: es.id,
        title: `${employee.name} - ${shift.name}`,
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        resource: { employee, shift, employeeShift: es }
      };
    }).filter(Boolean);
  }, [currentBranchEmployeeShifts, currentBranchEmployees, currentBranchShifts]);

  const getShiftTypeLabel = (type: Shift['type']) => {
    switch (type) {
      case 'morning': return 'صباحية';
      case 'evening': return 'مسائية';
      case 'full': return 'كاملة';
      default: return type;
    }
  };

  const getShiftTypeColor = (type: Shift['type']) => {
    switch (type) {
      case 'morning': return 'bg-yellow-100 text-yellow-800';
      case 'evening': return 'bg-indigo-100 text-indigo-800';
      case 'full': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayIndex];
  };

  // Check if user has permission to manage shifts
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح لك بالوصول</h3>
          <p className="text-gray-500">ليس لديك صلاحية لإدارة الورديات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          <Button
            onClick={() => setShowShiftForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة وردية جديدة
          </Button>
          <Button
            onClick={() => setShowAssignShiftModal(true)}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            تعيين وردية لموظف
          </Button>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'shifts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              الورديات ({currentBranchShifts.length})
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              التقويم
            </button>
            <button
              onClick={() => setActiveTab('employee-shifts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'employee-shifts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              تعيينات الموظفين ({currentBranchEmployeeShifts.length})
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة الورديات</h1>
          <p className="text-gray-600 text-right">تنظيم وتوزيع الورديات على الموظفين</p>
        </div>
      </div>

      {/* Shift Form */}
      {showShiftForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingShift ? 'تعديل الوردية' : 'إضافة وردية جديدة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleShiftSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shift-name" className="text-right block mb-2">اسم الوردية *</Label>
                  <Input
                    id="shift-name"
                    value={shiftFormData.name}
                    onChange={(e) => setShiftFormData({ ...shiftFormData, name: e.target.value })}
                    placeholder="مثال: وردية صباحية"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="shift-type" className="text-right block mb-2">نوع الوردية *</Label>
                  <select
                    id="shift-type"
                    value={shiftFormData.type}
                    onChange={(e) => setShiftFormData({ ...shiftFormData, type: e.target.value as Shift['type'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="morning">صباحية</option>
                    <option value="evening">مسائية</option>
                    <option value="full">كاملة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time" className="text-right block mb-2">وقت البدء *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={shiftFormData.start_time}
                    onChange={(e) => setShiftFormData({ ...shiftFormData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-right block mb-2">وقت الانتهاء *</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={shiftFormData.end_time}
                    onChange={(e) => setShiftFormData({ ...shiftFormData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-right block mb-2">أيام الأسبوع *</Label>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                    <Button
                      key={dayIndex}
                      type="button"
                      variant={shiftFormData.days_of_week.includes(dayIndex) ? 'default' : 'outline'}
                      onClick={() => {
                        setShiftFormData(prev => ({
                          ...prev,
                          days_of_week: prev.days_of_week.includes(dayIndex)
                            ? prev.days_of_week.filter(d => d !== dayIndex)
                            : [...prev.days_of_week, dayIndex].sort((a, b) => a - b)
                        }));
                      }}
                      className="flex-1"
                    >
                      {getDayName(dayIndex)}
                    </Button>
                  ))}
                </div>
                {shiftFormData.days_of_week.length === 0 && (
                  <p className="text-red-500 text-sm text-right mt-1">يجب اختيار يوم واحد على الأقل.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Label htmlFor="is-active" className="text-right">نشط</Label>
                <input
                  id="is-active"
                  type="checkbox"
                  checked={shiftFormData.is_active}
                  onChange={(e) => setShiftFormData({ ...shiftFormData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowShiftForm(false);
                  setEditingShift(null);
                  setShiftFormData({ name: '', type: 'morning', start_time: '', end_time: '', days_of_week: [], is_active: true });
                }}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={shiftFormData.days_of_week.length === 0}>
                  {editingShift ? 'حفظ التغييرات' : 'إضافة الوردية'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assign Shift Modal */}
      {showAssignShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-right">تعيين وردية لموظف</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignShiftSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employee-select" className="text-right block mb-2">الموظف *</Label>
                  <select
                    id="employee-select"
                    value={assignShiftFormData.employee_id}
                    onChange={(e) => setAssignShiftFormData({ ...assignShiftFormData, employee_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="">اختر موظف</option>
                    {currentBranchEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="shift-select" className="text-right block mb-2">الوردية *</Label>
                  <select
                    id="shift-select"
                    value={assignShiftFormData.shift_id}
                    onChange={(e) => setAssignShiftFormData({ ...assignShiftFormData, shift_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="">اختر وردية</option>
                    {currentBranchShifts.map(shift => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({formatTimeOnly(shift.start_time)} - {formatTimeOnly(shift.end_time)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="assignment-date" className="text-right block mb-2">تاريخ التعيين *</Label>
                  <Input
                    id="assignment-date"
                    type="date"
                    value={assignShiftFormData.assignment_date}
                    onChange={(e) => setAssignShiftFormData({ ...assignShiftFormData, assignment_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assign-notes" className="text-right block mb-2">ملاحظات</Label>
                  <textarea
                    id="assign-notes"
                    value={assignShiftFormData.notes}
                    onChange={(e) => setAssignShiftFormData({ ...assignShiftFormData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية"
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  />
                </div>
                <div className="flex gap-4 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAssignShiftModal(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">تعيين</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentBranchShifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleShiftEdit(shift)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleShiftDelete(shift.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-xl">{shift.name}</CardTitle>
                    <div className="flex gap-2 justify-end mt-1">
                      <Badge className={getShiftTypeColor(shift.type)}>
                        {getShiftTypeLabel(shift.type)}
                      </Badge>
                      <Badge variant={shift.is_active ? 'default' : 'destructive'}>
                        {shift.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">{formatTimeOnly(shift.start_time)} - {formatTimeOnly(shift.end_time)}</span>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">
                      {shift.days_of_week.map(getDayName).join(', ')}
                    </span>
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {currentBranchShifts.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <div className="text-gray-400 mb-4">
                <Clock className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ورديات</h3>
              <p className="text-gray-500 mb-4">ابدأ بإضافة الوردية الأولى لهذا الفرع</p>
              <Button onClick={() => setShowShiftForm(true)}>
                إضافة وردية جديدة
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">تقويم الورديات - اضغط على أي يوم لإدارة التعيينات</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 700 }}>
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                defaultView="month"
                views={['month', 'week', 'day']}
                culture="ar-EG"
                selectable
                onSelectSlot={(slotInfo) => handleDayClick(slotInfo.start)}
                onSelectEvent={(event) => {
                  const eventDate = new Date(event.start);
                  eventDate.setHours(0, 0, 0, 0); // Reset time to start of day
                  handleDayClick(eventDate);
                }}
                messages={{
                  next: 'التالي',
                  previous: 'السابق',
                  today: 'اليوم',
                  month: 'شهر',
                  week: 'أسبوع',
                  day: 'يوم',
                  agenda: 'أجندة',
                  date: 'التاريخ',
                  time: 'الوقت',
                  event: 'الحدث',
                  noEventsInRange: 'لا توجد أحداث في هذا النطاق.',
                  showMore: (total) => `+ عرض المزيد (${total})`,
                }}
                eventPropGetter={(event, start, end, isSelected) => {
                  const shiftType = event.resource.shift.type;
                  let backgroundColor = '#3B82F6'; // Default blue
                  if (shiftType === 'morning') backgroundColor = '#F59E0B'; // Orange
                  if (shiftType === 'evening') backgroundColor = '#6366F1'; // Indigo
                  if (shiftType === 'full') backgroundColor = '#8B5CF6'; // Purple

                  return {
                    style: {
                      backgroundColor,
                      color: 'white',
                      borderRadius: '0px',
                      border: 'none',
                      cursor: 'pointer',
                    },
                  };
                }}
                dayPropGetter={(date) => {
                  const hasShifts = currentBranchShifts.some(shift => {
                    const dayOfWeek = date.getDay();
                    return shift.days_of_week.includes(dayOfWeek) && shift.is_active;
                  });
                  
                  return {
                    className: hasShifts ? 'cursor-pointer hover:bg-blue-100 border-2 border-blue-200' : 'cursor-pointer hover:bg-gray-100',
                    style: {
                      backgroundColor: hasShifts ? '#EFF6FF' : 'transparent'
                    }
                  };
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Shifts Tab */}
      {activeTab === 'employee-shifts' && (
        <div className="space-y-4">
          {currentBranchEmployeeShifts.map((es) => {
            const employee = currentBranchEmployees.find(emp => emp.id === es.employee_id);
            const shift = currentBranchShifts.find(s => s.id === es.shift_id);

            if (!employee || !shift) return null; // Don't render if data is incomplete

            return (
              <Card key={es.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          // Implement edit functionality for employee shifts
                          alert('ميزة تعديل تعيين الوردية ستتوفر قريباً!');
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEmployeeShiftDelete(es.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <p className="text-gray-600">{shift.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{formatDateOnly(es.assignment_date)}</span>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{formatTimeOnly(shift.start_time)} - {formatTimeOnly(shift.end_time)}</span>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{employee.role}</span>
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                  {es.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg text-sm text-gray-600 text-right">
                      ملاحظات: {es.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {currentBranchEmployeeShifts.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <div className="text-gray-400 mb-4">
                <Users className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تعيينات ورديات</h3>
              <p className="text-gray-500 mb-4">ابدأ بتعيين ورديات للموظفين</p>
              <Button onClick={() => setShowAssignShiftModal(true)}>
                تعيين وردية لموظف
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Day Shift Assignment Modal */}
      <DayShiftAssignmentModal
        isOpen={showDayAssignmentModal}
        onClose={() => {
          setShowDayAssignmentModal(false);
          setSelectedCalendarDate(null);
        }}
        selectedDate={selectedCalendarDate}
        shifts={currentBranchShifts}
        employees={currentBranchEmployees}
        employeeShifts={currentBranchEmployeeShifts}
        onSaveAssignments={handleDayAssignmentsSave}
      />
    </div>
  );
};

export default ShiftManagement;