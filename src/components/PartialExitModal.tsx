import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  X, Users, Package, DollarSign, Clock, User, UserMinus, 
  AlertTriangle, Calculator, CheckCircle, Coffee, LogOut 
} from 'lucide-react';
import { InvoiceItem, SessionPricing } from '../types';
import { formatTime } from '../lib/utils';

interface Individual {
  id: string;
  name: string;
  isMainClient: boolean;
}

interface PartialExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    individuals: Individual[];
    sessionItems: InvoiceItem[];
    sessionDurationSeconds: number;
    totalIndividuals: number;
  };
  pricing: SessionPricing;
  onConfirm: (data: {
    exitingIndividuals: Individual[];
    exitingItems: InvoiceItem[];
    sessionDurationSeconds: number;
  }) => void;
}

const PartialExitModal: React.FC<PartialExitModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  pricing,
  onConfirm
}) => {
  const [selectedIndividuals, setSelectedIndividuals] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<{[itemId: string]: number}>({});

  // Calculate time cost for exiting individuals
  const calculateTimeCost = (individualsCount: number, durationSeconds: number) => {
    const hours = durationSeconds / 3600;
    let totalCost = individualsCount * pricing.hour_1_price;
    
    if (hours <= 1) {
      return totalCost;
    } else {
      const additionalHours = Math.ceil(hours - 1);
      const additionalCost = individualsCount * additionalHours * pricing.hour_3_plus_price;
      const cappedAdditionalCost = Math.min(additionalCost, pricing.max_additional_charge);
      return totalCost + cappedAdditionalCost;
    }
  };

  const handleIndividualToggle = (individualId: string) => {
    setSelectedIndividuals(prev => {
      if (prev.includes(individualId)) {
        return prev.filter(id => id !== individualId);
      } else {
        return [...prev, individualId];
      }
    });
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    const item = sessionData.sessionItems.find(item => item.id === itemId);
    if (!item) return;

    const maxQuantity = item.quantity;
    const validQuantity = Math.max(0, Math.min(maxQuantity, quantity));
    
    if (validQuantity === 0) {
      const { [itemId]: removed, ...rest } = itemQuantities;
      setItemQuantities(rest);
    } else {
      setItemQuantities(prev => ({
        ...prev,
        [itemId]: validQuantity
      }));
    }
  };

  const getExitingItems = () => {
    return sessionData.sessionItems
      .map(item => {
        const exitingQuantity = itemQuantities[item.id] || 0;
        if (exitingQuantity === 0) return null;
        
        return {
          ...item,
          id: `exit-${item.id}`,
          quantity: exitingQuantity,
          total_price: exitingQuantity * item.unit_price
        };
      })
      .filter(Boolean) as InvoiceItem[];
  };

  const getExitingIndividuals = () => {
    return sessionData.individuals.filter(individual => 
      selectedIndividuals.includes(individual.id)
    );
  };

  const getTotalTimeCost = () => {
    return calculateTimeCost(selectedIndividuals.length, sessionData.sessionDurationSeconds);
  };

  const getTotalItemsCost = () => {
    return getExitingItems().reduce((sum, item) => sum + item.total_price, 0);
  };

  const getTotalCost = () => {
    return getTotalTimeCost() + getTotalItemsCost();
  };

  const getRemainingIndividuals = () => {
    return sessionData.totalIndividuals - selectedIndividuals.length;
  };

  const canConfirm = () => {
    // Must select at least one individual
    if (selectedIndividuals.length === 0) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canConfirm()) {
      alert('يجب اختيار فرد واحد على الأقل للمغادرة، ويجب أن يبقى شخص واحد على الأقل في الجلسة');
      return;
    }

    const exitingIndividuals = getExitingIndividuals();
    const exitingItems = getExitingItems();

    onConfirm({
      exitingIndividuals,
      exitingItems,
      sessionDurationSeconds: sessionData.sessionDurationSeconds
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">مغادرة جزئية - اختيار الأفراد والمنتجات</span>
              <LogOut className="h-5 w-5 text-orange-500" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session Summary */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 text-right mb-3">ملخص الجلسة الحالية:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-bold text-orange-800">{formatTime(sessionData.sessionDurationSeconds)}</div>
                  <p className="text-sm text-orange-600">مدة الجلسة</p>
                </div>
                
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-bold text-orange-800">{sessionData.totalIndividuals}</div>
                  <p className="text-sm text-orange-600">إجمالي الأفراد</p>
                </div>
                
                <div className="text-center">
                  <Package className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-bold text-orange-800">{sessionData.sessionItems.length}</div>
                  <p className="text-sm text-orange-600">المنتجات المطلوبة</p>
                </div>
              </div>
            </div>

            {/* Select Individuals for Exit */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <UserMinus className="h-5 w-5 text-red-600 ml-2" />
                  اختر الأفراد الذين سيغادرون ({selectedIndividuals.length}/{sessionData.individuals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessionData.individuals.map((individual) => {
                    const isSelected = selectedIndividuals.includes(individual.id);
                    const isMainClient = individual.isMainClient;
                    const canSelectMainClientAlone = selectedIndividuals.length > 1 || !isMainClient;
                    
                    return (
                      <label 
                        key={individual.id}
                        className={`cursor-pointer p-4 border-2 rounded-lg transition-all ${
                          isSelected 
                            ? 'border-red-400 bg-red-50' 
                            : isMainClient 
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                        } ${!canSelectMainClientAlone && isMainClient ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              handleIndividualToggle(individual.id);
                            }}
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                          />
                          
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-1">
                              <span className="font-semibold">{individual.name}</span>
                              {isMainClient && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  العميل الأساسي
                                </Badge>
                              )}
                            </div>
                            
                            {isSelected && (
                              <div className="bg-red-100 p-2 rounded text-center">
                                <span className="text-sm font-medium text-red-800">سيغادر</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                
                {selectedIndividuals.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <UserMinus className="h-8 w-8 mx-auto mb-2" />
                    <p>اختر الأفراد الذين سيغادرون</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Select Items to Split */}
            {sessionData.sessionItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-right flex items-center">
                    <Package className="h-5 w-5 text-purple-600 ml-2" />
                    فصل المنتجات مع الأفراد المغادرين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessionData.sessionItems.map((item) => {
                      const exitingQuantity = itemQuantities[item.id] || 0;
                      const remainingQuantity = item.quantity - exitingQuantity;
                      
                      return (
                        <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Coffee className="h-5 w-5 text-purple-600" />
                              <div>
                                <span className="font-semibold">{item.unit_price} ج.م/قطعة</span>
                                <p className="text-sm text-gray-600">متاح: {item.quantity} قطعة</p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-semibold text-lg">{item.name}</p>
                              {item.individual_name && (
                                <Badge className="bg-gray-100 text-gray-800 mt-1">
                                  <User className="h-3 w-3 mr-1" />
                                  {item.individual_name}
                                </Badge>
                              )}
                              <p className="text-sm text-gray-600">
                                إجمالي: {item.total_price.toFixed(2)} ج.م
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`quantity-${item.id}`} className="text-right block mb-2">
                                كمية المغادرة:
                              </Label>
                              <Input
                                id={`quantity-${item.id}`}
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={exitingQuantity}
                                onChange={(e) => handleItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                className="text-center"
                              />
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-gray-500 mb-2">سيبقى:</p>
                              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <span className="font-bold text-green-800">{remainingQuantity}</span>
                                <p className="text-xs text-green-600">قطعة</p>
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-gray-500 mb-2">تكلفة المغادرة:</p>
                              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <span className="font-bold text-red-800">
                                  {(exitingQuantity * item.unit_price).toFixed(2)} ج.م
                                </span>
                                <p className="text-xs text-red-600">للمغادرين</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cost Summary */}
            <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-300">
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <Calculator className="h-5 w-5 text-gray-600 ml-2" />
                  ملخص التكاليف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Exiting Cost */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 text-right mb-3">تكلفة الأفراد المغادرين:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-right">
                        <span className="font-medium text-red-700">{getTotalTimeCost().toFixed(2)} ج.م</span>
                        <span className="text-red-600">تكلفة الوقت ({selectedIndividuals.length} أشخاص):</span>
                      </div>
                      <div className="flex justify-between items-center text-right">
                        <span className="font-medium text-red-700">{getTotalItemsCost().toFixed(2)} ج.م</span>
                        <span className="text-red-600">تكلفة المنتجات:</span>
                      </div>
                      <div className="border-t border-red-300 pt-2 flex justify-between items-center text-right">
                        <span className="text-xl font-bold text-red-800">{getTotalCost().toFixed(2)} ج.م</span>
                        <span className="text-red-700 font-medium">الإجمالي:</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remaining in Session */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 text-right mb-3">سيبقى في الجلسة:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-right">
                        <span className="font-medium text-green-700">{getRemainingIndividuals()}</span>
                        <span className="text-green-600">عدد الأفراد:</span>
                      </div>
                      <div className="flex justify-between items-center text-right">
                        <span className="font-medium text-green-700">
                          {sessionData.sessionItems.reduce((sum, item) => 
                            sum + (item.quantity - (itemQuantities[item.id] || 0)), 0
                          )}
                        </span>
                        <span className="text-green-600">المنتجات المتبقية:</span>
                      </div>
                      <div className="border-t border-green-300 pt-2">
                        <p className="text-sm text-green-700 text-right">
                          ✅ ستستمر الجلسة مع الأفراد المتبقين
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Messages */}
            {selectedIndividuals.length === 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-yellow-800">يرجى اختيار الأفراد الذين سيغادرون</span>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            )}

            {selectedIndividuals.length >= sessionData.totalIndividuals && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-blue-800">⚠️ جميع الأفراد سيغادرون - سيتم إنهاء الجلسة بالكامل</span>
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            )}

            {/* Summary Preview */}
            {canConfirm() && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 text-right mb-3">
                  <CheckCircle className="h-5 w-5 inline mr-2" />
                  معاينة النتيجة:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-right">
                    <p className="text-sm text-blue-600">سيغادر:</p>
                    <div className="space-y-1">
                      {getExitingIndividuals().map(ind => (
                        <Badge key={ind.id} className="bg-red-100 text-red-800 block w-fit mr-auto">
                          {ind.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-blue-600">سيبقى:</p>
                    <div className="space-y-1">
                      {sessionData.individuals
                        .filter(ind => !selectedIndividuals.includes(ind.id))
                        .map(ind => (
                          <Badge key={ind.id} className="bg-green-100 text-green-800 block w-fit mr-auto">
                            {ind.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!canConfirm()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                تأكيد المغادرة الجزئية ({selectedIndividuals.length} أشخاص)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartialExitModal;