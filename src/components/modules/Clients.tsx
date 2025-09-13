import React, { useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, Users, Phone, Mail, Calendar, Gift, CreditCard } from 'lucide-react';
import { Client } from '../../types';
import { formatDateOnly } from '../../lib/utils';

const Clients: React.FC = () => {
  const { user } = useAuth();
  
  const [allClients, setAllClients] = useLocalStorage<Client[]>('clients', [
    {
      id: '1',
      branch_id: '1',
      name: 'أحمد محمد علي',
      email: 'ahmed@example.com',
      phone: '+20101234567',
      id_number: '12345678901234',
      membership_type: 'monthly',
      membership_start: '2024-01-01T00:00:00Z',
      membership_end: '2024-12-31T00:00:00Z',
      loyalty_points: 150,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      branch_id: '1',
      name: 'فاطمة أحمد',
      email: 'fatma@example.com',
      phone: '+20102345678',
      id_number: '98765432109876',
      membership_type: 'weekly',
      membership_start: '2024-12-01T00:00:00Z',
      membership_end: '2024-12-31T00:00:00Z',
      loyalty_points: 80,
      created_at: '2024-12-01T00:00:00Z'
    },
    {
      id: '3',
      branch_id: '2',
      name: 'محمد حسن',
      email: 'mohamed@example.com',
      phone: '+20103456789',
      id_number: '11223344556677',
      membership_type: 'corporate',
      membership_start: '2024-06-01T00:00:00Z',
      membership_end: '2025-06-01T00:00:00Z',
      loyalty_points: 300,
      created_at: '2024-06-01T00:00:00Z'
    }
  ]);

  // Filter clients by current user's branch
  const clients = allClients.filter(client => client.branch_id === user?.branch_id);

  const setClients = (newClients: Client[] | ((prevClients: Client[]) => Client[])) => {
    if (typeof newClients === 'function') {
      setAllClients(prevAllClients => {
        const currentBranchClients = prevAllClients.filter(client => client.branch_id === user?.branch_id);
        const otherBranchClients = prevAllClients.filter(client => client.branch_id !== user?.branch_id);
        const updatedCurrentBranchClients = newClients(currentBranchClients);
        return [...otherBranchClients, ...updatedCurrentBranchClients];
      });
    } else {
      setAllClients(prevAllClients => {
        const otherBranchClients = prevAllClients.filter(client => client.branch_id !== user?.branch_id);
        return [...otherBranchClients, ...newClients];
      });
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    id_number: '',
    membership_type: 'daily' as Client['membership_type'],
    membership_start: '',
    membership_end: '',
    loyalty_points: '0'
  });

  const membershipTypes = [
    { value: 'daily', label: 'يومي', color: 'bg-blue-100 text-blue-800' },
    { value: 'weekly', label: 'أسبوعي', color: 'bg-green-100 text-green-800' },
    { value: 'monthly', label: 'شهري', color: 'bg-purple-100 text-purple-800' },
    { value: 'corporate', label: 'شركات', color: 'bg-orange-100 text-orange-800' }
  ];

  const getMembershipTypeLabel = (type: string) => {
    return membershipTypes.find(mt => mt.value === type)?.label || type;
  };

  const getMembershipTypeColor = (type: string) => {
    return membershipTypes.find(mt => mt.value === type)?.color || 'bg-gray-100 text-gray-800';
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من تكرار رقم الهاتف عند إضافة عميل جديد
    if (!editingClient && formData.phone.trim()) {
      const existingClient = clients.find(client => 
        client.phone === formData.phone.trim() && client.id !== (editingClient?.id || '')
      );
      
      if (existingClient) {
        alert(`رقم الهاتف ${formData.phone} مسجل بالفعل للعميل: ${existingClient.name}`);
        return;
      }
    }
    
    const clientData = {
      ...formData,
      loyalty_points: parseInt(formData.loyalty_points) || 0
    };

    if (editingClient) {
      setClients(clients.map(client => 
        client.id === editingClient.id 
          ? { ...client, ...clientData }
          : client
      ));
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        branch_id: user?.branch_id || '1',
        ...clientData,
        created_at: new Date().toISOString()
      };
      setClients([...clients, newClient]);
    }
    
    setShowForm(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      id_number: '',
      membership_type: 'daily',
      membership_start: '',
      membership_end: '',
      loyalty_points: '0'
    });
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      id_number: client.id_number,
      membership_type: client.membership_type,
      membership_start: client.membership_start.split('T')[0],
      membership_end: client.membership_end.split('T')[0],
      loyalty_points: client.loyalty_points.toString()
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setClients(clients.filter(client => client.id !== id));
    }
  };

  const handleAddLoyaltyPoints = (clientId: string, points: number) => {
    setClients(clients.map(client => 
      client.id === clientId 
        ? { ...client, loyalty_points: client.loyalty_points + points }
        : client
    ));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة عميل جديد
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة العملاء والعضويات</h1>
          <p className="text-gray-600 text-right">إدارة قاعدة بيانات العملاء وعضوياتهم</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">عضويات منتهية الصلاحية</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-red-600">
              {clients.filter(client => isExpired(client.membership_end)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">تنتهي قريباً</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-orange-600">
              {clients.filter(client => isExpiringSoon(client.membership_end)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي نقاط الولاء</CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-purple-600">
              {clients.reduce((total, client) => total + client.loyalty_points, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-right block mb-2">الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="الاسم الكامل"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-right block mb-2">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="البريد الإلكتروني"
                    className="text-right"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-right block mb-2">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+20101234567"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="id_number" className="text-right block mb-2">رقم الهوية</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    placeholder="رقم الهوية الوطنية"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="membership_type" className="text-right block mb-2">نوع العضوية</Label>
                  <select
                    id="membership_type"
                    value={formData.membership_type}
                    onChange={(e) => setFormData({ ...formData, membership_type: e.target.value as Client['membership_type'] })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md text-right"
                  >
                    {membershipTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="membership_start" className="text-right block mb-2">تاريخ بداية العضوية</Label>
                  <Input
                    id="membership_start"
                    type="date"
                    value={formData.membership_start}
                    onChange={(e) => setFormData({ ...formData, membership_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="membership_end" className="text-right block mb-2">تاريخ انتهاء العضوية</Label>
                  <Input
                    id="membership_end"
                    type="date"
                    value={formData.membership_end}
                    onChange={(e) => setFormData({ ...formData, membership_end: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="loyalty_points" className="text-right block mb-2">نقاط الولاء</Label>
                <Input
                  id="loyalty_points"
                  type="number"
                  value={formData.loyalty_points}
                  onChange={(e) => setFormData({ ...formData, loyalty_points: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="text-right"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingClient(null);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    id_number: '',
                    membership_type: 'daily',
                    membership_start: '',
                    membership_end: '',
                    loyalty_points: '0'
                  });
                }}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingClient ? 'حفظ التغييرات' : 'إضافة العميل'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(client)}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <div className="flex gap-2 justify-end mt-1">
                    <Badge className={getMembershipTypeColor(client.membership_type)}>
                      {getMembershipTypeLabel(client.membership_type)}
                    </Badge>
                    {isExpired(client.membership_end) && (
                      <Badge variant="destructive">منتهية</Badge>
                    )}
                    {isExpiringSoon(client.membership_end) && !isExpired(client.membership_end) && (
                      <Badge className="bg-orange-100 text-orange-800">تنتهي قريباً</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-end text-sm text-gray-600">
                  <span className="mr-2" dir="ltr">{client.email}</span>
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-end text-sm text-gray-600">
                  <span className="mr-2" dir="ltr">{client.phone}</span>
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-end text-sm text-gray-600">
                  <span className="mr-2">
                    {formatDateOnly(client.membership_end)}
                  </span>
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddLoyaltyPoints(client.id, 10)}
                    className="text-purple-600 hover:bg-purple-50"
                  >
                    +10 نقاط
                  </Button>
                  <div className="flex items-center text-sm font-semibold text-purple-600">
                    <span className="mr-2">{client.loyalty_points} نقطة</span>
                    <Gift className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد عملاء في هذا الفرع</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة العميل الأول لهذا الفرع</p>
          <Button onClick={() => setShowForm(true)}>
            إضافة عميل جديد
          </Button>
        </div>
      )}
    </div>
  );
};

export default Clients;