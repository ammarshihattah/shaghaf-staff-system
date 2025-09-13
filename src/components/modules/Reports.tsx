import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Download, FileText, TrendingUp, TrendingDown, DollarSign, 
  Users, Calendar, Package, AlertTriangle 
} from 'lucide-react';
import { formatDateOnly } from '../../lib/utils';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [clients] = useLocalStorage('clients', []);
  const [bookings] = useLocalStorage('bookings', []);
  const [products] = useLocalStorage('products', []);
  const [expenses] = useLocalStorage('expenses', []);
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16)
  });

  // Filter data by branch and date range
  const branchClients = clients.filter(client => client.branch_id === user?.branch_id);
  const branchBookings = bookings.filter(booking => 
    booking.branch_id === user?.branch_id &&
    new Date(booking.created_at) >= new Date(dateRange.start) &&
    new Date(booking.created_at) <= new Date(dateRange.end)
  );

  // Revenue Analytics
  const revenueData = React.useMemo(() => {
    const monthlyRevenue = {};
    branchBookings.forEach(booking => {
      const month = new Date(booking.created_at).toLocaleDateString('ar-EG', { month: 'long' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + booking.total_amount;
    });
    
    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue: Number(revenue)
    }));
  }, [branchBookings]);

  // Booking Status Distribution
  const bookingStatusData = React.useMemo(() => {
    const statusCount = {};
    branchBookings.forEach(booking => {
      const status = booking.status === 'confirmed' ? 'مؤكد' : 
                    booking.status === 'cancelled' ? 'ملغي' : 'مكتمل';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: Number(count)
    }));
  }, [branchBookings]);

  // Membership Type Distribution
  const membershipData = React.useMemo(() => {
    const membershipCount = {};
    branchClients.forEach(client => {
      const type = client.membership_type === 'daily' ? 'يومي' :
                  client.membership_type === 'weekly' ? 'أسبوعي' :
                  client.membership_type === 'monthly' ? 'شهري' : 'شركات';
      membershipCount[type] = (membershipCount[type] || 0) + 1;
    });
    
    return Object.entries(membershipCount).map(([type, count]) => ({
      name: type,
      value: Number(count)
    }));
  }, [branchClients]);

  // Daily Bookings Trend
  const dailyBookingsData = React.useMemo(() => {
    const dailyBookings = {};
    branchBookings.forEach(booking => {
      const date = new Date(booking.created_at).toLocaleDateString('ar-EG');
      dailyBookings[date] = (dailyBookings[date] || 0) + 1;
    });
    
    return Object.entries(dailyBookings).map(([date, count]) => ({
      date,
      bookings: Number(count)
    })).slice(-7); // Last 7 days
  }, [branchBookings]);

  // Key Metrics
  const metrics = React.useMemo(() => {
    const totalRevenue = branchBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
    const totalBookings = branchBookings.length;
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const activeClients = branchClients.filter(client => 
      new Date(client.membership_end) > new Date()
    ).length;
    
    return {
      totalRevenue,
      totalBookings,
      averageBookingValue,
      activeClients,
      totalClients: branchClients.length,
      conversionRate: branchClients.length > 0 ? (activeClients / branchClients.length) * 100 : 0
    };
  }, [branchBookings, branchClients]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }
    
    // Add timestamp to filename for datetime-based reports
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    const fullFilename = `${filename}_${timestamp}`;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fullFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          <Button 
            onClick={() => exportToCSV(revenueData, `revenue-report-${dateRange.start.split('T')[0]}-to-${dateRange.end.split('T')[0]}`)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير تقرير بالنطاق الزمني
          </Button>
          
          <Button 
            onClick={() => {
              const summaryData = [{
                'النطاق الزمني': `${new Date(dateRange.start).toLocaleString('ar-EG')} - ${new Date(dateRange.end).toLocaleString('ar-EG')}`,
                'إجمالي الإيرادات': `${metrics.totalRevenue.toLocaleString('ar-EG')} ج.م`,
                'إجمالي الحجوزات': metrics.totalBookings,
                'العملاء النشطون': metrics.activeClients,
                'معدل التحويل': `${metrics.conversionRate.toFixed(1)}%`,
                'متوسط قيمة الحجز': `${metrics.averageBookingValue.toFixed(2)} ج.م`
              }];
              exportToCSV(summaryData, `detailed-summary-${dateRange.start.split('T')[0]}-to-${dateRange.end.split('T')[0]}`);
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            📋 تصدير ملخص تفصيلي
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">التقارير والإحصائيات</h1>
          <p className="text-gray-600 text-right">تحليل شامل لأداء الأعمال</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-right">فترة التقرير (تاريخ ووقت دقيق)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-right block mb-2">من تاريخ ووقت</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                اختر التاريخ والوقت بدقة (مثال: 2024-01-01 الساعة 09:00)
              </p>
            </div>
            <div>
              <Label htmlFor="end-date" className="text-right block mb-2">إلى تاريخ ووقت</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                اختر التاريخ والوقت بدقة (مثال: 2024-01-31 الساعة 23:59)
              </p>
            </div>
          </div>
          
          {/* Quick Time Range Buttons */}
          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
                setDateRange({
                  start: startOfDay.toISOString().slice(0, 16),
                  end: endOfDay.toISOString().slice(0, 16)
                });
              }}
            >
              اليوم
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0);
                const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59);
                setDateRange({
                  start: startOfYesterday.toISOString().slice(0, 16),
                  end: endOfYesterday.toISOString().slice(0, 16)
                });
              }}
            >
              أمس
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date();
                const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
                startOfWeek.setHours(0, 0, 0, 0);
                const endOfWeek = new Date(startOfWeek.getTime() + (6 * 24 * 60 * 60 * 1000));
                endOfWeek.setHours(23, 59, 0, 0);
                setDateRange({
                  start: startOfWeek.toISOString().slice(0, 16),
                  end: endOfWeek.toISOString().slice(0, 16)
                });
              }}
            >
              هذا الأسبوع
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
                setDateRange({
                  start: startOfMonth.toISOString().slice(0, 16),
                  end: endOfMonth.toISOString().slice(0, 16)
                });
              }}
            >
              هذا الشهر
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date();
                const morningStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0);
                const morningEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0);
                setDateRange({
                  start: morningStart.toISOString().slice(0, 16),
                  end: morningEnd.toISOString().slice(0, 16)
                });
              }}
            >
              فترة صباحية (6-12)
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const now = new Date();
                const eveningStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
                const eveningEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
                setDateRange({
                  start: eveningStart.toISOString().slice(0, 16),
                  end: eveningEnd.toISOString().slice(0, 16)
                });
              }}
            >
              فترة مسائية (6-12م)
            </Button>
          </div>
          
          {/* Current Selection Display */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 text-right mb-2">النطاق الزمني المحدد:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-right">
                <span className="text-blue-600">من: </span>
                <span className="font-semibold text-blue-800">
                  {new Date(dateRange.start).toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-blue-600">إلى: </span>
                <span className="font-semibold text-blue-800">
                  {new Date(dateRange.end).toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-blue-700 font-medium">
                📊 مدة التقرير: {(() => {
                  const start = new Date(dateRange.start);
                  const end = new Date(dateRange.end);
                  const diffHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffHours / 24);
                  const remainingHours = diffHours % 24;
                  
                  if (diffDays > 0) {
                    return `${diffDays} يوم${remainingHours > 0 ? ` و ${remainingHours} ساعة` : ''}`;
                  } else {
                    return `${diffHours} ساعة`;
                  }
                })()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-green-600">
              {metrics.totalRevenue.toLocaleString('ar-EG')} ج.م
            </div>
            <p className="text-xs text-muted-foreground text-right">
              متوسط الحجز: {metrics.averageBookingValue.toFixed(0)} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الحجوزات</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-blue-600">{metrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground text-right">
              في الفترة المحددة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">العملاء النشطون</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-purple-600">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground text-right">
              من أصل {metrics.totalClients} عميل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">معدل التحويل</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-orange-600">
              %{metrics.conversionRate.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              العملاء النشطون / الإجمالي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">الإيرادات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع حالات الحجز</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Bookings Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">اتجاه الحجوزات اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyBookingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Membership Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع أنواع العضوية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={membershipData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أفضل العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branchClients
                .sort((a, b) => b.loyalty_points - a.loyalty_points)
                .slice(0, 5)
                .map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <span className="font-semibold text-purple-600">{client.loyalty_points} نقطة</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">النشاط الأخير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branchBookings
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status === 'confirmed' ? 'مؤكد' : 
                         booking.status === 'cancelled' ? 'ملغي' : 'مكتمل'}
                      </Badge>
                      <span className="font-semibold text-green-600">{booking.total_amount} ج.م</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{booking.room?.name}</p>
                      <p className="text-sm text-gray-600">{booking.client?.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateOnly(booking.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;