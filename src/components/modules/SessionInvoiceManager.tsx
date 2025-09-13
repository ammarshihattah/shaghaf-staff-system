import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Clock, Users, Package, DollarSign, User, Phone, Plus, 
  Edit, Trash2, Play, Square, UserPlus, Receipt, AlertTriangle,
  CheckCircle, Coffee, Calculator, ShoppingCart, Calendar
} from 'lucide-react';
import { Client, Product, InvoiceItem, Invoice, SessionPricing } from '../types';
import { formatTime, formatTimeOnly, formatDateOnly } from '../../lib/utils';
import StartSessionModal from '../StartSessionModal';
import AddIndividualModal from '../AddIndividualModal';
import AddProductToSessionModal from '../AddProductToSessionModal';
import EditSessionProductsModal from '../EditSessionProductsModal';
import QuickProductEditModal from '../QuickProductEditModal';
import EarlyExitFeedbackModal from '../EarlyExitFeedbackModal';
import PartialExitModal from '../PartialExitModal';
import PaymentModal from '../PaymentModal';
import LinkBookingModal from '../LinkBookingModal';
import SessionDetailsModal from '../SessionDetailsModal';
import SessionControlPanel from '../SessionControlPanel';
import ClientSearchSelect from '../ClientSearchSelect';

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
  session_items: InvoiceItem[];
  early_exit_reasons?: string[];
  early_exit_other_reason?: string;
  end_time?: string;
  linked_booking_id?: string;
  linked_invoice_id?: string;
}

interface Individual {
  id: string;
  name: string;
  isMainClient: boolean;
}

