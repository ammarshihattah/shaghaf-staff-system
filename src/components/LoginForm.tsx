import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Branch } from '../types';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [branches] = useLocalStorage<Branch[]>('branches', [
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
  
  const [formData, setFormData] = useState({
    emailOrUsername: 'admin',
    password: 'password',
    branch_id: '1'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(formData.emailOrUsername, formData.password, formData.branch_id);
      if (!result.success) {
        setError(result.message || 'فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول.');
      console.error('Login error:', err);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">شغف للعمل المشترك</CardTitle>
          <p className="text-gray-600 mt-2">نظام إدارة شامل</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-right">
                {error}
              </div>
            )}
            
            <div>
              <Label htmlFor="emailOrUsername" className="text-right block mb-2">البريد الإلكتروني أو اسم المستخدم</Label>
              <Input
                id="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value })}
                placeholder="admin أو admin@shaghaf.eg"
                required
                className="text-right"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                يمكنك استخدام البريد الإلكتروني أو اسم المستخدم
              </p>
            </div>
            
            <div>
              <Label htmlFor="password" className="text-right block mb-2">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="branch" className="text-right block mb-2">الفرع</Label>
              <select
                id="branch"
                value={formData.branch_id}
                onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                required
                className="w-full p-2 border border-gray-300 rounded-md text-right bg-white"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center mb-2">بيانات تجريبية:</p>
            <p className="text-xs text-gray-500 text-center">
              اسم المستخدم: admin (للمدير)<br />
              manager (لمدير الفرع)<br />
              reception (للاستقبال)<br />
              أو استخدم البريد الإلكتروني<br />
             كلمة المرور: أي كلمة مرور<br />
             <strong>ملاحظة:</strong> النظام يستخدم التواريخ الميلادية والجنيه المصري
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;