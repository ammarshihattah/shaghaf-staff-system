import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Plus, ShoppingCart, Package, Truck, CheckCircle, Clock, 
  AlertTriangle, Edit, Trash2, DollarSign, Calendar, User,
  FileText, Send, X, Calculator, TrendingUp, Archive,
  Filter, Search, ExternalLink
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem, Supplier, Product, SupplierProductDetail } from '../../types';
import { formatDateOnly, formatCurrency } from '../../lib/utils';

const Purchases: React.FC = () => {
  const { user } = useAuth();
  
  // Data from localStorage
  const [allPurchaseOrders, setAllPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchase_orders', []);
  const [allSuppliers, setAllSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [allProducts, setAllProducts] = useLocalStorage<Product[]>('products', []);
  const [allSupplierProducts, setAllSupplierProducts] = useLocalStorage<SupplierProductDetail[]>('supplier_product_details', []);
  const [allBranches] = useLocalStorage('branches', []);

  // Filter by branch
  const purchaseOrders = Array.isArray(allPurchaseOrders) ? allPurchaseOrders.filter(po => po.branch_id === user?.branch_id) : [];
  const suppliers = Array.isArray(allSuppliers) ? allSuppliers.filter(supplier => supplier.branch_id === user?.branch_id) : [];
  const products = Array.isArray(allProducts) ? allProducts.filter(product => product.branch_id === user?.branch_id) : [];
  const supplierProducts = Array.isArray(allSupplierProducts) ? allSupplierProducts.filter(sp => {
    const product = Array.isArray(allProducts) ? allProducts.find(p => p.id === sp.product_id) : null;
    return product?.branch_id === user?.branch_id;
  }) : [];

  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'create-order' | 'demand-forecast'>('overview');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<PurchaseOrder | null>(null);

  // Form States
  const [orderFormData, setOrderFormData] = useState({
    branch_id: user?.branch_id || '1',
    supplier_id: '',
    expected_delivery_date: '',
    notes: ''
  });

  const [orderItems, setOrderItems] = useState<Array<{
    product_id: string;
    quantity: number;
    unit_cost: number;
  }>>([]);

  const [newItemForm, setNewItemForm] = useState({
    product_id: '',
    quantity: 1,
    unit_cost: 0
  });

  // Demand forecasting states
  const [forecastPeriod, setForecastPeriod] = useState('week'); // week, month, quarter
  const [demandForecast, setDemandForecast] = useState<Array<{
    product_id: string;
    product_name: string;
    current_stock: number;
    min_stock: number;
    max_stock: number;
    weekly_usage: number;
    monthly_usage: number;
    predicted_demand: number;
    suggested_order_quantity: number;
    urgency_level: 'low' | 'medium' | 'high' | 'critical';
    supplier_suggestions: Array<{
      supplier_id: string;
      supplier_name: string;
      cost: number;
      delivery_days: number;
      is_preferred: boolean;
    }>;
  }>>([]);

  // Statistics
  const purchaseStats = React.useMemo(() => {
    const validPurchaseOrders = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    return {
      totalOrders: (purchaseOrders || []).length,
      draftOrders: (purchaseOrders || []).filter(po => po.status === 'draft').length,
      sentOrders: (purchaseOrders || []).filter(po => po.status === 'sent').length,
      confirmedOrders: (purchaseOrders || []).filter(po => po.status === 'confirmed').length,
      deliveredOrders: (purchaseOrders || []).filter(po => po.status === 'delivered').length,
      totalValue: (purchaseOrders || []).reduce((sum, po) => sum + po.total_amount, 0),
      pendingValue: (purchaseOrders || [])
        .filter(po => po.status === 'sent' || po.status === 'confirmed')
        .reduce((sum, po) => sum + po.total_amount, 0)
    };
  }, [purchaseOrders]);

  // Calculate demand forecast
  const calculateDemandForecast = React.useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    return products.map(product => {
      // Simulate historical usage data (in real app, this would come from sales/usage history)
      const baseUsage = Math.floor(Math.random() * 20) + 5; // 5-25 per week
      const weeklyUsage = baseUsage;
      const monthlyUsage = baseUsage * 4.3; // Average weeks per month
      
      // Calculate predicted demand based on current trends
      let predictedDemand = 0;
      switch (forecastPeriod) {
        case 'week':
          predictedDemand = weeklyUsage;
          break;
        case 'month':
          predictedDemand = monthlyUsage;
          break;
        case 'quarter':
          predictedDemand = monthlyUsage * 3;
          break;
      }
      
      // Calculate suggested order quantity
      const currentStock = product.stock_quantity || 0;
      const minStock = product.min_stock_level || 0;
      const maxStock = product.max_stock_level || (minStock * 3);
      
      const stockAfterPeriod = currentStock - predictedDemand;
      const suggestedOrderQuantity = Math.max(0, maxStock - stockAfterPeriod);
      
      // Determine urgency level
      let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (currentStock <= 0) {
        urgencyLevel = 'critical';
      } else if (currentStock <= minStock) {
        urgencyLevel = 'high';
      } else if (stockAfterPeriod <= minStock) {
        urgencyLevel = 'medium';
      }
      
      // Get supplier suggestions for this product
      const supplierSuggestions = Array.isArray(supplierProducts) ? 
        supplierProducts
          .filter(sp => sp.product_id === product.id)
          .map(sp => {
            const supplier = Array.isArray(allSuppliers) ? 
              allSuppliers.find(s => s.id === sp.supplier_id) : null;
            return {
              supplier_id: sp.supplier_id,
              supplier_name: supplier?.name || 'مورد غير معروف',
              cost: sp.cost,
              delivery_days: sp.average_delivery_days,
              is_preferred: sp.is_preferred
            };
          })
          .sort((a, b) => {
            // Sort by preference first, then by cost
            if (a.is_preferred && !b.is_preferred) return -1;
            if (!a.is_preferred && b.is_preferred) return 1;
            return a.cost - b.cost;
          }) : [];
      
      return {
        product_id: product.id,
        product_name: product.name,
        current_stock: currentStock,
        min_stock: minStock,
        max_stock: maxStock,
        weekly_usage: weeklyUsage,
        monthly_usage: monthlyUsage,
        predicted_demand: predictedDemand,
        suggested_order_quantity: suggestedOrderQuantity,
        urgency_level: urgencyLevel,
        supplier_suggestions: supplierSuggestions
      };
    });
  }, [products, supplierProducts, allSuppliers, forecastPeriod]);

  // Create order from forecast
  const createOrderFromForecast = (forecastItems: typeof demandForecast) => {
    if (forecastItems.length === 0) return;
    
    // Group by preferred supplier
    const supplierGroups: { [supplierId: string]: typeof forecastItems } = {};
    
    forecastItems.forEach(item => {
      if (item.supplier_suggestions.length > 0) {
        const preferredSupplier = item.supplier_suggestions[0];
        if (!supplierGroups[preferredSupplier.supplier_id]) {
          supplierGroups[preferredSupplier.supplier_id] = [];
        }
        supplierGroups[preferredSupplier.supplier_id].push(item);
      }
    });
    
    // Create order for the supplier with most items
    const bestSupplierId = Object.keys(supplierGroups).reduce((a, b) => 
      supplierGroups[a].length > supplierGroups[b].length ? a : b
    );
    
    if (bestSupplierId) {
      setOrderFormData({
        branch_id: user?.branch_id || '1',
        supplier_id: bestSupplierId,
        expected_delivery_date: '',
        notes: 'أمر شراء تم إنشاؤه من التنبؤ بالطلب'
      });
      
      setOrderItems(supplierGroups[bestSupplierId].map(item => ({
        product_id: item.product_id,
        quantity: item.suggested_order_quantity,
        unit_cost: item.supplier_suggestions[0].cost
      })));
      
      setShowOrderForm(true);
      setActiveTab('orders');
    }
  };

  // Get supplier products for selected supplier
  const getSupplierProducts = (supplierId: string) => {
    return Array.isArray(supplierProducts) ? supplierProducts
      .filter(sp => sp.supplier_id === supplierId)
      .map(sp => {
        const product = Array.isArray(products) ? products.find(p => p.id === sp.product_id) : null;
        return {
          ...sp,
          product_name: product?.name || 'منتج غير معروف',
          product_category: product?.category || '',
          current_stock: product?.stock_quantity || 0,
          min_stock: product?.min_stock_level || 0
        };
      }) : [];
  };

  // Add item to order
  const addItemToOrder = () => {
    if (!newItemForm.product_id || newItemForm.quantity <= 0 || newItemForm.unit_cost <= 0) {
      alert('يرجى ملء جميع بيانات المنتج');
      return;
    }

    // Check if product already exists in the order
    const existingItemIndex = orderItems.findIndex(item => item.product_id === newItemForm.product_id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + newItemForm.quantity,
        unit_cost: newItemForm.unit_cost // Update cost if different
      };
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([...orderItems, { ...newItemForm }]);
    }

    // Reset form
    setNewItemForm({
      product_id: '',
      quantity: 1,
      unit_cost: 0
    });
  };

  // Remove item from order
  const removeItemFromOrder = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Update item in order
  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setOrderItems(updatedItems);
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  // Auto-fill cost when product and supplier are selected
  useEffect(() => {
    if (newItemForm.product_id && orderFormData.supplier_id) {
      const supplierProduct = Array.isArray(supplierProducts) ? supplierProducts.find(sp => 
        sp.product_id === newItemForm.product_id && sp.supplier_id === orderFormData.supplier_id
      ) : null;
      
      if (supplierProduct && newItemForm.unit_cost === 0) {
        setNewItemForm(prev => ({ ...prev, unit_cost: supplierProduct.cost }));
      }
    }
  }, [newItemForm.product_id, orderFormData.supplier_id, supplierProducts]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderFormData.supplier_id) {
      alert('يرجى اختيار المورد');
      return;
    }

    if (orderItems.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    const orderData = {
      ...orderFormData,
      total_amount: calculateTotalAmount(),
      items: orderItems.map(item => ({
        ...item,
        total_cost: item.quantity * item.unit_cost,
        product_name: Array.isArray(products) ? products.find(p => p.id === item.product_id)?.name || 'منتج غير معروف' : 'منتج غير معروف'
      }))
    };

    if (editingOrder) {
      const validAllPurchaseOrders = Array.isArray(allPurchaseOrders) ? allPurchaseOrders : [];
      setAllPurchaseOrders(validAllPurchaseOrders.map(po => 
        po.id === editingOrder.id 
          ? { ...po, ...orderData, items: orderData.items.map(item => ({ ...item, purchase_order_id: po.id })) }
          : po
      ));
    } else {
      const validAllPurchaseOrders = Array.isArray(allPurchaseOrders) ? allPurchaseOrders : [];
      const newOrder: PurchaseOrder = {
        id: Date.now().toString(),
        branch_id: orderFormData.branch_id,
        order_number: `PO-${Date.now()}`,
        status: 'draft',
        created_by: user?.id || '1',
        created_at: new Date().toISOString(),
        ...orderData,
        items: orderData.items.map(item => ({ ...item, purchase_order_id: Date.now().toString() }))
      };
      setAllPurchaseOrders([...validAllPurchaseOrders, newOrder]);
    }
    
    // Reset form
    setShowOrderForm(false);
    setEditingOrder(null);
    setOrderFormData({ branch_id: user?.branch_id || '1', supplier_id: '', expected_delivery_date: '', notes: '' });
    setOrderItems([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'sent': return 'مرسل';
      case 'confirmed': return 'مؤكد';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setOrderFormData({
      branch_id: order.branch_id,
      supplier_id: order.supplier_id,
      expected_delivery_date: order.expected_delivery_date?.split('T')[0] || '',
      notes: order.notes || ''
    });
    setOrderItems(order.items?.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost
    })) || []);
    setShowOrderForm(true);
  };

  const handleStatusUpdate = (orderId: string, newStatus: PurchaseOrder['status']) => {
    const validAllPurchaseOrders = Array.isArray(allPurchaseOrders) ? allPurchaseOrders : [];
    setAllPurchaseOrders(validAllPurchaseOrders.map(po => 
      po.id === orderId 
        ? { 
            ...po, 
            status: newStatus,
            actual_delivery_date: newStatus === 'delivered' ? new Date().toISOString().split('T')[0] : po.actual_delivery_date
          }
        : po
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              if (activeTab === 'orders') setShowOrderForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'orders' ? 'أمر شراء جديد' : 'إضافة'}
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
              onClick={() => setActiveTab('demand-forecast')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'demand-forecast' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              التنبؤ بالطلب
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'orders' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              أوامر الشراء ({purchaseOrders.length})
            </button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة المشتريات</h1>
          <p className="text-gray-600 text-right">إدارة أوامر الشراء والموردين</p>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الأوامر</CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-blue-600">{purchaseStats.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">أوامر معلقة</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-orange-600">
                  {purchaseStats.sentOrders + purchaseStats.confirmedOrders}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">القيمة الإجمالية</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-green-600">
                  {purchaseStats.totalValue.toLocaleString('ar-EG')} ج.م
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">قيمة معلقة</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-purple-600">
                  {purchaseStats.pendingValue.toLocaleString('ar-EG')} ج.م
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">أحدث أوامر الشراء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(purchaseOrders) ? purchaseOrders
                  .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                  .slice(0, 5)
                  .map((order) => {
                    const supplier = Array.isArray(suppliers) ? suppliers.find(s => s.id === order.supplier_id) : null;
                    
                    return (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex gap-3">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrderForDetails(order)}
                          >
                            التفاصيل
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{order.order_number}</p>
                          <p className="text-sm text-gray-600">{supplier?.name}</p>
                          <p className="text-sm font-medium text-green-600">
                            {order.total_amount.toLocaleString('ar-EG')} ج.م
                          </p>
                        </div>
                      </div>
                    );
                  }) : []}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Demand Forecast Tab */}
      {activeTab === 'demand-forecast' && (
        <>
          {/* Forecast Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-right flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 ml-2" />
                إعدادات التنبؤ بالطلب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="forecast-period" className="text-right block mb-2">فترة التنبؤ</Label>
                  <select
                    id="forecast-period"
                    value={forecastPeriod}
                    onChange={(e) => setForecastPeriod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                  >
                    <option value="week">أسبوع واحد</option>
                    <option value="month">شهر واحد</option>
                    <option value="quarter">ربع سنة</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      const urgentProducts = calculateDemandForecast.filter(f => 
                        f.urgency_level === 'critical' || f.urgency_level === 'high'
                      );
                      createOrderFromForecast(urgentProducts);
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={calculateDemandForecast.filter(f => f.urgency_level === 'critical' || f.urgency_level === 'high').length === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    أمر شراء للمنتجات العاجلة
                  </Button>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={() => createOrderFromForecast(calculateDemandForecast.filter(f => f.suggested_order_quantity > 0))}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={calculateDemandForecast.filter(f => f.suggested_order_quantity > 0).length === 0}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    أمر شراء شامل
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {calculateDemandForecast.filter(f => f.urgency_level === 'critical').length}
                  </div>
                  <p className="text-sm text-red-600">منتجات حرجة</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {calculateDemandForecast.filter(f => f.urgency_level === 'high').length}
                  </div>
                  <p className="text-sm text-orange-600">أولوية عالية</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateDemandForecast.filter(f => f.suggested_order_quantity > 0).length}
                  </div>
                  <p className="text-sm text-blue-600">يحتاج طلب</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {calculateDemandForecast.reduce((sum, f) => sum + (f.suggested_order_quantity * (f.supplier_suggestions[0]?.cost || 0)), 0).toLocaleString('ar-EG')} ج.م
                  </div>
                  <p className="text-sm text-green-600">التكلفة المتوقعة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demand Forecast Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">تحليل الطلب المتوقع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calculateDemandForecast.map((forecast) => (
                  <div key={forecast.product_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          forecast.urgency_level === 'critical' ? 'bg-red-100 text-red-800' :
                          forecast.urgency_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          forecast.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {forecast.urgency_level === 'critical' ? 'حرج' :
                           forecast.urgency_level === 'high' ? 'عالي' :
                           forecast.urgency_level === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        {forecast.suggested_order_quantity > 0 && (
                          <Button
                            size="sm"
                            onClick={() => createOrderFromForecast([forecast])}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            طلب شراء
                          </Button>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg text-right">{forecast.product_name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">المخزون الحالي</p>
                        <p className={`font-semibold ${forecast.current_stock <= forecast.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                          {forecast.current_stock}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">الطلب المتوقع ({forecastPeriod === 'week' ? 'أسبوعي' : forecastPeriod === 'month' ? 'شهري' : 'ربع سنوي'})</p>
                        <p className="font-semibold text-blue-600">{forecast.predicted_demand}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">الكمية المقترحة للطلب</p>
                        <p className="font-semibold text-orange-600">{forecast.suggested_order_quantity}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">التكلفة المتوقعة</p>
                        <p className="font-semibold text-green-600">
                          {(forecast.suggested_order_quantity * (forecast.supplier_suggestions[0]?.cost || 0)).toLocaleString('ar-EG')} ج.م
                        </p>
                      </div>
                    </div>
                    
                    {forecast.supplier_suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2 text-right">الموردون المتاحون:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {forecast.supplier_suggestions.slice(0, 2).map((supplier) => (
                            <div key={supplier.supplier_id} className="bg-gray-50 p-2 rounded text-right">
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <span className="font-medium">{supplier.cost} ج.م</span>
                                  <span className="text-gray-500 mr-2">({supplier.delivery_days} يوم)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {supplier.is_preferred && (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">مفضل</Badge>
                                  )}
                                  <span className="font-medium">{supplier.supplier_name}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Purchase Order Form */}
      {showOrderForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingOrder ? 'تعديل أمر الشراء' : 'إنشاء أمر شراء جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <div>
                    <Label htmlFor="order-branch" className="text-right block mb-2">الفرع</Label>
                    <select
                      id="order-branch"
                      value={orderFormData.branch_id}
                      onChange={(e) => {
                        setOrderFormData({ ...orderFormData, branch_id: e.target.value, supplier_id: '' });
                        // Clear items when branch changes
                        setOrderItems([]);
                        setNewItemForm({ product_id: '', quantity: 1, unit_cost: 0 });
                      }}
                      required
                      className="w-full p-3 border border-gray-300 rounded-md text-right"
                    >
                      {allBranches.map((branch: any) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="supplier-select" className="text-right block mb-2">المورد *</Label>
                  <select
                    id="supplier-select"
                    value={orderFormData.supplier_id}
                    onChange={(e) => {
                      setOrderFormData({ ...orderFormData, supplier_id: e.target.value });
                      // Clear items when supplier changes
                      setOrderItems([]);
                      setNewItemForm({ product_id: '', quantity: 1, unit_cost: 0 });
                    }}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                  >
                    <option value="">اختر المورد</option>
                    {Array.isArray(allSuppliers) ? allSuppliers.filter(supplier => supplier.branch_id === orderFormData.branch_id).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.contact_person}
                      </option>
                    )) : []}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="delivery-date" className="text-right block mb-2">تاريخ التسليم المتوقع</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={orderFormData.expected_delivery_date}
                    onChange={(e) => setOrderFormData({ ...orderFormData, expected_delivery_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Add Product Section */}
              {orderFormData.supplier_id && (
                <Card className="bg-blue-50 border border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-right text-blue-800">إضافة منتجات إلى الأمر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const availableProducts = Array.isArray(allSupplierProducts) ? allSupplierProducts
                        .filter(sp => sp.supplier_id === orderFormData.supplier_id && sp)
                        .map(sp => {
                          const product = Array.isArray(allProducts) ? allProducts.find(p => p.id === sp.product_id && p.branch_id === orderFormData.branch_id) : null;
                          return product ? {
                            ...sp,
                            product_name: product.name,
                            product_category: product.category,
                            current_stock: product.stock_quantity,
                            min_stock: product.min_stock_level
                          } : null;
                        })
                        .filter(Boolean) : [];
                      
                      if (availableProducts.length === 0) {
                        return (
                          <div className="text-center py-6">
                            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">لا توجد منتجات مربوطة بهذا المورد</p>
                            <p className="text-sm text-gray-500">يجب ربط المنتجات بالمورد أولاً من تبويب المخزون</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="product-select" className="text-right block mb-2">المنتج</Label>
                              <select
                                id="product-select"
                                value={newItemForm.product_id}
                                onChange={(e) => setNewItemForm({ ...newItemForm, product_id: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md text-right"
                              >
                                <option value="">اختر المنتج</option>
                                {availableProducts.map(sp => (
                                  <option key={sp.product_id} value={sp.product_id}>
                                    {sp.product_name} - {sp.cost} ج.م
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <Label htmlFor="quantity" className="text-right block mb-2">الكمية</Label>
                              <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={newItemForm.quantity}
                                onChange={(e) => setNewItemForm({ ...newItemForm, quantity: parseInt(e.target.value) || 1 })}
                                className="text-right"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="unit-cost" className="text-right block mb-2">سعر الوحدة (ج.م)</Label>
                              <Input
                                id="unit-cost"
                                type="number"
                                step="0.01"
                                min="0"
                                value={newItemForm.unit_cost}
                                onChange={(e) => setNewItemForm({ ...newItemForm, unit_cost: parseFloat(e.target.value) || 0 })}
                                className="text-right"
                              />
                            </div>
                            
                            <div className="flex items-end">
                              <Button
                                type="button"
                                onClick={addItemToOrder}
                                className="w-full"
                                disabled={!newItemForm.product_id || newItemForm.quantity <= 0 || newItemForm.unit_cost <= 0}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                إضافة
                              </Button>
                            </div>
                          </div>

                          {/* Display selected product info */}
                          {newItemForm.product_id && (
                            <div className="bg-white p-3 rounded-lg border border-blue-300">
                              {(() => {
                                const selectedProductDetail = availableProducts.find(sp => sp.product_id === newItemForm.product_id);
                                if (!selectedProductDetail) return null;
                                
                                return (
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-right">
                                      <span className="text-gray-500">المخزون الحالي: </span>
                                      <span className={`font-medium ${selectedProductDetail.current_stock <= selectedProductDetail.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                                        {selectedProductDetail.current_stock}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-gray-500">الحد الأدنى: </span>
                                      <span className="font-medium">{selectedProductDetail.min_stock}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-gray-500">التكلفة الإجمالية: </span>
                                      <span className="font-bold text-blue-600">
                                        {(newItemForm.quantity * newItemForm.unit_cost).toFixed(2)} ج.م
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Order Items List */}
              {orderItems.length > 0 && (
                <Card className="bg-green-50 border border-green-200">
                  <CardHeader>
                    <CardTitle className="text-right text-green-800">بنود أمر الشراء ({orderItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderItems.map((item, index) => {
                        const product = Array.isArray(products) ? products.find(p => p.id === item.product_id) : null;
                        const totalCost = item.quantity * item.unit_cost;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-300">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeItemFromOrder(index)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20 text-center"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_cost}
                                  onChange={(e) => updateOrderItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                                  className="w-24 text-center"
                                />
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-lg">{product?.name}</p>
                              <p className="text-sm text-gray-600">{product?.category}</p>
                              <div className="flex items-center justify-end gap-4 mt-1">
                                <span className="text-sm text-gray-500">
                                  {item.quantity} × {item.unit_cost} ج.م
                                </span>
                                <span className="font-bold text-green-600">
                                  = {totalCost.toFixed(2)} ج.م
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Total Amount */}
                      <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                        <div className="flex justify-between items-center text-right">
                          <span className="text-2xl font-bold text-green-800">
                            {calculateTotalAmount().toLocaleString('ar-EG')} ج.م
                          </span>
                          <span className="text-green-700 font-medium">المبلغ الإجمالي:</span>
                        </div>
                        <p className="text-sm text-green-600 text-right mt-1">
                          {orderItems.length} منتج | {orderItems.reduce((sum, item) => sum + item.quantity, 0)} قطعة إجمالي
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="order-notes" className="text-right block mb-2">ملاحظات الأمر</Label>
                <textarea
                  id="order-notes"
                  value={orderFormData.notes}
                  onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية حول أمر الشراء"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md text-right resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => {
                  setShowOrderForm(false);
                  setEditingOrder(null);
                  setOrderFormData({ branch_id: user?.branch_id || '1', supplier_id: '', expected_delivery_date: '', notes: '' });
                  setOrderItems([]);
                }}>
                  إلغاء
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!orderFormData.supplier_id || orderItems.length === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {editingOrder ? 'حفظ التغييرات' : 'إنشاء أمر الشراء'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {['draft', 'sent', 'confirmed', 'delivered', 'cancelled'].map(status => (
              <Badge 
                key={status}
                className={`cursor-pointer ${getStatusColor(status)} hover:opacity-80`}
                onClick={() => {
                  // This could be used for filtering if we implement filter state
                }}
              >
                {getStatusLabel(status)} ({Array.isArray(purchaseOrders) ? purchaseOrders.filter(po => po.status === status).length : 0})
              </Badge>
            ))}
          </div>

          {/* Orders List */}
          {Array.isArray(purchaseOrders) ? purchaseOrders.map((order) => {
            const supplier = Array.isArray(suppliers) ? suppliers.find(s => s.id === order.supplier_id) : null;
            
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrderForDetails(order)}
                      >
                        التفاصيل
                      </Button>
                      
                      {order.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOrder(order)}
                            className="text-blue-600"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'sent')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            إرسال للمورد
                          </Button>
                        </>
                      )}
                      
                      {order.status === 'sent' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          تأكيد الاستلام
                        </Button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'delivered')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          تم التسليم
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <h3 className="font-semibold text-lg">{order.order_number}</h3>
                      <p className="text-gray-600">{supplier?.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-end text-sm">
                      <span className="font-semibold text-green-600 mr-2">
                        {order.total_amount.toLocaleString('ar-EG')} ج.م
                      </span>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </div>
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{order.items?.length || 0} منتج</span>
                      <Package className="h-4 w-4" />
                    </div>
                    
                    {order.expected_delivery_date && (
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2">{formatDateOnly(order.expected_delivery_date)}</span>
                        <Calendar className="h-4 w-4" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-end text-sm text-gray-600">
                      <span className="mr-2">{formatDateOnly(order.created_at)}</span>
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }) : []}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrderForDetails(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle className="text-right">
                  تفاصيل أمر الشراء #{selectedOrderForDetails.order_number}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const supplier = Array.isArray(suppliers) ? suppliers.find(s => s.id === selectedOrderForDetails.supplier_id) : null;
                
                return (
                  <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <Badge className={getStatusColor(selectedOrderForDetails.status)}>
                          {getStatusLabel(selectedOrderForDetails.status)}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">حالة الأمر</p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-xl font-bold text-green-600">
                          {selectedOrderForDetails.total_amount.toLocaleString('ar-EG')} ج.م
                        </div>
                        <p className="text-sm text-gray-600">القيمة الإجمالية</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-xl font-bold text-gray-600">
                          {selectedOrderForDetails.items?.length || 0}
                        </div>
                        <p className="text-sm text-gray-600">عدد المنتجات</p>
                      </div>
                    </div>

                    {/* Supplier Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-right">معلومات المورد</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">اسم المورد</p>
                            <p className="font-semibold">{supplier?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">الشخص المسؤول</p>
                            <p className="font-semibold">{supplier?.contact_person}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">الهاتف</p>
                            <p className="font-semibold" dir="ltr">{supplier?.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                            <p className="font-semibold" dir="ltr">{supplier?.email}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-right">منتجات الأمر</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedOrderForDetails.items?.map((item, index) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-gray-500" />
                                <div>
                                  <span className="font-semibold">{item.total_cost.toLocaleString('ar-EG')} ج.م</span>
                                  <p className="text-sm text-gray-600">
                                    {item.quantity} × {item.unit_cost} ج.م
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-semibold">{item.product_name}</p>
                                <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Notes */}
                    {selectedOrderForDetails.notes && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-right">ملاحظات الأمر</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-right text-gray-700">{selectedOrderForDetails.notes}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Order Dates */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-right">تواريخ الأمر</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
                            <p className="font-semibold">{formatDateOnly(selectedOrderForDetails.created_at)}</p>
                          </div>
                          {selectedOrderForDetails.expected_delivery_date && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">التسليم المتوقع</p>
                              <p className="font-semibold">{formatDateOnly(selectedOrderForDetails.expected_delivery_date)}</p>
                            </div>
                          )}
                          {selectedOrderForDetails.actual_delivery_date && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">التسليم الفعلي</p>
                              <p className="font-semibold">{formatDateOnly(selectedOrderForDetails.actual_delivery_date)}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Purchases;