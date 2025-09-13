import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, Users, Clock, DollarSign, Package, Calendar, User, 
  Receipt, Link, MapPin, AlertTriangle, CheckCircle, Coffee, LogOut,
  UserPlus, FileText, CreditCard, Star, Phone, Mail
} from 'lucide-react';
import { formatTimeOnly, formatDateTimeDetailed, formatDateOnly, formatTime, calculateSessionDuration } from '../lib/utils';

interface Individual {
  id: string;
  name: string;
  isMainClient: boolean;
}

interface ActiveSession {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  start_time: string;
  current_individuals_count: number;
  initial_individuals_count: number;
  initial_individuals: Array<{ name: string }>;
  added_individuals?: Array<{ name: string; added_at: string }>;
  invoice_id: string;
  status: 'active' | 'completed';
  session_items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    individual_name?: string;
    item_type: string;
  }>;
  early_exit_reasons?: string[];
  early_exit_other_reason?: string;
  end_time?: string;
  linked_booking_id?: string;
  linked_invoice_id?: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  membership_type: string;
  loyalty_points: number;
}

interface Booking {
  id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  room?: { name: string };
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  items?: Array<any>;
  payment_methods?: Array<any>;
}

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ActiveSession | null;
  client?: Client;
  linkedBooking?: Booking;
  invoice?: Invoice;
  currentSessionDuration?: number;
  allProducts?: Product[];
  onViewInvoice: () => void;
  onAddIndividual?: () => void;
  onAddProduct?: () => void;
  onEarlyExit?: () => void;
  onPartialExit?: () => void;
  onCompleteSession?: () => void;
  onLinkBooking?: () => void;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  onClose,
  session,
  client,
  linkedBooking,
  invoice,
  currentSessionDuration,
  onViewInvoice,
  onAddIndividual = () => {},
  onAddProduct = () => {},
  onEarlyExit = () => {},
  onPartialExit = () => {},
  onCompleteSession = () => {},
  onAddHour = () => {},
  onLinkBooking = () => {}
}) => {
  // Early return if modal is closed or session is null
  if (!isOpen || !session) return null;

  const sessionDurationSeconds = currentSessionDuration || 0;

  const getSessionDuration = () => {
    if (session.status === 'active' && currentSessionDuration) {
      return formatTime(currentSessionDuration);
    } else if (session.status === 'completed' && session.start_time && session.end_time) {
      const duration = calculateSessionDuration(session.start_time, session.end_time);
      return formatTime(duration);
    }
    return '00:00:00';
  };

  const getMembershipTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'يومي';
      case 'weekly': return 'أسبوعي';
      case 'monthly': return 'شهري';
      case 'corporate': return 'شركات';
      default: return type;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوع بالكامل';
      case 'partial': return 'مدفوع جزئياً';
      case 'pending': return 'في الانتظار';
      case 'overpaid': return 'مدفوع زائد';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'overpaid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExitReasonsLabels = (reasons: string[]) => {
    const reasonLabels: { [key: string]: string } = {
      'errand': 'جاله مشوار',
      'pricing': 'الأسعار',
      'crowded': 'الزحمة',
      'hot_weather': 'الجو حر',
      'help_yourself': 'Help your self',
      'other': 'أخرى'
    };
    
    return reasons.map(reason => reasonLabels[reason] || reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-right text-2xl">
              تفاصيل الجلسة - {session.client_name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Status Banner */}
          <div className={`p-4 rounded-lg border-2 ${
            session.status === 'active' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-center gap-4">
              <Badge className={
                session.status === 'active' 
                  ? 'bg-green-100 text-green-800 text-lg px-4 py-2' 
                  : 'bg-gray-100 text-gray-800 text-lg px-4 py-2'
              }>
                {session.status === 'active' ? (
                  <>
                    <Clock className="h-5 w-5 mr-2" />
                    جلسة نشطة
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    جلسة مكتملة
                  </>
                )}
              </Badge>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{getSessionDuration()}</div>
                <p className="text-sm text-gray-600">
                  {session.status === 'active' ? 'مدة الجلسة الحالية' : 'المدة الإجمالية'}
                </p>
              </div>
            </div>
          </div>

          {/* Session Control Buttons */}
          {session.status === 'active' && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-right text-blue-800">إجراءات الجلسة النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <Button
                    onClick={onAddIndividual}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    إضافة شخص
                  </Button>
                  
                  <Button
                    onClick={onAddProduct}
                    className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    إضافة منتج
                  </Button>
                  
                  {!session.linked_booking_id && (
                    <Button
                      onClick={onLinkBooking}
                      className="bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2"
                    >
                      <Link className="h-4 w-4" />
                      ربط بحجز خاص
                    </Button>
                  )}
                  
                  <Button
                    onClick={onEarlyExit}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    مغادرة مبكرة
                  </Button>
                  
                  <Button
                    onClick={onPartialExit}
                    className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    مغادرة جزئية
                  </Button>
                  
                  <Button
                    onClick={onCompleteSession}
                    className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    إنهاء ودفع
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <User className="h-5 w-5 text-blue-600 ml-2" />
                  معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">{session.client_name}</span>
                    <span className="text-gray-500">الاسم:</span>
                  </div>
                  
                  {session.client_phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-medium" dir="ltr">{session.client_phone}</span>
                      </div>
                      <span className="text-gray-500">الهاتف:</span>
                    </div>
                  )}
                  
                  {client && (
                    <>
                      {client.email && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-medium" dir="ltr">{client.email}</span>
                          </div>
                          <span className="text-gray-500">البريد:</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-100 text-purple-800">
                          {getMembershipTypeLabel(client.membership_type)}
                        </Badge>
                        <span className="text-gray-500">نوع العضوية:</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-purple-600">{client.loyalty_points} نقطة</span>
                        </div>
                        <span className="text-gray-500">نقاط الولاء:</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Timing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 ml-2" />
                  توقيت الجلسة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatTimeOnly(session.start_time)}</span>
                    <span className="text-gray-500">وقت البداية:</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDateOnly(session.start_time)}</span>
                    <span className="text-gray-500">التاريخ:</span>
                  </div>
                  
                  {session.end_time ? (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatTimeOnly(session.end_time)}</span>
                      <span className="text-gray-500">وقت الانتهاء:</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-100 text-green-800">جارية الآن</Badge>
                      <span className="text-gray-500">الحالة:</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-600 text-lg">{getSessionDuration()}</span>
                    <span className="text-gray-500">المدة:</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individuals in Session */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center">
                <Users className="h-5 w-5 text-blue-600 ml-2" />
                الأفراد في الجلسة ({session.current_individuals_count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Main Client */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800">العميل الأساسي</Badge>
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-center font-semibold text-blue-800">{session.client_name}</p>
                  <p className="text-center text-sm text-blue-600">
                    منذ: {formatTimeOnly(session.start_time)}
                  </p>
                </div>

                {/* Initial Additional Individuals */}
                {session.initial_individuals && session.initial_individuals.map((individual, index) => (
                  <div key={`initial-${index}`} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-800">فرد أساسي</Badge>
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-center font-semibold text-green-800">{individual.name}</p>
                    <p className="text-center text-sm text-green-600">
                      منذ: {formatTimeOnly(session.start_time)}
                    </p>
                  </div>
                ))}

                {/* Added Individuals */}
                {session.added_individuals && session.added_individuals.map((individual, index) => (
                  <div key={`added-${index}`} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Badge className="bg-purple-100 text-purple-800">انضم لاحقاً</Badge>
                      <UserPlus className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-center font-semibold text-purple-800">{individual.name}</p>
                    <p className="text-center text-sm text-purple-600">
                      انضم: {formatTimeOnly(individual.added_at)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Items/Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center">
                <Package className="h-5 w-5 text-orange-600 ml-2" />
                المنتجات المطلوبة ({(session.session_items || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(session.session_items || []).length > 0 ? (
                <div className="space-y-3">
                  {(session.session_items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3">
                        <Coffee className="h-5 w-5 text-orange-600" />
                        <div>
                          <span className="font-semibold text-lg text-orange-800">
                            {item.total_price.toFixed(2)} ج.م
                          </span>
                          <p className="text-sm text-orange-600">
                            {item.quantity} × {item.unit_price} ج.م
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-lg">{item.name}</p>
                        {item.individual_name && (
                          <Badge className="bg-gray-100 text-gray-800 mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {item.individual_name}
                          </Badge>
                        )}
                        <p className="text-sm text-gray-600">
                          {item.item_type === 'product' ? 'منتج' : 
                           item.item_type === 'service' ? 'خدمة' : 'وقت'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-orange-100 p-3 rounded-lg border border-orange-300">
                    <div className="flex justify-between items-center text-right">
                      <span className="text-xl font-bold text-orange-800">
                        {(session.session_items || []).reduce((sum, item) => sum + item.total_price, 0).toFixed(2)} ج.م
                      </span>
                      <span className="text-orange-700 font-medium">إجمالي المنتجات:</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد منتجات مطلوبة في هذه الجلسة</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Private Booking */}
          {linkedBooking && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <Link className="h-5 w-5 text-blue-600 ml-2" />
                  الحجز المربوط
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-right">
                      <p className="text-sm text-blue-600">الغرفة:</p>
                      <p className="font-semibold text-blue-800">{linkedBooking.room?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600">الوقت:</p>
                      <p className="font-semibold text-blue-800">
                        {formatTimeOnly(linkedBooking.start_time)} - {formatTimeOnly(linkedBooking.end_time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
                    <p className="text-sm text-blue-800 text-right">
                      ✅ بعد الربط: ستصبح فاتورة الحجز الخاص تحتوي على تكاليف الغرفة الخاصة + تكاليف المساحة المشتركة + المنتجات
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Early Exit Information */}
          {session.early_exit_reasons && session.early_exit_reasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 ml-2" />
                  معلومات المغادرة المبكرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 text-right mb-3">أسباب المغادرة:</h4>
                  <div className="flex flex-wrap gap-2 justify-end mb-3">
                    {getExitReasonsLabels(session.early_exit_reasons).map((reason, index) => (
                      <Badge key={index} className="bg-yellow-100 text-yellow-800">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  
                  {session.early_exit_other_reason && (
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <p className="text-sm text-yellow-800 text-right">
                        <strong>سبب إضافي:</strong> {session.early_exit_other_reason}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                    <p className="text-sm text-green-800 text-right font-medium">
                      🎁 تم جعل الجلسة مجانية بسبب المغادرة المبكرة
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Summary */}
          {invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center">
                  <Receipt className="h-5 w-5 text-green-600 ml-2" />
                  ملخص الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{(invoice?.total_amount || 0).toFixed(2)} ج.م</div>
                    <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">#{invoice.invoice_number}</div>
                    <p className="text-sm text-gray-600">رقم الفاتورة</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Badge className={getPaymentStatusColor(invoice.payment_status)}>
                      {getPaymentStatusLabel(invoice.payment_status)}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">حالة الدفع</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-600">{invoice.items?.length || 0}</div>
                    <p className="text-sm text-gray-600">بنود الفاتورة</p>
                  </div>
                </div>
                
                {/* Payment Methods Summary */}
                {invoice.payment_methods && invoice.payment_methods.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-right mb-3">طرق الدفع المستخدمة:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {invoice.payment_methods.map((pm: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <span className="font-bold text-lg">{(pm?.amount || 0).toFixed(2)} ج.م</span>
                          <div className="flex items-center gap-2">
                            {pm.method === 'cash' && (
                              <>
                                <span className="text-sm font-medium text-green-700">نقدي</span>
                                <span className="text-green-600">💵</span>
                              </>
                            )}
                            {pm.method === 'visa' && (
                              <>
                                <span className="text-sm font-medium text-blue-700">فيزا</span>
                                <CreditCard className="h-4 w-4 text-blue-600" />
                              </>
                            )}
                            {pm.method === 'wallet' && (
                              <>
                                <span className="text-sm font-medium text-purple-700">محفظة</span>
                                <span className="text-purple-600">📱</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{session.initial_individuals_count}</div>
              <p className="text-sm text-blue-600">أفراد البداية</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{session.current_individuals_count}</div>
              <p className="text-sm text-green-600">العدد الحالي</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{(session.session_items || []).length}</div>
              <p className="text-sm text-orange-600">المنتجات</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {(session.session_items || []).reduce((sum, item) => sum + item.total_price, 0).toFixed(0)} ج.م
              </div>
              <p className="text-sm text-purple-600">قيمة المنتجات</p>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex gap-4 justify-end pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            {invoice && (
              <Button 
                onClick={onViewInvoice}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                عرض تفاصيل الفاتورة والدفع
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionDetailsModal;