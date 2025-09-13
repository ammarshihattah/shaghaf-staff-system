import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Plus, Package, Truck, Edit, Trash2, AlertTriangle, DollarSign, 
  Calendar, Star, TrendingDown, Building2, Phone, Mail, MapPin,
  CheckCircle, Link, ArrowRight, Users, Factory, ShoppingCart
} from 'lucide-react';
import { Product, Supplier, SupplierProductDetail } from '../../types';
import { formatDateOnly, formatCurrency } from '../../lib/utils';
import ProductRecipeModal from '../ProductRecipeModal';

const Inventory: React.FC = () => {
  const { user } = useAuth();
  
  // Data from localStorage
  const [allProducts, setAllProducts] = useLocalStorage<Product[]>('products', []);
  const [allSuppliers, setAllSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [allSupplierProducts, setAllSupplierProducts] = useLocalStorage<SupplierProductDetail[]>('supplier_product_details', []);
  const [allBranches] = useLocalStorage('branches', []);
  
  // Selected branch for viewing (allows admins/managers to view other branches' inventory)
  const [selectedViewBranchId, setSelectedViewBranchId] = useState(user?.branch_id || '1');

  // Filter by selected branch for viewing
  const products = allProducts.filter(product => product.branch_id === selectedViewBranchId);
  const suppliers = allSuppliers.filter(supplier => supplier.branch_id === selectedViewBranchId);
  const supplierProducts = allSupplierProducts.filter(sp => {
    const product = allProducts.find(p => p.id === sp.product_id);
    return product?.branch_id === selectedViewBranchId;
  });

  // Update selected branch when user changes
  useEffect(() => {
    if (user?.branch_id && !selectedViewBranchId) {
      setSelectedViewBranchId(user.branch_id);
    }
  }, [user?.branch_id]);

  // UI States
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'supplier-products'>('products');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [productFormData, setProductFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    staff_price: '',
    order_price: '',
    cost: '',
    stock_quantity: '',
    min_stock_level: '',
    max_stock_level: '',
    unit: '',
    barcode: '',
    expiry_date: ''
  });

  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<Product | null>(null);

  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  // Linked products for supplier form
  const [linkedProducts, setLinkedProducts] = useState<Array<{
    product_id: string;
    cost: number;
    average_delivery_days: number;
    is_preferred: boolean;
    notes: string;
  }>>([]);

  // Statistics
  const inventoryStats = React.useMemo(() => {
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level && p.is_active);
    const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * (p.cost || p.price)), 0);
    
    return {
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      totalSuppliers: suppliers.length,
      totalValue,
      outOfStockCount: products.filter(p => p.stock_quantity === 0 && p.is_active).length
    };
  }, [products, suppliers]);

  // Product form handlers
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...productFormData,
      price: parseFloat(productFormData.price),
      staff_price: productFormData.staff_price ? parseFloat(productFormData.staff_price) : undefined,
      order_price: productFormData.order_price ? parseFloat(productFormData.order_price) : undefined,
      cost: productFormData.cost ? parseFloat(productFormData.cost) : undefined,
      stock_quantity: parseInt(productFormData.stock_quantity) || 0,
      min_stock_level: parseInt(productFormData.min_stock_level) || 0,
      max_stock_level: productFormData.max_stock_level ? parseInt(productFormData.max_stock_level) : undefined
    };

    if (editingProduct) {
      setAllProducts(allProducts.map(product => 
        product.id === editingProduct.id 
          ? { ...product, ...productData }
          : product
      ));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1', // Always use user's own branch when creating
        ...productData,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setAllProducts([...allProducts, newProduct]);
    }
    
    setShowProductForm(false);
    setEditingProduct(null);
    setProductFormData({
      name: '', category: '', description: '', price: '', staff_price: '', order_price: '',
      cost: '', stock_quantity: '', min_stock_level: '', max_stock_level: '',
      unit: '', barcode: '', expiry_date: ''
    });
  };

  // Supplier form handlers
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSupplier) {
      // Update existing supplier
      setAllSuppliers(allSuppliers.map(supplier => 
        supplier.id === editingSupplier.id 
          ? { ...supplier, ...supplierFormData }
          : supplier
      ));

      // Update supplier-product relationships
      const currentSupplierId = editingSupplier.id;
      
      // Remove existing relationships for this supplier
      const filteredSupplierProducts = allSupplierProducts.filter(sp => sp.supplier_id !== currentSupplierId);
      
      // Add new relationships
      const newSupplierProducts = linkedProducts.map(lp => ({
        id: `${currentSupplierId}-${lp.product_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        supplier_id: currentSupplierId,
        product_id: lp.product_id,
        cost: lp.cost,
        average_delivery_days: lp.average_delivery_days,
        is_preferred: lp.is_preferred,
        notes: lp.notes,
        created_at: new Date().toISOString()
      }));

      setAllSupplierProducts([...filteredSupplierProducts, ...newSupplierProducts]);
    } else {
      // Create new supplier
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1', // Always use user's own branch when creating
        ...supplierFormData,
        created_at: new Date().toISOString()
      };
      setAllSuppliers([...allSuppliers, newSupplier]);

      // Add supplier-product relationships for new supplier
      const newSupplierId = newSupplier.id;
      const newSupplierProducts = linkedProducts.map(lp => ({
        id: `${newSupplierId}-${lp.product_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        supplier_id: newSupplierId,
        product_id: lp.product_id,
        cost: lp.cost,
        average_delivery_days: lp.average_delivery_days,
        is_preferred: lp.is_preferred,
        notes: lp.notes,
        created_at: new Date().toISOString()
      }));

      setAllSupplierProducts([...allSupplierProducts, ...newSupplierProducts]);
    }
    
    setShowSupplierForm(false);
    setEditingSupplier(null);
    setSupplierFormData({
      name: '', contact_person: '', phone: '', email: '', address: ''
    });
    setLinkedProducts([]);
  };

  // Handle product edit
  const handleProductEdit = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      category: product.category || '',
      description: product.description || '',
      price: product.price.toString(),
      staff_price: product.staff_price?.toString() || '',
      order_price: product.order_price?.toString() || '',
      cost: product.cost?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      max_stock_level: product.max_stock_level?.toString() || '',
      unit: product.unit || '',
      barcode: product.barcode || '',
      expiry_date: product.expiry_date || ''
    });
    setShowProductForm(true);
  };

  // Handle supplier edit
  const handleSupplierEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address
    });

    // Load existing linked products for this supplier
    const existingLinks = supplierProducts
      .filter(sp => sp.supplier_id === supplier.id)
      .map(sp => ({
        product_id: sp.product_id,
        cost: sp.cost,
        average_delivery_days: sp.average_delivery_days,
        is_preferred: sp.is_preferred,
        notes: sp.notes || ''
      }));
    
    setLinkedProducts(existingLinks);
    setShowSupplierForm(true);
  };

  // Handle product deletion
  const handleProductDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setAllProducts(allProducts.filter(product => product.id !== id));
      // Also remove any supplier product relationships
      setAllSupplierProducts(allSupplierProducts.filter(sp => sp.product_id !== id));
    }
  };

  // Handle supplier deletion
  const handleSupplierDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      setAllSuppliers(allSuppliers.filter(supplier => supplier.id !== id));
      // Also remove any supplier product relationships
      setAllSupplierProducts(allSupplierProducts.filter(sp => sp.supplier_id !== id));
    }
  };

  // Toggle product link for supplier
  const toggleProductLink = (productId: string) => {
    const existing = linkedProducts.find(lp => lp.product_id === productId);
    
    if (existing) {
      setLinkedProducts(linkedProducts.filter(lp => lp.product_id !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      setLinkedProducts([...linkedProducts, {
        product_id: productId,
        cost: product?.cost || 0,
        average_delivery_days: 7,
        is_preferred: false,
        notes: ''
      }]);
    }
  };

  // Update linked product details
  const updateLinkedProduct = (productId: string, field: string, value: any) => {
    setLinkedProducts(linkedProducts.map(lp => 
      lp.product_id === productId 
        ? { ...lp, [field]: value }
        : lp
    ));
  };

  // Get products for supplier
  const getSupplierProducts = (supplierId: string) => {
    return supplierProducts
      .filter(sp => sp.supplier_id === supplierId)
      .map(sp => {
        const product = products.find(p => p.id === sp.product_id);
        return {
          ...sp,
          product_name: product?.name || 'منتج محذوف',
          product_category: product?.category || '',
          current_stock: product?.stock_quantity || 0,
          min_stock: product?.min_stock_level || 0
        };
      });
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-4">
            {/* Branch Selector - Only for admin/manager */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div className="flex items-center gap-2">
                <Label htmlFor="branch-selector" className="text-right whitespace-nowrap">عرض مخزون الفرع:</Label>
                <select
                  id="branch-selector"
                  value={selectedViewBranchId}
                  onChange={(e) => setSelectedViewBranchId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-right bg-white min-w-[200px]"
                >
                  {allBranches.map((branch: any) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <Button 
              onClick={() => {
                if (activeTab === 'products') setShowProductForm(true);
                else if (activeTab === 'suppliers') setShowSupplierForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'products' ? 'إضافة منتج جديد' : 
               activeTab === 'suppliers' ? 'إضافة مورد جديد' : 'إضافة'}
            </Button>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'products' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                المنتجات ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'suppliers' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                الموردين ({suppliers.length})
              </button>
              <button
                onClick={() => setActiveTab('supplier-products')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'supplier-products' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ربط المنتجات بالموردين
              </button>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة المخزون والموردين</h1>
            <p className="text-gray-600 text-right">
              إدارة المنتجات والموردين وربطهم ببعض
              {(user?.role === 'admin' || user?.role === 'manager') && selectedViewBranchId !== user?.branch_id && (
                <span className="text-blue-600 font-medium"> - عرض فرع: {allBranches.find((b: any) => b.id === selectedViewBranchId)?.name}</span>
              )}
            </p>
          </div>
        </div>

        {/* Branch Info Card - Show when viewing different branch */}
        {(user?.role === 'admin' || user?.role === 'manager') && selectedViewBranchId !== user?.branch_id && (
          <Card className="mb-6 bg-blue-50 border border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-end gap-3">
                <div className="text-right">
                  <p className="text-blue-800 font-semibold">
                    🏢 تعرض حالياً مخزون فرع: {allBranches.find((b: any) => b.id === selectedViewBranchId)?.name}
                  </p>
                  <p className="text-blue-600 text-sm">
                    لإضافة منتجات أو موردين جدد، ارجع لفرعك الأساسي أو غير الفرع المعروض
                  </p>
                </div>
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">إجمالي المنتجات</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-blue-600">{inventoryStats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">مخزون منخفض</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-red-600">{inventoryStats.lowStockCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">نفد المخزون</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-orange-600">{inventoryStats.outOfStockCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">إجمالي الموردين</CardTitle>
              <Truck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-green-600">{inventoryStats.totalSuppliers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-right">قيمة المخزون</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right text-purple-600">
                {inventoryStats.totalValue.toLocaleString('ar-EG')} ج.م
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Form */}
        {showProductForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-right">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-name" className="text-right block mb-2">اسم المنتج *</Label>
                    <Input
                      id="product-name"
                      value={productFormData.name}
                      onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                      placeholder="اسم المنتج"
                      required
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-right block mb-2">الفئة</Label>
                    <Input
                      id="category"
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                      placeholder="مثال: مشروبات، طعام"
                      className="text-right"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-right block mb-2">الوصف</Label>
                  <textarea
                    id="description"
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    placeholder="وصف المنتج"
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-right block mb-2">سعر البيع (ج.م) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                      placeholder="سعر البيع"
                      required
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="staff-price" className="text-right block mb-2">سعر الموظفين (ج.م)</Label>
                    <Input
                      id="staff-price"
                      type="number"
                      step="0.01"
                      value={productFormData.staff_price}
                      onChange={(e) => setProductFormData({ ...productFormData, staff_price: e.target.value })}
                      placeholder="سعر خاص للموظفين"
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost" className="text-right block mb-2">تكلفة الشراء (ج.م)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={productFormData.cost}
                      onChange={(e) => setProductFormData({ ...productFormData, cost: e.target.value })}
                      placeholder="تكلفة الشراء"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stock-quantity" className="text-right block mb-2">الكمية الحالية</Label>
                    <Input
                      id="stock-quantity"
                      type="number"
                      value={productFormData.stock_quantity}
                      onChange={(e) => setProductFormData({ ...productFormData, stock_quantity: e.target.value })}
                      placeholder="الكمية"
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-stock" className="text-right block mb-2">الحد الأدنى للمخزون</Label>
                    <Input
                      id="min-stock"
                      type="number"
                      value={productFormData.min_stock_level}
                      onChange={(e) => setProductFormData({ ...productFormData, min_stock_level: e.target.value })}
                      placeholder="الحد الأدنى"
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit" className="text-right block mb-2">الوحدة</Label>
                    <Input
                      id="unit"
                      value={productFormData.unit}
                      onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                      placeholder="كوب، قطعة، كيلو"
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowProductForm(false);
                    setEditingProduct(null);
                    setProductFormData({
                      name: '', category: '', description: '', price: '', staff_price: '', order_price: '',
                      cost: '', stock_quantity: '', min_stock_level: '', max_stock_level: '',
                      unit: '', barcode: '', expiry_date: ''
                    });
                  }}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Supplier Form */}
        {showSupplierForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-right">
                {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSupplierSubmit} className="space-y-6">
                {/* Basic Supplier Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-name" className="text-right block mb-2">اسم المورد *</Label>
                    <Input
                      id="supplier-name"
                      value={supplierFormData.name}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                      placeholder="اسم المورد"
                      required
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-person" className="text-right block mb-2">الشخص المسؤول *</Label>
                    <Input
                      id="contact-person"
                      value={supplierFormData.contact_person}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })}
                      placeholder="اسم الشخص المسؤول"
                      required
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier-phone" className="text-right block mb-2">رقم الهاتف *</Label>
                    <Input
                      id="supplier-phone"
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                      placeholder="+20101234567"
                      required
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-email" className="text-right block mb-2">البريد الإلكتروني</Label>
                    <Input
                      id="supplier-email"
                      type="email"
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                      placeholder="supplier@example.com"
                      className="text-right"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier-address" className="text-right block mb-2">العنوان</Label>
                  <textarea
                    id="supplier-address"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                    placeholder="عنوان المورد"
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  />
                </div>

                {/* Products Linking Section - هذا هو القسم المطلوب */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-right text-blue-800 flex items-center">
                      <Link className="h-5 w-5 text-blue-600 ml-2" />
                      المنتجات التي يوردها هذا المورد
                    </CardTitle>
                    <p className="text-sm text-blue-600 text-right">
                      اختر المنتجات التي يوردها هذا المورد وحدد تفاصيل التوريد لكل منتج
                    </p>
                  </CardHeader>
                  <CardContent>
                    {allProducts.filter(p => p.branch_id === user?.branch_id).length > 0 ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-300">
                          <p className="text-sm font-medium text-blue-800 text-right mb-3">
                            💡 اختر المنتجات من الفرع الحالي وحدد تفاصيل التوريد:
                          </p>
                          <div className="grid grid-cols-1 gap-4">
                            {allProducts.filter(p => p.branch_id === user?.branch_id).map((product) => {
                              const isLinked = linkedProducts.some(lp => lp.product_id === product.id);
                              const linkedData = linkedProducts.find(lp => lp.product_id === product.id);
                              
                              return (
                                <div 
                                  key={product.id} 
                                  className={`p-4 border-2 rounded-lg transition-all ${
                                    isLinked 
                                      ? 'border-green-300 bg-green-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  {/* Product Selection Header */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      {isLinked && <CheckCircle className="h-5 w-5 text-green-600" />}
                                      <Badge variant={product.stock_quantity <= product.min_stock_level ? 'destructive' : 'secondary'}>
                                        {product.stock_quantity} {product.unit || 'قطعة'}
                                      </Badge>
                                      <span className="font-medium text-green-600">
                                        {product.price} ج.م
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <p className="font-semibold text-lg">{product.name}</p>
                                        <p className="text-sm text-gray-600">{product.category}</p>
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={isLinked}
                                        onChange={() => toggleProductLink(product.id)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>

                                  {/* Product Details Form (shows when product is selected) */}
                                  {isLinked && linkedData && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-green-200">
                                      <div>
                                        <Label className="text-right block mb-1 text-sm">تكلفة الشراء (ج.م)</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={linkedData.cost}
                                          onChange={(e) => updateLinkedProduct(product.id, 'cost', parseFloat(e.target.value) || 0)}
                                          placeholder="التكلفة"
                                          className="text-right"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label className="text-right block mb-1 text-sm">أيام التسليم</Label>
                                        <Input
                                          type="number"
                                          value={linkedData.average_delivery_days}
                                          onChange={(e) => updateLinkedProduct(product.id, 'average_delivery_days', parseInt(e.target.value) || 7)}
                                          placeholder="7"
                                          className="text-right"
                                        />
                                      </div>
                                      
                                      <div className="flex items-center justify-end">
                                        <Label className="text-right text-sm mr-2">مورد مفضل</Label>
                                        <input
                                          type="checkbox"
                                          checked={linkedData.is_preferred}
                                          onChange={(e) => updateLinkedProduct(product.id, 'is_preferred', e.target.checked)}
                                          className="rounded"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label className="text-right block mb-1 text-sm">ملاحظات</Label>
                                        <Input
                                          value={linkedData.notes}
                                          onChange={(e) => updateLinkedProduct(product.id, 'notes', e.target.value)}
                                          placeholder="ملاحظات"
                                          className="text-right"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Summary of linked products */}
                        {linkedProducts.length > 0 && (
                          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                            <h4 className="font-semibold text-green-800 text-right mb-2">
                              ملخص المنتجات المربوطة ({linkedProducts.length}):
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {linkedProducts.map(lp => {
                                const product = allProducts.filter(p => p.branch_id === user?.branch_id).find(p => p.id === lp.product_id);
                                return (
                                  <div key={lp.product_id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-green-700">
                                      {lp.cost > 0 ? `${lp.cost} ج.م` : 'بدون تكلفة'}
                                      {lp.is_preferred && ' ⭐'}
                                    </span>
                                    <span className="text-green-600">{product?.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات في المخزون</h3>
                        <p className="text-gray-600 mb-4">
                          يجب إضافة منتجات أولاً قبل ربطها بالموردين
                          {selectedViewBranchId !== user?.branch_id && 
                            <span className="block text-blue-600 mt-2">
                              💡 لا يمكن إضافة منتجات لفرع آخر - ارجع لفرعك لإضافة منتجات
                            </span>
                          }
                        </p>
                        <Button 
                          type="button"
                          disabled={selectedViewBranchId !== user?.branch_id}
                          onClick={() => {
                            setActiveTab('products');
                            setShowProductForm(true);
                            setShowSupplierForm(false);
                          }}
                          className={selectedViewBranchId !== user?.branch_id ? 
                            "bg-gray-400 cursor-not-allowed" : 
                            "bg-blue-600 hover:bg-blue-700"
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة منتج جديد أولاً
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowSupplierForm(false);
                    setEditingSupplier(null);
                    setSupplierFormData({
                      name: '', contact_person: '', phone: '', email: '', address: ''
                    });
                    setLinkedProducts([]);
                  }}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingSupplier ? 'حفظ التغييرات' : 'إضافة المورد'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleProductEdit(product)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleProductDelete(product.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <div className="flex gap-2 justify-end mt-1">
                        <Badge variant="secondary">{product.category}</Badge>
                        <Badge variant={product.stock_quantity <= product.min_stock_level ? 'destructive' : 'default'}>
                          {product.stock_quantity} {product.unit || 'قطعة'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelectedProductForRecipe(product); setShowRecipeModal(true); }}
                      >
                        إدارة الوصفة
                      </Button>
                      <span className="text-gray-500">الوصفة:</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-green-600">{product.price} ج.م</span>
                      <span className="text-gray-500">سعر البيع:</span>
                    </div>
                    {product.staff_price && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-blue-600">{product.staff_price} ج.م</span>
                        <span className="text-gray-500">سعر الموظفين:</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${
                        product.stock_quantity <= product.min_stock_level ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {product.min_stock_level}
                      </span>
                      <span className="text-gray-500">الحد الأدنى:</span>
                    </div>
                    {product.cost && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{product.cost} ج.م</span>
                        <span className="text-gray-500">تكلفة الشراء:</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => {
              const supplierProductsList = getSupplierProducts(supplier.id);
              
              return (
                <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSupplierEdit(supplier)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSupplierDelete(supplier.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2" dir="ltr">{supplier.phone}</span>
                        <Phone className="h-4 w-4" />
                      </div>
                      {supplier.email && (
                        <div className="flex items-center justify-end text-sm text-gray-600">
                          <span className="mr-2" dir="ltr">{supplier.email}</span>
                          <Mail className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-blue-600">{supplierProductsList.length} منتج</span>
                        <span className="text-gray-500">المنتجات:</span>
                      </div>
                      
                      {/* Display linked products */}
                      {supplierProductsList.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 text-right mb-2">المنتجات المربوطة:</p>
                          <div className="space-y-1">
                            {supplierProductsList.slice(0, 3).map(sp => (
                              <div key={sp.id} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">{sp.cost} ج.م</span>
                                <span className="text-gray-800">{sp.product_name}</span>
                              </div>
                            ))}
                            {supplierProductsList.length > 3 && (
                              <p className="text-xs text-gray-500 text-center">
                                +{supplierProductsList.length - 3} منتج آخر
                              </p>
                            )}
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

        {/* Supplier-Products Tab */}
        {activeTab === 'supplier-products' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">مقارنة الموردين للمنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map(product => {
                    const productSuppliers = supplierProducts
                      .filter(sp => sp.product_id === product.id)
                      .map(sp => {
                        const supplier = suppliers.find(s => s.id === sp.supplier_id);
                        return { ...sp, supplier_name: supplier?.name || 'مورد محذوف' };
                      })
                      .sort((a, b) => a.cost - b.cost);

                    if (productSuppliers.length === 0) return null;

                    return (
                      <Card key={product.id} className="bg-gray-50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <Badge variant={product.stock_quantity <= product.min_stock_level ? 'destructive' : 'secondary'}>
                              {product.stock_quantity} متاح
                            </Badge>
                            <CardTitle className="text-right">{product.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {productSuppliers.map(sp => (
                              <div key={sp.id} className={`p-3 rounded-lg border ${
                                sp.is_preferred ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1">
                                    {sp.is_preferred && <Star className="h-4 w-4 text-yellow-500" />}
                                    <span className="font-semibold text-green-600">{sp.cost} ج.م</span>
                                  </div>
                                  <span className="font-medium">{sp.supplier_name}</span>
                                </div>
                                <p className="text-sm text-gray-600 text-right">
                                  التسليم: {sp.average_delivery_days} أيام
                                </p>
                                {sp.notes && (
                                  <p className="text-xs text-gray-500 text-right mt-1">{sp.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty States */}
        {activeTab === 'products' && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد منتجات في {allBranches.find((b: any) => b.id === selectedViewBranchId)?.name || 'هذا الفرع'}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedViewBranchId === user?.branch_id ? 
                'ابدأ بإضافة المنتج الأول لهذا الفرع' : 
                'لا توجد منتجات في هذا الفرع بعد'
              }
            </p>
            {selectedViewBranchId === user?.branch_id && (
            <Button onClick={() => setShowProductForm(true)}>
              إضافة منتج جديد
            </Button>
            )}
          </div>
        )}

        {activeTab === 'suppliers' && suppliers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Truck className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد موردين في {allBranches.find((b: any) => b.id === selectedViewBranchId)?.name || 'هذا الفرع'}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedViewBranchId === user?.branch_id ? 
                'ابدأ بإضافة المورد الأول لهذا الفرع' : 
                'لا توجد موردين في هذا الفرع بعد'
              }
            </p>
            {selectedViewBranchId === user?.branch_id && (
            <Button onClick={() => setShowSupplierForm(true)}>
              إضافة مورد جديد
            </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Product Recipe Modal */}
      <ProductRecipeModal
        isOpen={showRecipeModal}
        onClose={() => {
          setShowRecipeModal(false);
          setSelectedProductForRecipe(null);
        }}
        product={selectedProductForRecipe}
        allProducts={products}
      />
    </>
  );
};

export default Inventory;