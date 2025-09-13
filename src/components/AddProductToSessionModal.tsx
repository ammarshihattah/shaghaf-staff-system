import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, Package, Plus, Minus, ShoppingCart, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { 
  Coffee, Sandwich, Cake, Cookie, Apple, Wine, 
  IceCream, Pizza, Soup, Candy, Beef, Fish 
} from 'lucide-react';
import { Product } from '../types';

interface AddProductToSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  sessionId: string;
  onAddProductsBatch: (sessionId: string, products: Array<{
    productId: string;
    quantity: number;
    individualName?: string;
    customPrice?: number;
  }>) => void;
}

const AddProductToSessionModal: React.FC<AddProductToSessionModalProps> = ({
  isOpen,
  onClose,
  products,
  sessionId,
  onAddProductsBatch
}) => {
  const [selectedProducts, setSelectedProducts] = useState<{[productId: string]: { quantity: number; individualName?: string; customPrice?: number }}>({});
  const [individualName, setIndividualName] = useState('');
  const [useCustomPrices, setUseCustomPrices] = useState(false);

  // Helper function to get appropriate icon for each product
  const getProductIcon = (product: Product) => {
    const name = product.name.toLowerCase();
    const category = product.category?.toLowerCase() || '';
    
    // Coffee and tea products
    if (name.includes('قهوة') || name.includes('coffee') || name.includes('شاي') || name.includes('tea')) {
      return <Coffee className="h-8 w-8 text-amber-600" />;
    }
    
    // Sandwiches and wraps
    if (name.includes('ساندويتش') || name.includes('sandwich') || name.includes('توست') || category.includes('طعام')) {
      return <Sandwich className="h-8 w-8 text-orange-600" />;
    }
    
    // Juices and beverages
    if (name.includes('عصير') || name.includes('juice') || name.includes('مشروب') || category.includes('مشروبات')) {
      return <Wine className="h-8 w-8 text-blue-600" />;
    }
    
    // Desserts and sweets
    if (name.includes('حلويات') || name.includes('كيك') || name.includes('cake') || name.includes('آيس كريم')) {
      return <Cake className="h-8 w-8 text-pink-600" />;
    }
    
    // Snacks
    if (name.includes('وجبات خفيفة') || name.includes('snack') || name.includes('شيبس')) {
      return <Cookie className="h-8 w-8 text-yellow-600" />;
    }
    
    // Fruits
    if (name.includes('فاكهة') || name.includes('fruit') || name.includes('تفاح') || name.includes('موز')) {
      return <Apple className="h-8 w-8 text-green-600" />;
    }
    
    // Default fallback
    return <Package className="h-8 w-8 text-purple-600" />;
  };

  // Helper function to get background color based on product type
  const getProductBackgroundColor = (product: Product) => {
    const name = product.name.toLowerCase();
    const category = product.category?.toLowerCase() || '';
    
    if (name.includes('قهوة') || name.includes('coffee') || name.includes('شاي')) {
      return 'from-amber-50 to-orange-50 border-amber-200';
    }
    if (category.includes('طعام') || name.includes('ساندويتش')) {
      return 'from-orange-50 to-red-50 border-orange-200';
    }
    if (category.includes('مشروبات') || name.includes('عصير')) {
      return 'from-blue-50 to-cyan-50 border-blue-200';
    }
    if (name.includes('حلويات') || name.includes('كيك')) {
      return 'from-pink-50 to-purple-50 border-pink-200';
    }
    
    return 'from-gray-50 to-slate-50 border-gray-200';
  };
  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      const { [productId]: removed, ...rest } = selectedProducts;
      setSelectedProducts(rest);
    } else {
      setSelectedProducts(prev => ({
        ...prev,
        [productId]: {
          quantity,
          individualName: individualName.trim() || undefined,
          customPrice: prev[productId]?.customPrice
        }
      }));
    }
  };

  const updateProductCustomPrice = (productId: string, customPrice: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || customPrice < 0) return;
    
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        customPrice: customPrice
      }
    }));
  };

  const handleAddProducts = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const productsToAdd = Object.entries(selectedProducts);
    if (productsToAdd.length === 0) {
      alert('يرجى اختيار منتج واحد على الأقل');
      return;
    }

    // التحقق من توفر المخزون لجميع المنتجات أولاً
    const validationErrors = [];
    const validProducts = [];
    
    for (const [productId, data] of productsToAdd) {
      const product = products.find(p => p.id === productId);
      if (!product) {
        validationErrors.push('منتج غير موجود');
        continue;
      }
      
      if (product.stock_quantity < data.quantity) {
        validationErrors.push(`${product.name} - الكمية المطلوبة (${data.quantity}) أكبر من المتوفر (${product.stock_quantity})`);
        continue;
      }
      
      validProducts.push({
        productId,
        quantity: data.quantity,
        individualName: data.individualName,
        customPrice: data.customPrice
      });
    }
    
    // عرض أخطاء التحقق إن وجدت
    if (validationErrors.length > 0) {
      alert(`تحذيرات:\n${validationErrors.join('\n')}`);
    }
    
    // إذا كانت هناك منتجات صالحة، قم بإضافتها
    if (validProducts.length > 0) {
      console.log('🛒 إضافة منتجات للجلسة:', validProducts);
      onAddProductsBatch(sessionId, validProducts);
      
      // إعادة تعيين الحالة وإغلاق النافذة
      setSelectedProducts({});
      setIndividualName('');
      onClose();
      
      const totalQuantity = validProducts.reduce((sum, p) => sum + p.quantity, 0);
      alert(`تم إضافة ${totalQuantity} قطعة من ${validProducts.length} منتج بنجاح! 🎉`);
    } else {
      alert('لا توجد منتجات صالحة للإضافة');
    }

  };

  const getTotalCost = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, data]) => {
      const product = products.find(p => p.id === productId);
      const unitPrice = data.customPrice !== undefined ? data.customPrice : (product ? product.price : 0);
      return total + (unitPrice * data.quantity);
    }, 0);
  };

  const getSelectedCount = () => {
    return Object.values(selectedProducts).reduce((sum, data) => sum + data.quantity, 0);
  };

  if (!isOpen) return null;

  // Show all active products in one list
  const allActiveProducts = products.filter(product => product.is_active);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right">
              إضافة منتجات إلى الجلسة
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Individual Name Input */}
          <div className="mb-6">
            <Label htmlFor="individual-name" className="text-right block mb-2">
              اسم الشخص (اختياري):
            </Label>
            <Input
              id="individual-name"
              value={individualName}
              onChange={(e) => setIndividualName(e.target.value)}
              placeholder="اسم الشخص الذي طلب المنتجات"
              className="text-right"
            />
            <p className="text-xs text-gray-500 text-right mt-1">
              إذا تُرك فارغاً، ستُضاف المنتجات للجلسة بشكل عام
            </p>
          </div>

          {/* Custom Pricing Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-end gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Label htmlFor="custom-pricing" className="text-right font-medium text-yellow-800">
                استخدام أسعار مخصصة (للخصومات أو الأسعار الخاصة)
              </Label>
              <input
                id="custom-pricing"
                type="checkbox"
                checked={useCustomPrices}
                onChange={(e) => setUseCustomPrices(e.target.checked)}
                className="h-5 w-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            {useCustomPrices && (
              <p className="text-sm text-yellow-700 text-right mt-2 bg-yellow-100 p-2 rounded">
                💡 عند التفعيل، يمكنك تعديل سعر كل منتج بشكل منفصل
              </p>
            )}
          </div>

          {/* All Products */}
          <div className="mb-6">
            <h4 className="font-semibold text-right mb-4 text-blue-800">جميع المنتجات:</h4>
            {allActiveProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allActiveProducts.map((product) => {
                  const selected = selectedProducts[product.id];
                  const maxQuantity = Math.min(product.stock_quantity, 20); // حد أقصى 20 قطعة
                  const isOutOfStock = product.stock_quantity <= 0;
                  const currentPrice = selected?.customPrice !== undefined ? selected.customPrice : product.price;

                  return (
                    <div 
                      key={product.id} 
                      className={`p-6 rounded-xl border-2 transition-all duration-300 bg-gradient-to-br ${
                        isOutOfStock ? 'opacity-60 cursor-not-allowed' : ''
                      } ${
                        selected 
                          ? 'ring-2 ring-purple-400 shadow-lg transform scale-105' 
                          : 'hover:shadow-md hover:scale-102'
                      } ${getProductBackgroundColor(product)}`}
                    >
                      {/* Product Header with Icon */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Badge className={isOutOfStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                            {isOutOfStock ? 'نفد المخزون' : `${product.stock_quantity} متاح`}
                          </Badge>
                          <div className="flex flex-col items-start">
                            {useCustomPrices && selected ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={selected.customPrice !== undefined ? selected.customPrice : product.price}
                                  onChange={(e) => updateProductCustomPrice(product.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 h-6 text-xs text-right"
                                />
                                <span className="text-xs text-green-600">ج.م</span>
                              </div>
                            ) : (
                              <span className={`font-semibold ${isOutOfStock ? 'text-gray-500 line-through' : 'text-green-600'}`}>
                                {currentPrice.toFixed(2)} ج.م
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className={`font-semibold text-lg ${isOutOfStock ? 'text-gray-500' : 'text-gray-800'}`}>
                              {product.name}
                            </p>
                            <p className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                              {product.category}
                            </p>
                          </div>
                          <div className={`flex-shrink-0 ${isOutOfStock ? 'opacity-50' : ''}`}>
                            {getProductIcon(product)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          onClick={() => updateProductQuantity(product.id, Math.max(0, (selected?.quantity || 0) - 1))}
                          disabled={isOutOfStock || !selected || selected.quantity <= 0}
                          size="icon"
                          variant="outline" 
                          className="h-10 w-10 rounded-full border-2 hover:bg-red-50 hover:border-red-300 disabled:opacity-30"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex flex-col items-center bg-white rounded-lg p-3 shadow-sm border-2 border-purple-200 min-w-[4rem]">
                          <span className="text-2xl font-bold text-purple-700 min-w-[3rem] text-center">
                            {selected?.quantity || 0}
                          </span>
                          <span className="text-xs text-purple-600 font-medium">{product.unit || 'قطعة'}</span>
                        </div>
                        
                        <Button
                          type="button"
                          onClick={() => updateProductQuantity(product.id, Math.min(maxQuantity, (selected?.quantity || 0) + 1))}
                          disabled={isOutOfStock || (selected && selected.quantity >= maxQuantity)}
                          size="icon"
                          variant="outline" 
                          className="h-10 w-10 rounded-full border-2 hover:bg-green-50 hover:border-green-300 disabled:opacity-30"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Total for this product */}
                      {selected && selected.quantity > 0 && (
                        <div className="mt-4 text-center">
                          <div className="bg-white rounded-lg p-2 border-2 border-purple-200">
                            <span className="text-lg font-bold text-purple-800">
                            الإجمالي: {(currentPrice * selected.quantity).toFixed(2)} ج.م
                            </span>
                            {useCustomPrices && selected.customPrice !== undefined && selected.customPrice !== product.price && (
                              <p className="text-xs text-orange-600 mt-1">
                                السعر الأصلي: {(product.price * selected.quantity).toFixed(2)} ج.م
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Out of Stock Message */}
                      {isOutOfStock && (
                        <div className="mt-4 text-center">
                          <div className="bg-red-100 rounded-lg p-2 border-2 border-red-200">
                            <span className="text-sm font-medium text-red-800">
                              غير متاح حالياً
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>لا توجد منتجات متاحة في المخزون</p>
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {getSelectedCount() > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200 mb-6">
              <h4 className="font-semibold text-purple-800 text-right mb-3">
                <ShoppingCart className="h-5 w-5 inline mr-2" />
                ملخص المنتجات المختارة:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">{getSelectedCount()}</div>
                  <p className="text-sm text-purple-600">إجمالي القطع</p>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">{Object.keys(selectedProducts).length}</div>
                  <p className="text-sm text-purple-600">أصناف مختلفة</p>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-800">{getTotalCost().toFixed(2)} ج.م</div>
                  <p className="text-sm text-purple-600">التكلفة الإجمالية</p>
                </div>
              </div>
              
              {individualName.trim() && (
                <div className="mt-3 text-center">
                  <Badge className="bg-blue-100 text-blue-800">
                    للشخص: {individualName.trim()}
                  </Badge>
                </div>
              )}
              
              {/* Show custom pricing summary */}
              {useCustomPrices && Object.entries(selectedProducts).some(([productId, data]) => data.customPrice !== undefined) && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                  <p className="text-sm font-semibold text-yellow-800 text-right mb-2">أسعار مخصصة:</p>
                  <div className="space-y-1">
                    {Object.entries(selectedProducts)
                      .filter(([_, data]) => data.customPrice !== undefined)
                      .map(([productId, data]) => {
                        const product = products.find(p => p.id === productId);
                        return (
                          <div key={productId} className="flex justify-between text-xs text-yellow-700">
                            <span>{data.customPrice?.toFixed(2)} ج.م (بدلاً من {product?.price.toFixed(2)} ج.م)</span>
                            <span>{product?.name}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleAddProducts}
              className="bg-purple-600 hover:bg-purple-700 text-lg px-8"
              disabled={getSelectedCount() === 0}
            >
              <Package className="h-5 w-5 mr-2" />
              إضافة المنتجات ({getSelectedCount()})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductToSessionModal;