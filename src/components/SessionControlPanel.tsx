import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Play, Pause, Square, Users, Clock, Package, DollarSign,
  Edit, Trash2, Plus, UserPlus, Receipt, AlertTriangle,
  CheckCircle, Coffee, User, Calculator, ShoppingCart
} from 'lucide-react';
import { InvoiceItem, Product } from '../types';
import { formatTime, formatTimeOnly } from '../lib/utils';
import EditSessionProductsModal from './EditSessionProductsModal';
import AddProductToSessionModal from './AddProductToSessionModal';

interface ActiveSession {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  start_time: string;
  current_individuals_count: number;
  session_items: InvoiceItem[];
  status: 'active' | 'completed';
}

interface SessionControlPanelProps {
  session: ActiveSession;
  currentSessionDuration: number;
  availableProducts: Product[];
  onUpdateSessionItems: (sessionId: string, updatedItems: InvoiceItem[]) => void;
  onAddProducts: (sessionId: string, products: Array<{
    productId: string;
    quantity: number;
    individualName?: string;
  }>) => void;
  onAddIndividual?: () => void;
  onPartialExit?: () => void;
  onCompleteSession?: () => void;
}

const SessionControlPanel: React.FC<SessionControlPanelProps> = ({
  session,
  currentSessionDuration,
  availableProducts,
  onUpdateSessionItems,
  onAddProducts,
  onAddIndividual,
  onPartialExit,
  onCompleteSession
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Calculate session costs
  const getProductsCost = () => {
    return session.session_items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const getTimeCost = () => {
    const hours = currentSessionDuration / 3600;
    // Using shared space pricing: 40 ج.م for first hour, 30 ج.م for additional hours
    const firstHourCost = session.current_individuals_count * 40;
    const additionalHoursCost = hours > 1 ? 
      session.current_individuals_count * Math.ceil(hours - 1) * 30 : 0;
    const cappedAdditionalCost = Math.min(additionalHoursCost, 100); // Max 100 ج.م additional
    return firstHourCost + cappedAdditionalCost;
  };

  const getTotalCost = () => {
    return getTimeCost() + getProductsCost();
  };

  // Get product icon (same logic as other modals)
  const getProductIcon = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes('قهوة') || name.includes('coffee') || name.includes('شاي')) {
      return <Coffee className="h-4 w-4 text-amber-600" />;
    }
    return <Package className="h-4 w-4 text-purple-600" />;
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-right text-blue-800">
          لوحة تحكم الجلسة - {session.client_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-bold text-green-800">{formatTime(currentSessionDuration)}</div>
            <p className="text-sm text-green-600">مدة الجلسة</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-lg font-bold text-blue-800">{session.current_individuals_count}</div>
            <p className="text-sm text-blue-600">عدد الأشخاص</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Package className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-lg font-bold text-purple-800">{session.session_items.length}</div>
            <p className="text-sm text-purple-600">المنتجات</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-lg font-bold text-orange-800">{getTotalCost().toFixed(2)} ج.م</div>
            <p className="text-sm text-orange-600">التكلفة الحالية</p>
          </div>
        </div>

        {/* Session Items Summary */}
        {session.session_items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Button
                onClick={() => setShowEditModal(true)}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                تعديل المنتجات
              </Button>
              <h5 className="font-semibold text-right text-gray-800">منتجات الجلسة:</h5>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {session.session_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    {getProductIcon(item.name)}
                    <div>
                      <span className="font-semibold text-purple-600">{item.total_price.toFixed(2)} ج.م</span>
                      <p className="text-xs text-gray-600">
                        {item.quantity} × {item.unit_price.toFixed(2)} ج.م
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{item.name}</p>
                    {item.individual_name && (
                      <Badge className="bg-gray-100 text-gray-800 text-xs mt-1">
                        {item.individual_name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={onAddIndividual}
            className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            إضافة شخص
          </Button>
          
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
          
          <Button
            onClick={onPartialExit}
            className="bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            مغادرة جزئية
          </Button>
          
          <Button
            onClick={onCompleteSession}
            className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <Receipt className="h-4 w-4" />
            إنهاء ودفع
          </Button>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="font-semibold text-right mb-3 text-gray-800">تفصيل التكلفة:</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">{getTimeCost().toFixed(2)} ج.م</div>
              <p className="text-sm text-blue-600">تكلفة الوقت</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">{getProductsCost().toFixed(2)} ج.م</div>
              <p className="text-sm text-purple-600">تكلفة المنتجات</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{getTotalCost().toFixed(2)} ج.م</div>
              <p className="text-sm text-green-600">الإجمالي</p>
            </div>
          </div>
        </div>

        {/* Edit Products Modal */}
        <EditSessionProductsModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          sessionId={session.id}
          sessionItems={session.session_items}
          availableProducts={availableProducts}
          onUpdateSessionItems={onUpdateSessionItems}
          sessionInfo={{
            client_name: session.client_name,
            current_individuals_count: session.current_individuals_count,
            session_duration_seconds: currentSessionDuration
          }}
        />

        {/* Add Products Modal */}
        <AddProductToSessionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          products={availableProducts}
          sessionId={session.id}
          onAddProductsBatch={onAddProducts}
        />
      </CardContent>
    </Card>
  );
};

export default SessionControlPanel;