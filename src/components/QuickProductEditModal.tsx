import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  X, Edit, Save, RotateCcw, DollarSign, Package, 
  User, Plus, Minus, AlertTriangle, CheckCircle, Coffee
} from 'lucide-react';
import { InvoiceItem, Product } from '../types';

interface QuickProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InvoiceItem | null;
  availableProducts: Product[];
  onUpdateItem: (updatedItem: InvoiceItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const QuickProductEditModal: React.FC<QuickProductEditModalProps> = ({
  isOpen,
  onClose,
  item,
  availableProducts,
  onUpdateItem,
  onDeleteItem
}) => {
  const [editData, setEditData] = useState({
    quantity: 1,
    unit_price: 0,
    individual_name: ''
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Initialize data when item changes
  React.useEffect(() => {
    if (item) {
      setEditData({
        quantity: item.quantity,
        unit_price: item.unit_price,
        individual_name: item.individual_name || ''
      });
      setHasChanges(false);
    }
  }, [item]);

  const handleDataChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!item) return;

    if (editData.quantity <= 0) {
      alert('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    if (editData.unit_price < 0) {
      alert('السعر لا يمكن أن يكون سالباً');
      return;
    }

    const updatedItem: InvoiceItem = {
      ...item,
      quantity: editData.quantity,
      unit_price: editData.unit_price,
      total_price: editData.quantity * editData.unit_price,
      individual_name: editData.individual_name.trim() || undefined
    };

    onUpdateItem(updatedItem);
    setHasChanges(false);
    alert('تم تحديث المنتج بنجاح! ✅');
  };

  const handleDelete = () => {
    if (!item) return;
    
    if (confirm(`هل أنت متأكد من حذف "${item.name}" من الجلسة؟`)) {
      onDeleteItem(item.id);
      onClose();
    }
  };

  const resetChanges = () => {
    if (item) {
      setEditData({
        quantity: item.quantity,
        unit_price: item.unit_price,
        individual_name: item.individual_name || ''
      });
      setHasChanges(false);
    }
  };

  const getProductIcon = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes('قهوة') || name.includes('coffee') || name.includes('شاي')) {
      return <Coffee className="h-6 w-6 text-amber-600" />;
    }
    return <Package className="h-6 w-6 text-purple-600" />;
  };

  const getOriginalProduct = () => {
    return availableProducts.find(p => p.id === item?.related_id);
  };

  if (!isOpen || !item) return null;

  const originalProduct = getOriginalProduct();
  const totalPrice = editData.quantity * editData.unit_price;
  const originalTotal = item.quantity * item.unit_price;
  const priceDifference = totalPrice - originalTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">تعديل سريع - {item.name}</span>
              <Edit className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Info */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-end gap-4">
              <div className="text-right">
                <h4 className="font-semibold text-lg text-purple-800">{item.name}</h4>
                {originalProduct && (
                  <div className="flex gap-2 justify-end mt-1">
                    <Badge className="bg-purple-100 text-purple-800">{originalProduct.category}</Badge>
                    <Badge className="bg-gray-100 text-gray-800">
                      متاح: {originalProduct.stock_quantity} {originalProduct.unit}
                    </Badge>
                  </div>
                )}
                {originalProduct && (
                  <p className="text-sm text-purple-600 mt-1">
                    السعر الأصلي: {originalProduct.price.toFixed(2)} ج.م
                  </p>
                )}
              </div>
              {getProductIcon(item.name)}
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
            {/* Quantity */}
            <div>
              <Label className="text-right block mb-2 font-medium">الكمية:</Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  onClick={() => handleDataChange('quantity', Math.max(1, editData.quantity - 1))}
                  disabled={editData.quantity <= 1}
                  size="icon"
                  variant="outline"
                  className="h-10 w-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <div className="text-center bg-blue-50 p-3 rounded-lg border-2 border-blue-200 min-w-[100px]">
                  <div className="text-2xl font-bold text-blue-600">{editData.quantity}</div>
                  <p className="text-sm text-blue-600">{originalProduct?.unit || 'قطعة'}</p>
                </div>
                
                <Button
                  type="button"
                  onClick={() => handleDataChange('quantity', editData.quantity + 1)}
                  disabled={originalProduct && editData.quantity >= originalProduct.stock_quantity}
                  size="icon"
                  variant="outline"
                  className="h-10 w-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Unit Price */}
            <div>
              <Label htmlFor="unit-price" className="text-right block mb-2 font-medium">السعر للوحدة:</Label>
              <div className="relative">
                <Input
                  id="unit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editData.unit_price}
                  onChange={(e) => handleDataChange('unit_price', parseFloat(e.target.value) || 0)}
                  className="text-right font-semibold text-lg pr-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">ج.م</span>
                </div>
              </div>
              {originalProduct && editData.unit_price !== originalProduct.price && (
                <p className={`text-sm text-right mt-1 ${
                  editData.unit_price > originalProduct.price ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {editData.unit_price > originalProduct.price ? 'زيادة' : 'خصم'}: 
                  {Math.abs(editData.unit_price - originalProduct.price).toFixed(2)} ج.م
                </p>
              )}
            </div>

            {/* Individual Name */}
            <div>
              <Label htmlFor="individual-name" className="text-right block mb-2 font-medium">للشخص:</Label>
              <Input
                id="individual-name"
                value={editData.individual_name}
                onChange={(e) => handleDataChange('individual_name', e.target.value)}
                placeholder="اسم الشخص (اختياري)"
                className="text-right"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-lg font-semibold text-gray-600">{originalTotal.toFixed(2)} ج.م</div>
              <p className="text-sm text-gray-600">الإجمالي الأصلي</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-lg font-semibold text-blue-600">{totalPrice.toFixed(2)} ج.م</div>
              <p className="text-sm text-blue-600">الإجمالي الجديد</p>
            </div>
            
            <div className={`p-4 rounded-lg text-center ${
              priceDifference > 0 ? 'bg-orange-50 border border-orange-200' : 
              priceDifference < 0 ? 'bg-green-50 border border-green-200' : 
              'bg-gray-50'
            }`}>
              <div className={`text-lg font-semibold ${
                priceDifference > 0 ? 'text-orange-600' : 
                priceDifference < 0 ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(2)} ج.م
              </div>
              <p className={`text-sm ${
                priceDifference > 0 ? 'text-orange-600' : 
                priceDifference < 0 ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {priceDifference > 0 ? 'زيادة' : priceDifference < 0 ? 'توفير' : 'لا يوجد تغيير'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              حذف من الجلسة
            </Button>
            
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
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ التغييرات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickProductEditModal;