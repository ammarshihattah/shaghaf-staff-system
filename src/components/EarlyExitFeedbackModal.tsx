import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, AlertTriangle, Clock, MessageSquare } from 'lucide-react';

interface EarlyExitFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reasons: string[], otherReason?: string) => void;
  sessionDuration: string;
  clientName?: string;
}

const EarlyExitFeedbackModal: React.FC<EarlyExitFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sessionDuration,
  clientName
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');

  const exitReasons = [
    { id: 'errand', label: 'جاله مشوار' },
    { id: 'pricing', label: 'الأسعار' },
    { id: 'crowded', label: 'الزحمة' },
    { id: 'hot_weather', label: 'الجو حر' },
    { id: 'help_yourself', label: 'Help your self' },
    { id: 'other', label: 'أخرى' }
  ];

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons(prev => {
      if (prev.includes(reasonId)) {
        return prev.filter(id => id !== reasonId);
      } else {
        return [...prev, reasonId];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedReasons.length === 0) {
      alert('يرجى اختيار سبب واحد على الأقل');
      return;
    }

    // If "other" is selected but no text provided
    if (selectedReasons.includes('other') && !otherReason.trim()) {
      alert('يرجى كتابة السبب الآخر');
      return;
    }

    onSubmit(selectedReasons, otherReason.trim() || undefined);
    
    // Reset form
    setSelectedReasons([]);
    setOtherReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">مغادرة مبكرة</span>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </CardTitle>
          </div>
        </CardHeader> 
        <CardContent>
          {/* Session Info */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">مدة الجلسة: {sessionDuration}</span>
            </div>
            {clientName && (
              <p className="text-center text-orange-700 text-sm">العميل: {clientName}</p>
            )}
            <div className="text-center mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
              <span className="text-green-800 font-semibold">🎉 جلسة مجانية - لا توجد رسوم على الوقت!</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Scrollable content area */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto p-1">
              {/* Feedback Question */}
              <div>
                <h4 className="font-semibold text-right mb-4 text-gray-800">
                  ليه العميل مكملش في المكان؟ (يمكن اختيار أكثر من سبب)
                </h4>
                
                <div className="space-y-3">
                  {exitReasons.map((reason) => (
                    <label 
                      key={reason.id}
                      className="flex items-center justify-end space-x-3 space-x-reverse cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-medium">{reason.label}</span>
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(reason.id)}
                        onChange={() => handleReasonToggle(reason.id)}
                        className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Reason Input */}
              {selectedReasons.includes('other') && (
                <div>
                  <Label htmlFor="other-reason" className="text-right block mb-2">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    السبب الآخر:
                  </Label>
                  <Input
                    id="other-reason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="اكتب السبب..."
                    required={selectedReasons.includes('other')}
                    className="text-right"
                  />
                </div>
              )}

              {/* Selected Reasons Preview */}
              {selectedReasons.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 text-right mb-2">الأسباب المختارة:</p>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {selectedReasons.map(reasonId => {
                      const reason = exitReasons.find(r => r.id === reasonId);
                      return (
                        <span key={reasonId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {reason?.label}
                          {reasonId === 'other' && otherReason && `: ${otherReason}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div> {/* End of scrollable div */}

            {/* Action Buttons - fixed at the bottom */}
            <div className="flex gap-4 justify-end pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={selectedReasons.length === 0}
              >
                تسجيل الأسباب وإنهاء الجلسة
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EarlyExitFeedbackModal;