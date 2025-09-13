export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: 'admin' | 'manager' | 'employee' | 'reception';
  branch_id: string;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
}

export type RoomType = 'private' | 'shared';

export interface Room {
  id: string;
  branch_id: string;
  name: string;
  type: ('private' | 'shared')[];
  capacity: number;
  hourly_rate: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Client {
  id: string;
  branch_id: string;
  name: string;
  email: string;
  phone: string;
  id_number: string;
  membership_type: 'daily' | 'weekly' | 'monthly' | 'corporate';
  membership_start: string;
  membership_end: string;
  loyalty_points: number;
  created_at: string;
}

export interface Booking {
  id: string;
  branch_id: string;
  room_id: string;
  client_id: string;
  invoice_id?: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  check_in_time?: string;
  check_out_time?: string;
  is_shared_space?: boolean;
  session_items?: InvoiceItem[];
  created_at: string;
  room?: Room;
  client?: Client;
}


export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: 'time_entry' | 'product' | 'service';
  related_id?: string; // client_id or product_id
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  individual_name?: string;
  is_split?: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  invoice_id: string;
  method: 'cash' | 'visa' | 'wallet';
  amount: number;
  transaction_id?: string;
  notes?: string;
  processed_at: string;
  created_at: string;
}

export interface Product {
  id: string;
  branch_id: string;
  name: string;
  category: string;
  image_url?: string;
  price: number;
  staff_price?: number;
  order_price?: number;
  cost?: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  unit?: string;
  barcode?: string;
  expiry_date?: string;
  is_active?: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  branch_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export interface SupplierProductDetail {
  id: string;
  supplier_id: string;
  product_id: string;
  cost: number;
  average_delivery_days: number;
  is_preferred: boolean;
  notes?: string;
  created_at: string;
  supplier_name?: string;
  product_name?: string;
  product_category?: string;
}

export interface PurchaseOrder {
  id: string;
  branch_id: string;
  supplier_id: string;
  order_number: string;
  status: 'draft' | 'sent' | 'confirmed' | 'delivered' | 'cancelled';
  total_amount: number;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity?: number;
  product_name?: string;
}

export interface Employee {
  id: string;
  branch_id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  salary: number;
  hire_date: string;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeProfile {
  id: string;
  branch_id: string;
  employee_code: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  position: 'manager' | 'reception' | 'employee';
  department: string;
  basic_salary: number;
  hire_date: string;
  employment_status: 'active' | 'inactive';
  password?: string;
  created_at: string;
}

export interface Shift {
  id: string;
  branch_id: string;
  name: string;
  type: 'morning' | 'evening' | 'full';
  start_time: string;
  end_time: string;
  days_of_week: number[]; // 0-6 (Sunday-Saturday)
  is_active: boolean;
  created_at: string;
}

export interface EmployeeShift {
  id: string;
  employee_id: string;
  shift_id: string;
  assigned_date: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  branch_id: string;
  check_in?: string;
  check_out?: string;
  break_duration: number; // in minutes
  total_hours: number;
  overtime_hours: number;
  late_minutes: number;
  status: 'present' | 'late' | 'absent' | 'partial';
  notes?: string;
  date: string;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  branch_id: string;
  month: string; // YYYY-MM
  basic_salary: number;
  overtime_pay: number;
  total_deductions: number;
  net_salary: number;
  total_hours: number;
  overtime_hours: number;
  absent_days: number;
  late_instances: number;
  status: 'draft' | 'approved' | 'paid';
  generated_at: string;
}

export interface Invoice {
  id: string;
  branch_id: string;
  client_id?: string;
  booking_id?: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'paid' | 'pending' | 'overdue';
  payment_status: 'pending' | 'partial' | 'paid' | 'overpaid';
  remaining_balance_action: 'none' | 'account_credit' | 'tips';
  due_date: string;
  paid_date?: string;
  notes?: string;
  created_at: string;
  client?: Client;
  booking?: Booking;
  items?: InvoiceItem[];
  payment_methods?: PaymentMethod[];
}

export interface FinancialReport {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  booking_revenue: number;
  membership_revenue: number;
  product_revenue: number;
  room_utilization: number;
}

export interface Shift {
  id: string;
  branch_id: string;
  name: string;
  type: 'morning' | 'evening' | 'full';
  start_time: string; // TIME format, e.g., "08:00"
  end_time: string;   // TIME format, e.g., "16:00"
  days_of_week: number[]; // Array of integers (0=Sunday, 1=Monday, ..., 6=Saturday)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeShift {
  id: string;
  employee_id: string;
  shift_id: string;
  assignment_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Optional fields for display purposes (fetched via join/lookup)
  employee?: User;
  shift?: Shift;
}
export interface Task {
  id: string;
  branch_id: string;
  assigned_to: string[];
  assigned_by: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly';
  recurrence_days?: number[]; // Days of week for weekly (0=Sunday), or day of month for monthly
  parent_task_id?: string; // For recurring task instances
  task_date?: string; // Specific date for daily task instances
  created_at: string;
  updated_at: string;
  assigned_to_names?: string[];
  assigned_by_name?: string;
}

export interface Asset {
  id: string;
  branch_id: string;
  name: string;
  category: 'furniture' | 'electronics' | 'equipment' | 'infrastructure' | 'other';
  description?: string;
  location: string;
  purchase_date: string;
  purchase_cost: number;
  warranty_end_date?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'out_of_service';
  maintenance_schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as_needed';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  branch_id: string;
  asset_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  request_type: 'preventive' | 'corrective' | 'emergency';
  estimated_cost?: number;
  actual_cost?: number;
  requested_by: string;
  approved_by?: string;
  assigned_to?: string;
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  asset?: Asset;
  requested_by_name?: string;
  approved_by_name?: string;
  assigned_to_name?: string;
}

export interface MaintenanceTask {
  id: string;
  maintenance_request_id: string;
  task_description: string;
  estimated_duration: number; // in hours
  actual_duration?: number;
  materials_needed?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  assigned_to_name?: string;
}

export interface MaintenanceSchedule {
  id: string;
  asset_id: string;
  schedule_type: 'preventive' | 'inspection';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  next_due_date: string;
  last_performed_date?: string;
  description: string;
  estimated_cost: number;
  is_active: boolean;
  created_at: string;
}

export interface SessionPricing {
  hour_1_price: number;
  hour_2_price: number;
  hour_3_plus_price: number;
  max_additional_charge: number;
}

export interface FinancialAdjustment {
  id: string;
  employee_id: string;
  employee_name: string;
  branch_id: string;
  type: 'bonus' | 'deduction';
  amount: number;
  reason: string;
  notes?: string;
  approved_by: string;
  approved_by_name: string;
  status: 'pending' | 'approved' | 'rejected';
  processed_date?: string;
  created_at: string;
}

export interface ProductRecipe {
  id: string;
  product_id: string; // The finished product
  component_product_id: string; // The raw material/component
  quantity_needed: number; // How much of the component is needed for one unit of the product
  created_at: string;
  updated_at: string;
  
  // Optional fields for display/lookup
  component_name?: string;
  component_unit?: string;
}