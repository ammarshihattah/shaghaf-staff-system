import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, UserPlus, Users, AlertCircle, Plus, Minus, User } from 'lucide-react';

interface AddIndividualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIndividuals?: (individualsData: Array<{ name: string }>) => void;
  currentIndividualsCount: number;
  sessionClientName: string;
}

const AddIndividualModal: React.FC<AddIndividualModalProps> = ({
  isOpen,
  onClose,
  onAddIndividuals = () => {},
  currentIndividualsCount,
  sessionClientName
}) => {
  const [individualsToAdd, setIndividualsToAdd] = useState(1);
  const [individualNames, setIndividualNames] = useState<string[]>(['']);

  // تأكد من أن currentIndividualsCount رقم صحيح
  const safeCurrentCount = typeof currentIndividualsCount === 'number' && !isNaN(currentIndividualsCount) 
    ? currentIndividualsCount 
    : 0;
  
  const newTotalCount = safeCurrentCount + individualsToAdd;

  // تحديث قائمة الأسماء عند تغيير العدد
  React.useEffect(() => {
    const newNames = Array(individualsToAdd).fill('').map((_, index) => 
      individualNames[index] || ''
    );
    setIndividualNames(newNames);
  }, [individualsToAdd]);

  const adjustIndividualsCount = (increment: number) => {
    const newCount = Math.max(1, Math.min(10, individualsToAdd + increment));
    setIndividualsToAdd(newCount);
  };

  const updateIndividualName = (index: number, name: string) => {
    const newNames = [...individualNames];
    newNames[index] = name;
    setIndividualNames(newNames);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // إنشاء قائمة الأفراد مع الأسماء
    const individualsData = individualNames.map((name, index) => ({
      name: name.trim() || `فرد ${safeCurrentCount + index + 1}`
    }));
    
    onAddIndividuals(individualsData);
    
    // إعادة تعيين النموذج
    setIndividualsToAdd(1);
    setIndividualNames(['']);
  };

  const handleClose = () => {
    setIndividualsToAdd(1);
    setIndividualNames(['']);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">إضافة أفراد جدد للجلسة</span>
              <UserPlus className="h-5 w-5 text-green-500" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Session Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">جلسة {sessionClientName}</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-blue-600">
                العدد الحالي: {safeCurrentCount} شخص → سيصبح {newTotalCount} شخص
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Number of Individuals to Add */}
            <div>
              <h4 className="font-semibold text-right mb-4 text-green-800">كم شخص تريد إضافتهم؟</h4>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  type="button"
                  onClick={() => adjustIndividualsCount(-1)}
                  disabled={individualsToAdd <= 1}
                  size="icon"
                  variant="outline"
                  className="border-2 border-green-300 hover:bg-green-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <div className="text-center bg-green-50 p-4 rounded-lg border-2 border-green-200 min-w-[120px]">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {individualsToAdd}
                  </div>
                  <Badge variant="secondary">
                    <Users className="h-4 w-4 mr-1" />
                    {individualsToAdd === 1 ? 'شخص واحد' : `${individualsToAdd} أشخاص`}
                  </Badge>
                </div>
                
                <Button
                  type="button"
                  onClick={() => adjustIndividualsCount(1)}
                  disabled={individualsToAdd >= 10}
                  size="icon"
                  variant="outline"
                  className="border-2 border-green-300 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-600 mb-4">
                سيتم إضافة {individualsToAdd} شخص جديد للجلسة (الحد الأقصى: 10 أشخاص)
              </p>
            </div>

            {/* Individual Names Input */}
            <div>
              <h4 className="font-semibold text-right mb-4 text-purple-800">أسماء الأشخاص الجدد:</h4>
              <div className="space-y-3">
                {Array.from({ length: individualsToAdd }, (_, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-end gap-3 mb-2">
                      <div className="text-right">
                        <Label htmlFor={`individual-${index}`} className="font-medium text-gray-700">
                          الشخص رقم {safeCurrentCount + index + 1}:
                        </Label>
                      </div>
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    
                    <Input
                      id={`individual-${index}`}
                      value={individualNames[index] || ''}
                      onChange={(e) => updateIndividualName(index, e.target.value)}
                      placeholder={`اسم الشخص رقم ${safeCurrentCount + index + 1} (اختياري)`}
                      className="text-right"
                    />
                    
                    <p className="text-xs text-gray-500 text-right mt-1">
                      إذا تُرك فارغاً سيتم تسجيله كـ "فرد {safeCurrentCount + index + 1}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 text-right mb-3">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                معاينة الأفراد الجدد:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {individualNames.map((name, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-green-300">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-medium text-green-800">
                        {name.trim() || `فرد ${safeCurrentCount + index + 1}`}
                      </span>
                      <UserPlus className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-green-600 text-right">
                      {name.trim() ? 'اسم مخصص' : 'اسم تلقائي'}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-700">{safeCurrentCount}</div>
                    <p className="text-sm text-green-600">العدد الحالي</p>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-700">+{individualsToAdd}</div>
                    <p className="text-sm text-green-600">سيتم إضافة</p>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-800">{newTotalCount}</div>
                    <p className="text-sm text-green-600">العدد الجديد</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Name Templates */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 text-right mb-3">قوالب أسماء سريعة:</h4>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const commonNames = ['أحمد', 'محمد', 'فاطمة', 'عائشة', 'علي', 'خالد', 'سارة', 'منى', 'يوسف', 'ليلى'];
                    const newNames = individualNames.map((_, index) => 
                      commonNames[index % commonNames.length] || `شخص ${index + 1}`
                    );
                    setIndividualNames(newNames);
                  }}
                  className="text-xs"
                >
                  أسماء شائعة
                </Button>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newNames = individualNames.map((_, index) => `زائر ${safeCurrentCount + index + 1}`);
                    setIndividualNames(newNames);
                  }}
                  className="text-xs"
                >
                  زوار مرقمين
                </Button>
                
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIndividualNames(Array(individualsToAdd).fill(''));
                  }}
                  className="text-xs"
                >
                  مسح الأسماء
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-lg px-8"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                إضافة {individualsToAdd} {individualsToAdd === 1 ? 'شخص' : 'أشخاص'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddIndividualModal;