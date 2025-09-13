import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize with comprehensive demo data on first load
  const getInitialValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        // If the parsed item is an empty array and we have demo data, use demo data instead
        if (Array.isArray(parsedItem) && parsedItem.length === 0) {
          const demoData = getDefaultData(key, initialValue);
          if (Array.isArray(demoData) && demoData.length > 0) {
            return demoData;
          }
        }
        return parsedItem;
      }
      
      // Add comprehensive demo data if none exists
      return getDefaultData(key, initialValue);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return getDefaultData(key, initialValue);
    }
  };

  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(getInitialValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Comprehensive demo data generator
function getDefaultData<T>(key: string, fallback: T): T {
  const currentDate = new Date().toISOString();
  
  const demoData: Record<string, any> = {
    branches: [
      {
        id: '1',
        name: 'الفرع الرئيسي - القاهرة',
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
    ],
    
    clients: [
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
        name: 'فاطمة أحمد حسن',
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
        branch_id: '1',
        name: 'محمد حسن علي',
        email: 'mohamed@example.com',
        phone: '+20103456789',
        id_number: '11223344556677',
        membership_type: 'corporate',
        membership_start: '2024-06-01T00:00:00Z',
        membership_end: '2025-06-01T00:00:00Z',
        loyalty_points: 300,
        created_at: '2024-06-01T00:00:00Z'
      },
      {
        id: '4',
        branch_id: '1',
        name: 'سارة أحمد محمد',
        email: 'sara@example.com',
        phone: '+20104567890',
        id_number: '22334455667788',
        membership_type: 'daily',
        membership_start: '2024-12-15T00:00:00Z',
        membership_end: '2024-12-16T00:00:00Z',
        loyalty_points: 25,
        created_at: '2024-12-15T00:00:00Z'
      }
    ],
    
    rooms: [
      {
        id: '1',
        branch_id: '1',
        name: 'قاعة الاجتماعات الكبرى',
        type: ['private'],
        capacity: 20,
        hourly_rate: 150,
        features: ['بروجكتر', 'واي فاي', 'سبورة ذكية', 'تكييف'],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        branch_id: '1',
        name: 'غرفة العمل الفردي',
        type: ['private'],
        capacity: 1,
        hourly_rate: 50,
        features: ['واي فاي', 'مكتب', 'كرسي مريح'],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        branch_id: '1',
        name: 'المساحة المشتركة',
        type: ['shared'],
        capacity: 50,
        hourly_rate: 40,
        features: ['واي فاي', 'مقاهي', 'مساحة مفتوحة'],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
    
    products: [
      {
        id: '1',
        branch_id: '1',
        name: 'قهوة عربية',
        category: 'مشروبات',
        price: 15,
        staff_price: 10,
        order_price: 12,
        cost: 8,
        stock_quantity: 45,
        min_stock_level: 50,
        max_stock_level: 200,
        unit: 'كوب',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        branch_id: '1',
        name: 'شاي بالنعناع',
        category: 'مشروبات',
        price: 12,
        staff_price: 8,
        order_price: 10,
        cost: 6,
        stock_quantity: 8,
        min_stock_level: 30,
        max_stock_level: 150,
        unit: 'كوب',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        branch_id: '1',
        name: 'ساندويتش تونة',
        category: 'طعام',
        price: 25,
        staff_price: 18,
        order_price: 22,
        cost: 15,
        stock_quantity: 0,
        min_stock_level: 20,
        max_stock_level: 100,
        unit: 'قطعة',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        branch_id: '1',
        name: 'عصير برتقال طازج',
        category: 'مشروبات',
        price: 18,
        staff_price: 12,
        order_price: 15,
        cost: 10,
        stock_quantity: 15,
        min_stock_level: 25,
        max_stock_level: 100,
        unit: 'كوب',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      // منتجات فرع الإسكندرية
      {
        id: '5',
        branch_id: '2',
        name: 'قهوة إسبريسو',
        category: 'مشروبات',
        price: 20,
        staff_price: 15,
        order_price: 18,
        cost: 12,
        stock_quantity: 30,
        min_stock_level: 40,
        max_stock_level: 150,
        unit: 'كوب',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z'
      },
      {
        id: '6',
        branch_id: '2',
        name: 'شاي كركديه',
        category: 'مشروبات',
        price: 14,
        staff_price: 10,
        order_price: 12,
        cost: 8,
        stock_quantity: 20,
        min_stock_level: 35,
        max_stock_level: 120,
        unit: 'كوب',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z'
      }
    ],
    
    suppliers: [
      {
        id: '1',
        branch_id: '1',
        name: 'شركة المشروبات المصرية',
        contact_person: 'أحمد محمد',
        phone: '+20101111111',
        email: 'beverages@supplier.com',
        address: 'المنطقة الصناعية، القاهرة',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        branch_id: '1',
        name: 'مخبز الأصالة',
        contact_person: 'فاطمة علي',
        phone: '+20102222222',
        email: 'bakery@supplier.com',
        address: 'شارع النيل، الجيزة',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        branch_id: '1',
        name: 'شركة الأغذية المتميزة',
        contact_person: 'محمد حسن',
        phone: '+20103333333',
        email: 'foods@supplier.com',
        address: 'مدينة العبور، القاهرة',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      // موردين فرع الإسكندرية
      {
        id: '4',
        branch_id: '2',
        name: 'شركة المشروبات الإسكندرانية',
        contact_person: 'سامح علي',
        phone: '+20104444444',
        email: 'alex-beverages@supplier.com',
        address: 'المنطقة الصناعية، برج العرب، الإسكندرية',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z'
      },
      {
        id: '5',
        branch_id: '2',
        name: 'مخبز البحر المتوسط',
        contact_person: 'نورا حسن',
        phone: '+20105555555',
        email: 'med-bakery@supplier.com',
        address: 'شارع الجيش، الإسكندرية',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z'
      }
    ],
    
    supplier_product_details: [
      {
        id: '1',
        supplier_id: '1',
        product_id: '1',
        cost: 8,
        average_delivery_days: 3,
        is_preferred: true,
        notes: 'جودة ممتازة، تسليم سريع',
        created_at: currentDate
      },
      {
        id: '2',
        supplier_id: '1',
        product_id: '2',
        cost: 6,
        average_delivery_days: 3,
        is_preferred: true,
        notes: 'أوراق شاي طبيعية عالية الجودة',
        created_at: currentDate
      },
      {
        id: '3',
        supplier_id: '2',
        product_id: '3',
        cost: 15,
        average_delivery_days: 1,
        is_preferred: true,
        notes: 'طازج يومياً، جودة ممتازة',
        created_at: currentDate
      },
      {
        id: '4',
        supplier_id: '3',
        product_id: '3',
        cost: 16,
        average_delivery_days: 2,
        is_preferred: false,
        notes: 'جودة جيدة، سعر أعلى قليلاً',
        created_at: currentDate
      },
      {
        id: '5',
        supplier_id: '1',
        product_id: '4',
        cost: 10,
        average_delivery_days: 2,
        is_preferred: true,
        notes: 'عصير طازج 100%',
        created_at: currentDate
      },
      // تفاصيل منتجات موردي فرع الإسكندرية
      {
        id: '6',
        supplier_id: '4',
        product_id: '5',
        cost: 12,
        average_delivery_days: 2,
        is_preferred: true,
        notes: 'قهوة إسبريسو إيطالية أصلية',
        created_at: currentDate
      },
      {
        id: '7',
        supplier_id: '4',
        product_id: '6',
        cost: 8,
        average_delivery_days: 2,
        is_preferred: true,
        notes: 'كركديه سوداني أصلي عالي الجودة',
        created_at: currentDate
      },
      {
        id: '8',
        supplier_id: '5',
        product_id: '5',
        cost: 13,
        average_delivery_days: 3,
        is_preferred: false,
        notes: 'قهوة جيدة الجودة، تسليم أبطأ',
        created_at: currentDate
      }
    ],
    
    bookings: [
     {
       id: '1',
       branch_id: '1',
       room_id: '1',
       client_id: '1',
       start_time: '2024-12-17T09:00:00Z',
       end_time: '2024-12-17T17:00:00Z',
       total_amount: 800,
       status: 'confirmed',
       is_shared_space: false,
       created_at: '2024-12-16T08:00:00Z',
       room: { id: '1', name: 'قاعة الاجتماعات الكبرى' },
       client: { id: '1', name: 'أحمد محمد علي' }
     },
     {
       id: '2',
       branch_id: '1',
       room_id: '2',
       client_id: '2',
       start_time: '2024-12-17T10:00:00Z',
       end_time: '2024-12-17T18:00:00Z',
       total_amount: 400,
       status: 'confirmed',
       is_shared_space: false,
       created_at: '2024-12-16T09:00:00Z',
       room: { id: '2', name: 'غرفة العمل الفردي' },
       client: { id: '2', name: 'فاطمة أحمد' }
     },
     {
       id: '3',
       branch_id: '1',
       room_id: '1',
       client_id: '3',
       start_time: '2024-12-17T14:00:00Z',
       end_time: '2024-12-17T16:00:00Z',
       total_amount: 300,
       status: 'confirmed',
       is_shared_space: false,
       created_at: '2024-12-16T11:00:00Z',
       room: { id: '1', name: 'قاعة الاجتماعات الكبرى' },
       client: { id: '3', name: 'محمد حسن علي' }
     }
    ],
    
    tasks: [
      {
        id: '1',
        branch_id: '1',
        assigned_to: ['2'],
        assigned_by: '1',
        title: 'تنظيف وتعقيم جميع الغرف',
        description: 'تنظيف شامل وتعقيم لجميع غرف العمل والمساحات المشتركة',
        priority: 'high',
        status: 'pending',
        due_date: '2024-12-20T16:00:00Z',
        created_at: '2024-12-16T09:00:00Z',
        updated_at: '2024-12-16T09:00:00Z',
        assigned_to_names: ['فاطمة أحمد'],
        assigned_by_name: 'مدير النظام'
      },
      {
        id: '2',
        branch_id: '1',
        assigned_to: ['3'],
        assigned_by: '1',
        title: 'صيانة أجهزة الكمبيوتر',
        description: 'فحص وصيانة جميع أجهزة الكمبيوتر في المكتب',
        priority: 'medium',
        status: 'in_progress',
        due_date: '2024-12-18T18:00:00Z',
        created_at: '2024-12-15T10:00:00Z',
        updated_at: '2024-12-16T11:30:00Z',
        assigned_to_names: ['محمد حسام'],
        assigned_by_name: 'مدير النظام'
      },
      {
        id: '3',
        branch_id: '1',
        assigned_to: ['2'],
        assigned_by: '2',
        title: 'تحديث قاعدة بيانات العملاء',
        description: 'مراجعة وتحديث معلومات الاتصال لجميع العملاء',
        priority: 'low',
        status: 'completed',
        due_date: '2024-12-15T17:00:00Z',
        completed_at: '2024-12-15T16:30:00Z',
        created_at: '2024-12-14T08:00:00Z',
        updated_at: '2024-12-15T16:30:00Z',
        assigned_to_names: ['فاطمة أحمد'],
        assigned_by_name: 'فاطمة أحمد'
      }
    ],
    
    users: [
      { id: '1', name: 'مدير النظام', email: 'admin@shaghaf.eg', role: 'admin', branch_id: '1', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'فاطمة أحمد', email: 'fatma@shaghaf.eg', role: 'reception', branch_id: '1', created_at: '2024-01-01T00:00:00Z' },
      { id: '3', name: 'محمد حسام', email: 'mohamed@shaghaf.eg', role: 'employee', branch_id: '1', created_at: '2024-01-01T00:00:00Z' }
    ],
    
    invoices: [
      {
        id: '1',
        branch_id: '1',
        client_id: '1',
        booking_id: '1',
        invoice_number: 'INV-001',
        amount: 200,
        tax_amount: 30,
        total_amount: 230,
        status: 'pending',
        payment_status: 'pending',
        remaining_balance_action: 'none',
        due_date: '2024-12-25T00:00:00Z',
        created_at: '2024-12-15T00:00:00Z',
        items: [
          {
            id: '1',
            invoice_id: '1',
            item_type: 'product',
            related_id: '1',
            name: 'قهوة عربية',
            quantity: 5,
            unit_price: 15,
            total_price: 75,
            created_at: '2024-12-15T00:00:00Z'
          },
          {
            id: '2',
            invoice_id: '1',
            item_type: 'product',
            related_id: '2',
            name: 'شاي بالنعناع',
            quantity: 3,
            unit_price: 12,
            total_price: 36,
            created_at: '2024-12-15T00:00:00Z'
          }
        ],
        payment_methods: []
      },
      {
        id: '2',
        branch_id: '1',
        client_id: '2',
        booking_id: '2',
        invoice_number: 'INV-002',
        amount: 100,
        tax_amount: 15,
        total_amount: 115,
        status: 'pending',
        payment_status: 'pending',
        remaining_balance_action: 'none',
        due_date: '2024-12-25T00:00:00Z',
        created_at: '2024-12-16T00:00:00Z',
        items: [
          {
            id: '3',
            invoice_id: '2',
            item_type: 'product',
            related_id: '4',
            name: 'عصير برتقال طازج',
            quantity: 2,
            unit_price: 18,
            total_price: 36,
            created_at: '2024-12-16T00:00:00Z'
          },
          {
            id: '4',
            invoice_id: '2',
            item_type: 'product',
            related_id: '1',
            name: 'قهوة عربية',
            quantity: 4,
            unit_price: 15,
            total_price: 60,
            created_at: '2024-12-16T00:00:00Z'
          }
        ],
        payment_methods: []
      },
      {
        id: '3',
        branch_id: '1',
        client_id: '3',
        booking_id: '3',
        invoice_number: 'INV-003',
        amount: 150,
        tax_amount: 22.5,
        total_amount: 172.5,
        status: 'pending',
        payment_status: 'pending',
        remaining_balance_action: 'none',
        due_date: '2024-12-25T00:00:00Z',
        created_at: '2024-12-16T00:00:00Z',
        items: [
          {
            id: '5',
            invoice_id: '3',
            item_type: 'product',
            related_id: '3',
            name: 'ساندويتش تونة',
            quantity: 3,
            unit_price: 25,
            total_price: 75,
            created_at: '2024-12-16T00:00:00Z'
          },
          {
            id: '6',
            invoice_id: '3',
            item_type: 'product',
            related_id: '2',
            name: 'شاي بالنعناع',
            quantity: 6,
            unit_price: 12,
            total_price: 72,
            created_at: '2024-12-16T00:00:00Z'
          }
        ],
        payment_methods: []
      },
      {
        id: '4',
        branch_id: '1',
        client_id: '1',
        invoice_number: 'INV-004',
        amount: 85,
        tax_amount: 12.75,
        total_amount: 97.75,
        status: 'paid',
        payment_status: 'paid',
        remaining_balance_action: 'none',
        due_date: '2024-12-20T00:00:00Z',
        paid_date: '2024-12-14T00:00:00Z',
        created_at: '2024-12-14T00:00:00Z',
        items: [
          {
            id: '7',
            invoice_id: '4',
            item_type: 'product',
            related_id: '1',
            name: 'قهوة عربية',
            quantity: 3,
            unit_price: 15,
            total_price: 45,
            created_at: '2024-12-14T00:00:00Z'
          },
          {
            id: '8',
            invoice_id: '4',
            item_type: 'product',
            related_id: '4',
            name: 'عصير برتقال طازج',
            quantity: 2,
            unit_price: 18,
            total_price: 36,
            created_at: '2024-12-14T00:00:00Z'
          }
        ],
        payment_methods: []
      },
      {
        id: '5',
        branch_id: '1',
        client_id: '2',
        invoice_number: 'INV-005',
        amount: 120,
        tax_amount: 18,
        total_amount: 138,
        status: 'paid',
        payment_status: 'paid',
        remaining_balance_action: 'none',
        due_date: '2024-12-18T00:00:00Z',
        paid_date: '2024-12-13T00:00:00Z',
        created_at: '2024-12-13T00:00:00Z',
        items: [
          {
            id: '9',
            invoice_id: '5',
            item_type: 'product',
            related_id: '2',
            name: 'شاي بالنعناع',
            quantity: 8,
            unit_price: 12,
            total_price: 96,
            created_at: '2024-12-13T00:00:00Z'
          },
          {
            id: '10',
            invoice_id: '5',
            item_type: 'product',
            related_id: '3',
            name: 'ساندويتش تونة',
            quantity: 1,
            unit_price: 25,
            total_price: 25,
            created_at: '2024-12-13T00:00:00Z'
          }
        ],
        payment_methods: []
      }
    ],
    
    purchase_orders: [
      {
        id: '1',
        branch_id: '1',
        supplier_id: '1',
        order_number: 'PO-001',
        status: 'sent',
        total_amount: 1250,
        expected_delivery_date: '2024-12-20',
        notes: 'طلبية شهرية للمشروبات',
        created_by: '1',
        created_at: '2024-12-16T10:00:00Z',
        items: [
          {
            id: '1',
            purchase_order_id: '1',
            product_id: '1',
            quantity: 100,
            unit_cost: 8,
            total_cost: 800,
            product_name: 'قهوة عربية'
          },
          {
            id: '2',
            purchase_order_id: '1',
            product_id: '2',
            quantity: 75,
            unit_cost: 6,
            total_cost: 450,
            product_name: 'شاي بالنعناع'
          }
        ]
      },
      {
        id: '2',
        branch_id: '1',
        supplier_id: '2',
        order_number: 'PO-002',
        status: 'draft',
        total_amount: 800,
        expected_delivery_date: '2024-12-18',
        notes: 'طلبية الساندويتشات الأسبوعية',
        created_by: '1',
      }
    ]
  }
  
  // Return specific key if it exists in demoData, otherwise return fallback
  if (key in demoData) {
    return demoData[key];
  }
  
  return fallback;
}