import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, MapPin, Users, DollarSign, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Room, Booking, Client, Product } from '../../types';
import { formatDateOnly, formatTimeOnly, formatTime } from '../../lib/utils';
import PaymentModal from '../PaymentModal';
import { Invoice, InvoiceItem } from '../../types';
import BookingForm from './BookingForm';
import BookingCalendar from './BookingCalendar';
import AddProductToSessionModal from '../AddProductToSessionModal';
import DayBookingsModal from '../DayBookingsModal';
import EditSessionProductsModal from '../EditSessionProductsModal';
import QuickProductEditModal from '../QuickProductEditModal';

const Rooms: React.FC = () => {
  const { user } = useAuth();
  
  const [allRooms, setAllRooms] = useLocalStorage<Room[]>('rooms', []);
  const [allBookings, setAllBookings] = useLocalStorage<Booking[]>('bookings', []);
  const [allClients, setAllClients] = useLocalStorage<Client[]>('clients', []);
  const [allProducts, setAllProducts] = useLocalStorage<Product[]>('products', []);
  const [allInvoices, setAllInvoices] = useLocalStorage('invoices', []);
  
  // Filter data by branch
  const rooms = allRooms.filter(room => room.branch_id === user?.branch_id);
  const bookings = allBookings.filter(booking => booking.branch_id === user?.branch_id);
  const clients = allClients.filter(client => client.branch_id === user?.branch_id);
  const products = allProducts.filter(product => product.branch_id === user?.branch_id);

  const [activeTab, setActiveTab] = useState<'rooms' | 'bookings' | 'calendar'>('rooms');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDayBookingsModal, setShowDayBookingsModal] = useState(false);
  const [showEditProductsModal, setShowEditProductsModal] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [selectedBookingForProducts, setSelectedBookingForProducts] = useState<string | null>(null);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<string | null>(null);
  const [selectedItemForQuickEdit, setSelectedItemForQuickEdit] = useState<InvoiceItem | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [invoiceToDisplayInPaymentModal, setInvoiceToDisplayInPaymentModal] = useState<Invoice | null>(null);
  const [activeBookingsTab, setActiveBookingsTab] = useState<'active' | 'future' | 'completed'>('active');

  const [roomFormData, setRoomFormData] = useState({
    name: '',
    type: ['private'] as ('private' | 'shared')[],
    capacity: '',
    hourly_rate: '',
    features: ''
  });

  const setRooms = (newRooms: Room[] | ((prevRooms: Room[]) => Room[])) => {
    if (typeof newRooms === 'function') {
      setAllRooms(prevAllRooms => {
        const currentBranchRooms = prevAllRooms.filter(room => room.branch_id === user?.branch_id);
        const otherBranchRooms = prevAllRooms.filter(room => room.branch_id !== user?.branch_id);
        const updatedCurrentBranchRooms = newRooms(currentBranchRooms);
        return [...otherBranchRooms, ...updatedCurrentBranchRooms];
      });
    } else {
      setAllRooms(prevAllRooms => {
        const otherBranchRooms = prevAllRooms.filter(room => room.branch_id !== user?.branch_id);
        return [...otherBranchRooms, ...newRooms];
      });
    }
  };

  const setBookings = (newBookings: Booking[] | ((prevBookings: Booking[]) => Booking[])) => {
    if (typeof newBookings === 'function') {
      setAllBookings(prevAllBookings => {
        const currentBranchBookings = prevAllBookings.filter(booking => booking.branch_id === user?.branch_id);
        const otherBranchBookings = prevAllBookings.filter(booking => booking.branch_id !== user?.branch_id);
        const updatedCurrentBranchBookings = newBookings(currentBranchBookings);
        return [...otherBranchBookings, ...updatedCurrentBranchBookings];
      });
    } else {
      setAllBookings(prevAllBookings => {
        const otherBranchBookings = prevAllBookings.filter(booking => booking.branch_id !== user?.branch_id);
        return [...otherBranchBookings, ...newBookings];
      });
    }
  };

  // Get current date and time for proper booking categorization
  const getCurrentDateTime = () => new Date();

  // Categorize bookings based on current time
  const categorizeBookings = () => {
    const now = getCurrentDateTime();
    
    const activeBookings = bookings.filter(booking => {
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      return startTime <= now && endTime > now && booking.status === 'confirmed';
    });
    
    const futureBookings = bookings.filter(booking => {
      const startTime = new Date(booking.start_time);
      return startTime > now && booking.status === 'confirmed';
    });
    
    const completedBookings = bookings.filter(booking => {
      const endTime = new Date(booking.end_time);
      return endTime <= now || booking.status === 'completed' || booking.status === 'cancelled';
    });
    
    return {
      active: activeBookings,
      future: futureBookings,
      completed: completedBookings
    };
  };

  const categorizedBookings = categorizeBookings();
  const activeCount = categorizedBookings.active.length;
  const futureCount = categorizedBookings.future.length;
  const completedCount = categorizedBookings.completed.length;

  // Get filtered bookings based on active tab
  const getFilteredBookings = () => {
    switch (activeBookingsTab) {
      case 'active':
        return categorizedBookings.active;
      case 'future':
        return categorizedBookings.future;
      case 'completed':
        return categorizedBookings.completed;
      default:
        return [];
    }
  };

  const filteredBookings = getFilteredBookings();

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const roomData = {
      ...roomFormData,
      capacity: parseInt(roomFormData.capacity),
      hourly_rate: parseFloat(roomFormData.hourly_rate),
      features: roomFormData.features.split(',').map(f => f.trim()).filter(f => f)
    };

    if (editingRoom) {
      setRooms(rooms.map(room => 
        room.id === editingRoom.id 
          ? { ...room, ...roomData }
          : room
      ));
    } else {
      const newRoom: Room = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        ...roomData,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setRooms([...rooms, newRoom]);
    }
    
    setShowRoomForm(false);
    setEditingRoom(null);
    setRoomFormData({
      name: '',
      type: ['private'],
      capacity: '',
      hourly_rate: '',
      features: ''
    });
  };

  const handleBookingSubmit = (bookingData: any) => {
    // Create or find client
    let clientId = bookingData.client_id;
    let clientToAssign: Client | undefined;
    
    if (bookingData.client_type === 'new') {
      // Create new client for new visitors
      const newClient: Client = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        name: bookingData.client_name,
        email: '',
        phone: bookingData.client_phone,
        id_number: '',
        membership_type: 'daily',
        membership_start: new Date().toISOString(),
        membership_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        loyalty_points: 0,
        created_at: new Date().toISOString()
      };
      
      setAllClients(prevClients => [...prevClients, newClient]);
      clientId = newClient.id;
      clientToAssign = newClient;
    } else {
      clientToAssign = allClients.find(c => c.id === clientId);
    }

    const newBooking: Booking = {
      id: Date.now().toString(),
      branch_id: user?.branch_id || '1',
      room_id: bookingData.room_id,
      client_id: clientId,
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
      total_amount: bookingData.estimated_cost || 0,
      status: 'confirmed',
      check_in_time: undefined,
      check_out_time: undefined,
      is_shared_space: false,
      created_at: new Date().toISOString(),
      room: rooms.find(r => r.id === bookingData.room_id),
      client: clientToAssign
    };
    
    setAllBookings(prevBookings => [...prevBookings, newBooking]);
    setShowBookingForm(false);
  };

  const handleRoomEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity.toString(),
      hourly_rate: room.hourly_rate.toString(),
      features: room.features.join(', ')
    });
    setShowRoomForm(true);
  };

  const handleRoomDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الغرفة؟')) {
      setRooms(rooms.filter(room => room.id !== id));
    }
  };

  const handleBookingCancel = (id: string) => {
    if (confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) {
      setBookings(bookings.map(booking => 
        booking.id === id 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
    }
  };

  const openProductModal = (bookingId: string) => {
    setSelectedBookingForProducts(bookingId);
    setShowProductModal(true);
  };

  const openEditProductsModal = (bookingId: string) => {
    setSelectedBookingForEdit(bookingId);
    setShowEditProductsModal(true);
  };

  const openQuickEditModal = (item: InvoiceItem) => {
    setSelectedItemForQuickEdit(item);
    setShowQuickEditModal(true);
  };

  const handleAddProductToBooking = (bookingId: string, productId: string, quantity: number, individualName?: string) => {
    return handleAddProductToBookingWithPrice(bookingId, productId, quantity, individualName);
  };
  
  const handleAddProductToBookingWithPrice = (bookingId: string, productId: string, quantity: number, individualName?: string, customPrice?: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock_quantity < quantity) {
      alert('الكمية المطلوبة غير متوفرة في المخزون');
      return;
    }

    // Use custom price if provided, otherwise use product price
    const unitPrice = customPrice !== undefined ? customPrice : product.price;

    // Update product stock
    setAllProducts(allProducts.map(p => 
      p.id === productId 
        ? { ...p, stock_quantity: p.stock_quantity - quantity }
        : p
    ));

    // Create invoice item for the product
    const productItem: InvoiceItem = {
      id: `${bookingId}-${productId}-${Date.now()}`,
      invoice_id: `INV-${bookingId}`,
      item_type: 'product',
      related_id: productId,
      name: product.name,
      quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
      individual_name: individualName,
      created_at: new Date().toISOString()
    };

    // Update booking with the new product
    setBookings(bookings.map(booking => {
      if (booking.id === bookingId) {
        const updatedSessionItems = [...(booking.session_items || []), productItem];
        const productsTotal = updatedSessionItems.reduce((sum, item) => sum + item.total_price, 0);
        
        return {
          ...booking,
          session_items: updatedSessionItems,
          total_amount: booking.total_amount + productItem.total_price
        };
      }
      return booking;
    }));
    
    return true; // Return success
  };

  const handleUpdateSessionItems = (sessionId: string, updatedItems: InvoiceItem[]) => {
    setBookings(bookings.map(booking => {
      if (booking.id === sessionId) {
        const newProductsTotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
        const originalProductsTotal = (booking.session_items || []).reduce((sum, item) => sum + item.total_price, 0);
        const difference = newProductsTotal - originalProductsTotal;
        
        return {
          ...booking,
          session_items: updatedItems,
          total_amount: booking.total_amount + difference
        };
      }
      return booking;
    }));
    
    setShowEditProductsModal(false);
    setSelectedBookingForEdit(null);
  };

  const handleBatchAddProducts = (sessionId: string, productsData: Array<{
    productId: string;
    quantity: number;
    individualName?: string;
    customPrice?: number;
  }>) => {
    let successCount = 0;
    
    productsData.forEach(data => {
      if (handleAddProductToBookingWithPrice(sessionId, data.productId, data.quantity, data.individualName, data.customPrice)) {
        successCount++;
      }
    });
    
    if (successCount > 0) {
      const individualText = productsData[0]?.individualName ? ` للشخص: ${productsData[0].individualName}` : '';
      alert(`تم إضافة ${successCount} منتج بنجاح${individualText}`);
    }
  };

  const handleCalendarDateSelect = (date: Date) => {
    const selectedDateString = date.toISOString().split('T')[0];
    const bookingsForDay = bookings.filter(booking => 
      booking.start_time.split('T')[0] === selectedDateString
    );
    
    setSelectedCalendarDate(date);
    setDayBookings(bookingsForDay);
    setShowDayBookingsModal(true);
  };

  const handleCompleteBookingAndPay = (booking: Booking) => {
    const room = rooms.find(r => r.id === booking.room_id);
    if (!room) {
      alert('لا يمكن العثور على تفاصيل الغرفة');
      return;
    }

    // Calculate session duration
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const sessionDurationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Calculate time cost
    const hours = sessionDurationSeconds / 3600;
    const timeCost = hours * room.hourly_rate;
    
    // Create time entry item
    const timeItem: InvoiceItem = {
      id: `time-${booking.id}`,
      invoice_id: `INV-${booking.id}`,
      item_type: 'time_entry',
      related_id: booking.client_id,
      name: `حجز ${room.name}`,
      quantity: 1,
      unit_price: timeCost,
      total_price: timeCost,
      created_at: new Date().toISOString()
    };

    // Include booking's session items (products added during the session)
    const allItems = [timeItem, ...(booking.session_items || [])];
    const totalAmount = allItems.reduce((sum, item) => sum + item.total_price, 0);

    // Create invoice
    const invoice: Invoice = {
      id: `INV-${booking.id}`,
      branch_id: booking.branch_id,
      client_id: booking.client_id,
      booking_id: booking.id,
      invoice_number: `INV-${booking.id}`,
      amount: totalAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      remaining_balance_action: 'none',
      due_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      items: allItems,
      payment_methods: [],
      client: booking.client,
      booking: booking
    };

    setInvoiceToDisplayInPaymentModal(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (updatedInvoice: Invoice) => {
    // Update invoices in storage
    setAllInvoices(prevInvoices => {
      const existingIndex = prevInvoices.findIndex(inv => inv.id === updatedInvoice.id);
      if (existingIndex >= 0) {
        const updated = [...prevInvoices];
        updated[existingIndex] = updatedInvoice;
        return updated;
      } else {
        return [...prevInvoices, updatedInvoice];
      }
    });

    // Mark booking as completed
    if (updatedInvoice.booking_id) {
      setBookings(bookings.map(b => 
        b.id === updatedInvoice.booking_id 
          ? { ...b, status: 'completed', check_out_time: new Date().toISOString() }
          : b
      ));
    }

    // Close payment modal
    setShowPaymentModal(false);
    setInvoiceToDisplayInPaymentModal(null);
  };

  const getRoomTypeLabel = (type: ('private' | 'shared')[]) => {
    if (type.includes('shared')) return 'مشتركة';
    return 'خاصة';
  };

  const getRoomTypeColor = (type: ('private' | 'shared')[]) => {
    if (type.includes('shared')) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              if (activeTab === 'rooms') setShowRoomForm(true);
              else if (activeTab === 'bookings') setShowBookingForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'rooms' ? 'إضافة غرفة جديدة' : 'حجز جديد'}
          </Button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rooms' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              الغرف ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'bookings' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              الحجوزات ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              التقويم
            </button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة الغرف والحجوزات</h1>
          <p className="text-gray-600 text-right">إدارة الغرف ونظام الحجوزات المتقدم</p>
        </div>
      </div>

      {/* Room Form */}
      {showRoomForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingRoom ? 'تعديل الغرفة' : 'إضافة غرفة جديدة'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room-name" className="text-right block mb-2">اسم الغرفة</Label>
                  <Input
                    id="room-name"
                    value={roomFormData.name}
                    onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                    placeholder="اسم الغرفة"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="room-capacity" className="text-right block mb-2">السعة</Label>
                  <Input
                    id="room-capacity"
                    type="number"
                    value={roomFormData.capacity}
                    onChange={(e) => setRoomFormData({ ...roomFormData, capacity: e.target.value })}
                    placeholder="عدد الأشخاص"
                    required
                    className="text-right"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourly-rate" className="text-right block mb-2">السعر بالساعة (ج.م)</Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    step="0.01"
                    value={roomFormData.hourly_rate}
                    onChange={(e) => setRoomFormData({ ...roomFormData, hourly_rate: e.target.value })}
                    placeholder="السعر بالساعة"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="room-type" className="text-right block mb-2">نوع الغرفة</Label>
                  <select
                    id="room-type"
                    value={roomFormData.type[0]}
                    onChange={(e) => setRoomFormData({ ...roomFormData, type: [e.target.value as 'private' | 'shared'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="private">غرفة خاصة</option>
                    <option value="shared">مساحة مشتركة</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="features" className="text-right block mb-2">المرافق</Label>
                <Input
                  id="features"
                  value={roomFormData.features}
                  onChange={(e) => setRoomFormData({ ...roomFormData, features: e.target.value })}
                  placeholder="بروجكتر، واي فاي، سبورة (افصل بفاصلة)"
                  className="text-right"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowRoomForm(false);
                  setEditingRoom(null);
                  setRoomFormData({
                    name: '',
                    type: ['private'],
                    capacity: '',
                    hourly_rate: '',
                    features: ''
                  });
                }}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingRoom ? 'حفظ التغييرات' : 'إضافة الغرفة'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Booking Form */}
      {showBookingForm && (
        <BookingForm
          rooms={rooms.filter(room => room.is_active)}
          clients={clients}
          onSubmit={handleBookingSubmit}
          onCancel={() => setShowBookingForm(false)}
        />
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRoomEdit(room)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRoomDelete(room.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-xl">{room.name}</CardTitle>
                    <div className="flex gap-2 justify-end mt-1">
                      <Badge className={getRoomTypeColor(room.type)}>
                        {getRoomTypeLabel(room.type)}
                      </Badge>
                      <Badge variant={room.is_active ? 'default' : 'destructive'}>
                        {room.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">{room.capacity} شخص</span>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">{room.hourly_rate} ج.م/ساعة</span>
                    <DollarSign className="h-4 w-4" />
                  </div>
                  {room.features.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 text-right mb-1">المرافق:</p>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {room.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Booking Status Tabs */}
          <Card>
            <CardHeader>
              <div className="flex justify-center">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveBookingsTab('active')}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeBookingsTab === 'active' 
                        ? 'bg-white text-gray-900 shadow-sm border-2 border-green-300' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    🟢 الحجوزات النشطة ({activeCount})
                  </button>
                  <button
                    onClick={() => setActiveBookingsTab('future')}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeBookingsTab === 'future' 
                        ? 'bg-white text-gray-900 shadow-sm border-2 border-orange-300' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    🟠 الحجوزات المستقبلية ({futureCount})
                  </button>
                  <button
                    onClick={() => setActiveBookingsTab('completed')}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeBookingsTab === 'completed' 
                        ? 'bg-white text-gray-900 shadow-sm border-2 border-blue-300' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    🔵 الحجوزات المنتهية ({completedCount})
                  </button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Current Tab Title */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {activeBookingsTab === 'active' && '🟢 الحجوزات النشطة الآن'}
              {activeBookingsTab === 'future' && '🟠 الحجوزات المستقبلية'}
              {activeBookingsTab === 'completed' && '🔵 الحجوزات المنتهية'}
            </h3>
            <p className="text-gray-600 text-sm">
              {activeBookingsTab === 'active' && 'الحجوزات التي بدأت ولم تنتهِ بعد'}
              {activeBookingsTab === 'future' && 'الحجوزات المحددة للمستقبل'}
              {activeBookingsTab === 'completed' && 'الحجوزات المكتملة أو الملغاة'}
            </p>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const now = getCurrentDateTime();
              const startTime = new Date(booking.start_time);
              const endTime = new Date(booking.end_time);
              const isActive = startTime <= now && endTime > now && booking.status === 'confirmed';
              const isFuture = startTime > now && booking.status === 'confirmed';
              const isCompleted = endTime <= now || booking.status === 'completed' || booking.status === 'cancelled';
              
              return (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-2">
                        {/* Status Badge with Enhanced Styling */}
                        <Badge className={`${getBookingStatusColor(booking.status)} text-sm px-3 py-1`}>
                          {isActive && '🟢 نشط الآن'}
                          {isFuture && '🟠 لم يبدأ بعد'}
                          {isCompleted && (booking.status === 'cancelled' ? '❌ ملغي' : '✅ مكتمل')}
                        </Badge>
                        
                        {/* Actions based on booking type */}
                        {activeBookingsTab === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openProductModal(booking.id)}
                              disabled={!products.length}
                              className="bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              إضافة منتج
                            </Button>
                            {booking.session_items && booking.session_items.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditProductsModal(booking.id)}
                                className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                              >
                                تعديل المنتجات
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleCompleteBookingAndPay(booking)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              إنهاء ودفع
                            </Button>
                          </>
                        )}
                        
                        {activeBookingsTab === 'future' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Edit booking functionality can be added here
                                alert('ميزة تعديل الحجز ستتوفر قريباً!');
                              }}
                              className="bg-orange-50 text-orange-700 hover:bg-orange-100"
                            >
                              تعديل الحجز
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBookingCancel(booking.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              إلغاء الحجز
                            </Button>
                          </>
                        )}
                        
                        {activeBookingsTab === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Find the invoice linked to this booking
                              const linkedInvoice = allInvoices.find(invoice => 
                                invoice.booking_id === booking.id || 
                                invoice.id === `INV-${booking.id}`
                              );
                              
                              if (linkedInvoice) {
                                setInvoiceToDisplayInPaymentModal(linkedInvoice);
                                setShowPaymentModal(true);
                              } else {
                                alert('لم يتم العثور على فاتورة مرتبطة بهذا الحجز');
                              }
                            }}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                          >
                            عرض الفاتورة
                          </Button>
                        )}
                      </div>
                      <div className="text-right">
                        <h3 className="font-semibold text-lg">{booking.room?.name}</h3>
                        <p className="text-gray-600">{booking.client?.name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2">{formatDateOnly(booking.start_time)}</span>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2">
                          {formatTimeOnly(booking.start_time)} - {formatTimeOnly(booking.end_time)}
                        </span>
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex items-center justify-end text-sm text-gray-600">
                        <span className="mr-2">{booking.room?.capacity || 'غير محدد'} شخص</span>
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex items-center justify-end text-sm font-semibold text-green-600">
                        <span className="mr-2">{booking.total_amount} ج.م</span>
                        <DollarSign className="h-4 w-4" />
                      </div>
                      
                      {/* Show products count if any */}
                      {booking.session_items && booking.session_items.length > 0 && (
                        <div className="flex items-center justify-end text-sm text-purple-600">
                          <span className="mr-2">{booking.session_items.length} منتج</span>
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      
                      {/* Additional Info for Each Tab */}
                      {activeBookingsTab === 'active' && (
                        <div className="md:col-span-4 mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-4 text-sm">
                              <span className="text-green-700">
                                ⏱️ بدأت منذ: {(() => {
                                  const elapsed = (getCurrentDateTime().getTime() - startTime.getTime()) / 1000;
                                  return formatTime(elapsed);
                                })()}
                              </span>
                              <span className="text-green-700">
                                ⏰ متبقي: {(() => {
                                  const remaining = Math.max(0, (endTime.getTime() - getCurrentDateTime().getTime()) / 1000);
                                  return formatTime(remaining);
                                })()}
                              </span>
                            </div>
                            
                            {/* Show added products */}
                            {booking.session_items && booking.session_items.length > 0 && (
                              <div className="border-t border-green-300 pt-2">
                                <p className="text-sm text-green-700 font-medium text-center mb-2">المنتجات المضافة:</p>
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {booking.session_items.map((item, index) => (
                                    <Badge 
                                      key={index} 
                                      className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200 transition-colors"
                                      onClick={() => openQuickEditModal(item)}
                                      title="اضغط للتعديل السريع"
                                    >
                                      {item.name} ({item.quantity}) - {item.total_price.toFixed(2)} ج.م
                                      {item.individual_name && ` - ${item.individual_name}`}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="mt-2 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditProductsModal(booking.id)}
                                    className="bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    تعديل وإدارة المنتجات
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {activeBookingsTab === 'future' && (
                        <div className="md:col-span-4 mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-center gap-4 text-sm">
                            <span className="text-orange-700">
                              🕐 يبدأ خلال: {(() => {
                                const timeUntilStart = (startTime.getTime() - getCurrentDateTime().getTime()) / 1000;
                                return formatTime(Math.max(0, timeUntilStart));
                              })()}
                            </span>
                            <span className="text-orange-700">
                              ⏱️ مدة الحجز: {(() => {
                                const duration = (endTime.getTime() - startTime.getTime()) / 1000;
                                return formatTime(duration);
                              })()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {activeBookingsTab === 'completed' && (
                        <div className="md:col-span-4 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-center gap-4 text-sm">
                            <span className="text-blue-700">
                              {booking.status === 'cancelled' ? '❌ تم الإلغاء' : '✅ اكتمل'}
                            </span>
                            <span className="text-blue-700">
                              📅 انتهى: {formatTimeOnly(booking.end_time)} - {formatDateOnly(booking.end_time)}
                            </span>
                            {booking.status !== 'cancelled' && (
                              <span className="text-blue-700">
                                ⏱️ المدة الفعلية: {(() => {
                                  const duration = (endTime.getTime() - startTime.getTime()) / 1000;
                                  return formatTime(duration);
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Empty State for Each Tab */}
            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {activeBookingsTab === 'active' && <Clock className="h-12 w-12 mx-auto animate-pulse" />}
                  {activeBookingsTab === 'future' && <Calendar className="h-12 w-12 mx-auto" />}
                  {activeBookingsTab === 'completed' && <CheckCircle className="h-12 w-12 mx-auto" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeBookingsTab === 'active' && 'لا توجد حجوزات نشطة'}
                  {activeBookingsTab === 'future' && 'لا توجد حجوزات مستقبلية'}
                  {activeBookingsTab === 'completed' && 'لا توجد حجوزات مكتملة'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeBookingsTab === 'active' && 'لا توجد حجوزات جارية في الوقت الحالي'}
                  {activeBookingsTab === 'future' && 'لم يتم إنشاء أي حجوزات للمستقبل بعد'}
                  {activeBookingsTab === 'completed' && 'لم يتم إكمال أي حجوزات بعد'}
                </p>
                {activeBookingsTab !== 'completed' && (
                  <Button onClick={() => setShowBookingForm(true)}>
                    إنشاء حجز جديد
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">تقويم الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingCalendar 
              bookings={bookings} 
              onSelectDate={handleCalendarDateSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      
      {/* Empty State for Rooms Tab */}
      {activeTab === 'rooms' && rooms.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد غرف</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة الغرفة الأولى لهذا الفرع</p>
          <Button onClick={() => setShowRoomForm(true)}>
            إضافة غرفة جديدة
          </Button>
        </div>
      )}

      {/* Product Selection Modal for Bookings */}
      <AddProductToSessionModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedBookingForProducts(null);
        }}
        products={products}
        sessionId={selectedBookingForProducts || ''}
        onAddProductsBatch={handleBatchAddProducts}
      />

      {/* Edit Session Products Modal */}
      <EditSessionProductsModal
        isOpen={showEditProductsModal}
        onClose={() => {
          setShowEditProductsModal(false);
          setSelectedBookingForEdit(null);
        }}
        sessionId={selectedBookingForEdit || ''}
        sessionItems={(() => {
          const booking = bookings.find(b => b.id === selectedBookingForEdit);
          return booking?.session_items || [];
        })()}
        availableProducts={products}
        onUpdateSessionItems={handleUpdateSessionItems}
        sessionInfo={(() => {
          const booking = bookings.find(b => b.id === selectedBookingForEdit);
          const startTime = booking ? new Date(booking.start_time) : new Date();
          const currentTime = new Date();
          const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
          
          return {
            client_name: booking?.client?.name || 'عميل غير محدد',
            current_individuals_count: 1, // Default for private rooms
            session_duration_seconds: Math.max(0, duration)
          };
        })()}
      />

      {/* Quick Edit Product Modal */}
      <QuickProductEditModal
        isOpen={showQuickEditModal}
        onClose={() => {
          setShowQuickEditModal(false);
          setSelectedItemForQuickEdit(null);
        }}
        item={selectedItemForQuickEdit}
        availableProducts={products}
        onUpdateItem={(updatedItem) => {
          // Find the booking that contains this item
          const bookingWithItem = bookings.find(booking => 
            booking.session_items?.some(item => item.id === updatedItem.id)
          );
          
          if (bookingWithItem) {
            const updatedSessionItems = bookingWithItem.session_items?.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            ) || [];
            
            handleUpdateSessionItems(bookingWithItem.id, updatedSessionItems);
          }
          
          setShowQuickEditModal(false);
          setSelectedItemForQuickEdit(null);
        }}
        onDeleteItem={(itemId) => {
          // Find the booking that contains this item and remove it
          const bookingWithItem = bookings.find(booking => 
            booking.session_items?.some(item => item.id === itemId)
          );
          
          if (bookingWithItem) {
            const updatedSessionItems = bookingWithItem.session_items?.filter(item => item.id !== itemId) || [];
            handleUpdateSessionItems(bookingWithItem.id, updatedSessionItems);
          }
          
          setShowQuickEditModal(false);
          setSelectedItemForQuickEdit(null);
        }}
      />

      {/* Day Bookings Modal */}
      <DayBookingsModal
        isOpen={showDayBookingsModal}
        onClose={() => {
          setShowDayBookingsModal(false);
          setSelectedCalendarDate(null);
          setDayBookings([]);
        }}
        selectedDate={selectedCalendarDate}
        bookings={dayBookings}
        onEditBooking={(booking) => {
          // Handle booking edit if needed
          console.log('Edit booking:', booking);
          alert('تعديل الحجز قريباً!');
        }}
        onCancelBooking={handleBookingCancel}
      />

      {/* Payment Modal for Private Room Bookings */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setInvoiceToDisplayInPaymentModal(null);
        }}
        invoice={invoiceToDisplayInPaymentModal || {
          id: 'temp',
          branch_id: user?.branch_id || '1',
          invoice_number: 'TEMP',
          amount: 0,
          tax_amount: 0,
          total_amount: 0,
          status: 'pending',
          payment_status: 'pending',
          remaining_balance_action: 'none',
          due_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          items: []
        }}
        onPaymentSuccess={handlePaymentSuccess}
        isViewMode={invoiceToDisplayInPaymentModal?.status === 'paid' || invoiceToDisplayInPaymentModal?.payment_status === 'paid'}
        userRole={user?.role}
      />
    </div>
  );
};

export default Rooms;