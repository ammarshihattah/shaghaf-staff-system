import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, Users, Phone, User, Plus, Minus, UserCheck } from 'lucide-react';
import { Client } from '../types';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSession: (data: {
    client_id?: string;
    name?: string;
    phone?: string;
    initialIndividualsCount: number;
    initialIndividuals: Array<{ name: string }>;
  }) => void;
  initialClient?: Client | null;
}

const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  onStartSession,
  initialClient
}) => {
  const [formData, setFormData] = useState({
    name: initialClient?.name || '',
    phone: initialClient?.phone || '',
    initialIndividualsCount: 1
  });
  
  const [individualNames, setIndividualNames] = useState<string[]>([]);

  // Update individual names array when count changes
  React.useEffect(() => {
    // Only store names for additional individuals (excluding the main client)
    const additionalIndividualsCount = Math.max(0, formData.initialIndividualsCount - 1);
    const newIndividuals = Array(additionalIndividualsCount).fill('').map((_, index) => 
      individualNames[index] || ''
    );
    setIndividualNames(newIndividuals);
  }, [formData.initialIndividualsCount]);

  // Reset form when modal opens/closes or client changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialClient?.name || '',
        phone: initialClient?.phone || '',
        initialIndividualsCount: 1
      });
      setIndividualNames([]);
    }
  }, [isOpen, initialClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For existing clients, we don't need name/phone validation
    if (!initialClient && (!formData.name.trim() || !formData.phone.trim())) {
      alert('يرجى إدخال اسم ورقم هاتف العميل');
      return;
    }

    // Validate that all individuals have names if count > 1
    const additionalIndividualsCount = formData.initialIndividualsCount - 1;
    
    // Create individuals array with automatic naming for empty fields
    const initialIndividuals = Array.from({ length: additionalIndividualsCount }, (_, index) => ({
      name: individualNames[index]?.trim() || `فرد ${index + 2}`
    }));

    if (initialClient) {
      // Existing client
      onStartSession({
        client_id: initialClient.id,
        initialIndividualsCount: formData.initialIndividualsCount,
        initialIndividuals
      });
    } else {
      // New client
      onStartSession({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        initialIndividualsCount: formData.initialIndividualsCount,
        initialIndividuals
      });
    }

    // Reset form
    setFormData({ name: '', phone: '', initialIndividualsCount: 1 });
    setIndividualNames([]);
  };

  const updateIndividualName = (index: number, name: string) => {
    const newNames = [...individualNames];
    newNames[index] = name;
    setIndividualNames(newNames);
  };

  const adjustIndividualsCount = (increment: number) => {
    const newCount = Math.max(1, Math.min(10, formData.initialIndividualsCount + increment));
    setFormData({ ...formData, initialIndividualsCount: newCount });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right">
              {initialClient ? 'بدء جلسة لعميل موجود' : 'بدء جلسة لزائر جديد'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div>
              <h4 className="font-semibold text-right mb-4 text-blue-800">
                {initialClient ? 'بيانات العميل:' : 'معلومات العميل الجديد:'}
              </h4>
              
              {initialClient && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <div className="flex items-center justify-end gap-3">
                    <div className="text-right">
                      <p className="font-medium text-blue-800">{initialClient.name}</p>
                      <p className="text-sm text-blue-600">{initialClient.phone}</p>
                      <div className="flex gap-2 justify-end mt-1">
                        <Badge className="bg-blue-100 text-blue-800">{initialClient.membership_type}</Badge>
                        <Badge className="bg-purple-100 text-purple-800">{initialClient.loyalty_points} نقطة</Badge>
                      </div>
                    </div>
                    <UserCheck className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              )}
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visitor-name" className="text-right block mb-2">
                      {initialClient ? 'اسم العميل' : 'الاسم الكامل *'}
                    </Label>
                    <Input
                      id="visitor-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={initialClient ? 'اسم العميل المحدد' : 'اسم العميل'}
                      required={!initialClient}
                      readOnly={!!initialClient}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <Label htmlFor="visitor-phone" className="text-right block mb-2">
                      {initialClient ? 'رقم الهاتف' : 'رقم الهاتف *'}
                    </Label>
                    <Input
                      id="visitor-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={initialClient ? 'رقم هاتف العميل' : '+20101234567'}
                      required={!initialClient}
                      readOnly={!!initialClient}
                      className="text-right"
                    />
                  </div>
                </div>
            </div>

            {/* Number of Individuals */}
            <div>
              <h4 className="font-semibold text-right mb-4 text-green-800">عدد الأشخاص في الجلسة:</h4>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  type="button"
                  onClick={() => adjustIndividualsCount(-1)}
                  disabled={formData.initialIndividualsCount <= 1}
                  size="icon"
                  variant="outline"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {formData.initialIndividualsCount}
                  </div>
                  <Badge variant="secondary">
                    <Users className="h-4 w-4 mr-1" />
                    {formData.initialIndividualsCount === 1 ? 'شخص واحد' : `${formData.initialIndividualsCount} أشخاص`}
                  </Badge>
                </div>
                
                <Button
                  type="button"
                  onClick={() => adjustIndividualsCount(1)}
                  disabled={formData.initialIndividualsCount >= 10}
                  size="icon"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-600 mb-4">
                {initialClient ? `${initialClient.name}` : 'العميل الأساسي'} + {formData.initialIndividualsCount - 1} شخص إضافي
              </p>
            </div>

            {/* Additional Individuals Names */}
            {formData.initialIndividualsCount > 1 && (
              <div>
                <h4 className="font-semibold text-right mb-4 text-purple-800">أسماء الأشخاص الإضافيين:</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-blue-800 font-medium">
                        {initialClient ? initialClient.name : (formData.name || 'العميل الأساسي')}
                      </span>
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-600 text-right">
                      {initialClient ? 'العميل المسجل' : 'العميل الأساسي (سيتم إنشاء حساب له)'}
                    </p>
                  </div>
                  
                  {Array.from({ length: formData.initialIndividualsCount - 1 }, (_, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <Label htmlFor={`individual-${index}`} className="text-right block mb-2">
                        الشخص رقم {index + 2} (اختياري):
                      </Label>
                      <Input
                        id={`individual-${index}`}
                        value={individualNames[index] || ''}
                        onChange={(e) => updateIndividualName(index, e.target.value)}
                        placeholder={`اسم الشخص رقم ${index + 2} (سيتم إنشاء اسم تلقائي إذا تُرك فارغاً)`}
                        className="text-right"
                      />
                      <p className="text-xs text-gray-500 text-right mt-1">
                        إذا تُرك فارغاً سيتم تسجيله كـ "فرد {index + 2}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Preview */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 text-right mb-3">معاينة التسعير:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-right">
                  <span className="font-semibold text-green-700">40 ج.م/شخص</span>
                  <span className="text-green-600">الساعة الأولى:</span>
                </div>
                <div className="flex justify-between items-center text-right">
                  <span className="font-semibold text-green-700">30 ج.م/شخص</span>
                  <span className="text-green-600">الساعات الإضافية:</span>
                </div>
                <div className="border-t border-green-300 pt-2 flex justify-between items-center text-right">
                  <span className="text-xl font-bold text-green-800">
                    {formData.initialIndividualsCount * 40} ج.م
                  </span>
                  <span className="text-green-700">تكلفة الساعة الأولى:</span>
                </div>
                <p className="text-sm text-green-600 text-right">
                  * التكلفة النهائية ستحسب حسب مدة الجلسة الفعلية
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-lg px-8"
              >
                <Users className="h-5 w-5 mr-2" />
                بدء الجلسة
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartSessionModal;