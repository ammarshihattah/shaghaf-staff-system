import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  X, Package, Edit, Trash2, Plus, Minus, Save, RotateCcw, 
  AlertTriangle, CheckCircle, Coffee, User, DollarSign,
  Calculator, ShoppingCart, Receipt, Clock
} from 'lucide-react';
import { InvoiceItem, Product } from '../types';
import { formatTime } from '../lib/utils';

interface EditSessionProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionItems: InvoiceItem[];
  availableProducts: Product[];
  onUpdateSessionItems: (sessionId: string, updatedItems: InvoiceItem[]) => void;
  sessionInfo: {
    client_name: string;
    current_individuals_count: number;
    session_duration_seconds: number;
  };
}

const EditSessionProductsModal: React.FC<EditSessionProductsModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionItems,
  availableProducts,
  onUpdateSessionItems,
  sessionInfo
}) => {
  const [editableItems, setEditableItems] = useState<InvoiceItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductData, setNewProductData] = useState({
    product_id: '',
    quantity: 1,
    individual_name: '',
    custom_price: ''
  });

  // Initialize editable items when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditableItems([...sessionItems]);
      setHasChanges(false);
      setShowAddForm(false);
      setNewProductData({ product_id: '', quantity: 1, individual_name: '', custom_price: '' });
    }
  }, [isOpen, sessionItems]);

  // Get product icon (same logic as AddProductToSessionModal)
  const getProductIcon = (itemName: string) => {
    const name = itemName.toLowerCase();
    
    if (name.includes('قهوة') || name.includes('coffee') || name.includes('شاي') || name.includes('tea')) {
      return <Coffee className="h-5 w-5 text-amber-600" />;
    }
    
    return <Package className="h-5 w-5 text-purple-600" />;
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    setEditableItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            quantity: newQuantity, 
            total_price: newQuantity * item.unit_price 
          }
        : item
    ));
    setHasChanges(true);
  };

  // Update item price
  const updateItemPrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return;
    
    setEditableItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            unit_price: newPrice, 
            total_price: item.quantity * newPrice 
          }
        : item
    ));
    setHasChanges(true);
  };

  // Update individual name
  const updateIndividualName = (itemId: string, newName: string) => {
    setEditableItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, individual_name: newName }
        : item
    ));
    setHasChanges(true);
  };

  // Remove item
  const removeItem = (itemId: string) => {
    const item = editableItems.find(item => item.id === itemId);
    if (!item) return;
    
    if (confirm(`هل أنت متأكد من حذف "${item.name}" من الجلسة؟`)) {
      setEditableItems(prev => prev.filter(item => item.id !== itemId));
      setHasChanges(true);
    }
  };

  // Add new product to session
  const addNewProduct = () => {
    if (!newProductData.product_id) {
      alert('يرجى اختيار منتج');
      return;
    }
    
    const product = availableProducts.find(p => p.id === newProductData.product_id);
    if (!product) {
      alert('المنتج المختار غير موجود');
      return;
    }
    
    if (product.stock_quantity < newProductData.quantity) {
      alert(`الكمية المطلوبة (${newProductData.quantity}) أكبر من المتوفر (${product.stock_quantity})`);
      return;
    }

    // Use custom price if provided, otherwise use product price
    const unitPrice = newProductData.custom_price ? 
      parseFloat(newProductData.custom_price) : 
      product.price;
    
    if (isNaN(unitPrice) || unitPrice < 0) {
      alert('يرجى إدخال سعر صحيح');
      return;
    }

    const newItem: InvoiceItem = {
      id: `session-${sessionId}-${Date.now()}`,
      invoice_id: `INV-${sessionId}`,
      item_type: 'product',
      related_id: product.id,
      name: product.name,
      quantity: newProductData.quantity,
      unit_price: unitPrice,
      total_price: newProductData.quantity * unitPrice,
      individual_name: newProductData.individual_name.trim() || undefined,
      created_at: new Date().toISOString()
    };

    setEditableItems(prev => [...prev, newItem]);
    setHasChanges(true);
    setShowAddForm(false);
    setNewProductData({ product_id: '', quantity: 1, individual_name: '', custom_price: '' });
  };

  // Save changes
  const saveChanges = () => {
    if (!hasChanges) return;
    
    onUpdateSessionItems(sessionId, editableItems);
    setHasChanges(false);
    alert('تم حفظ التغييرات بنجاح! ✅');
  };

  // Reset changes
  const resetChanges = () => {
    setEditableItems([...sessionItems]);
    setHasChanges(false);
    setShowAddForm(false);
  };

  // Calculate totals
  const getTotalCost = () => {
    return editableItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const getTotalQuantity = () => {
    return editableItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getOriginalTotal = () => {
    return sessionItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const getCostDifference = () => {
    return getTotalCost() - getOriginalTotal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">تعديل منتجات الجلسة - {sessionInfo.client_name}</span>
              <Edit className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Session Info Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
            <h4 className="font-semibold text-blue-800 text-right mb-3">معلومات الجلسة:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-semibold text-blue-800">{formatTime(sessionInfo.session_duration_seconds)}</div>
                <p className="text-sm text-blue-600">مدة الجلسة</p>
              </div>
              
              <div>
                <User className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-semibold text-blue-800">{sessionInfo.current_individuals_count}</div>
                <p className="text-sm text-blue-600">عدد الأشخاص</p>
              </div>
              
              <div>
                <Package className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-semibold text-blue-800">{editableItems.length}</div>
                <p className="text-sm text-blue-600">عدد المنتجات</p>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
              <div className="text-xl font-bold text-green-600">{getOriginalTotal().toFixed(2)} ج.م</div>
              <p className="text-sm text-green-600">التكلفة الأصلية</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
              <div className="text-xl font-bold text-blue-600">{getTotalCost().toFixed(2)} ج.م</div>
              <p className="text-sm text-blue-600">التكلفة الحالية</p>
            </div>
            
            <div className={`p-4 rounded-lg border text-center ${
              getCostDifference() > 0 ? 'bg-orange-50 border-orange-200' : 
              getCostDifference() < 0 ? 'bg-red-50 border-red-200' : 
              'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xl font-bold ${
                getCostDifference() > 0 ? 'text-orange-600' : 
                getCostDifference() < 0 ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {getCostDifference() > 0 ? '+' : ''}{getCostDifference().toFixed(2)} ج.م
              </div>
              <p className={`text-sm ${
                getCostDifference() > 0 ? 'text-orange-600' : 
                getCostDifference() < 0 ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                الفرق
              </p>
            </div>
          </div>

          {/* Add New Product Form */}
          {showAddForm && (
            <Card className="mb-6 bg-green-50 border border-green-200">
              <CardHeader>
                <CardTitle className="text-right flex items-center text-green-800">
                  <Plus className="h-5 w-5 text-green-600 ml-2" />
                  إضافة منتج جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="new-product" className="text-right block mb-2">المنتج *</Label>
                    <select
                      id="new-product"
                      value={newProductData.product_id}
                      onChange={(e) => {
                        const productId = e.target.value;
                        const product = availableProducts.find(p => p.id === productId);
                        setNewProductData({ 
                          ...newProductData, 
                          product_id: productId,
                          custom_price: product ? product.price.toString() : ''
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md text-right"
                    >
                      <option value="">اختر منتج</option>
                      {availableProducts.filter(p => p.is_active && p.stock_quantity > 0).map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.price} ج.م (متاح: {product.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="new-quantity" className="text-right block mb-2">الكمية *</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => setNewProductData(prev => ({ 
                          ...prev, 
                          quantity: Math.max(1, prev.quantity - 1) 
                        }))}
                        disabled={newProductData.quantity <= 1}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      
                      <Input
                        id="new-quantity"
                        type="number"
                        min="1"
                        value={newProductData.quantity}
                        onChange={(e) => setNewProductData({ 
                          ...newProductData, 
                          quantity: Math.max(1, parseInt(e.target.value) || 1) 
                        })}
                        className="text-center"
                      />
                      
                      <Button
                        type="button"
                        onClick={() => setNewProductData(prev => ({ 
                          ...prev, 
                          quantity: prev.quantity + 1 
                        }))}
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="new-custom-price" className="text-right block mb-2">سعر خاص (ج.م)</Label>
                    <Input
                      id="new-custom-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProductData.custom_price}
                      onChange={(e) => setNewProductData({ ...newProductData, custom_price: e.target.value })}
                      placeholder="السعر الافتراضي"
                      className="text-right"
                    />
                    <p className="text-xs text-gray-500 text-right mt-1">
                      اتركه فارغاً لاستخدام السعر الافتراضي
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="new-individual" className="text-right block mb-2">للشخص</Label>
                    <Input
                      id="new-individual"
                      value={newProductData.individual_name}
                      onChange={(e) => setNewProductData({ ...newProductData, individual_name: e.target.value })}
                      placeholder="اسم الشخص (اختياري)"
                      className="text-right"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end mt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="button" 
                    onClick={addNewProduct}
                    disabled={!newProductData.product_id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة للجلسة
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Items List */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة منتج جديد
              </Button>
              <h4 className="font-semibold text-right text-gray-800 text-lg">
                المنتجات في الجلسة ({editableItems.length}):
              </h4>
            </div>

            {editableItems.length > 0 ? (
              <div className="space-y-4">
                {editableItems.map((item, index) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow border-l-4 border-l-purple-400">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:bg-red-50"
                            title="حذف المنتج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <h5 className="font-semibold text-lg text-gray-800">{item.name}</h5>
                            {item.individual_name && (
                              <Badge className="bg-gray-100 text-gray-800 mt-1">
                                <User className="h-3 w-3 mr-1" />
                                {item.individual_name}
                              </Badge>
                            )}
                          </div>
                          {getProductIcon(item.name)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Quantity Controls */}
                        <div>
                          <Label className="text-right block mb-2 font-medium">الكمية:</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="text-center font-semibold"
                            />
                            
                            <Button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Unit Price */}
                        <div>
                          <Label className="text-right block mb-2 font-medium">السعر/الوحدة:</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                              className="text-right font-semibold pr-8"
                            />
                            <DollarSign className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        
                        {/* Individual Name */}
                        <div>
                          <Label className="text-right block mb-2 font-medium">للشخص:</Label>
                          <Input
                            value={item.individual_name || ''}
                            onChange={(e) => updateIndividualName(item.id, e.target.value)}
                            placeholder="اسم الشخص (اختياري)"
                            className="text-right"
                          />
                        </div>
                        
                        {/* Total Price Display */}
                        <div>
                          <Label className="text-right block mb-2 font-medium">الإجمالي:</Label>
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                            <span className="text-xl font-bold text-purple-600">
                              {item.total_price.toFixed(2)} ج.م
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد منتجات في الجلسة</h3>
                <p className="text-gray-500 mb-4">اضغط "إضافة منتج جديد" لبدء إضافة المنتجات</p>
              </div>
            )}
          </div>

          {/* Changes Preview */}
          {hasChanges && (
            <Card className="mb-6 bg-yellow-50 border border-yellow-200">
              <CardHeader>
                <CardTitle className="text-right flex items-center text-yellow-800">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 ml-2" />
                  معاينة التغييرات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-800">{editableItems.length}</div>
                    <p className="text-sm text-gray-600">عدد المنتجات</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{getTotalQuantity()}</div>
                    <p className="text-sm text-gray-600">إجمالي الكمية</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-semibold text-green-600">{getTotalCost().toFixed(2)} ج.م</div>
                    <p className="text-sm text-gray-600">التكلفة الجديدة</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      getCostDifference() > 0 ? 'text-orange-600' : 
                      getCostDifference() < 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {getCostDifference() > 0 ? '+' : ''}{getCostDifference().toFixed(2)} ج.م
                    </div>
                    <p className="text-sm text-gray-600">
                      {getCostDifference() > 0 ? 'زيادة' : getCostDifference() < 0 ? 'توفير' : 'لا يوجد تغيير'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            
            {hasChanges && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetChanges}
                className="text-orange-600 hover:bg-orange-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                إعادة تعيين
              </Button>
            )}
            
            <Button 
              onClick={saveChanges}
              disabled={!hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ التغييرات ({editableItems.length} منتجات)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSessionProductsModal;