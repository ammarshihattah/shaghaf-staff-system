import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, Calendar, Clock, Users, User, CheckCircle, AlertTriangle,
  Save, RotateCcw, UserCheck, UserX, Building2, Award
} from 'lucide-react';
import { Shift, EmployeeShift, User as Employee } from '../types';
import { formatDateOnly, formatTimeOnly } from '../lib/utils';

interface DayShiftAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  shifts: Shift[];
  employees: Employee[];
  employeeShifts: EmployeeShift[];
  onSaveAssignments: (assignments: Array<{
    shift_id: string;
    employee_id: string | null;
    assignment_date: string;
    notes?: string;
  }>) => void;
}

const DayShiftAssignmentModal: React.FC<DayShiftAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  shifts,
  employees,
  employeeShifts,
  onSaveAssignments
}) => {
  const [assignments, setAssignments] = useState<{[shiftId: string]: string | null}>({});
  const [notes, setNotes] = useState<{[shiftId: string]: string}>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize assignments when modal opens
  useEffect(() => {
    if (isOpen && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const initialAssignments: {[shiftId: string]: string | null} = {};
      const initialNotes: {[shiftId: string]: string} = {};
      
      // Get current assignments for this date
      shifts.forEach(shift => {
        const existingAssignment = employeeShifts.find(es => 
          es.shift_id === shift.id && es.assignment_date === dateString
        );
        
        initialAssignments[shift.id] = existingAssignment?.employee_id || null;
        initialNotes[shift.id] = existingAssignment?.notes || '';
      });
      
      setAssignments(initialAssignments);
      setNotes(initialNotes);
      setHasChanges(false);
    }
  }, [isOpen, selectedDate, shifts, employeeShifts]);

  const updateAssignment = (shiftId: string, employeeId: string | null) => {
    setAssignments(prev => ({ ...prev, [shiftId]: employeeId }));
    setHasChanges(true);
  };

  const updateNotes = (shiftId: string, note: string) => {
    setNotes(prev => ({ ...prev, [shiftId]: note }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    
    const dateString = selectedDate.toISOString().split('T')[0];
    const assignmentsToSave = shifts.map(shift => ({
      shift_id: shift.id,
      employee_id: assignments[shift.id] || null,
      assignment_date: dateString,
      notes: notes[shift.id] || undefined
    }));
    
    onSaveAssignments(assignmentsToSave);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset to original state
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const originalAssignments: {[shiftId: string]: string | null} = {};
      const originalNotes: {[shiftId: string]: string} = {};
      
      shifts.forEach(shift => {
        const existingAssignment = employeeShifts.find(es => 
          es.shift_id === shift.id && es.assignment_date === dateString
        );
        
        originalAssignments[shift.id] = existingAssignment?.employee_id || null;
        originalNotes[shift.id] = existingAssignment?.notes || '';
      });
      
      setAssignments(originalAssignments);
      setNotes(originalNotes);
      setHasChanges(false);
    }
  };

  const getShiftTypeColor = (type: Shift['type']) => {
    switch (type) {
      case 'morning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'evening': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'full': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getShiftTypeLabel = (type: Shift['type']) => {
    switch (type) {
      case 'morning': return 'صباحية';
      case 'evening': return 'مسائية';
      case 'full': return 'كاملة';
      default: return type;
    }
  };

  const getShiftTypeIcon = (type: Shift['type']) => {
    switch (type) {
      case 'morning': return '🌅';
      case 'evening': return '🌆';
      case 'full': return '🌞';
      default: return '🕐';
    }
  };

  const getEmployeeRole = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير عام';
      case 'manager': return 'مدير فرع';
      case 'reception': return 'استقبال';
      case 'employee': return 'موظف';
      default: return role;
    }
  };

  const getEmployeeRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'reception': return 'bg-green-100 text-green-800';
      case 'employee': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('ar-EG', { weekday: 'long' });
  };

  const isShiftActiveOnDay = (shift: Shift, date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return shift.days_of_week.includes(dayOfWeek);
  };

  // Filter shifts that are active on the selected day
  const availableShifts = shifts.filter(shift => 
    shift.is_active && selectedDate && isShiftActiveOnDay(shift, selectedDate)
  );

  const getAssignedCount = () => {
    return Object.values(assignments).filter(assignedId => assignedId !== null).length;
  };

  const getUnassignedCount = () => {
    return availableShifts.length - getAssignedCount();
  };

  if (!isOpen || !selectedDate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-3">
                إدارة ورديات يوم {formatDateOnly(selectedDate.toISOString())} ({getDayName(selectedDate)})
              </span>
              <Calendar className="h-6 w-6 text-blue-600" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{availableShifts.length}</div>
              <p className="text-sm text-blue-600">ورديات متاحة</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">{getAssignedCount()}</div>
              <p className="text-sm text-green-600">معينة</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{getUnassignedCount()}</div>
              <p className="text-sm text-orange-600">غير معينة</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{employees.length}</div>
              <p className="text-sm text-purple-600">موظفين متاحين</p>
            </div>
          </div>

          {/* Shifts Grid */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-right text-gray-800 mb-4">الورديات المتاحة لهذا اليوم:</h4>
            
            {availableShifts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {availableShifts.map((shift) => {
                  const assignedEmployeeId = assignments[shift.id];
                  const assignedEmployee = assignedEmployeeId ? employees.find(e => e.id === assignedEmployeeId) : null;
                  
                  return (
                    <Card key={shift.id} className={`border-2 ${getShiftTypeColor(shift.type)} transition-all hover:shadow-md`}>
                      <CardHeader className="pb-3">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-2">
                            <Badge className={getShiftTypeColor(shift.type)}>
                              <span className="mr-1">{getShiftTypeIcon(shift.type)}</span>
                              {getShiftTypeLabel(shift.type)}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{shift.name}</CardTitle>
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <span className="text-lg font-medium text-gray-700">
                              {formatTimeOnly(shift.start_time)} - {formatTimeOnly(shift.end_time)}
                            </span>
                            <Clock className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Current Assignment Display */}
                          {assignedEmployee ? (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <UserCheck className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">معين حالياً</span>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-green-800 text-lg">{assignedEmployee.name}</p>
                                <Badge className={getEmployeeRoleColor(assignedEmployee.role)}>
                                  {getEmployeeRole(assignedEmployee.role)}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-center gap-2">
                                <UserX className="h-5 w-5 text-gray-500" />
                                <span className="text-gray-600">غير معين</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Employee Selection */}
                          <div>
                            <label htmlFor={`employee-${shift.id}`} className="text-right block mb-2 font-medium text-gray-700">
                              تعيين موظف:
                            </label>
                            <select
                              id={`employee-${shift.id}`}
                              value={assignments[shift.id] || ''}
                              onChange={(e) => updateAssignment(shift.id, e.target.value || null)}
                              className="w-full p-3 border border-gray-300 rounded-md text-right bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">لا أحد</option>
                              {employees.map(employee => {
                                // Check if this employee is already assigned to another shift on this day
                                const isAlreadyAssigned = Object.entries(assignments).some(([otherShiftId, assignedId]) => 
                                  otherShiftId !== shift.id && assignedId === employee.id
                                );
                                
                                return (
                                  <option 
                                    key={employee.id} 
                                    value={employee.id}
                                    disabled={isAlreadyAssigned}
                                  >
                                    {employee.name} ({getEmployeeRole(employee.role)})
                                    {isAlreadyAssigned ? ' - معين لوردية أخرى' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          
                          {/* Notes */}
                          <div>
                            <label htmlFor={`notes-${shift.id}`} className="text-right block mb-2 font-medium text-gray-700">
                              ملاحظات:
                            </label>
                            <textarea
                              id={`notes-${shift.id}`}
                              value={notes[shift.id] || ''}
                              onChange={(e) => updateNotes(shift.id, e.target.value)}
                              placeholder="ملاحظات اختيارية"
                              rows={2}
                              className="w-full p-2 border border-gray-300 rounded-md text-right resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ورديات متاحة</h3>
                <p className="text-gray-500 mb-4">
                  لا توجد ورديات مجدولة لهذا اليوم ({getDayName(selectedDate)})
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto">
                  <p className="text-sm text-blue-800 text-right">
                    💡 <strong>نصيحة:</strong> تأكد من أن الورديات مضبوطة على أيام الأسبوع المناسبة في تبويب "الورديات"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Assignment Summary */}
          {availableShifts.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mb-6">
              <CardHeader>
                <CardTitle className="text-right text-blue-800">ملخص التعيينات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assigned Shifts */}
                  <div>
                    <h5 className="font-semibold text-green-800 text-right mb-3">
                      <CheckCircle className="h-4 w-4 inline mr-1" />
                      الورديات المعينة ({getAssignedCount()}):
                    </h5>
                    <div className="space-y-2">
                      {shifts.filter(shift => assignments[shift.id]).map(shift => {
                        const employee = employees.find(e => e.id === assignments[shift.id]);
                        return (
                          <div key={shift.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                {employee?.name}
                              </Badge>
                              <span className="text-sm text-green-600">
                                ({getEmployeeRole(employee?.role || '')})
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-800">{shift.name}</p>
                              <p className="text-sm text-green-600">
                                {formatTimeOnly(shift.start_time)} - {formatTimeOnly(shift.end_time)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {getAssignedCount() === 0 && (
                        <p className="text-center text-gray-500 italic py-4">لا توجد ورديات معينة</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Unassigned Shifts */}
                  <div>
                    <h5 className="font-semibold text-orange-800 text-right mb-3">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      الورديات غير المعينة ({getUnassignedCount()}):
                    </h5>
                    <div className="space-y-2">
                      {shifts.filter(shift => !assignments[shift.id]).map(shift => (
                        <div key={shift.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2">
                            <UserX className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-600">بحاجة لموظف</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-orange-800">{shift.name}</p>
                            <p className="text-sm text-orange-600">
                              {formatTimeOnly(shift.start_time)} - {formatTimeOnly(shift.end_time)}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {getUnassignedCount() === 0 && (
                        <div className="text-center p-4">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-green-600 font-medium">جميع الورديات معينة! ✅</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            
            {hasChanges && (
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                إعادة تعيين
              </Button>
            )}
            
            <Button 
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ التعيينات
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-800 text-right mb-2">كيفية الاستخدام:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-1 text-right">
                <p>• اختر موظف لكل وردية من القائمة المنسدلة</p>
                <p>• يمكن ترك الوردية بدون تعيين ("لا أحد")</p>
                <p>• أضف ملاحظات إضافية لكل وردية</p>
              </div>
              <div className="space-y-1 text-right">
                <p>• الموظف لا يمكن تعيينه لأكثر من وردية في نفس اليوم</p>
                <p>• الورديات المعطلة لا تظهر في هذا اليوم</p>
                <p>• اضغط "حفظ" لتطبيق جميع التغييرات</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DayShiftAssignmentModal;