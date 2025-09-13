/*
  # نظام إدارة مساحات العمل المشتركة - تحديث الميزات

  ## 1. الجداول الجديدة
  - `shared_space_pricing` - تسعير المساحات المشتركة لكل فرع
  - `invoice_items` - بنود الفواتير المفصلة
  - `payment_methods` - طرق الدفع المتعددة للفاتورة الواحدة

  ## 2. التحديثات على الجداول الموجودة
  - `rooms` - إضافة نوع الغرفة (خاصة/مشتركة)
  - `bookings` - دعم المساحات المشتركة والدفع المقدم
  - `invoices` - دعم حالات الدفع والمبلغ المتبقي

  ## 3. الأمان
  - تفعيل RLS على جميع الجداول الجديدة
  - إضافة سياسات الأمان المناسبة

  ## 4. المؤشرات والقيود
  - إضافة مؤشرات لتحسين الأداء
  - قيود التحقق من صحة البيانات
*/

-- Add type column to rooms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'type'
  ) THEN
    ALTER TABLE rooms ADD COLUMN type VARCHAR(20) DEFAULT 'private' CHECK (type IN ('private', 'shared'));
  END IF;
END $$;

-- Add shared space fields to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'is_shared_space'
  ) THEN
    ALTER TABLE bookings ADD COLUMN is_shared_space BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'check_in_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN check_in_time TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'check_out_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN check_out_time TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pre_booking_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pre_booking_amount NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add payment fields to invoices table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE invoices ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overpaid'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'remaining_balance_action'
  ) THEN
    ALTER TABLE invoices ADD COLUMN remaining_balance_action VARCHAR(20) DEFAULT 'none' CHECK (remaining_balance_action IN ('none', 'account_credit', 'tips'));
  END IF;
END $$;

-- Create shared_space_pricing table
CREATE TABLE IF NOT EXISTS shared_space_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  hour_1_price NUMERIC(10,2) NOT NULL DEFAULT 40.00,
  hour_2_price NUMERIC(10,2) NOT NULL DEFAULT 30.00,
  hour_3_plus_price NUMERIC(10,2) NOT NULL DEFAULT 30.00,
  max_additional_charge NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(branch_id)
);

ALTER TABLE shared_space_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage shared space pricing for their branch"
  ON shared_space_pricing
  FOR ALL
  TO authenticated
  USING (
    branch_id IN (
      SELECT branch_id FROM users WHERE id = auth.uid()
      UNION
      SELECT id FROM branches WHERE auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
      )
    )
  );

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('time_entry', 'product', 'service')),
  related_id UUID, -- client_id for time entries, product_id for products
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  individual_name VARCHAR(255), -- For non-client individuals
  is_split BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage invoice items for their branch"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE branch_id IN (
        SELECT branch_id FROM users WHERE id = auth.uid()
        UNION
        SELECT id FROM branches WHERE auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        )
      )
    )
  );

-- Create payment_methods table for split payments
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'visa', 'wallet')),
  amount NUMERIC(10,2) NOT NULL,
  transaction_id VARCHAR(255), -- For digital payments
  notes TEXT,
  processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payment methods for their branch"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE branch_id IN (
        SELECT branch_id FROM users WHERE id = auth.uid()
        UNION
        SELECT id FROM branches WHERE auth.uid() IN (
          SELECT id FROM users WHERE role = 'admin'
        )
      )
    )
  );

-- Add updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_shared_space_pricing_updated_at'
  ) THEN
    CREATE TRIGGER update_shared_space_pricing_updated_at
      BEFORE UPDATE ON shared_space_pricing
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_related_id ON invoice_items(related_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_invoice_id ON payment_methods(invoice_id);
CREATE INDEX IF NOT EXISTS idx_bookings_shared_space ON bookings(is_shared_space, branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_times ON bookings(check_in_time, check_out_time);

-- Insert default shared space pricing for existing branches
INSERT INTO shared_space_pricing (branch_id, hour_1_price, hour_2_price, hour_3_plus_price, max_additional_charge)
SELECT id, 40.00, 30.00, 30.00, 100.00
FROM branches
WHERE id NOT IN (SELECT branch_id FROM shared_space_pricing)
ON CONFLICT (branch_id) DO NOTHING;