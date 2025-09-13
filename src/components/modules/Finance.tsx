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
  Plus, Receipt, DollarSign, CreditCard, TrendingUp, TrendingDown,
  Calendar, User, FileText, CheckCircle, X, AlertTriangle, Clock,
  Building2, Filter, Search, Download, Printer, Eye
} from 'lucide-react';
import { Invoice, PaymentMethod } from '../../types';
import { formatDateOnly, formatDateTimeDetailed, formatCurrency } from '../../lib/utils';
import PaymentModal from '../PaymentModal';

const Finance: React.FC = () => {
  const { user } = useAuth();
  
  // Data from localStorage with better initial state handling
  const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [allExpenses, setAllExpenses] = useLocalStorage('expenses', []);
  
  // Filter by branch with null safety
  const invoices = Array.isArray(allInvoices) ? allInvoices.filter(invoice => invoice?.branch_id === user?.branch_id) : [];
  const expenses = Array.isArray(allExpenses) ? allExpenses.filter(expense => expense?.branch_id === user?.branch_id) : [];

  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'expenses' | 'payments'>('overview');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [invoiceFormData, setInvoiceFormData] = useState({
    client_id: '',
    amount: '',
    tax_amount: '',
    due_date: '',
    notes: ''
  });

  const [expenseFormData, setExpenseFormData] = useState({
    category: '',
    description: '',
    customDescription: '',
    amount: '',
    expense_date: '',
    receipt_url: ''
  });

  // Financial data state with better error handling
  const [financialData, setFinancialData] = useState({
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    booking_revenue: 0,
    membership_revenue: 0,
    product_revenue: 0,
    room_utilization: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load financial data with proper error handling
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getFinancialSummary(user?.branch_id);
      setFinancialData(response || {
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        booking_revenue: 0,
        membership_revenue: 0,
        product_revenue: 0,
        room_utilization: 0
      });
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Backend server not available');
      // Use fallback data
      setFinancialData({
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        booking_revenue: 0,
        membership_revenue: 0,
        product_revenue: 0,
        room_utilization: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.branch_id]);

  // Statistics with null safety
  const financeStats = React.useMemo(() => {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
    return {
      totalInvoices: safeInvoices.length,
      paidInvoices: safeInvoices.filter(inv => inv?.status === 'paid').length,
      pendingInvoices: safeInvoices.filter(inv => inv?.status === 'pending').length,
      overdueInvoices: safeInvoices.filter(inv => 
        inv?.status === 'pending' && inv?.due_date && new Date(inv.due_date) < new Date()
      ).length,
      totalInvoiceAmount: safeInvoices.reduce((sum, inv) => sum + (inv?.total_amount || 0), 0),
      totalExpenses: safeExpenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0),
      netProfit: safeInvoices.reduce((sum, inv) => sum + (inv?.total_amount || 0), 0) - 
                 safeExpenses.reduce((sum, exp) => sum + (exp?.amount || 0), 0)
    };
  }, [invoices, expenses]);

  // Filter invoices with null safety
  const filteredInvoices = React.useMemo(() => {
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    
    return safeInvoices.filter(invoice => {
      if (!invoice) return false;
      
      // Status filter
      if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;
      
      // Date filter
      if (dateFilter.start && invoice.created_at) {
        const invoiceDate = new Date(invoice.created_at);
        const startDate = new Date(dateFilter.start);
        if (invoiceDate < startDate) return false;
      }
      
      if (dateFilter.end && invoice.created_at) {
        const invoiceDate = new Date(invoice.created_at);
        const endDate = new Date(dateFilter.end);
        if (invoiceDate > endDate) return false;
      }
      
      // Search filter
      if (searchTerm && invoice.invoice_number) {
        const searchLower = searchTerm.toLowerCase();
        const matchesNumber = invoice.invoice_number.toLowerCase().includes(searchLower);
        const matchesClient = invoice.client?.name?.toLowerCase().includes(searchLower) || false;
        if (!matchesNumber && !matchesClient) return false;
      }
      
      return true;
    });
  }, [invoices, statusFilter, dateFilter, searchTerm]);

  // Handle invoice form submission
  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(invoiceFormData.amount);
    const taxAmount = parseFloat(invoiceFormData.tax_amount) || 0;
    
    if (isNaN(amount) || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    const invoiceData = {
      ...invoiceFormData,
      amount,
      tax_amount: taxAmount,
      total_amount: amount + taxAmount
    };

    if (editingInvoice) {
      const validAllInvoices = Array.isArray(allInvoices) ? allInvoices : [];
      setAllInvoices(validAllInvoices.map(invoice => 
        invoice?.id === editingInvoice.id 
          ? { ...invoice, ...invoiceData }
          : invoice
      ).filter(Boolean));
    } else {
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        invoice_number: `INV-${Date.now()}`,
        status: 'pending',
        payment_status: 'pending',
        remaining_balance_action: 'none',
        created_at: new Date().toISOString(),
        ...invoiceData,
        items: [],
        payment_methods: []
      };
      
      const validAllInvoices = Array.isArray(allInvoices) ? allInvoices : [];
      setAllInvoices([...validAllInvoices, newInvoice]);
    }
    
    // Reset form
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    setInvoiceFormData({
      client_id: '', amount: '', tax_amount: '', due_date: '', notes: ''
    });
  };

  // Handle expense form submission
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(expenseFormData.amount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    // Use custom description if "اخري" is selected
    const finalDescription = expenseFormData.description === 'اخري' 
      ? expenseFormData.customDescription.trim()
      : expenseFormData.description;

    if (!finalDescription) {
      alert('يرجى إدخال وصف المصروف');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      branch_id: user?.branch_id || '1',
      ...expenseFormData,
      description: finalDescription,
      amount,
      created_by: user?.id || '1',
      created_by_name: user?.name || 'مستخدم',
      created_at: new Date().toISOString()
    };
    
    const validAllExpenses = Array.isArray(allExpenses) ? allExpenses : [];
    setAllExpenses([...validAllExpenses, newExpense]);
    
    // Reset form
    setShowExpenseForm(false);
    setExpenseFormData({
      category: '', description: '', customDescription: '', amount: '', expense_date: '', receipt_url: ''
    });
  };

  // Handle payment success
  const handlePaymentSuccess = (updatedInvoice: Invoice) => {
    const validAllInvoices = Array.isArray(allInvoices) ? allInvoices : [];
    setAllInvoices(validAllInvoices.map(inv => 
      inv?.id === updatedInvoice.id ? updatedInvoice : inv
    ).filter(Boolean));
    
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
  };

  // Get status color with null safety
  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label with null safety
  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'غير محدد';
    
    switch (status) {
      case 'paid': return 'مدفوع';
      case 'pending': return 'معلق';
      case 'overdue': return 'متأخر';
      default: return status;
    }
  };

  // Get payment status color with null safety
  const getPaymentStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overpaid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment status label with null safety
  const getPaymentStatusLabel = (status: string | undefined) => {
    if (!status) return 'غير محدد';
    
    switch (status) {
      case 'paid': return 'مدفوع بالكامل';
      case 'partial': return 'مدفوع جزئياً';
      case 'pending': return 'في الانتظار';
      case 'overpaid': return 'مدفوع زائد';
      default: return status;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              if (activeTab === 'invoices') setShowInvoiceForm(true);
              else if (activeTab === 'expenses') setShowExpenseForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'invoices' ? 'فاتورة جديدة' : 
             activeTab === 'expenses' ? 'مصروف جديد' : 'إضافة'}
          </Button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'invoices' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              الفواتير ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'expenses' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              المصروفات ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'payments' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              المدفوعات
            </button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">الإدارة المالية</h1>
          <p className="text-gray-600 text-right">إدارة الفواتير والمصروفات والمدفوعات</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <p className="text-red-800 font-semibold">
                  ⚠️ تحذير: {error}
                </p>
                <p className="text-red-600 text-sm">
                  يتم عرض البيانات المحلية فقط. تأكد من تشغيل الخادم الخلفي.
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Financial Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الإيرادات</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-green-600">
                  {(financialData?.total_revenue || 0).toLocaleString('ar-EG')} ج.م
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  من الحجوزات والعضويات
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي المصروفات</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-red-600">
                  {(financialData?.total_expenses || 0).toLocaleString('ar-EG')} ج.م
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  إجمالي المصروفات المعتمدة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">صافي الربح</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-right ${
                  (financialData?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {(financialData?.net_profit || 0).toLocaleString('ar-EG')} ج.م
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  الإيرادات - المصروفات
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">استخدام الغرف</CardTitle>
                <Building2 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-purple-600">
                  {(financialData?.room_utilization || 0).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  معدل الإشغال
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الفواتير</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-blue-600">{financeStats.totalInvoices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">فواتير مدفوعة</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-green-600">{financeStats.paidInvoices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">فواتير معلقة</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-yellow-600">{financeStats.pendingInvoices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">فواتير متأخرة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-red-600">{financeStats.overdueInvoices}</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">توزيع الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-600">
                      {(financialData?.booking_revenue || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                    <span className="text-gray-600">إيرادات الحجوزات</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-600">
                      {(financialData?.membership_revenue || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                    <span className="text-gray-600">إيرادات العضويات</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-orange-600">
                      {(financialData?.product_revenue || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                    <span className="text-gray-600">إيرادات المنتجات</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right">أحدث الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(invoices) ? invoices
                    .filter(invoice => invoice && invoice.created_at)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Badge className={getStatusColor(invoice.status)}>
                          {getStatusLabel(invoice.status)}
                        </Badge>
                        <div className="text-right">
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">{(invoice.total_amount || 0).toFixed(2)} ج.م</p>
                        </div>
                      </div>
                    )) : []}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right">أحدث المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(expenses) ? expenses
                    .filter(expense => expense && expense.created_at)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-semibold text-red-600">{(expense.amount || 0).toFixed(2)} ج.م</span>
                        <div className="text-right">
                          <p className="font-medium">{expense.category}</p>
                          <p className="text-sm text-gray-600">{expense.description}</p>
                        </div>
                      </div>
                    )) : []}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-right flex items-center">
                <Filter className="h-5 w-5 ml-2" />
                تصفية الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="status-filter" className="text-right block mb-2">الحالة</Label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="pending">معلقة</option>
                    <option value="paid">مدفوعة</option>
                    <option value="overdue">متأخرة</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="start-date" className="text-right block mb-2">من تاريخ</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date" className="text-right block mb-2">إلى تاريخ</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="search" className="text-right block mb-2">البحث</Label>
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="رقم الفاتورة أو اسم العميل"
                    className="text-right"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Form */}
          {showInvoiceForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-right">
                  {editingInvoice ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount" className="text-right block mb-2">المبلغ (ج.م) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={invoiceFormData.amount}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="text-right"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tax-amount" className="text-right block mb-2">الضريبة (ج.م)</Label>
                      <Input
                        id="tax-amount"
                        type="number"
                        step="0.01"
                        value={invoiceFormData.tax_amount}
                        onChange={(e) => setInvoiceFormData({ ...invoiceFormData, tax_amount: e.target.value })}
                        placeholder="0.00"
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="due-date" className="text-right block mb-2">تاريخ الاستحقاق</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={invoiceFormData.due_date}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, due_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="invoice-notes" className="text-right block mb-2">ملاحظات</Label>
                    <textarea
                      id="invoice-notes"
                      value={invoiceFormData.notes}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                      placeholder="ملاحظات إضافية"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md text-right resize-none"
                    />
                  </div>

                  <div className="flex gap-4 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowInvoiceForm(false);
                      setEditingInvoice(null);
                      setInvoiceFormData({ client_id: '', amount: '', tax_amount: '', due_date: '', notes: '' });
                    }}>
                      إلغاء
                    </Button>
                    <Button type="submit">
                      {editingInvoice ? 'حفظ التغييرات' : 'إنشاء الفاتورة'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Invoices List */}
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                      
                      <Badge className={getPaymentStatusColor(invoice.payment_status)}>
                        {getPaymentStatusLabel(invoice.payment_status)}
                      </Badge>
                      
                      {invoice.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInvoiceForPayment(invoice);
                            setShowPaymentModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          تسجيل دفع
                        </Button>
                      )}
                      
                      {invoice.payment_status === 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoiceForPayment(invoice);
                            setShowPaymentModal(true);
                          }}
                          className="text-blue-600"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          عرض المدفوعات
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                      <p className="text-gray-600">{invoice.client?.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-end text-sm">
                      <span className="font-semibold text-green-600 mr-2">
                        {(invoice.total_amount || 0).toFixed(2)} ج.م
                      </span>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </div>
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{invoice.items?.length || 0} بند</span>
                      <FileText className="h-4 w-4" />
                    </div>
                    
                    {invoice.due_date && (
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2">{formatDateOnly(invoice.due_date)}</span>
                        <Calendar className="h-4 w-4" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{formatDateOnly(invoice.created_at)}</span>
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Payment Methods Summary */}
                  {invoice.payment_methods && invoice.payment_methods.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 text-right mb-2">طرق الدفع:</p>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {invoice.payment_methods.map((pm, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {pm.method === 'cash' ? 'نقدي' : pm.method === 'visa' ? 'فيزا' : 'محفظة'}: {(pm.amount || 0).toFixed(2)} ج.م
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <>
          {/* Expense Form */}
          {showExpenseForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-right">إضافة مصروف جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expense-category" className="text-right block mb-2">الفئة *</Label>
                      <Input
                        id="expense-category"
                        value={expenseFormData.category}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                        placeholder="مثال: مستلزمات مكتبية"
                        required
                        className="text-right"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="expense-amount" className="text-right block mb-2">المبلغ (ج.م) *</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        value={expenseFormData.amount}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                        className="text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expense-description" className="text-right block mb-2">نوع المصروف *</Label>
                    <select
                      id="expense-description"
                      value={expenseFormData.description}
                      onChange={(e) => setExpenseFormData({ 
                        ...expenseFormData, 
                        description: e.target.value,
                        customDescription: '' // Reset custom description when changing type
                      })}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md text-right bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر نوع المصروف</option>
                      <option value="الكهربا">⚡ الكهربا</option>
                      <option value="مصاريف اداريه">📋 مصاريف اداريه</option>
                      <option value="صيانه">🔧 صيانه</option>
                      <option value="اخري">📝 اخري (وصف مخصص)</option>
                    </select>
                  </div>

                  {/* Custom Description Input - Shows only when "اخري" is selected */}
                  {expenseFormData.description === 'اخري' && (
                    <div>
                      <Label htmlFor="custom-description" className="text-right block mb-2">الوصف المخصص *</Label>
                      <Input
                        id="custom-description"
                        value={expenseFormData.customDescription}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, customDescription: e.target.value })}
                        placeholder="اكتب وصف المصروف المخصص..."
                        required
                        className="text-right"
                      />
                      <p className="text-xs text-gray-500 text-right mt-1">
                        💡 مثال: مواد تنظيف، مستلزمات طبية، رسوم حكومية، إلخ
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="expense-details" className="text-right block mb-2">تفاصيل إضافية</Label>
                    <Input
                      id="expense-details"
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                      placeholder="تفاصيل أو ملاحظات إضافية (اختياري)"
                      className="text-right"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expense-date" className="text-right block mb-2">تاريخ المصروف *</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={expenseFormData.expense_date}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, expense_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="receipt-url" className="text-right block mb-2">رابط الإيصال</Label>
                    <Input
                      id="receipt-url"
                      type="url"
                      value={expenseFormData.receipt_url}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, receipt_url: e.target.value })}
                      placeholder="https://example.com/receipt.jpg"
                      className="text-right"
                    />
                  </div>

                  <div className="flex gap-4 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowExpenseForm(false);
                      setExpenseFormData({ 
                        category: '', 
                        description: '', 
                        customDescription: '', 
                        amount: '', 
                        expense_date: '', 
                        receipt_url: '' 
                      });
                    }}>
                      إلغاء
                    </Button>
                    <Button type="submit">
                      إضافة المصروف
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Expenses List */}
          <div className="space-y-4">
            {Array.isArray(expenses) ? expenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge variant="destructive">مصروف</Badge>
                      
                      {expense.approved_by && (
                        <Badge className="bg-green-100 text-green-800">معتمد</Badge>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">{expense.category}</h3>
                      <p className="text-gray-600">{expense.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-end text-sm">
                      <span className="font-semibold text-red-600 mr-2">
                        {(expense.amount || 0).toFixed(2)} ج.م
                      </span>
                      <DollarSign className="h-4 w-4 text-red-500" />
                    </div>
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{formatDateOnly(expense.expense_date)}</span>
                      <Calendar className="h-4 w-4" />
                    </div>
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{expense.created_by_name}</span>
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : []}
          </div>
        </>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">ملخص المدفوعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Array.isArray(invoices) ? invoices
                      .filter(inv => inv?.payment_methods)
                      .reduce((sum, inv) => 
                        sum + (inv.payment_methods?.reduce((pmSum, pm) => pmSum + (pm?.amount || 0), 0) || 0), 0
                      ).toLocaleString('ar-EG') : '0'} ج.م
                  </div>
                  <p className="text-sm text-green-600">إجمالي المدفوعات</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Array.isArray(invoices) ? invoices
                      .reduce((sum, inv) => sum + (inv?.payment_methods?.length || 0), 0) : 0}
                  </div>
                  <p className="text-sm text-blue-600">عدد المعاملات</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Array.isArray(invoices) ? invoices.filter(inv => inv?.payment_status === 'paid').length : 0}
                  </div>
                  <p className="text-sm text-purple-600">فواتير مكتملة الدفع</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">أحدث المدفوعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(invoices) ? invoices
                  .filter(invoice => invoice?.payment_methods && invoice.payment_methods.length > 0)
                  .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                  .slice(0, 10)
                  .map((invoice) => (
                    <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-right">
                          <p className="font-semibold">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">{invoice.client?.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {invoice.payment_methods?.map((pm, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              {pm.method === 'cash' && <span>💵</span>}
                              {pm.method === 'visa' && <CreditCard className="h-4 w-4 text-blue-600" />}
                              {pm.method === 'wallet' && <span>📱</span>}
                              <span className="font-semibold">{(pm.amount || 0).toFixed(2)} ج.م</span>
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
                  )) : []}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty States with null safety */}
      {activeTab === 'invoices' && filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Receipt className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فواتير</h3>
          <p className="text-gray-500 mb-4">
            {(Array.isArray(invoices) ? invoices.length : 0) === 0 ? 'ابدأ بإنشاء الفاتورة الأولى' : 'لا توجد فواتير تطابق المعايير المحددة'}
          </p>
          {(Array.isArray(invoices) ? invoices.length : 0) === 0 && (
            <Button onClick={() => setShowInvoiceForm(true)}>
              إنشاء فاتورة جديدة
            </Button>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (Array.isArray(expenses) ? expenses.length : 0) === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingDown className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مصروفات</h3>
          <p className="text-gray-500 mb-4">ابدأ بتسجيل المصروف الأول</p>
          <Button onClick={() => setShowExpenseForm(true)}>
            إضافة مصروف جديد
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      {selectedInvoiceForPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoiceForPayment(null);
          }}
          invoice={selectedInvoiceForPayment}
          onPaymentSuccess={handlePaymentSuccess}
          isViewMode={selectedInvoiceForPayment.payment_status === 'paid'}
          userRole={user?.role}
          onInvoiceUpdate={(updatedInvoice) => {
            const validAllInvoices = Array.isArray(allInvoices) ? allInvoices : [];
            setAllInvoices(validAllInvoices.map(inv => 
              inv?.id === updatedInvoice.id ? updatedInvoice : inv
            ).filter(Boolean));
          }}
        />
      )}
    </div>
  );
};

export default Finance;