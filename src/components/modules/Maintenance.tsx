import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Settings, Wrench, AlertTriangle, CheckCircle, Clock, Edit, Trash2, User, Calendar, DollarSign, Package, Building2, Filter, Search, FileText, Camera, Upload, Download, Send, Target, PenTool as Tool, Cog, Zap, Shield, Activity, TrendingUp } from 'lucide-react';
import { Asset, MaintenanceRequest, MaintenanceTask, MaintenanceSchedule, User as Employee } from '../../types';
import { formatDateOnly, formatDateTimeDetailed, formatRelativeDate } from '../../lib/utils';

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  
  // Data from localStorage with comprehensive demo data
  const [allAssets, setAllAssets] = useLocalStorage<Asset[]>('assets', [
    {
      id: '1',
      branch_id: '1',
      name: 'جهاز تكييف قاعة الاجتماعات',
      category: 'infrastructure',
      description: 'تكييف مركزي 3 حصان للقاعة الكبرى',
      location: 'قاعة الاجتماعات الكبرى',
      purchase_date: '2024-01-15',
      purchase_cost: 15000,
      warranty_end_date: '2026-01-15',
      condition: 'good',
      maintenance_schedule: 'monthly',
      last_maintenance_date: '2024-11-15',
      next_maintenance_date: '2024-12-15',
      is_active: true,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      branch_id: '1',
      name: 'شاشة عرض ذكية - القاعة الرئيسية',
      category: 'electronics',
      description: 'شاشة LED 65 بوصة للعروض التقديمية',
      location: 'قاعة الاجتماعات الكبرى',
      purchase_date: '2024-03-10',
      purchase_cost: 25000,
      warranty_end_date: '2027-03-10',
      condition: 'excellent',
      maintenance_schedule: 'quarterly',
      last_maintenance_date: '2024-09-10',
      next_maintenance_date: '2024-12-10',
      is_active: true,
      created_at: '2024-03-10T00:00:00Z'
    },
    {
      id: '3',
      branch_id: '1',
      name: 'طابعة HP LaserJet Pro',
      category: 'equipment',
      description: 'طابعة ليزر متعددة الوظائف',
      location: 'منطقة الاستقبال',
      purchase_date: '2024-02-20',
      purchase_cost: 8500,
      warranty_end_date: '2025-02-20',
      condition: 'fair',
      maintenance_schedule: 'monthly',
      last_maintenance_date: '2024-10-20',
      next_maintenance_date: '2024-11-20',
      is_active: true,
      created_at: '2024-02-20T00:00:00Z'
    },
    {
      id: '4',
      branch_id: '1',
      name: 'مجموعة كراسي مكتبية - المساحة المشتركة',
      category: 'furniture',
      description: 'مجموعة من 20 كرسي مكتبي مريح',
      location: 'المساحة المشتركة',
      purchase_date: '2024-01-05',
      purchase_cost: 30000,
      condition: 'good',
      maintenance_schedule: 'quarterly',
      last_maintenance_date: '2024-10-05',
      next_maintenance_date: '2025-01-05',
      is_active: true,
      created_at: '2024-01-05T00:00:00Z'
    }
  ]);

  const [allMaintenanceRequests, setAllMaintenanceRequests] = useLocalStorage<MaintenanceRequest[]>('maintenance_requests', [
    {
      id: '1',
      branch_id: '1',
      asset_id: '1',
      title: 'صيانة دورية للتكييف المركزي',
      description: 'تنظيف الفلاتر وفحص الفريون والضاغط',
      priority: 'medium',
      status: 'pending',
      request_type: 'preventive',
      estimated_cost: 800,
      requested_by: '2',
      scheduled_date: '2024-12-15',
      notes: 'صيانة دورية شهرية حسب الجدول',
      created_at: '2024-12-10T09:00:00Z',
      updated_at: '2024-12-10T09:00:00Z',
      requested_by_name: 'فاطمة أحمد'
    },
    {
      id: '2',
      branch_id: '1',
      asset_id: '3',
      title: 'إصلاح مشكلة في الطابعة',
      description: 'الطابعة لا تطبع بوضوح والألوان باهتة',
      priority: 'high',
      status: 'approved',
      request_type: 'corrective',
      estimated_cost: 500,
      actual_cost: 450,
      requested_by: '2',
      approved_by: '1',
      assigned_to: '3',
      scheduled_date: '2024-12-18',
      notes: 'مطلوب تغيير خرطوشة الحبر وتنظيف الطابعة',
      created_at: '2024-12-12T14:30:00Z',
      updated_at: '2024-12-13T10:15:00Z',
      requested_by_name: 'فاطمة أحمد',
      approved_by_name: 'مدير النظام',
      assigned_to_name: 'محمد حسام'
    },
    {
      id: '3',
      branch_id: '1',
      asset_id: '2',
      title: 'مشكلة في الاتصال بالشاشة الذكية',
      description: 'الشاشة لا تستجيب للاتصال اللاسلكي من اللابتوب',
      priority: 'urgent',
      status: 'in_progress',
      request_type: 'corrective',
      estimated_cost: 300,
      requested_by: '1',
      approved_by: '1',
      assigned_to: '3',
      scheduled_date: '2024-12-16',
      notes: 'مطلوب فحص اتصال WiFi والكابلات',
      created_at: '2024-12-15T11:20:00Z',
      updated_at: '2024-12-16T08:45:00Z',
      requested_by_name: 'مدير النظام',
      approved_by_name: 'مدير النظام',
      assigned_to_name: 'محمد حسام'
    }
  ]);

  const [allEmployees] = useLocalStorage<Employee[]>('users', []);

  // Filter data by branch
  const assets = allAssets.filter(asset => asset.branch_id === user?.branch_id);
  const maintenanceRequests = allMaintenanceRequests.filter(request => request.branch_id === user?.branch_id);
  const employees = allEmployees.filter(emp => emp.branch_id === user?.branch_id);

  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'requests' | 'schedule'>('overview');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    category: 'equipment' as Asset['category'],
    description: '',
    location: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_end_date: '',
    condition: 'excellent' as Asset['condition'],
    maintenance_schedule: 'monthly' as Asset['maintenance_schedule']
  });

  const [requestFormData, setRequestFormData] = useState({
    asset_id: '',
    title: '',
    description: '',
    priority: 'medium' as MaintenanceRequest['priority'],
    request_type: 'corrective' as MaintenanceRequest['request_type'],
    estimated_cost: '',
    scheduled_date: '',
    assigned_to: '',
    notes: ''
  });

  // Statistics
  const maintenanceStats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalAssets: assets.length,
      activeAssets: assets.filter(asset => asset.is_active).length,
      totalRequests: maintenanceRequests.length,
      pendingRequests: maintenanceRequests.filter(req => req.status === 'pending').length,
      urgentRequests: maintenanceRequests.filter(req => req.priority === 'urgent' && req.status !== 'completed').length,
      scheduledToday: maintenanceRequests.filter(req => req.scheduled_date === today).length,
      overdueRequests: maintenanceRequests.filter(req => 
        req.scheduled_date && req.scheduled_date < today && req.status !== 'completed'
      ).length,
      totalMaintenanceCost: maintenanceRequests
        .filter(req => req.actual_cost || req.estimated_cost)
        .reduce((sum, req) => sum + (req.actual_cost || req.estimated_cost || 0), 0)
    };
  }, [assets, maintenanceRequests]);

  // Asset form handlers
  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assetData = {
      ...assetFormData,
      purchase_cost: parseFloat(assetFormData.purchase_cost) || 0,
    };

    if (editingAsset) {
      setAllAssets(allAssets.map(asset => 
        asset.id === editingAsset.id 
          ? { ...asset, ...assetData }
          : asset
      ));
    } else {
      const newAsset: Asset = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        ...assetData,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setAllAssets([...allAssets, newAsset]);
    }
    
    setShowAssetForm(false);
    setEditingAsset(null);
    setAssetFormData({
      name: '', category: 'equipment', description: '', location: '', purchase_date: '', 
      purchase_cost: '', warranty_end_date: '', condition: 'excellent', maintenance_schedule: 'monthly'
    });
  };

  // Maintenance request form handlers
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData = {
      ...requestFormData,
      estimated_cost: parseFloat(requestFormData.estimated_cost) || undefined,
    };

    if (editingRequest) {
      setAllMaintenanceRequests(allMaintenanceRequests.map(req => 
        req.id === editingRequest.id 
          ? { ...req, ...requestData, updated_at: new Date().toISOString() }
          : req
      ));
    } else {
      const assignedEmployee = employees.find(emp => emp.id === requestData.assigned_to);
      const newRequest: MaintenanceRequest = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        ...requestData,
        status: 'pending',
        requested_by: user?.id || '1',
        requested_by_name: user?.name || 'مدير النظام',
        assigned_to_name: assignedEmployee?.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setAllMaintenanceRequests([...allMaintenanceRequests, newRequest]);
    }
    
    setShowRequestForm(false);
    setEditingRequest(null);
    setRequestFormData({
      asset_id: '', title: '', description: '', priority: 'medium', request_type: 'corrective',
      estimated_cost: '', scheduled_date: '', assigned_to: '', notes: ''
    });
  };

  // Helper functions
  const getAssetCategoryLabel = (category: Asset['category']) => {
    switch (category) {
      case 'furniture': return 'أثاث';
      case 'electronics': return 'إلكترونيات';
      case 'equipment': return 'معدات';
      case 'infrastructure': return 'بنية تحتية';
      case 'other': return 'أخرى';
      default: return category;
    }
  };

  const getAssetCategoryColor = (category: Asset['category']) => {
    switch (category) {
      case 'furniture': return 'bg-brown-100 text-brown-800';
      case 'electronics': return 'bg-blue-100 text-blue-800';
      case 'equipment': return 'bg-green-100 text-green-800';
      case 'infrastructure': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (condition: Asset['condition']) => {
    switch (condition) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'fair': return 'مقبول';
      case 'poor': return 'ضعيف';
      case 'out_of_service': return 'خارج الخدمة';
      default: return condition;
    }
  };

  const getConditionColor = (condition: Asset['condition']) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusLabel = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'approved': return 'موافق عليه';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getRequestStatusColor = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      case 'urgent': return 'عاجل';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: MaintenanceRequest['priority']) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestTypeLabel = (type: MaintenanceRequest['request_type']) => {
    switch (type) {
      case 'preventive': return 'وقائي';
      case 'corrective': return 'إصلاحي';
      case 'emergency': return 'طوارئ';
      default: return type;
    }
  };

  const getMaintenanceScheduleLabel = (schedule: Asset['maintenance_schedule']) => {
    switch (schedule) {
      case 'daily': return 'يومي';
      case 'weekly': return 'أسبوعي';
      case 'monthly': return 'شهري';
      case 'quarterly': return 'ربع سنوي';
      case 'annually': return 'سنوي';
      case 'as_needed': return 'عند الحاجة';
      default: return schedule;
    }
  };

  const handleAssetEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetFormData({
      name: asset.name,
      category: asset.category,
      description: asset.description || '',
      location: asset.location,
      purchase_date: asset.purchase_date,
      purchase_cost: asset.purchase_cost.toString(),
      warranty_end_date: asset.warranty_end_date || '',
      condition: asset.condition,
      maintenance_schedule: asset.maintenance_schedule
    });
    setShowAssetForm(true);
  };

  const handleAssetDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      setAllAssets(allAssets.filter(asset => asset.id !== id));
    }
  };

  const handleRequestEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setRequestFormData({
      asset_id: request.asset_id,
      title: request.title,
      description: request.description,
      priority: request.priority,
      request_type: request.request_type,
      estimated_cost: request.estimated_cost?.toString() || '',
      scheduled_date: request.scheduled_date || '',
      assigned_to: request.assigned_to || '',
      notes: request.notes || ''
    });
    setShowRequestForm(true);
  };

  const handleRequestDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      setAllMaintenanceRequests(allMaintenanceRequests.filter(req => req.id !== id));
    }
  };

  const handleStatusUpdate = (requestId: string, newStatus: MaintenanceRequest['status']) => {
    setAllMaintenanceRequests(allMaintenanceRequests.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: newStatus,
            completed_date: newStatus === 'completed' ? new Date().toISOString() : req.completed_date,
            updated_at: new Date().toISOString()
          }
        : req
    ));
  };

  // Filter maintenance requests
  const filteredRequests = React.useMemo(() => {
    let filtered = maintenanceRequests;

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(req => req.priority === filterPriority);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.asset && assets.find(a => a.id === req.asset_id)?.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by creation date (newer first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [maintenanceRequests, filterStatus, filterPriority, searchQuery, assets]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              if (activeTab === 'assets') setShowAssetForm(true);
              else if (activeTab === 'requests') setShowRequestForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'assets' ? 'إضافة أصل جديد' : 
             activeTab === 'requests' ? 'طلب صيانة جديد' : 'إضافة'}
          </Button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'assets' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              الأصول ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'requests' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              طلبات الصيانة ({maintenanceRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'schedule' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              الجدولة الوقائية
            </button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة الصيانة</h1>
          <p className="text-gray-600 text-right">إدارة الأصول وطلبات الصيانة والجدولة الوقائية</p>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الأصول</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-blue-600">{maintenanceStats.totalAssets}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">طلبات عاجلة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-red-600">{maintenanceStats.urgentRequests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">مجدولة اليوم</CardTitle>
                <Calendar className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-green-600">{maintenanceStats.scheduledToday}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">متأخرة</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right text-orange-600">{maintenanceStats.overdueRequests}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">الإجراءات السريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      setActiveTab('requests');
                      setShowRequestForm(true);
                    }}
                    className="p-4 h-auto flex flex-col items-center gap-2 bg-red-600 hover:bg-red-700"
                  >
                    <AlertTriangle className="h-6 w-6" />
                    <span className="text-sm font-medium">طلب صيانة عاجل</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setActiveTab('assets');
                      setShowAssetForm(true);
                    }}
                    className="p-4 h-auto flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Package className="h-6 w-6" />
                    <span className="text-sm font-medium">إضافة أصل جديد</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('schedule')}
                    className="p-4 h-auto flex flex-col items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm font-medium">الصيانة الوقائية</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('requests')}
                    className="p-4 h-auto flex flex-col items-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm font-medium">تقارير الصيانة</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Maintenance Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">طلبات الصيانة الأخيرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceRequests
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((request) => {
                      const asset = assets.find(a => a.id === request.asset_id);
                      return (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex gap-2">
                            <Badge className={getRequestStatusColor(request.status)}>
                              {getRequestStatusLabel(request.status)}
                            </Badge>
                            <Badge className={getPriorityColor(request.priority)}>
                              {getPriorityLabel(request.priority)}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-sm">{request.title}</p>
                            <p className="text-xs text-gray-600">{asset?.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeDate(request.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Asset Form */}
      {showAssetForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingAsset ? 'تعديل الأصل' : 'إضافة أصل جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssetSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset-name" className="text-right block mb-2">اسم الأصل *</Label>
                  <Input
                    id="asset-name"
                    value={assetFormData.name}
                    onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                    placeholder="اسم الأصل"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="asset-category" className="text-right block mb-2">الفئة *</Label>
                  <select
                    id="asset-category"
                    value={assetFormData.category}
                    onChange={(e) => setAssetFormData({ ...assetFormData, category: e.target.value as Asset['category'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="furniture">أثاث</option>
                    <option value="electronics">إلكترونيات</option>
                    <option value="equipment">معدات</option>
                    <option value="infrastructure">بنية تحتية</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset-location" className="text-right block mb-2">الموقع *</Label>
                  <Input
                    id="asset-location"
                    value={assetFormData.location}
                    onChange={(e) => setAssetFormData({ ...assetFormData, location: e.target.value })}
                    placeholder="موقع الأصل"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="purchase-cost" className="text-right block mb-2">تكلفة الشراء (ج.م) *</Label>
                  <Input
                    id="purchase-cost"
                    type="number"
                    step="0.01"
                    value={assetFormData.purchase_cost}
                    onChange={(e) => setAssetFormData({ ...assetFormData, purchase_cost: e.target.value })}
                    placeholder="التكلفة"
                    required
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchase-date" className="text-right block mb-2">تاريخ الشراء *</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={assetFormData.purchase_date}
                    onChange={(e) => setAssetFormData({ ...assetFormData, purchase_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="warranty-end" className="text-right block mb-2">انتهاء الضمان</Label>
                  <Input
                    id="warranty-end"
                    type="date"
                    value={assetFormData.warranty_end_date}
                    onChange={(e) => setAssetFormData({ ...assetFormData, warranty_end_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="asset-condition" className="text-right block mb-2">الحالة *</Label>
                  <select
                    id="asset-condition"
                    value={assetFormData.condition}
                    onChange={(e) => setAssetFormData({ ...assetFormData, condition: e.target.value as Asset['condition'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="excellent">ممتاز</option>
                    <option value="good">جيد</option>
                    <option value="fair">مقبول</option>
                    <option value="poor">ضعيف</option>
                    <option value="out_of_service">خارج الخدمة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenance-schedule" className="text-right block mb-2">جدولة الصيانة *</Label>
                  <select
                    id="maintenance-schedule"
                    value={assetFormData.maintenance_schedule}
                    onChange={(e) => setAssetFormData({ ...assetFormData, maintenance_schedule: e.target.value as Asset['maintenance_schedule'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="daily">يومي</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                    <option value="quarterly">ربع سنوي</option>
                    <option value="annually">سنوي</option>
                    <option value="as_needed">عند الحاجة</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="asset-description" className="text-right block mb-2">الوصف</Label>
                  <textarea
                    id="asset-description"
                    value={assetFormData.description}
                    onChange={(e) => setAssetFormData({ ...assetFormData, description: e.target.value })}
                    placeholder="وصف الأصل"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md text-right resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowAssetForm(false);
                  setEditingAsset(null);
                  setAssetFormData({
                    name: '', category: 'equipment', description: '', location: '', purchase_date: '',
                    purchase_cost: '', warranty_end_date: '', condition: 'excellent', maintenance_schedule: 'monthly'
                  });
                }}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingAsset ? 'حفظ التغييرات' : 'إضافة الأصل'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Request Form */}
      {showRequestForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingRequest ? 'تعديل طلب الصيانة' : 'طلب صيانة جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="request-asset" className="text-right block mb-2">الأصل *</Label>
                  <select
                    id="request-asset"
                    value={requestFormData.asset_id}
                    onChange={(e) => setRequestFormData({ ...requestFormData, asset_id: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="">اختر الأصل</option>
                    {assets.filter(asset => asset.is_active).map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - {asset.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="request-title" className="text-right block mb-2">عنوان الطلب *</Label>
                  <Input
                    id="request-title"
                    value={requestFormData.title}
                    onChange={(e) => setRequestFormData({ ...requestFormData, title: e.target.value })}
                    placeholder="عنوان طلب الصيانة"
                    required
                    className="text-right"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="request-description" className="text-right block mb-2">وصف المشكلة *</Label>
                <textarea
                  id="request-description"
                  value={requestFormData.description}
                  onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
                  placeholder="وصف تفصيلي للمشكلة أو الصيانة المطلوبة"
                  rows={3}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md text-right resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="request-priority" className="text-right block mb-2">الأولوية *</Label>
                  <select
                    id="request-priority"
                    value={requestFormData.priority}
                    onChange={(e) => setRequestFormData({ ...requestFormData, priority: e.target.value as MaintenanceRequest['priority'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">عالي</option>
                    <option value="urgent">عاجل</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="request-type" className="text-right block mb-2">نوع الطلب *</Label>
                  <select
                    id="request-type"
                    value={requestFormData.request_type}
                    onChange={(e) => setRequestFormData({ ...requestFormData, request_type: e.target.value as MaintenanceRequest['request_type'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="preventive">وقائي</option>
                    <option value="corrective">إصلاحي</option>
                    <option value="emergency">طوارئ</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="estimated-cost" className="text-right block mb-2">التكلفة المقدرة (ج.م)</Label>
                  <Input
                    id="estimated-cost"
                    type="number"
                    step="0.01"
                    value={requestFormData.estimated_cost}
                    onChange={(e) => setRequestFormData({ ...requestFormData, estimated_cost: e.target.value })}
                    placeholder="التكلفة المقدرة"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled-date" className="text-right block mb-2">التاريخ المجدول</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={requestFormData.scheduled_date}
                    onChange={(e) => setRequestFormData({ ...requestFormData, scheduled_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="assigned-to" className="text-right block mb-2">مكلف إلى</Label>
                  <select
                    id="assigned-to"
                    value={requestFormData.assigned_to}
                    onChange={(e) => setRequestFormData({ ...requestFormData, assigned_to: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="">لم يتم التعيين بعد</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.role === 'admin' ? 'مدير عام' : 
                         emp.role === 'manager' ? 'مدير فرع' : 
                         emp.role === 'employee' ? 'موظف' : emp.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="request-notes" className="text-right block mb-2">ملاحظات إضافية</Label>
                <textarea
                  id="request-notes"
                  value={requestFormData.notes}
                  onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية"
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md text-right resize-none"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowRequestForm(false);
                  setEditingRequest(null);
                  setRequestFormData({
                    asset_id: '', title: '', description: '', priority: 'medium', request_type: 'corrective',
                    estimated_cost: '', scheduled_date: '', assigned_to: '', notes: ''
                  });
                }}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingRequest ? 'حفظ التغييرات' : 'إنشاء طلب الصيانة'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleAssetEdit(asset)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleAssetDelete(asset.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <div className="flex gap-2 justify-end mt-1">
                      <Badge className={getAssetCategoryColor(asset.category)}>
                        {getAssetCategoryLabel(asset.category)}
                      </Badge>
                      <Badge className={getConditionColor(asset.condition)}>
                        {getConditionLabel(asset.condition)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">{asset.location}</span>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">{asset.purchase_cost.toLocaleString('ar-EG')} ج.م</span>
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">{getMaintenanceScheduleLabel(asset.maintenance_schedule)}</span>
                    <Calendar className="h-4 w-4" />
                  </div>
                  {asset.next_maintenance_date && (
                    <div className="flex items-center justify-end text-sm">
                      <span className={`mr-2 ${
                        new Date(asset.next_maintenance_date) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'
                      }`}>
                        {formatRelativeDate(asset.next_maintenance_date)}
                      </span>
                      <Clock className={`h-4 w-4 ${
                        new Date(asset.next_maintenance_date) < new Date() ? 'text-red-500' : 'text-gray-400'
                      }`} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Maintenance Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-right">تصفية طلبات الصيانة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search-requests" className="text-right block mb-2">البحث</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="search-requests"
                      placeholder="البحث في العنوان أو الوصف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-right pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="filter-status" className="text-right block mb-2">تصفية حسب الحالة</Label>
                  <select
                    id="filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="pending">في الانتظار</option>
                    <option value="approved">موافق عليه</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="filter-priority" className="text-right block mb-2">تصفية حسب الأولوية</Label>
                  <select
                    id="filter-priority"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    <option value="all">جميع الأولويات</option>
                    <option value="urgent">عاجل</option>
                    <option value="high">عالي</option>
                    <option value="medium">متوسط</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const asset = assets.find(a => a.id === request.asset_id);
              const isOverdue = request.scheduled_date && new Date(request.scheduled_date) < new Date() && request.status !== 'completed';
              
              return (
                <Card key={request.id} className={`hover:shadow-lg transition-shadow ${
                  isOverdue ? 'border-l-4 border-l-red-500' : 
                  request.priority === 'urgent' ? 'border-l-4 border-l-red-400' :
                  request.priority === 'high' ? 'border-l-4 border-l-orange-400' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRequestEdit(request)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRequestDelete(request.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        {/* Status Action Buttons */}
                        {request.status === 'pending' && (user?.role === 'admin' || user?.role === 'manager') && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'approved')}
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            موافقة
                          </Button>
                        )}
                        
                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'in_progress')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                          >
                            <Wrench className="h-3 w-3 mr-1" />
                            بدء العمل
                          </Button>
                        )}
                        
                        {request.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            إنجاز
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <Badge className={getRequestStatusColor(request.status)}>
                            {getRequestStatusLabel(request.status)}
                          </Badge>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getPriorityLabel(request.priority)}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive">متأخر</Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{request.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{asset?.name}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-700 text-right">{request.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-end text-gray-600">
                          <span className="mr-2">{request.requested_by_name}</span>
                          <User className="h-4 w-4" />
                        </div>
                        
                        {request.scheduled_date && (
                          <div className="flex items-center justify-end">
                            <span className={`mr-2 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                              {formatRelativeDate(request.scheduled_date)}
                            </span>
                            <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                          </div>
                        )}
                        
                        {(request.estimated_cost || request.actual_cost) && (
                          <div className="flex items-center justify-end text-gray-600">
                            <span className="mr-2">
                              {request.actual_cost || request.estimated_cost} ج.م
                              {request.actual_cost && ' (فعلي)'}
                              {!request.actual_cost && request.estimated_cost && ' (مقدر)'}
                            </span>
                            <DollarSign className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {request.assigned_to_name && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800 text-right">
                            <strong>مكلف إلى:</strong> {request.assigned_to_name}
                          </p>
                        </div>
                      )}

                      {request.notes && (
                        <div className="bg-gray-50 p-3 rounded-lg border">
                          <p className="text-sm text-gray-700 text-right">
                            <strong>ملاحظات:</strong> {request.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">جدولة الصيانة الوقائية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets
                .filter(asset => asset.next_maintenance_date)
                .sort((a, b) => new Date(a.next_maintenance_date!).getTime() - new Date(b.next_maintenance_date!).getTime())
                .map((asset) => {
                  const isOverdue = new Date(asset.next_maintenance_date!) < new Date();
                  const isDueSoon = new Date(asset.next_maintenance_date!).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
                  
                  return (
                    <Card key={asset.id} className={`${
                      isOverdue ? 'border-l-4 border-l-red-500 bg-red-50' :
                      isDueSoon ? 'border-l-4 border-l-orange-500 bg-orange-50' :
                      'bg-white'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {isOverdue && (
                              <Badge variant="destructive">متأخرة</Badge>
                            )}
                            {isDueSoon && !isOverdue && (
                              <Badge className="bg-orange-100 text-orange-800">مستحقة قريباً</Badge>
                            )}
                            <Badge className={getMaintenanceScheduleColor(asset.maintenance_schedule)}>
                              {getMaintenanceScheduleLabel(asset.maintenance_schedule)}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <h3 className="font-semibold text-lg">{asset.name}</h3>
                            <p className="text-gray-600 text-sm">{asset.location}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                          <div className="flex items-center justify-end text-gray-600">
                            <span className="mr-2">
                              {asset.last_maintenance_date 
                                ? formatRelativeDate(asset.last_maintenance_date)
                                : 'لم تتم بعد'
                              }
                            </span>
                            <span className="text-gray-500">آخر صيانة:</span>
                          </div>
                          
                          <div className="flex items-center justify-end">
                            <span className={`mr-2 font-medium ${
                              isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'
                            }`}>
                              {formatRelativeDate(asset.next_maintenance_date!)}
                            </span>
                            <span className="text-gray-500">الصيانة القادمة:</span>
                          </div>
                          
                          <div className="flex items-center justify-end text-gray-600">
                            <Badge className={getConditionColor(asset.condition)}>
                              {getConditionLabel(asset.condition)}
                            </Badge>
                            <span className="text-gray-500 mr-2">الحالة:</span>
                          </div>
                        </div>
                        
                        {isOverdue && (
                          <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
                            <p className="text-sm text-red-800 text-right font-medium">
                              ⚠️ الصيانة متأخرة! يجب تنفيذها في أسرع وقت ممكن
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {activeTab === 'assets' && assets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أصول</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة الأصل الأول لهذا الفرع</p>
          <Button onClick={() => setShowAssetForm(true)}>
            إضافة أصل جديد
          </Button>
        </div>
      )}

      {activeTab === 'requests' && filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Wrench className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {maintenanceRequests.length === 0 ? 'لا توجد طلبات صيانة' : 'لا توجد طلبات تطابق المعايير'}
          </h3>
          <p className="text-gray-500 mb-4">
            {maintenanceRequests.length === 0 ? 'لم يتم إنشاء أي طلبات صيانة بعد' : 'جرب تغيير المرشحات'}
          </p>
          {maintenanceRequests.length === 0 && (
            <Button onClick={() => setShowRequestForm(true)}>
              إنشاء طلب صيانة جديد
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const getMaintenanceScheduleColor = (schedule: Asset['maintenance_schedule']) => {
  switch (schedule) {
    case 'daily': return 'bg-red-100 text-red-800';
    case 'weekly': return 'bg-orange-100 text-orange-800';
    case 'monthly': return 'bg-yellow-100 text-yellow-800';
    case 'quarterly': return 'bg-blue-100 text-blue-800';
    case 'annually': return 'bg-green-100 text-green-800';
    case 'as_needed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default Maintenance;