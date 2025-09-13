import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { apiClient } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import { Branch } from '../../types';
import { formatDateOnly } from '../../lib/utils';

const Branches: React.FC = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useLocalStorage<Branch[]>('branches', [
    {
      id: '1',
      name: 'الفرع الرئيسي',
      address: 'شارع التحرير، وسط البلد، القاهرة',
      phone: '+20101234567',
      email: 'main@shaghaf.eg',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'فرع الإسكندرية',
      address: 'شارع الكورنيش، الإسكندرية',
      phone: '+20102345678',
      email: 'alexandria@shaghaf.eg',
      created_at: '2024-02-01T00:00:00Z'
    }
  ]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      try {
        const data = await apiClient.getBranches();
        setBranches(data);
      } catch (apiError) {
        console.warn('API not available, using local storage data:', apiError);
        // Local storage data is already loaded via useLocalStorage hook
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = async () => {
      try {
        // Try API first
        if (editingBranch) {
          await apiClient.updateBranch(editingBranch.id, formData);
        } else {
          await apiClient.createBranch(formData);
        }
        await fetchBranches();
      } catch (error) {
        console.warn('API call failed, using local storage fallback:', error);
        
        // Fallback to local storage
        if (editingBranch) {
          setBranches(branches.map(branch => 
            branch.id === editingBranch.id 
              ? { ...branch, ...formData }
              : branch
          ));
        } else {
          const newBranch: Branch = {
            id: Date.now().toString(),
            ...formData,
            created_at: new Date().toISOString()
          };
          setBranches([...branches, newBranch]);
        }
      }
      
      setShowForm(false);
      setEditingBranch(null);
      setFormData({ name: '', address: '', phone: '', email: '' });
    };
    
    submitData();
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      try {
        try {
          await apiClient.deleteBranch(id);
          await fetchBranches();
        } catch (apiError) {
          console.warn('API call failed, deleting from local storage:', apiError);
          setBranches(branches.filter(branch => branch.id !== id));
        }
      } catch (error) {
        console.error('Error deleting branch:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if user has permission to manage branches
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح لك بالوصول</h3>
          <p className="text-gray-500">ليس لديك صلاحية لإدارة الفروع</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          إضافة فرع جديد
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">إدارة الفروع</h1>
          <p className="text-gray-600 text-right">إدارة وتنظيم فروع شغف للعمل المشترك</p>
        </div>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-right">
              {editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-right block mb-2">اسم الفرع</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="اسم الفرع"
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
                    required
                    className="text-right"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address" className="text-right block mb-2">العنوان</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="العنوان الكامل"
                    required
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-right block mb-2">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966501234567"
                    required
                    className="text-right"
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingBranch(null);
                  setFormData({ name: '', address: '', phone: '', email: '' });
                }}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingBranch ? 'حفظ التغييرات' : 'إضافة الفرع'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(branch)}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(branch.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <CardTitle className="text-xl">{branch.name}</CardTitle>
                  <Badge variant="secondary">نشط</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-end text-sm text-gray-600">
                  <span className="mr-2">{branch.address}</span>
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-end text-sm text-gray-600">
                  <span className="mr-2" dir="ltr">{branch.phone}</span>
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-end text-sm text-gray-600">
                  <span className="mr-2" dir="ltr">{branch.email}</span>
                  <Mail className="h-4 w-4" />
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {formatDateOnly(branch.created_at)}
                  </span>
                  <span className="text-gray-500">تاريخ الإنشاء:</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فروع</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة الفرع الأول لشغف للعمل المشترك</p>
          <Button onClick={() => setShowForm(true)}>
            إضافة فرع جديد
          </Button>
        </div>
      )}
    </div>
  );
};

export default Branches;