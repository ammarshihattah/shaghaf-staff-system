import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, Package, Plus, Minus, FlaskConical, Trash2, CheckCircle } from 'lucide-react';
import { Product, ProductRecipe } from '../types';
import { apiClient } from '../lib/api';

interface ProductRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // The finished product for which we are defining the recipe
  allProducts: Product[]; // All available products (for components selection)
}

const ProductRecipeModal: React.FC<ProductRecipeModalProps> = ({
  isOpen,
  onClose,
  product,
  allProducts,
}) => {
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [componentProductId, setComponentProductId] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter products to be used as components (cannot be the product itself)
  const availableComponents = allProducts.filter(p => p.id !== product?.id);

  useEffect(() => {
    if (isOpen && product) {
      fetchRecipes(product.id);
    } else {
      // Reset state when modal closes
      setRecipes([]);
      setComponentProductId('');
      setQuantityNeeded('');
      setError(null);
    }
  }, [isOpen, product]);

  const fetchRecipes = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRecipes = await apiClient.getProductRecipes(productId);
      setRecipes(fetchedRecipes);
    } catch (err) {
      console.error('Error fetching product recipes:', err);
      setError('فشل في تحميل الوصفات. يرجى المحاولة مرة أخرى.');
      // Fallback to mock data if API fails
      setRecipes([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !componentProductId || !quantityNeeded) {
      setError('يرجى ملء جميع حقول المكونات.');
      return;
    }
    const qty = parseFloat(quantityNeeded);
    if (isNaN(qty) || qty <= 0) {
      setError('الكمية المطلوبة يجب أن تكون رقماً موجباً.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newRecipe = await apiClient.addProductRecipe(product.id, {
        component_product_id: componentProductId,
        quantity_needed: qty,
      });
      setRecipes([...recipes, { ...newRecipe, component_name: availableComponents.find(c => c.id === newRecipe.component_product_id)?.name || 'غير معروف' }]);
      setComponentProductId('');
      setQuantityNeeded('');
    } catch (err: any) {
      console.error('Error adding component:', err);
      setError(err.message || 'فشل في إضافة المكون. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComponent = async (recipeId: string) => {
    if (!product || !confirm('هل أنت متأكد من حذف هذا المكون من الوصفة؟')) return;

    setLoading(true);
    setError(null);
    try {
      await apiClient.deleteProductRecipe(product.id, recipeId);
      setRecipes(recipes.filter(r => r.id !== recipeId));
    } catch (err: any) {
      console.error('Error deleting component:', err);
      setError(err.message || 'فشل في حذف المكون. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">وصفة المنتج: {product.name}</span>
              <FlaskConical className="h-5 w-5 text-purple-600" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-right mb-4">
              {error}
            </div>
          )}

          {/* Product Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{product.category}</Badge>
              <div className="text-right">
                <p className="font-semibold text-lg text-blue-800">{product.name}</p>
                <p className="text-sm text-blue-600">
                  المخزون الحالي: {product.stock_quantity} {product.unit || 'قطعة'}
                </p>
              </div>
            </div>
          </div>

          {/* Add Component Form */}
          <form onSubmit={handleAddComponent} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold text-right mb-3 flex items-center justify-end">
              <span className="mr-2">إضافة مكون جديد للوصفة</span>
              <Plus className="h-4 w-4 text-green-600" />
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="component-product" className="text-right block mb-2">المكون (منتج من المخزون) *</Label>
                <select
                  id="component-product"
                  value={componentProductId}
                  onChange={(e) => setComponentProductId(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                >
                  <option value="">اختر مكون</option>
                  {availableComponents.map(comp => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.stock_quantity} {comp.unit || 'قطعة'} متاح)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="quantity-needed" className="text-right block mb-2">الكمية المطلوبة *</Label>
                <Input
                  id="quantity-needed"
                  type="number"
                  step="0.01"
                  value={quantityNeeded}
                  onChange={(e) => setQuantityNeeded(e.target.value)}
                  placeholder="مثال: 0.5"
                  required
                  className="text-right"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الإضافة...' : 'إضافة المكون'}
              </Button>
            </div>
          </form>

          {/* Current Recipe Components */}
          <h4 className="font-semibold text-right mb-3 flex items-center justify-end">
            <span className="mr-2">مكونات وصفة {product.name}</span>
            <Package className="h-4 w-4 text-purple-600" />
          </h4>
          {loading && recipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">جاري تحميل المكونات...</div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد مكونات معرفة لهذا المنتج بعد.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.map(recipe => (
                <div key={recipe.id} className="p-4 border rounded-lg bg-white flex items-center justify-between">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteComponent(recipe.id)}
                    className="text-red-600 hover:bg-red-50"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{recipe.component_name}</p>
                    <p className="text-gray-600">
                      الكمية المطلوبة: <span className="font-medium">{recipe.quantity_needed} {recipe.component_unit || 'قطعة'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductRecipeModal;