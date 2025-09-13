import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  X, CreditCard, Wallet, Banknote, Calculator, Clock, Users, 
  Package, Briefcase, Gift 
} from 'lucide-react';
import { Invoice, InvoiceItem, PaymentMethod } from '../types';
import { formatDateTimeDetailed } from '../lib/utils';
interface PaymentModalProps {
  invoice: Invoice;
  sessionDurationSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (invoice: Invoice) => void;
  isViewMode?: boolean; // New prop for view-only mode
  userRole?: string; // User role for permissions
  onInvoiceUpdate?: (invoice: Invoice) => void; // Callback for invoice updates
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  invoice, 
  sessionDurationSeconds, 
  isOpen, 
  onClose, 
  onPaymentSuccess,
  isViewMode = false, // Default to false
  userRole,
  onInvoiceUpdate
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [editableInvoice, setEditableInvoice] = useState<Invoice>(invoice);

  // Reset edit mode when modal opens/closes or invoice changes
  useEffect(() => {
    setIsEditMode(false);
    setDiscountAmount('');
    setDiscountReason('');
    setEditableInvoice(invoice);
  }, [isOpen, invoice.id]);

  const [paymentFormData, setPaymentFormData] = useState({
    cash_amount: '',
    visa_amount: '',
    wallet_amount: '',
    remaining_balance_action: 'none' as 'none' | 'account_credit' | 'tips',
    transaction_id: '',
    notes: ''
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTimeDetailed = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG');
  };

  const getTotalAmount = () => {
    return isEditMode ? editableInvoice.total_amount : invoice.total_amount;
  };

  const getTotalPaying = () => {
    const cash = parseFloat(paymentFormData.cash_amount) || 0;
    const visa = parseFloat(paymentFormData.visa_amount) || 0;
    const wallet = parseFloat(paymentFormData.wallet_amount) || 0;
    return cash + visa + wallet;
  };

  const getRemainingBalance = () => {
    return getTotalAmount() - getTotalPaying();
  };

  const getItemIcon = (itemType: string, itemName?: string) => {
    if (itemType === 'service') return <Briefcase className="h-4 w-4 text-blue-600" />;
    
    const name = itemName?.toLowerCase() || '';
    if (name.includes('قهوة') || name.includes('coffee')) return <span className="text-amber-600">☕</span>;
    if (name.includes('طعام') || name.includes('أكل') || name.includes('sandwich')) return <span className="text-green-600">🍽️</span>;
    
    return <Package className="h-4 w-4 text-purple-600" />;
  };

  const applyDiscount = () => {
    const discount = parseFloat(discountAmount);
    if (isNaN(discount) || discount <= 0) {
      alert('يرجى إدخال قيمة خصم صحيحة');
      return;
    }

    if (discount >= editableInvoice.total_amount) {
      alert('قيمة الخصم لا يمكن أن تكون أكبر من أو تساوي إجمالي الفاتورة');
      return;
    }

    // Create discount item
    const discountItem: InvoiceItem = {
      id: `discount-${Date.now()}`,
      invoice_id: editableInvoice.id,
      item_type: 'service',
      name: `خصم إداري - ${discountReason || 'خصم عام'}`,
      quantity: 1,
      unit_price: -discount,
      total_price: -discount,
      created_at: new Date().toISOString()
    };

    // Update editable invoice
    const updatedItems = [...(editableInvoice.items || []), discountItem];
    const newTotalAmount = editableInvoice.total_amount - discount;

    const updatedInvoice: Invoice = {
      ...editableInvoice,
      items: updatedItems,
      amount: editableInvoice.amount - discount,
      total_amount: newTotalAmount
    };

    setEditableInvoice(updatedInvoice);
    setDiscountAmount('');
    setDiscountReason('');
  };

  const saveInvoiceChanges = () => {
    if (onInvoiceUpdate) {
      onInvoiceUpdate(editableInvoice);
    }
    setIsEditMode(false);
    alert('تم حفظ التعديلات بنجاح');
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setEditableInvoice(invoice);
    setDiscountAmount('');
    setDiscountReason('');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cashAmount = parseFloat(paymentFormData.cash_amount) || 0;
    const visaAmount = parseFloat(paymentFormData.visa_amount) || 0;
    const walletAmount = parseFloat(paymentFormData.wallet_amount) || 0;
    const totalPaid = cashAmount + visaAmount + walletAmount;
    const totalAmount = getTotalAmount();

    if (totalPaid === 0) {
      alert('يجب إدخال مبلغ للدفع');
      return;
    }

    // Create payment methods array
    const paymentMethods: PaymentMethod[] = [];
    
    if (cashAmount > 0) {
      paymentMethods.push({
        id: `${invoice.id}-${Date.now()}-cash`,
        invoice_id: invoice.id,
        method: 'cash',
        amount: cashAmount,
        notes: paymentFormData.notes,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }

    if (visaAmount > 0) {
      paymentMethods.push({
        id: `${invoice.id}-${Date.now()}-visa`,
        invoice_id: invoice.id,
        method: 'visa',
        amount: visaAmount,
        transaction_id: paymentFormData.transaction_id,
        notes: paymentFormData.notes,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }

    if (walletAmount > 0) {
      paymentMethods.push({
        id: `${invoice.id}-${Date.now()}-wallet`,
        invoice_id: invoice.id,
        method: 'wallet',
        amount: walletAmount,
        transaction_id: paymentFormData.transaction_id,
        notes: paymentFormData.notes,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }

    // Determine payment status
    const remainingBalance = totalAmount - totalPaid;
    let paymentStatus: Invoice['payment_status'] = 'pending';
    let invoiceStatus: Invoice['status'] = 'pending';

    if (remainingBalance <= 0) {
      invoiceStatus = 'paid';
      paymentStatus = remainingBalance < 0 ? 'overpaid' : 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    }

    // Update existing invoice with payment information
    const updatedInvoice: Invoice = {
      ...invoice,
      status: invoiceStatus,
      payment_status: paymentStatus,
      remaining_balance_action: remainingBalance < 0 ? paymentFormData.remaining_balance_action : 'none',
      paid_date: invoiceStatus === 'paid' ? new Date().toISOString() : undefined,
      payment_methods: [...(invoice.payment_methods || []), ...paymentMethods]
    };

    onPaymentSuccess(updatedInvoice);
  };

  const getTimeCostFromItems = () => {
    return (invoice.items || [])
      .filter(item => item.item_type === 'time_entry')
      .reduce((sum, item) => sum + item.total_price, 0);
  };

  const getProductServiceCost = () => {
    return (invoice.items || [])
      .filter(item => item.item_type === 'product' || item.item_type === 'service')
      .reduce((sum, item) => sum + item.total_price, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              {/* Edit button for managers in view mode */}
              {isViewMode && !isEditMode && (userRole === 'admin' || userRole === 'manager') && (
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  تعديل وخصم
                </Button>
              )}
              <CardTitle className="text-right">
                {isEditMode ? 'تعديل الفاتورة وتطبيق خصم' : 
                 isViewMode ? 'تفاصيل الفاتورة' : 'إنهاء الجلسة والدفع'}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Session Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 text-right mb-4">ملخص الجلسة</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold text-blue-800">{formatTime(sessionDurationSeconds || 0)}</div>
                <p className="text-sm text-blue-600">مدة الجلسة</p>
              </div>
              
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold text-green-800">{1}</div>
                <p className="text-sm text-green-600">عدد الأشخاص</p>
              </div>
              
              <div className="text-center">
                <Calculator className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold text-purple-800">{getTimeCostFromItems()} ج.م</div>
                <p className="text-sm text-purple-600">تكلفة الوقت</p>
              </div>
              
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <div className="text-lg font-bold text-orange-800">{getProductServiceCost().toFixed(2)} ج.م</div>
                <p className="text-sm text-orange-600">المنتجات/الخدمات</p>
              </div>
            </div>
          </div>

          {/* Invoice Items Preview */}
          <div className="mb-6">
            <h4 className="font-semibold text-right mb-4">بنود الفاتورة:</h4>
            <div className="space-y-2">
              {/* Time Entry */}
              {(isEditMode ? editableInvoice.items : invoice.items || [])
                .filter(item => item.item_type === 'time_entry')
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">{item.total_price.toFixed(2)} ج.م</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.name || 'استخدام المساحة المشتركة'}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} شخص × {formatTime(sessionDurationSeconds || 0)}
                      </p>
                    </div>
                  </div>
                ))}

              {/* Session Items */}
              {(isEditMode ? editableInvoice.items : invoice.items || [])
                .filter(item => item.item_type !== 'time_entry')
                .map((item) => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${
                  item.total_price < 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {item.total_price < 0 ? (
                      <span className="text-red-600">💰</span>
                    ) : (
                      getItemIcon(item.item_type, item.name)
                    )}
                    <span className={`font-semibold ${item.total_price < 0 ? 'text-red-600' : ''}`}>
                      {item.total_price.toFixed(2)} ج.م
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {item.unit_price} ج.م
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center text-right">
              <span className="text-3xl font-bold text-green-800">{getTotalAmount().toFixed(2)} ج.م</span>
              <span className="text-xl font-semibold text-green-600">المبلغ الإجمالي:</span>
            </div>
          </div>

          {/* Discount Section for Managers in Edit Mode */}
          {isEditMode && (userRole === 'admin' || userRole === 'manager') && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 text-right mb-4">
                💰 تطبيق خصم إداري:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discount-amount" className="text-right block mb-2">قيمة الخصم (ج.م)</Label>
                  <Input
                    id="discount-amount"
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount-reason" className="text-right block mb-2">سبب الخصم</Label>
                  <Input
                    id="discount-reason"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="سبب الخصم (اختياري)"
                    className="text-right"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={applyDiscount}
                    disabled={!discountAmount || parseFloat(discountAmount) <= 0}
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                  >
                    تطبيق الخصم
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                <p className="text-xs text-yellow-700 text-right">
                  ⚠️ الخصم الإداري يتطلب تصريح من المدير. سيتم تسجيل هذا الإجراء في النظام.
                </p>
              </div>
            </div>
          )}

          {/* Edit Mode Action Buttons */}
          {isEditMode && (
            <div className="mb-6 flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={cancelEdit}>
                إلغاء التعديل
              </Button>
              <Button 
                type="button" 
                onClick={saveInvoiceChanges}
                className="bg-green-600 hover:bg-green-700"
              >
                حفظ التعديلات
              </Button>
            </div>
          )}

          {/* Payment Form */}
          {!isEditMode && (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div>
              <h4 className="font-semibold text-right mb-4">طرق الدفع:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <Label htmlFor="cash-amount" className="text-right block mb-2 flex items-center justify-end">
                    <span className="mr-2">كاش (ج.م)</span>
                    <Banknote className="h-5 w-5 text-green-600" />
                  </Label>
                  <Input
                    id="cash-amount"
                    type="number"
                    step="0.01"
                    value={paymentFormData.cash_amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, cash_amount: e.target.value })}
                    placeholder="0.00"
                    className="text-right text-lg"
                    readOnly={isViewMode}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Label htmlFor="visa-amount" className="text-right block mb-2 flex items-center justify-end">
                    <span className="mr-2">فيزا (ج.م)</span>
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </Label>
                  <Input
                    id="visa-amount"
                    type="number"
                    step="0.01"
                    value={paymentFormData.visa_amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, visa_amount: e.target.value })}
                    placeholder="0.00"
                    className="text-right text-lg"
                    readOnly={isViewMode}
                  />
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <Label htmlFor="wallet-amount" className="text-right block mb-2 flex items-center justify-end">
                    <span className="mr-2">محفظة (ج.م)</span>
                    <Wallet className="h-5 w-5 text-purple-600" />
                  </Label>
                  <Input
                    id="wallet-amount"
                    type="number"
                    step="0.01"
                    value={paymentFormData.wallet_amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, wallet_amount: e.target.value })}
                    placeholder="0.00"
                    className="text-right text-lg"
                    readOnly={isViewMode}
                  />
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-800">{getTotalAmount().toFixed(2)} ج.م</div>
                  <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">{getTotalPaying().toFixed(2)} ج.م</div>
                  <p className="text-sm text-gray-600">المدفوع</p>
                </div>
                <div>
                  <div className={`text-lg font-semibold ${getRemainingBalance() > 0 ? 'text-red-600' : getRemainingBalance() < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {getRemainingBalance().toFixed(2)} ج.م
                  </div>
                  <p className="text-sm text-gray-600">
                    {getRemainingBalance() > 0 ? 'المتبقي' : getRemainingBalance() < 0 ? 'الزائد' : 'مدفوع بالكامل'}
                  </p>
                </div>
              </div>
            </div>

            {/* Remaining Balance Action */}
            {!isViewMode && getRemainingBalance() !== 0 && (
              <>
                <div>
                  <Label htmlFor="remaining-action" className="text-right block mb-2">
                    التعامل مع {getRemainingBalance() > 0 ? 'المبلغ المتبقي' : 'المبلغ الزائد'}:
                  </Label>
                  <select
                    id="remaining-action"
                    value={paymentFormData.remaining_balance_action}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, remaining_balance_action: e.target.value as any })}
                    className="w-full p-3 border border-gray-300 rounded-md text-right bg-white"
                  >
                    <option value="none">
                      {getRemainingBalance() > 0 ? '📄 لا شيء (العميل سيدفع لاحقاً)' : '💰 إرجاع الباقي للعميل'}
                    </option>
                    <option value="account_credit">💳 رصيد في حساب العميل</option>
                    <option value="tips">🎁 إكرامية للموظفين</option>
                  </select>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    {paymentFormData.remaining_balance_action === 'none' && getRemainingBalance() > 0 && 'سيبقى المبلغ كدين على العميل'}
                    {paymentFormData.remaining_balance_action === 'none' && getRemainingBalance() < 0 && 'سيتم إرجاع المبلغ الزائد للعميل نقداً'}
                    {paymentFormData.remaining_balance_action === 'account_credit' && 'سيتم إضافة المبلغ كرصيد في حساب العميل للاستخدام المستقبلي'}
                    {paymentFormData.remaining_balance_action === 'tips' && 'سيتم توزيع المبلغ كإكرامية على الموظفين'}
                  </p>
                </div>
              </>
            )}

            {/* Display existing payment methods if in view mode */}
            {isViewMode && invoice.payment_methods && invoice.payment_methods.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-right mb-4">طرق السداد:</h4>
                <div className="space-y-3">
                  {invoice.payment_methods.map((pm, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {pm.method === 'cash' && <Banknote className="h-4 w-4 text-green-600" />}
                        {pm.method === 'visa' && <CreditCard className="h-4 w-4 text-blue-600" />}
                        {pm.method === 'wallet' && <Wallet className="h-4 w-4 text-purple-600" />}
                        <span className="font-semibold">{pm.amount.toFixed(2)} ج.م</span>
                        {pm.transaction_id && <span className="text-xs text-gray-500">#{pm.transaction_id}</span>}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {pm.method === 'cash' ? 'نقدي' : pm.method === 'visa' ? 'فيزا' : 'محفظة'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTimeDetailed(pm.processed_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Payment Details */}
            {!isViewMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction-id" className="text-right block mb-2">رقم المعاملة (للدفع الإلكتروني)</Label>
                  <Input
                    id="transaction-id"
                    value={paymentFormData.transaction_id}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, transaction_id: e.target.value })}
                    placeholder="رقم المعاملة للفيزا/المحفظة"
                    className="text-right"
                    readOnly={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="payment-notes" className="text-right block mb-2">ملاحظات الدفع</Label>
                  <Input
                    id="payment-notes"
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية"
                    className="text-right"
                    readOnly={isViewMode}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              {!isViewMode && (
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-lg px-8"
                  disabled={getTotalPaying() === 0}
                >
                  <Gift className="h-5 w-5 mr-2" />
                  تسجيل الدفع وإنهاء الجلسة
                </Button>
              )}
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;