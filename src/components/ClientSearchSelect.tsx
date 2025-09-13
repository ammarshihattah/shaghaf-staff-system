import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, X, User, Phone, Star, UserCheck } from 'lucide-react';
import { Client } from '../types';

interface ClientSearchSelectProps {
  clients: Client[];
  selectedClientId: string;
  onClientSelect: (clientId: string) => void;
  placeholder?: string;
  className?: string;
}

const ClientSearchSelect: React.FC<ClientSearchSelectProps> = ({
  clients,
  selectedClientId,
  onClientSelect,
  placeholder = "ابحث واختر عميل موجود...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter clients based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleClientSelect = (client: Client) => {
    onClientSelect(client.id);
    setSearchTerm('');
    setIsOpen(false);
  };

  const clearSelection = () => {
    onClientSelect('');
    setSearchTerm('');
    setIsOpen(false);
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

  const getMembershipTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'corporate': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Display Selected Client or Search Input */}
      {selectedClient ? (
        <div className="flex items-center justify-between p-3 border-2 border-green-300 rounded-md bg-green-50">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            className="text-red-600 hover:bg-red-50 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="text-right flex-1">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="font-semibold text-green-800">{selectedClient.name}</span>
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-green-600" dir="ltr">{selectedClient.phone}</span>
              <Badge className={getMembershipTypeColor(selectedClient.membership_type)}>
                {getMembershipTypeLabel(selectedClient.membership_type)}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                <Star className="h-3 w-3 mr-1" />
                {selectedClient.loyalty_points} نقطة
              </Badge>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="text-right pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && !selectedClient && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Search Results Header */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {filteredClients.length} نتيجة
              </span>
              <span className="text-sm font-medium text-gray-700">
                {searchTerm ? `نتائج البحث عن: "${searchTerm}"` : 'جميع العملاء'}
              </span>
            </div>
          </div>

          {/* No Results */}
          {filteredClients.length === 0 && (
            <div className="p-6 text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? `لم يتم العثور على عملاء تطابق "${searchTerm}"` : 'لا يوجد عملاء في هذا الفرع'}
              </p>
            </div>
          )}

          {/* Client Results */}
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleClientSelect(client)}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge className={getMembershipTypeColor(client.membership_type)}>
                    {getMembershipTypeLabel(client.membership_type)}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    <Star className="h-3 w-3 mr-1" />
                    {client.loyalty_points}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{client.name}</span>
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                    <span dir="ltr">{client.phone}</span>
                    <Phone className="h-3 w-3" />
                  </div>
                  {client.email && (
                    <p className="text-xs text-gray-500 text-right mt-1" dir="ltr">
                      {client.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          {searchTerm && filteredClients.length === 0 && (
            <div className="p-4 bg-blue-50 border-t border-blue-200">
              <div className="text-center">
                <p className="text-sm text-blue-800 mb-2">
                  لم يتم العثور على عميل بهذا الاسم
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    // يمكن إضافة وظيفة إنشاء عميل جديد هنا
                    setIsOpen(false);
                    alert('لبدء جلسة لعميل جديد، استخدم الزر الأخضر "بدء جلسة لزائر جديد"');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  <User className="h-3 w-3 mr-1" />
                  إنشاء عميل جديد
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSearchSelect;