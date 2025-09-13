import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Gift, Star, Trophy, Crown, Users, TrendingUp } from 'lucide-react';
import { formatDateOnly } from '../../lib/utils';

interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  color: string;
  icon: React.ReactNode;
}

interface LoyaltyTransaction {
  id: string;
  client_id: string;
  client_name: string;
  points: number;
  type: 'earned' | 'redeemed';
  description: string;
  date: string;
}

const Loyalty: React.FC = () => {
  const { user } = useAuth();
  const [clients] = useLocalStorage('clients', []);
  const [loyaltyTransactions, setLoyaltyTransactions] = useLocalStorage<LoyaltyTransaction[]>('loyaltyTransactions', []);
  const [selectedClient, setSelectedClient] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [description, setDescription] = useState('');

  const loyaltyTiers: LoyaltyTier[] = [
    {
      name: 'برونزي',
      minPoints: 0,
      maxPoints: 99,
      benefits: ['خصم 5%', 'نقاط مضاعفة في المناسبات'],
      color: 'bg-amber-100 text-amber-800',
      icon: <Gift className="h-4 w-4" />
    },
    {
      name: 'فضي',
      minPoints: 100,
      maxPoints: 299,
      benefits: ['خصم 10%', 'حجز مجاني شهرياً', 'أولوية في الحجز'],
      color: 'bg-gray-100 text-gray-800',
      icon: <Star className="h-4 w-4" />
    },
    {
      name: 'ذهبي',
      minPoints: 300,
      maxPoints: 599,
      benefits: ['خصم 15%', 'حجزين مجانيين شهرياً', 'دعوة لفعاليات خاصة'],
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Trophy className="h-4 w-4" />
    },
    {
      name: 'بلاتيني',
      minPoints: 600,
      maxPoints: Infinity,
      benefits: ['خصم 20%', 'حجوزات مجانية غير محدودة', 'خدمة عملاء مخصصة'],
      color: 'bg-purple-100 text-purple-800',
      icon: <Crown className="h-4 w-4" />
    }
  ];

  const branchClients = clients.filter(client => client.branch_id === user?.branch_id);

  const getClientTier = (points: number): LoyaltyTier => {
    return loyaltyTiers.find(tier => points >= tier.minPoints && points <= tier.maxPoints) || loyaltyTiers[0];
  };

  const handleAddPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !pointsToAdd) return;

    const client = branchClients.find(c => c.id === selectedClient);
    if (!client) return;

    const transaction: LoyaltyTransaction = {
      id: Date.now().toString(),
      client_id: selectedClient,
      client_name: client.name,
      points: parseInt(pointsToAdd),
      type: 'earned',
      description: description || 'نقاط مكافأة',
      date: new Date().toISOString()
    };

    setLoyaltyTransactions([transaction, ...loyaltyTransactions]);
    
    // Update client points
    const updatedClients = clients.map(c => 
      c.id === selectedClient 
        ? { ...c, loyalty_points: c.loyalty_points + parseInt(pointsToAdd) }
        : c
    );
    localStorage.setItem('clients', JSON.stringify(updatedClients));

    setSelectedClient('');
    setPointsToAdd('');
    setDescription('');
  };

  const handleRedeemPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !pointsToRedeem) return;

    const client = branchClients.find(c => c.id === selectedClient);
    if (!client || client.loyalty_points < parseInt(pointsToRedeem)) {
      alert('النقاط غير كافية للاستبدال');
      return;
    }

    const transaction: LoyaltyTransaction = {
      id: Date.now().toString(),
      client_id: selectedClient,
      client_name: client.name,
      points: -parseInt(pointsToRedeem),
      type: 'redeemed',
      description: description || 'استبدال نقاط',
      date: new Date().toISOString()
    };

    setLoyaltyTransactions([transaction, ...loyaltyTransactions]);
    
    // Update client points
    const updatedClients = clients.map(c => 
      c.id === selectedClient 
        ? { ...c, loyalty_points: c.loyalty_points - parseInt(pointsToRedeem) }
        : c
    );
    localStorage.setItem('clients', JSON.stringify(updatedClients));

    setSelectedClient('');
    setPointsToRedeem('');
    setDescription('');
  };

  const totalPoints = branchClients.reduce((sum, client) => sum + client.loyalty_points, 0);
  const activeMembers = branchClients.filter(client => client.loyalty_points > 0).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 text-right mb-2">برنامج الولاء</h1>
        <p className="text-gray-600 text-right">إدارة نقاط الولاء ومستويات العضوية</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي النقاط</CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-purple-600">{totalPoints.toLocaleString('ar-EG')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">الأعضاء النشطون</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-blue-600">{activeMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">المعاملات اليوم</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-green-600">
              {loyaltyTransactions.filter(t => 
                new Date(t.date).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">أعضاء بلاتيني</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-purple-600">
              {branchClients.filter(client => client.loyalty_points >= 600).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {loyaltyTiers.map((tier, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className={tier.color}>
                  {tier.icon}
                  <span className="mr-1">{tier.name}</span>
                </Badge>
                <div className="text-right">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {tier.minPoints} - {tier.maxPoints === Infinity ? '∞' : tier.maxPoints} نقطة
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tier.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center justify-end text-sm text-gray-600">
                    <span className="mr-2">{benefit}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <span className="text-lg font-bold text-gray-800">
                  {branchClients.filter(client => {
                    const clientTier = getClientTier(client.loyalty_points);
                    return clientTier.name === tier.name;
                  }).length}
                </span>
                <p className="text-xs text-gray-500">عضو</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Points Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Add Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">إضافة نقاط ولاء</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPoints} className="space-y-4">
              <div>
                <Label htmlFor="client-select" className="text-right block mb-2">العميل</Label>
                <select
                  id="client-select"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                >
                  <option value="">اختر العميل</option>
                  {branchClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.loyalty_points} نقطة)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="points-add" className="text-right block mb-2">عدد النقاط</Label>
                <Input
                  id="points-add"
                  type="number"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(e.target.value)}
                  placeholder="عدد النقاط"
                  required
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="description-add" className="text-right block mb-2">الوصف</Label>
                <Input
                  id="description-add"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="سبب إضافة النقاط"
                  className="text-right"
                />
              </div>

              <Button type="submit" className="w-full">
                إضافة النقاط
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Redeem Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">استبدال نقاط الولاء</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRedeemPoints} className="space-y-4">
              <div>
                <Label htmlFor="client-redeem" className="text-right block mb-2">العميل</Label>
                <select
                  id="client-redeem"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                >
                  <option value="">اختر العميل</option>
                  {branchClients.filter(client => client.loyalty_points > 0).map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.loyalty_points} نقطة)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="points-redeem" className="text-right block mb-2">عدد النقاط</Label>
                <Input
                  id="points-redeem"
                  type="number"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  placeholder="عدد النقاط للاستبدال"
                  required
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="description-redeem" className="text-right block mb-2">الوصف</Label>
                <Input
                  id="description-redeem"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="سبب استبدال النقاط"
                  className="text-right"
                />
              </div>

              <Button type="submit" variant="outline" className="w-full">
                استبدال النقاط
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">المعاملات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loyaltyTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={transaction.type === 'earned' ? 'default' : 'secondary'}>
                    {transaction.type === 'earned' ? 'مكتسب' : 'مستبدل'}
                  </Badge>
                  <span className={`font-semibold ${
                    transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : ''}{transaction.points} نقطة
                  </span>
                </div>
                
                <div className="text-right">
                  <p className="font-medium">{transaction.client_name}</p>
                  <p className="text-sm text-gray-600">{transaction.description}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateOnly(transaction.date)}
                  </p>
                </div>
              </div>
            ))}
            
            {loyaltyTransactions.length === 0 && (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد معاملات</h3>
                <p className="text-gray-500">لم يتم تسجيل أي معاملات نقاط بعد</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loyalty;