export const SessionInvoiceManager: React.FC = () => {
  const { user } = useAuth();

  // Data from localStorage
  const [allClients] = useLocalStorage<Client[]>('clients', []);
  const [allProducts] = useLocalStorage<Product[]>('products', []);
  const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [allSessions, setAllSessions] = useLocalStorage<ActiveSession[]>('active_sessions', []);
  const [allBookings] = useLocalStorage('bookings', []);

  // Default pricing for shared space
  const [pricing] = useLocalStorage<SessionPricing>('session_pricing', {
    hour_1_price: 40,
    hour_2_price: 30,
    hour_3_plus_price: 30,
    max_additional_charge: 100
  });

  // Filter by branch
  const clients = allClients.filter(client => client.branch_id === user?.branch_id);
  const products = allProducts.filter(product => product.branch_id === user?.branch_id);
  const activeSessions = allSessions.filter(session => session.status === 'active');
  const completedSessions = allSessions.filter(session => session.status === 'completed');

  // UI States
  const [activeSessionTab, setActiveSessionTab] = useState<'active' | 'completed'>('active');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [sessionDurations, setSessionDurations] = useState<{[sessionId: string]: number}>({});
  const [showStartModal, setShowStartModal] = useState(false);
  const [showAddIndividualModal, setShowAddIndividualModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductsModal, setShowEditProductsModal] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [showEarlyExitModal, setShowEarlyExitModal] = useState(false);
  const [showPartialExitModal, setShowPartialExitModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLinkBookingModal, setShowLinkBookingModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  
  const [selectedSessionForAction, setSelectedSessionForAction] = useState<string | null>(null);
  const [selectedItemForQuickEdit, setSelectedItemForQuickEdit] = useState<InvoiceItem | null>(null);
  const [invoiceToDisplayInPaymentModal, setInvoiceToDisplayInPaymentModal] = useState<Invoice | null>(null);

  // Update session durations every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDurations(prev => {
        const updated = { ...prev };
        activeSessions.forEach(session => {
          const startTime = new Date(session.start_time);
          const currentTime = new Date();
          const durationSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
          updated[session.id] = Math.max(0, durationSeconds);
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSessions]);

  // Start new session
  const handleStartSession = (data: {
    client_id?: string;
    name?: string;
    phone?: string;
    initialIndividualsCount: number;
    initialIndividuals: Array<{ name: string }>;
  }) => {
    let clientToUse: Client;
    
    if (data.client_id) {
      clientToUse = clients.find(c => c.id === data.client_id)!;
    } else {
      // Create new visitor client
      clientToUse = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        name: data.name!,
        email: '',
        phone: data.phone!,
        id_number: '',
        membership_type: 'daily',
        membership_start: new Date().toISOString(),
        membership_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        loyalty_points: 0,
        created_at: new Date().toISOString()
      };
      
      // Update clients list (but not saved to localStorage until needed)
    }

    const newSession: ActiveSession = {
      id: Date.now().toString(),
      client_id: clientToUse.id,
      client_name: clientToUse.name,
      client_phone: clientToUse.phone,
      start_time: new Date().toISOString(),
      current_individuals_count: data.initialIndividualsCount,
      initial_individuals_count: data.initialIndividualsCount,
      initial_individuals: data.initialIndividuals,
      invoice_id: `INV-${Date.now()}`,
      status: 'active',
      session_items: []
    };

    setAllSessions([...allSessions, newSession]);
    setShowStartModal(false);
  };

  // Add individual to session
  const handleAddIndividualToSession = (sessionId: string, individualsData: Array<{ name: string }>) => {
    setAllSessions(allSessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          current_individuals_count: session.current_individuals_count + individualsData.length,
          added_individuals: [
            ...(session.added_individuals || []),
            ...individualsData.map(data => ({
              name: data.name,
              added_at: new Date().toISOString()
            }))
          ]
        };
      }
      return session;
    }));
    
    setShowAddIndividualModal(false);
    setSelectedSessionForAction(null);
  };

  // Add products to session
  const handleAddProductsToSession = (sessionId: string, productsData: Array<{
    productId: string;
    quantity: number;
    individualName?: string;
    customPrice?: number;
  }>) => {
    const newItems: InvoiceItem[] = [];
    let updatedProducts = [...allProducts];

    // Process each product
    productsData.forEach(data => {
      const product = products.find(p => p.id === data.productId);
      if (!product) return;

      if (product.stock_quantity < data.quantity) {
        alert(`${product.name} - الكمية المطلوبة غير متوفرة`);
        return;
      }

      // Use custom price if provided, otherwise use product price
      const unitPrice = data.customPrice !== undefined ? data.customPrice : product.price;

      // Update product stock
      updatedProducts = updatedProducts.map(p => 
        p.id === data.productId 
          ? { ...p, stock_quantity: p.stock_quantity - data.quantity }
          : p
      );

      // Create invoice item
      const productItem: InvoiceItem = {
        id: `${sessionId}-${data.productId}-${Date.now()}-${Math.random()}`,
        invoice_id: `INV-${sessionId}`,
        item_type: 'product',
        related_id: data.productId,
        name: product.name,
        quantity: data.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * data.quantity,
        individual_name: data.individualName,
        created_at: new Date().toISOString()
      };

      newItems.push(productItem);
    });

    if (newItems.length > 0) {
      // Update products in storage
      setAllProducts(updatedProducts);

      // Update session with new items
      setAllSessions(allSessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            session_items: [...session.session_items, ...newItems]
          };
        }
        return session;
      }));

      alert(`تم إضافة ${newItems.length} منتج بنجاح!`);
    }

    setShowAddProductModal(false);
    setSelectedSessionForAction(null);
  };

  // Update session items (for editing)
  const handleUpdateSessionItems = (sessionId: string, updatedItems: InvoiceItem[]) => {
    setAllSessions(allSessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          session_items: updatedItems
        };
      }
      return session;
    }));
  };

  // Complete session with payment
  const handleCompleteSession = (sessionId: string) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const sessionDuration = sessionDurations[sessionId] || 0;
    const timeCost = calculateTimeCost(session.current_individuals_count, sessionDuration, pricing);
    
    // Create time entry item
    const timeItem: InvoiceItem = {
      id: `time-${sessionId}`,
      invoice_id: session.invoice_id,
      item_type: 'time_entry',
      related_id: session.client_id,
      name: 'استخدام المساحة المشتركة',
      quantity: session.current_individuals_count,
      unit_price: timeCost / session.current_individuals_count,
      total_price: timeCost,
      created_at: new Date().toISOString()
    };

    // Create invoice
    const allItems = [timeItem, ...session.session_items];
    const totalAmount = allItems.reduce((sum, item) => sum + item.total_price, 0);

    const invoice: Invoice = {
      id: session.invoice_id,
      branch_id: user?.branch_id || '1',
      client_id: session.client_id,
      invoice_number: session.invoice_id,
      amount: totalAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      remaining_balance_action: 'none',
      due_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      items: allItems,
      payment_methods: []
    };

    setInvoiceToDisplayInPaymentModal(invoice);
    setShowPaymentModal(true);
  };

  // Calculate time cost
  const calculateTimeCost = (individualsCount: number, durationSeconds: number, pricing: SessionPricing) => {
    const hours = durationSeconds / 3600;
    let totalCost = individualsCount * pricing.hour_1_price;
    
    if (hours > 1) {
      const additionalHours = Math.ceil(hours - 1);
      const additionalCost = individualsCount * additionalHours * pricing.hour_3_plus_price;
      const cappedAdditionalCost = Math.min(additionalCost, pricing.max_additional_charge);
      totalCost += cappedAdditionalCost;
    }
    
    return totalCost;
  };

  // Handle payment success
  const handlePaymentSuccess = (updatedInvoice: Invoice) => {
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

    // Mark session as completed
    setAllSessions(allSessions.map(session => 
      session.invoice_id === updatedInvoice.id 
        ? { ...session, status: 'completed', end_time: new Date().toISOString() }
        : session
    ));

    setShowPaymentModal(false);
    setInvoiceToDisplayInPaymentModal(null);
  };

  // Get session stats
  const sessionStats = React.useMemo(() => {
    const currentSessions = activeSessionTab === 'active' ? activeSessions : completedSessions;
    
    const totalSessions = currentSessions.length;
    const totalIndividuals = currentSessions.reduce((sum, session) => sum + session.current_individuals_count, 0);
    const totalProductsOrdered = currentSessions.reduce((sum, session) => sum + (session.session_items?.length || 0), 0);
    
    const totalSessionRevenue = currentSessions.reduce((sum, session) => {
      const duration = activeSessionTab === 'active' 
        ? (sessionDurations[session.id] || 0)
        : (session.end_time && session.start_time 
            ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000)
            : 0);
      const timeCost = calculateTimeCost(session.current_individuals_count, duration, pricing);
      const productsCost = (session.session_items || []).reduce((itemSum, item) => itemSum + item.total_price, 0);
      return sum + timeCost + productsCost;
    }, 0);

    return {
      totalSessions,
      totalIndividuals,
      totalProductsOrdered,
      totalSessionRevenue
    };
  }, [activeSessions, completedSessions, activeSessionTab, sessionDurations, pricing]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          {/* Enhanced Client Selection with Search */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-300 shadow-sm min-w-[400px]">
            <ClientSearchSelect
              clients={clients}
              selectedClientId={selectedClientId}
              onClientSelect={setSelectedClientId}
              placeholder="ابحث عن عميل بالاسم أو الهاتف..."
              className="flex-1"
            />
            
            <Button 
              onClick={() => {
                if (!selectedClientId) {
                  alert('يرجى اختيار عميل أولاً');
                  return;
                }
                setShowStartModal(true);
              }}
              disabled={!selectedClientId}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              بدء جلسة للعميل المحدد
            </Button>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedClientId(''); // Reset selected client for new visitor
              setShowStartModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            بدء جلسة لزائر جديد
          </Button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveSessionTab('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSessionTab === 'active' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🟢 الجلسات النشطة ({activeSessions.length})
            </button>
            <button
              onClick={() => setActiveSessionTab('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSessionTab === 'completed' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🔵 الجلسات المكتملة ({completedSessions.length})
            </button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة الجلسات والفواتير</h1>
          <p className="text-gray-600 text-right">إدارة متقدمة للجلسات والمنتجات والدفع</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              {activeSessionTab === 'active' ? 'الجلسات النشطة' : 'الجلسات المكتملة'}
            </CardTitle>
            <Clock className={`h-4 w-4 ${activeSessionTab === 'active' ? 'text-green-500' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-right ${
              activeSessionTab === 'active' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {sessionStats.totalSessions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الأشخاص</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-blue-600">{sessionStats.totalIndividuals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">المنتجات المطلوبة</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-purple-600">{sessionStats.totalProductsOrdered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              {activeSessionTab === 'active' ? 'الإيرادات المتوقعة' : 'إجمالي الإيرادات'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-orange-600">
              {sessionStats.totalSessionRevenue.toFixed(2)} ج.م
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Tab Content */}
      <div className="space-y-6">
        {activeSessionTab === 'active' ? (
          // Active Sessions
          activeSessions.map((session) => {
            const sessionDuration = sessionDurations[session.id] || 0;
            const client = clients.find(c => c.id === session.client_id);
            
            return (
              <SessionControlPanel
                key={session.id}
                session={session}
                currentSessionDuration={sessionDuration}
                availableProducts={products}
                onUpdateSessionItems={handleUpdateSessionItems}
                onAddProducts={handleAddProductsToSession}
                onAddIndividual={() => {
                  setSelectedSessionForAction(session.id);
                  setShowAddIndividualModal(true);
                }}
                onPartialExit={() => {
                  setSelectedSessionForAction(session.id);
                  setShowPartialExitModal(true);
                }}
                onCompleteSession={() => handleCompleteSession(session.id)}
              />
            );
          })
        ) : (
          // Completed Sessions
          completedSessions.map((session) => {
            const sessionDuration = session.end_time && session.start_time 
              ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000)
              : 0;
            const client = clients.find(c => c.id === session.client_id);
            const linkedInvoice = allInvoices.find(inv => inv.id === session.invoice_id);
            
            return (
              <Card key={session.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedSessionForAction(session.id);
                          setShowSessionDetailsModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Receipt className="h-4 w-4" />
                        تفاصيل الجلسة
                      </Button>
                      
                      {linkedInvoice && (
                        <Button
                          onClick={() => {
                            setInvoiceToDisplayInPaymentModal(linkedInvoice);
                            setShowPaymentModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                        >
                          <Receipt className="h-4 w-4" />
                          عرض الفاتورة
                        </Button>
                      )}
                    </div>
                    
                    <CardTitle className="text-right text-blue-800 flex items-center">
                      <div className="text-right mr-3">
                        <span className="text-xl">{session.client_name}</span>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            جلسة مكتملة
                          </Badge>
                        </div>
                      </div>
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-100 rounded-lg border border-blue-300">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-lg font-bold text-blue-800">{formatTime(sessionDuration)}</div>
                      <p className="text-sm text-blue-600">مدة الجلسة</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-100 rounded-lg border border-blue-300">
                      <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-lg font-bold text-blue-800">{session.current_individuals_count}</div>
                      <p className="text-sm text-blue-600">عدد الأشخاص</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-100 rounded-lg border border-blue-300">
                      <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-lg font-bold text-blue-800">{session.session_items.length}</div>
                      <p className="text-sm text-blue-600">المنتجات</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-100 rounded-lg border border-blue-300">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-lg font-bold text-blue-800">
                        {(() => {
                          const timeCost = calculateTimeCost(session.current_individuals_count, sessionDuration, pricing);
                          const productsCost = session.session_items.reduce((sum, item) => sum + item.total_price, 0);
                          return (timeCost + productsCost).toFixed(2);
                        })()} ج.م
                      </div>
                      <p className="text-sm text-blue-600">إجمالي التكلفة</p>
                    </div>
                  </div>
                  
                  {/* Session Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-semibold text-right mb-3 text-gray-800">الجدول الزمني:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-600">{formatTimeOnly(session.start_time)}</span>
                          <span className="text-gray-600">بداية الجلسة:</span>
                        </div>
                        {session.end_time && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-red-600">{formatTimeOnly(session.end_time)}</span>
                            <span className="text-gray-600">نهاية الجلسة:</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-600">{formatDateOnly(session.start_time)}</span>
                          <span className="text-gray-600">التاريخ:</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-semibold text-right mb-3 text-gray-800">معلومات إضافية:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{session.initial_individuals_count}</span>
                          <span className="text-gray-600">أفراد البداية:</span>
                        </div>
                        {session.added_individuals && session.added_individuals.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-purple-600">+{session.added_individuals.length}</span>
                            <span className="text-gray-600">انضم لاحقاً:</span>
                          </div>
                        )}
                        {linkedInvoice && (
                          <div className="flex justify-between items-center">
                            <Badge className="bg-green-100 text-green-800">{linkedInvoice.invoice_number}</Badge>
                            <span className="text-gray-600">رقم الفاتورة:</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Session Items */}
                  {session.session_items.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-semibold text-right mb-3 text-gray-800">المنتجات المطلوبة:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {session.session_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2">
                              <Coffee className="h-4 w-4 text-purple-600" />
                              <div>
                                <span className="font-semibold text-purple-800">{item.total_price.toFixed(2)} ج.م</span>
                                <p className="text-xs text-purple-600">
                                  {item.quantity} × {item.unit_price.toFixed(2)} ج.م
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-medium">{item.name}</p>
                              {item.individual_name && (
                                <Badge className="bg-gray-100 text-gray-800 text-xs mt-1">
                                  <User className="h-3 w-3 mr-1" />
                                  {item.individual_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Early Exit Information */}
                  {session.early_exit_reasons && session.early_exit_reasons.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 text-right mb-3">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        أسباب المغادرة المبكرة:
                      </h5>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {session.early_exit_reasons.map((reason, index) => (
                          <Badge key={index} className="bg-yellow-100 text-yellow-800">
                            {reason === 'errand' ? 'جاله مشوار' :
                             reason === 'pricing' ? 'الأسعار' :
                             reason === 'crowded' ? 'الزحمة' :
                             reason === 'hot_weather' ? 'الجو حر' :
                             reason === 'help_yourself' ? 'Help your self' :
                             reason === 'other' ? 'أخرى' : reason}
                          </Badge>
                        ))}
                      </div>
                      {session.early_exit_other_reason && (
                        <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                          <p className="text-sm text-yellow-800 text-right">
                            <strong>سبب إضافي:</strong> {session.early_exit_other_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Active Sessions Display */}
        {activeSessionTab === 'active' && activeSessions.map((session) => {
          const sessionDuration = sessionDurations[session.id] || 0;
          const client = clients.find(c => c.id === session.client_id);
          
          return (
            <SessionControlPanel
              key={session.id}
              session={session}
              currentSessionDuration={sessionDuration}
              availableProducts={products}
              onUpdateSessionItems={handleUpdateSessionItems}
              onAddProducts={handleAddProductsToSession}
              onAddIndividual={() => {
                setSelectedSessionForAction(session.id);
                setShowAddIndividualModal(true);
              }}
              onPartialExit={() => {
                setSelectedSessionForAction(session.id);
                setShowPartialExitModal(true);
              }}
              onCompleteSession={() => handleCompleteSession(session.id)}
            />
          );
        })}

        {/* Empty State */}
        {((activeSessionTab === 'active' && activeSessions.length === 0) || 
          (activeSessionTab === 'completed' && completedSessions.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeSessionTab === 'active' ? (
                <Clock className="h-16 w-16 mx-auto animate-pulse" />
              ) : (
                <CheckCircle className="h-16 w-16 mx-auto" />
              )}
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {activeSessionTab === 'active' ? 'لا توجد جلسات نشطة' : 'لا توجد جلسات مكتملة'}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeSessionTab === 'active' 
                ? 'ابدأ جلسة جديدة للعملاء في المساحة المشتركة'
                : 'لم يتم إكمال أي جلسات بعد'
              }
            </p>
            {activeSessionTab === 'active' && (
              <Button onClick={() => setShowStartModal(true)} className="bg-green-600 hover:bg-green-700">
                <Play className="h-5 w-5 mr-2" />
                بدء جلسة جديدة
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <StartSessionModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStartSession={handleStartSession}
        initialClient={selectedClientId ? clients.find(c => c.id === selectedClientId) || null : null}
      />

      <AddIndividualModal
        isOpen={showAddIndividualModal}
        onClose={() => {
          setShowAddIndividualModal(false);
          setSelectedSessionForAction(null);
        }}
        onAddIndividuals={(individualsData) => {
          if (selectedSessionForAction) {
            handleAddIndividualToSession(selectedSessionForAction, individualsData);
          }
        }}
        currentIndividualsCount={(() => {
          const session = activeSessions.find(s => s.id === selectedSessionForAction);
          return session?.current_individuals_count || 0;
        })()}
        sessionClientName={(() => {
          const session = activeSessions.find(s => s.id === selectedSessionForAction);
          return session?.client_name || 'عميل غير محدد';
        })()}
      />

      <AddProductToSessionModal
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          setSelectedSessionForAction(null);
        }}
        products={products}
        sessionId={selectedSessionForAction || ''}
        onAddProductsBatch={handleAddProductsToSession}
      />

      <EditSessionProductsModal
        isOpen={showEditProductsModal}
        onClose={() => {
          setShowEditProductsModal(false);
          setSelectedSessionForAction(null);
        }}
        sessionId={selectedSessionForAction || ''}
        sessionItems={(() => {
          const session = activeSessions.find(s => s.id === selectedSessionForAction);
          return session?.session_items || [];
        })()}
        availableProducts={products}
        onUpdateSessionItems={handleUpdateSessionItems}
        sessionInfo={(() => {
          const session = activeSessions.find(s => s.id === selectedSessionForAction);
          const duration = session ? sessionDurations[session.id] || 0 : 0;
          
          return {
            client_name: session?.client_name || 'عميل غير محدد',
            current_individuals_count: session?.current_individuals_count || 0,
            session_duration_seconds: duration
          };
        })()}
      />

      <QuickProductEditModal
        isOpen={showQuickEditModal}
        onClose={() => {
          setShowQuickEditModal(false);
          setSelectedItemForQuickEdit(null);
        }}
        item={selectedItemForQuickEdit}
        availableProducts={products}
        onUpdateItem={(updatedItem) => {
          // Find session with this item and update it
          const sessionWithItem = activeSessions.find(session => 
            session.session_items.some(item => item.id === updatedItem.id)
          );
          
          if (sessionWithItem) {
            const updatedItems = sessionWithItem.session_items.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            );
            handleUpdateSessionItems(sessionWithItem.id, updatedItems);
          }
          
          setShowQuickEditModal(false);
          setSelectedItemForQuickEdit(null);
        }}
        onDeleteItem={(itemId) => {
          // Find session with this item and remove it
          const sessionWithItem = activeSessions.find(session => 
            session.session_items.some(item => item.id === itemId)
          );
          
          if (sessionWithItem) {
            const updatedItems = sessionWithItem.session_items.filter(item => item.id !== itemId);
            handleUpdateSessionItems(sessionWithItem.id, updatedItems);
          }
          
          setShowQuickEditModal(false);
          setSelectedItemForQuickEdit(null);
        }}
      />

      {/* Payment Modal */}
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
        sessionDurationSeconds={(() => {
          const session = activeSessions.find(s => s.invoice_id === invoiceToDisplayInPaymentModal?.id);
          return session ? sessionDurations[session.id] : 0;
        })()}
        onPaymentSuccess={handlePaymentSuccess}
        userRole={user?.role}
      />
    </div>
  );
};

export default SessionInvoiceManager;