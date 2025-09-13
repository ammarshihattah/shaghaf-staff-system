import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Room, Client, Booking } from '../../types';
import { Calendar, Clock, Users, DollarSign, MapPin } from 'lucide-react';

interface BookingFormProps {
  rooms: Room[];
  clients: Client[];
  onSubmit: (bookingData: any) => void;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ rooms, clients, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    room_id: '',
    client_id: '',
    client_name: '',
    client_phone: '',
    start_time: '',
    end_time: '',
    notes: ''
  });
  
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing');
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Calculate estimated cost when room and times change
  React.useEffect(() => {
    if (formData.room_id && formData.start_time && formData.end_time) {
      const room = rooms.find(r => r.id === formData.room_id);
      if (room) {
        const start = new Date(formData.start_time);
        const end = new Date(formData.end_time);
        const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        // تطبيق فترة سماح 10 دقائق - كل ساعة + 10 دقائق = ساعة واحدة
        const hours = Math.max(1, Math.ceil((totalMinutes - 10) / 60));
        setEstimatedCost(hours * room.hourly_rate);
      }
    }
  }, [formData.room_id, formData.start_time, formData.end_time, rooms]);

  const selectedRoom = rooms.find(r => r.id === formData.room_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.room_id || !formData.start_time || !formData.end_time) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Validate time order
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    
    if (endTime <= startTime) {
      alert('وقت الانتهاء يجب أن يكون بعد وقت البداية');
      return;
    }

    // Check if it's at least 1 hour booking
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (hours < 1) {
      alert('الحد الأدنى للحجز ساعة واحدة');
      return;
    }

    onSubmit({
      ...formData,
      client_type: clientType,
      estimated_cost: estimatedCost
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-right">حجز جديد</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Selection */}
          <div>
            <Label htmlFor="room-select" className="text-right block mb-2">الغرفة *</Label>
            <select
              id="room-select"
              value={formData.room_id}
              onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
              required
              className="w-full p-3 border border-gray-300 rounded-md text-right"
            >
              <option value="">اختر الغرفة</option>
              {rooms.filter(room => room.is_active).map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.hourly_rate} ج.م/ساعة ({room.capacity} أشخاص)
                </option>
              ))}
            </select>
            
            {selectedRoom && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-end">
                    <span className="mr-2">{selectedRoom.capacity} شخص</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="mr-2">{selectedRoom.hourly_rate} ج.م/ساعة</span>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                {selectedRoom.features.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-blue-600 text-right mb-1">المرافق:</p>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {selectedRoom.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Client Type Selection */}
          <div>
            <Label className="text-right block mb-2">نوع العميل *</Label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-end space-x-2 space-x-reverse cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-sm font-medium">عميل موجود</span>
                <input
                  type="radio"
                  name="client_type"
                  value="existing"
                  checked={clientType === 'existing'}
                  onChange={(e) => setClientType(e.target.value as 'existing' | 'new')}
                  className="rounded"
                />
              </label>
              
              <label className="flex items-center justify-end space-x-2 space-x-reverse cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-sm font-medium">عميل جديد</span>
                <input
                  type="radio"
                  name="client_type"
                  value="new"
                  checked={clientType === 'new'}
                  onChange={(e) => setClientType(e.target.value as 'existing' | 'new')}
                  className="rounded"
                />
              </label>
            </div>
          </div>

          {/* Existing Client Selection */}
          {clientType === 'existing' && (
            <div>
              <Label htmlFor="client-select" className="text-right block mb-2">العميل *</Label>
              <select
                id="client-select"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                required
                className="w-full p-3 border border-gray-300 rounded-md text-right"
              >
                <option value="">اختر العميل</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone} ({client.loyalty_points} نقطة)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New Client Information */}
          {clientType === 'new' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-name" className="text-right block mb-2">اسم العميل *</Label>
                <Input
                  id="client-name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="الاسم الكامل"
                  required={clientType === 'new'}
                  className="text-right"
                />
              </div>
              <div>
                <Label htmlFor="client-phone" className="text-right block mb-2">رقم الهاتف *</Label>
                <Input
                  id="client-phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="+20101234567"
                  required={clientType === 'new'}
                  className="text-right"
                />
              </div>
            </div>
          )}

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-right block mb-2">وقت البداية *</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-right block mb-2">وقت الانتهاء *</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                min={formData.start_time || new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Cost Estimation */}
          {estimatedCost > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between text-right">
                <div className="text-2xl font-bold text-green-800">{estimatedCost.toFixed(2)} ج.م</div>
                <div>
                  <span className="text-green-600 font-medium">التكلفة المقدرة:</span>
                  {formData.start_time && formData.end_time && (
                    <p className="text-sm text-green-600 mt-1">
                      {((new Date(formData.end_time).getTime() - new Date(formData.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1)} ساعة
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="booking-notes" className="text-right block mb-2">ملاحظات</Label>
            <textarea
              id="booking-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية للحجز"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md text-right resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={!formData.room_id || !formData.start_time || !formData.end_time}
            >
              <Calendar className="h-4 w-4 mr-2" />
              تأكيد الحجز
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BookingForm;