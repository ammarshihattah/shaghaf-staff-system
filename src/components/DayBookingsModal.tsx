import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, Calendar, Clock, Users, DollarSign, MapPin, Phone, 
  User, CheckCircle, AlertTriangle, Ban, Package 
} from 'lucide-react';
import { Booking } from '../types';
import { formatTimeOnly, formatDateOnly, formatCurrency } from '../lib/utils';

interface DayBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  bookings: Booking[];
  onEditBooking?: (booking: Booking) => void;
  onCancelBooking?: (bookingId: string) => void;
}

const DayBookingsModal: React.FC<DayBookingsModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  bookings,
  onEditBooking,
  onCancelBooking
}) => {
  if (!isOpen || !selectedDate) return null;

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'مؤكد';
      case 'cancelled': return 'ملغي';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <Ban className="h-4 w-4 text-red-600" />;
      case 'completed': return <Package className="h-4 w-4 text-blue-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateBookingDuration = (booking: Booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return durationHours;
  };

  // Sort bookings by start time
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
  const totalDuration = bookings.reduce((sum, booking) => sum + calculateBookingDuration(booking), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right text-2xl flex items-center">
              <span className="mr-3">حجوزات يوم {formatDateOnly(selectedDate.toISOString())}</span>
              <Calendar className="h-6 w-6 text-blue-600" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
              <p className="text-sm text-blue-600">إجمالي الحجوزات</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <p className="text-sm text-green-600">مؤكد</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{totalDuration.toFixed(1)} ساعة</div>
              <p className="text-sm text-purple-600">إجمالي الساعات</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-orange-600">إجمالي الإيرادات</p>
            </div>
          </div>

          {/* Bookings List */}
          {sortedBookings.length > 0 ? (
            <div className="space-y-4">
              {sortedBookings.map((booking) => (
                <Card key={booking.id} className={`hover:shadow-md transition-shadow border-l-4 ${
                  booking.status === 'confirmed' ? 'border-l-green-500' :
                  booking.status === 'cancelled' ? 'border-l-red-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        <Badge className={getBookingStatusColor(booking.status)}>
                          {getBookingStatusIcon(booking.status)}
                          <span className="mr-1">{getBookingStatusLabel(booking.status)}</span>
                        </Badge>
                        
                        {onEditBooking && booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditBooking(booking)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            تعديل
                          </Button>
                        )}
                        
                        {onCancelBooking && booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onCancelBooking(booking.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            إلغاء
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <h3 className="font-semibold text-lg">{booking.room?.name || 'غرفة غير محددة'}</h3>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <p className="text-gray-600">{booking.client?.name || 'عميل غير محدد'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                        <div className="font-semibold text-blue-800">
                          {formatTimeOnly(booking.start_time)}
                        </div>
                        <p className="text-xs text-blue-600">البداية</p>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-red-600" />
                        <div className="font-semibold text-red-800">
                          {formatTimeOnly(booking.end_time)}
                        </div>
                        <p className="text-xs text-red-600">النهاية</p>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                        <div className="font-semibold text-purple-800">
                          {calculateBookingDuration(booking).toFixed(1)} ساعة
                        </div>
                        <p className="text-xs text-purple-600">المدة</p>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                        <div className="font-semibold text-green-800">
                          {booking.total_amount.toFixed(2)} ج.م
                        </div>
                        <p className="text-xs text-green-600">القيمة</p>
                      </div>
                    </div>

                    {/* Client Contact Information */}
                    {booking.client && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {booking.client.phone && (
                            <div className="flex items-center justify-end text-sm text-gray-600">
                              <span className="mr-2" dir="ltr">{booking.client.phone}</span>
                              <Phone className="h-4 w-4" />
                            </div>
                          )}
                          
                          {booking.client.email && (
                            <div className="flex items-center justify-end text-sm text-gray-600">
                              <span className="mr-2" dir="ltr">{booking.client.email}</span>
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Booking Notes */}
                    {booking.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 text-right">
                          <strong>ملاحظات:</strong> {booking.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد حجوزات</h3>
              <p className="text-gray-500">
                لا توجد حجوزات في يوم {formatDateOnly(selectedDate.toISOString())}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 mt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DayBookingsModal;