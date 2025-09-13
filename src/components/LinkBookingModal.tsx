import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, Link, Clock, DollarSign, MapPin, User, Calendar, 
  CheckCircle, AlertCircle, Users
} from 'lucide-react';
import { Booking, Client, Room } from '../types';
import { formatTimeOnly, formatDateOnly, formatCurrency } from '../lib/utils';

interface LinkBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBooking: (booking: Booking) => void;
  availableBookings: Booking[];
  sessionClient?: Client;
  sessionData?: {
    client_name: string;
    current_individuals_count: number;
    session_items_count: number;
  };
}

const LinkBookingModal: React.FC<LinkBookingModalProps> = ({
  isOpen,
  onClose,
  onSelectBooking,
  availableBookings,
  sessionClient,
  sessionData
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');

  const handleSelectBooking = () => {
    const selectedBooking = availableBookings.find(b => b.id === selectedBookingId);
    if (!selectedBooking) {
      alert('يرجى اختيار حجز للربط');
      return;
    }

    onSelectBooking(selectedBooking);
  };

  const calculateBookingDuration = (booking: Booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return durationHours;
  };

  const getBookingStatus = (booking: Booking) => {
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    
    if (now < startTime) return { label: 'لم يبدأ بعد', color: 'bg-blue-100 text-blue-800' };
    if (now >= startTime && now <= endTime) return { label: 'نشط الآن', color: 'bg-green-100 text-green-800' };
    return { label: 'انتهى', color: 'bg-gray-100 text-gray-800' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right flex items-center">
              <span className="mr-2">ربط الجلسة بحجز خاص</span>
              <Link className="h-5 w-5 text-blue-500" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Session Info Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
            <h4 className="font-semibold text-blue-800 text-right mb-3">
              معلومات الجلسة المراد ربطها:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <User className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-semibold text-blue-800">{sessionData?.client_name || 'غير محدد'}</div>
                <p className="text-sm text-blue-600">العميل</p>
              </div>
              
              <div className="text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-semibold text-blue-800">{sessionData?.current_individuals_count || 0}</div>
                <p className="text-sm text-blue-600">عدد الأفراد</p>
              </div>
              
              <div className="text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="font-semibold text-blue-800">{sessionData?.session_items_count || 0}</div>
                <p className="text-sm text-blue-600">المنتجات المطلوبة</p>
              </div>
            </div>
          </div>

          {/* Available Bookings */}
          <div className="mb-6">
            <h4 className="font-semibold text-right mb-4 text-green-800">
              الحجوزات الخاصة المتاحة للعميل:
            </h4>
            
            {availableBookings.length > 0 ? (
              <div className="space-y-4">
                {availableBookings.map((booking) => {
                  const status = getBookingStatus(booking);
                  const duration = calculateBookingDuration(booking);
                  
                  return (
                    <label 
                      key={booking.id}
                      className={`block cursor-pointer p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        selectedBookingId === booking.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="radio"
                          name="booking-selection"
                          value={booking.id}
                          checked={selectedBookingId === booking.id}
                          onChange={(e) => setSelectedBookingId(e.target.value)}
                          className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <div className="flex-1 mr-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Room Info */}
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="font-semibold text-lg">{booking.room?.name || 'غرفة غير محددة'}</span>
                                <MapPin className="h-4 w-4 text-gray-500" />
                              </div>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </div>
                            
                            {/* Time Info */}
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="font-medium">{formatTimeOnly(booking.start_time)} - {formatTimeOnly(booking.end_time)}</span>
                                <Clock className="h-4 w-4 text-gray-500" />
                              </div>
                              <p className="text-sm text-gray-600">{formatDateOnly(booking.start_time)}</p>
                            </div>
                            
                            {/* Duration & Cost */}
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="font-medium">{duration.toFixed(1)} ساعة</span>
                                <Calendar className="h-4 w-4 text-gray-500" />
                              </div>
                              <p className="text-sm text-gray-600">مدة الحجز</p>
                            </div>
                            
                            {/* Total Amount */}
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="font-semibold text-green-600">{booking.total_amount.toFixed(2)} ج.م</span>
                                <DollarSign className="h-4 w-4 text-green-500" />
                              </div>
                              <p className="text-sm text-gray-600">قيمة الحجز</p>
                            </div>
                          </div>
                          
                          {/* Additional Info */}
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 text-right">
                              💡 عند الربط: ستتم إضافة تكاليف المساحة المشتركة ({sessionData?.current_individuals_count || 0} أشخاص) 
                              وتكلفة المنتجات ({sessionData?.session_items_count || 0} منتجات) إلى فاتورة هذا الحجز
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد حجوزات خاصة متاحة</h3>
                <p className="text-gray-600 mb-4">
                  {sessionClient 
                    ? `لا يوجد حجوزات خاصة نشطة للعميل ${sessionClient.name}`
                    : 'لا يمكن العثور على حجوزات للعميل المحدد'
                  }
                </p>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 text-right">
                    📝 <strong>ملاحظة:</strong> لربط الجلسة، يجب أن يكون هناك حجز خاص نشط ومؤكد للعميل في نفس اليوم
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Booking Preview */}
          {selectedBookingId && (
            <div className="mb-6">
              {(() => {
                const selectedBooking = availableBookings.find(b => b.id === selectedBookingId);
                if (!selectedBooking) return null;
                
                return (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 text-right mb-3">
                      <CheckCircle className="h-5 w-5 inline mr-2" />
                      الحجز المختار:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-right">
                        <p className="text-sm text-green-600">الغرفة:</p>
                        <p className="font-semibold text-green-800">{selectedBooking.room?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">الوقت:</p>
                        <p className="font-semibold text-green-800">
                          {formatTimeOnly(selectedBooking.start_time)} - {formatTimeOnly(selectedBooking.end_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">المدة:</p>
                        <p className="font-semibold text-green-800">{calculateBookingDuration(selectedBooking).toFixed(1)} ساعة</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600">القيمة:</p>
                        <p className="font-semibold text-green-800">{selectedBooking.total_amount.toFixed(2)} ج.م</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                      <p className="text-sm text-green-800 text-right">
                        ✅ بعد الربط: ستصبح فاتورة الحجز الخاص تحتوي على تكاليف الغرفة الخاصة + تكاليف المساحة المشتركة + المنتجات
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSelectBooking}
              disabled={!selectedBookingId || availableBookings.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            >
              <Link className="h-5 w-5 mr-2" />
              ربط الجلسة بالحجز المختار
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkBookingModal;