import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, FileText, DollarSign, TrendingUp, TrendingDown, 
  User, Calendar, Building2, Phone, Mail, Calculator,
  CheckCircle, AlertCircle, Banknote, CreditCard
} from 'lucide-react';
import { User as Employee, FinancialAdjustment } from '../types';
import { formatDateOnly, formatCurrency } from '../lib/utils';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  adjustments: FinancialAdjustment[];
  selectedMonth?: string; // YYYY-MM format
}

const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  employee,
  adjustments,
  selectedMonth
}) => {
  if (!isOpen || !employee) return null;

  const currentMonth = selectedMonth || new Date().toISOString().slice(0, 7);
  const monthName = new Date(currentMonth + '-01').toLocaleDateString('ar-EG', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Filter adjustments for the selected month
  const monthAdjustments = adjustments.filter(adj => 
    adj.employee_id === employee.id &&
    adj.status === 'approved' &&
    adj.created_at.slice(0, 7) === currentMonth
  );

  // Calculate totals
  const basicSalary = employee.salary || 0;
  const totalBonuses = monthAdjustments
    .filter(adj => adj.type === 'bonus')
    .reduce((sum, adj) => sum + adj.amount, 0);
  const totalDeductions = monthAdjustments
    .filter(adj => adj.type === 'deduction')
    .reduce((sum, adj) => sum + adj.amount, 0);
  const netSalary = basicSalary + totalBonuses - totalDeductions;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير عام';
      case 'manager': return 'مدير فرع';
      case 'reception': return 'موظف استقبال';
      case 'employee': return 'موظف';
      default: return role;
    }
  };

  const printPayslip = () => {
    const printContent = document.getElementById('payslip-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html dir="rtl" lang="ar">
            <head>
              <title>كشف مرتب - ${employee.name}</title>
              <style>
                body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .section { margin: 20px 0; }
                .total { background-color: #f0f9ff; padding: 15px; border-radius: 8px; border: 2px solid #0ea5e9; }
                .adjustment { padding: 10px; margin: 5px 0; border-radius: 5px; }
                .bonus { background-color: #f0fdf4; border: 1px solid #16a34a; }
                .deduction { background-color: #fef2f2; border: 1px solid #dc2626; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: right; }
                th { background-color: #f9fafb; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={printPayslip}>
                <FileText className="h-4 w-4 mr-2" />
                طباعة
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-right">
                كشف مرتب - {monthName}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div id="payslip-content">
            {/* Header Section */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-blue-800">شغف للعمل المشترك</h1>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">كشف مرتب شهر {monthName}</h2>
              <p className="text-gray-600">تاريخ الإصدار: {formatDateOnly(new Date().toISOString())}</p>
            </div>

            {/* Employee Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <User className="h-5 w-5 text-blue-600 ml-2" />
                  بيانات الموظف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{employee.name}</span>
                      <span className="text-gray-500">الاسم:</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{employee.email}</span>
                      <span className="text-gray-500">البريد الإلكتروني:</span>
                    </div>
                    
                    {employee.username && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{employee.username}</span>
                        <span className="text-gray-500">اسم المستخدم:</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-blue-100 text-blue-800">
                        {getRoleLabel(employee.role)}
                      </Badge>
                      <span className="text-gray-500">الوظيفة:</span>
                    </div>
                    
                    {employee.phone && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium" dir="ltr">{employee.phone}</span>
                        <span className="text-gray-500">الهاتف:</span>
                      </div>
                    )}
                    
                    {employee.hire_date && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{formatDateOnly(employee.hire_date)}</span>
                        <span className="text-gray-500">تاريخ التعيين:</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Breakdown */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <Calculator className="h-5 w-5 text-green-600 ml-2" />
                  تفصيل المرتب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Basic Salary */}
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                      <span className="text-xl font-bold text-gray-800">{basicSalary.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <span className="text-gray-700 font-medium">الراتب الأساسي:</span>
                  </div>

                  {/* Bonuses */}
                  {totalBonuses > 0 && (
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-xl font-bold text-green-700">+{totalBonuses.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                      <span className="text-green-700 font-medium">إجمالي البونصات:</span>
                    </div>
                  )}

                  {/* Deductions */}
                  {totalDeductions > 0 && (
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <span className="text-xl font-bold text-red-700">-{totalDeductions.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                      <span className="text-red-700 font-medium">إجمالي الخصومات:</span>
                    </div>
                  )}

                  {/* Net Salary */}
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-6 w-6 text-blue-600" />
                      <span className="text-3xl font-bold text-blue-800">{netSalary.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <span className="text-blue-800 font-bold text-xl">صافي المرتب:</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adjustments Details */}
            {monthAdjustments.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-right flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 ml-2" />
                    تفاصيل التعديلات المالية ({monthAdjustments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthAdjustments.map((adjustment) => (
                      <div 
                        key={adjustment.id} 
                        className={`p-4 rounded-lg border-2 ${
                          adjustment.type === 'bonus' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {adjustment.type === 'bonus' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-lg font-bold ${
                              adjustment.type === 'bonus' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {adjustment.type === 'bonus' ? '+' : '-'}{adjustment.amount.toFixed(2)} ج.م
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <Badge className={
                              adjustment.type === 'bonus' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }>
                              {adjustment.type === 'bonus' ? 'بونص' : 'خصم'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">السبب:</p>
                            <p className="font-medium text-gray-800">{adjustment.reason}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-500">التاريخ:</p>
                            <p className="font-medium text-gray-800">{formatDateOnly(adjustment.created_at)}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-500">مطبق بواسطة:</p>
                            <p className="font-medium text-gray-800">{adjustment.approved_by_name}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-500">الحالة:</p>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              مطبق
                            </Badge>
                          </div>
                        </div>
                        
                        {adjustment.notes && (
                          <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-700 text-right">
                              <strong>ملاحظات:</strong> {adjustment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Table */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-right">ملخص مالي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-right font-semibold">المبلغ (ج.م)</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold">البيان</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-3 font-medium">{basicSalary.toLocaleString('ar-EG')}</td>
                        <td className="border border-gray-300 p-3">الراتب الأساسي</td>
                      </tr>
                      
                      {totalBonuses > 0 && (
                        <tr className="bg-green-50">
                          <td className="border border-gray-300 p-3 font-medium text-green-700">+{totalBonuses.toLocaleString('ar-EG')}</td>
                          <td className="border border-gray-300 p-3 text-green-700">البونصات والحوافز</td>
                        </tr>
                      )}
                      
                      {totalDeductions > 0 && (
                        <tr className="bg-red-50">
                          <td className="border border-gray-300 p-3 font-medium text-red-700">-{totalDeductions.toLocaleString('ar-EG')}</td>
                          <td className="border border-gray-300 p-3 text-red-700">الخصومات</td>
                        </tr>
                      )}
                      
                      <tr className="bg-blue-100 border-t-2 border-blue-300">
                        <td className="border border-gray-300 p-4 text-xl font-bold text-blue-800">{netSalary.toLocaleString('ar-EG')}</td>
                        <td className="border border-gray-300 p-4 text-xl font-bold text-blue-800">صافي المرتب</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">ملاحظات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-right text-sm text-gray-600">
                    <p>• تم احتساب جميع التعديلات المالية المطبقة خلال الشهر</p>
                    <p>• البونصات والخصومات مطبقة حسب موافقات الإدارة</p>
                    <p>• يحق للموظف الاستعلام عن أي بند في كشف المرتب</p>
                    {monthAdjustments.length === 0 && (
                      <p>• لا توجد تعديلات مالية لهذا الشهر</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">التوقيعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-2">توقيع الموظف:</p>
                      <div className="h-16 border-b-2 border-gray-300"></div>
                      <p className="text-xs text-gray-400 mt-1">{employee.name}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-2">توقيع المسؤول المالي:</p>
                      <div className="h-16 border-b-2 border-gray-300"></div>
                      <p className="text-xs text-gray-400 mt-1">قسم الموارد البشرية</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>نظام شغف للعمل المشترك - إدارة الموارد البشرية</p>
              <p>تم إنشاء هذا الكشف تلقائياً في {formatDateOnly(new Date().toISOString())}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 mt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            <Button onClick={printPayslip} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="h-4 w-4 mr-2" />
              طباعة كشف المرتب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayslipModal;