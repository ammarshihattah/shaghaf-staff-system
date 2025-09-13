import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  targetEmployeeId?: string; // For employee-specific notifications
}

const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clients] = useLocalStorage('clients', []);
  const [products] = useLocalStorage('products', []);
  const [invoices] = useLocalStorage('invoices', []);
  const [financialAdjustments] = useLocalStorage('financial_adjustments', []);

  // Generate notifications based on system data
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = new Date();

      // Check for expiring memberships
      clients.forEach(client => {
        if (client.branch_id === user?.branch_id) {
          const membershipEnd = new Date(client.membership_end);
          const daysUntilExpiry = Math.ceil((membershipEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            newNotifications.push({
              id: `membership-${client.id}`,
              type: 'warning',
              title: 'عضوية تنتهي قريباً',
              message: `عضوية ${client.name} تنتهي خلال ${daysUntilExpiry} أيام`,
              timestamp: now.toISOString(),
              read: false
            });
          } else if (daysUntilExpiry <= 0) {
            newNotifications.push({
              id: `membership-expired-${client.id}`,
              type: 'error',
              title: 'عضوية منتهية',
              message: `عضوية ${client.name} انتهت`,
              timestamp: now.toISOString(),
              read: false
            });
          }
        }
      });

      // Check for low stock products
      products.forEach(product => {
        if (product.branch_id === user?.branch_id && product.stock_quantity <= product.min_stock_level) {
          newNotifications.push({
            id: `stock-${product.id}`,
            type: 'warning',
            title: 'مخزون منخفض',
            message: `${product.name} - المتوفر: ${product.stock_quantity} ${product.unit}`,
            timestamp: now.toISOString(),
            read: false
          });
        }
      });

      // Check for financial adjustments notifications for current user
      financialAdjustments.forEach(adjustment => {
        if (adjustment.employee_id === user?.id && adjustment.status === 'approved') {
          const adjustmentDate = new Date(adjustment.created_at).toDateString();
          const today = new Date().toDateString();
          
          // Only show notification for adjustments from today
          if (adjustmentDate === today) {
            newNotifications.push({
              id: `financial-adjustment-${adjustment.id}`,
              type: adjustment.type === 'bonus' ? 'success' : 'warning',
              title: adjustment.type === 'bonus' ? 'تم إضافة بونص' : 'تم تطبيق خصم',
              message: `${adjustment.type === 'bonus' ? '+' : '-'}${adjustment.amount} ج.م - ${adjustment.reason}`,
              timestamp: adjustment.created_at,
              read: false,
              targetEmployeeId: adjustment.employee_id
            });
          }
        }
      });

      // Check for overdue invoices
      invoices.forEach(invoice => {
        if (invoice.branch_id === user?.branch_id && invoice.status === 'pending' && invoice.due_date) {
          const dueDate = new Date(invoice.due_date);
          if (dueDate < now) {
            newNotifications.push({
              id: `invoice-${invoice.id}`,
              type: 'error',
              title: 'فاتورة متأخرة',
              message: `فاتورة #${invoice.invoice_number} متأخرة السداد`,
              timestamp: now.toISOString(),
              read: false
            });
          }
        }
      });

      // Filter out existing notifications and add new ones
      const existingIds = notifications.map(n => n.id);
      const uniqueNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id));
      
      if (uniqueNewNotifications.length > 0) {
        setNotifications([...notifications, ...uniqueNewNotifications]);
      }
    };

    generateNotifications();
  }, [clients, products, invoices, financialAdjustments, user?.branch_id, user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-orange-500 bg-orange-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute left-0 top-full mt-2 w-96 z-50">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-right">
                  <CardTitle className="text-lg">الإشعارات</CardTitle>
                  {unreadCount > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs p-0 h-auto"
                    >
                      تحديد الكل كمقروء
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            getNotificationColor(notification.type)
                          } ${!notification.read ? 'font-medium' : 'opacity-75'}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 h-auto"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <div className="text-right flex-1">
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="text-sm font-semibold">{notification.title}</span>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                                <span>
                                  {formatDateTimeDetailed(notification.timestamp)}
                                </span>
                                <Clock className="h-3 w-3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;