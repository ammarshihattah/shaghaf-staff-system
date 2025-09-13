import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  X, DollarSign, Plus, Minus, User, AlertCircle, 
  CheckCircle, Clock, FileText, Calculator 
} from 'lucide-react';
import { FinancialAdjustment, User as Employee } from '../types';

interface FinancialAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSubmit: (adjustment: Omit<FinancialAdjustment, 'id' | 'created_at' | 'status' | 'processed_date'>) => void;
}

const FinancialAdjustmentModal: React.FC<FinancialAdjustmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    type: 'bonus' as 'bonus' | 'deduction',
    amount: '',
    reason: '',
    notes: ''
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (!formData.reason.trim()) {
      alert('يرجى إدخال سبب التعديل');
      return;
    }

    const adjustmentData = {
      employee_id: employee.id,
      employee_name: employee.name,
      branch_id: employee.branch_id,
      type: formData.type,
      amount,
      reason: formData.reason.trim(),
      notes: formData.notes.trim() || undefined,
      approved_by: 'current-user-id', // This would be the current user's ID
      approved_by_name: 'current-user-name' // This would be the current user's name
    };

    onSubmit(adjustmentData);
    
    // Reset form
    setFormData({
      type: 'bonus',
      amount: '',
      reason: '',
      notes: ''
    });
    setShowPreview(false);
  };

  const handleClose = () => {
    setFormData({
      type: 'bonus',
      amount: '',
      reason: '',
      notes: ''
    });
    setShowPreview(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">إدارة التعديلات المالية</span>
              <Calculator className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Employee Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <p className="font-semibold text-blue-800 text-lg">{employee.name}</p>
                <p className="text-blue-600 text-sm">{employee.email}</p>
                <Badge className="bg-blue-100 text-blue-800 mt-1">
                  {employee.role === 'admin' ? 'مدير عام' : 
                   employee.role === 'manager' ? 'مدير فرع' : 
                   employee.role === 'reception' ? 'استقبال' : 'موظف'}
                </Badge>
              </div>
              <User className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Adjustment Type */}
            <div>
              <Label className="text-right block mb-4 font-semibold text-gray-800">نوع التعديل المالي:</Label>
              <div className="grid grid-cols-2 gap-4">
                <label 
                  className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'bonus' 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <span className="font-semibold text-green-800">بونص / مكافأة</span>
                      <p className="text-sm text-green-600 mt-1">إضافة مبلغ للراتب</p>
                    </div>
                    <input
                      type="radio"
                      name="adjustment_type"
                      value="bonus"
                      checked={formData.type === 'bonus'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'bonus' | 'deduction' })}
                      className="w-5 h-5 text-green-600"
                    />
                  </div>
                </label>
                
                <label 
                  className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'deduction' 
                      ? 'border-red-400 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <Minus className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <span className="font-semibold text-red-800">خصم</span>
                      <p className="text-sm text-red-600 mt-1">خصم مبلغ من الراتب</p>
                    </div>
                    <input
                      type="radio"
                      name="adjustment_type"
                      value="deduction"
                      checked={formData.type === 'deduction'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'bonus' | 'deduction' })}
                      className="w-5 h-5 text-red-600"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount" className="text-right block mb-2">المبلغ (ج.م) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="text-right text-lg"
              />
              <p className="text-sm text-gray-500 text-right mt-1">
                المبلغ بالجنيه المصري
              </p>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="reason" className="text-right block mb-2">سبب التعديل *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={formData.type === 'bonus' ? 'مثال: مكافأة الأداء المتميز' : 'مثال: خصم التأخير'}
                required
                className="text-right"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="notes" className="text-right block mb-2">ملاحظات إضافية</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات أو تفاصيل إضافية حول التعديل"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md text-right resize-none"
              />
            </div>

            {/* Preview */}
            {formData.amount && formData.reason && (
              <div className={`p-4 rounded-lg border-2 ${
                formData.type === 'bonus' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`font-semibold text-right mb-3 ${
                  formData.type === 'bonus' ? 'text-green-800' : 'text-red-800'
                }`}>
                  <CheckCircle className="h-5 w-5 inline mr-2" />
                  معاينة التعديل:
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-right">
                    <span className={`text-xl font-bold ${
                      formData.type === 'bonus' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formData.type === 'bonus' ? '+' : '-'}{parseFloat(formData.amount || '0').toFixed(2)} ج.م
                    </span>
                    <span className="text-gray-700">المبلغ:</span>
                  </div>
                  <div className="flex justify-between items-center text-right">
                    <span className="font-medium text-gray-800">{formData.reason}</span>
                    <span className="text-gray-700">السبب:</span>
                  </div>
                  <div className="flex justify-between items-center text-right">
                    <span className="font-medium text-gray-800">{employee.name}</span>
                    <span className="text-gray-700">الموظف:</span>
                  </div>
                </div>
                
                <div className={`mt-3 p-3 rounded-lg border ${
                  formData.type === 'bonus' 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-red-100 border-red-300'
                }`}>
                  <p className={`text-sm text-right font-medium ${
                    formData.type === 'bonus' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    📧 سيتم إرسال إشعار للموظف بالتعديل المالي
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button 
                type="submit"
                className={
                  formData.type === 'bonus' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }
                disabled={!formData.amount || !formData.reason}
              >
                {formData.type === 'bonus' ? (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    تطبيق البونص
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 mr-2" />
                    تطبيق الخصم
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialAdjustmentModal;