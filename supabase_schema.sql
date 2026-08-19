-- ══════════════════════════════════════════════════════════════════════════════
-- FERRERO ROCHER · COUNTEROS PRODUCTION SUPABASE DATABASE SCHEMA
-- Multi-Level Architecture: Sub-DB Representatives <--> Sweet Shop Retailers <--> Executive Management
-- Automated Realtime Triggers, KYC & Section 194R Compliance, & Smart Invoicing
-- ══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. PROFILES TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Retailer Partner',
    role TEXT NOT NULL CHECK (role IN ('retailer', 'subdb', 'asm', 'admin')) DEFAULT 'retailer',
    shop_name TEXT DEFAULT 'Sweet & Confectionery Store',
    location TEXT DEFAULT 'Central India',
    zone TEXT DEFAULT 'Central' CHECK (zone IN ('Central', 'North', 'West', 'South')),
    points_balance INT NOT NULL DEFAULT 2025,
    pan_number TEXT,
    is_kyc_verified BOOLEAN DEFAULT false,
    gst_number TEXT,
    payout_upi TEXT,
    payout_bank_acc TEXT,
    payout_ifsc TEXT,
    assigned_subdb_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporting_asm_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure points_balance column exists if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_balance INT DEFAULT 2025;

-- ─── 2. INVENTORY TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT NOT NULL,
    cat TEXT DEFAULT 'rocher',
    unit TEXT DEFAULT 'Box',
    qty INT NOT NULL DEFAULT 0,
    buy NUMERIC(10,2) DEFAULT 0.00,
    sell NUMERIC(10,2) DEFAULT 0.00,
    earn NUMERIC(10,2) DEFAULT 0.00,
    mfg TEXT DEFAULT '2026-06',
    exp TEXT DEFAULT '2027-05',
    business_cat TEXT DEFAULT 'rocher',
    is_subdb_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist for retro-compatibility
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS cat TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS qty INT DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS buy NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS sell NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS earn NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS mfg TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS exp TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS business_cat TEXT;

-- ─── 3. TRANSACTIONS & LOYALTY LEDGER ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'POINTS_CREDIT',
    label TEXT,
    sub TEXT,
    amt TEXT,
    clr TEXT,
    icon TEXT,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    points INT NOT NULL DEFAULT 0,
    description TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS sub TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amt TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS clr TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS icon TEXT;

-- ─── 4. RETAILER MONTHLY TARGETS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.retailer_monthly_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Target Quota',
    month TEXT NOT NULL DEFAULT 'august_2026',
    target_value INT NOT NULL DEFAULT 50,
    current_value INT NOT NULL DEFAULT 0,
    target_boxes INT NOT NULL DEFAULT 50,
    restocked_boxes INT NOT NULL DEFAULT 0,
    points_reward INT NOT NULL DEFAULT 1500,
    bonus_points INT NOT NULL DEFAULT 1500,
    unit TEXT DEFAULT 'Boxes',
    status TEXT NOT NULL DEFAULT 'in_progress',
    spend_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    top_sku TEXT DEFAULT 'Ferrero Rocher 16pc',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. SUB-DB PHYSICAL INVOICES (OCR PROCESSED) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.subdb_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    subdb_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    retailer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    retailer_shop TEXT NOT NULL,
    retailer_phone TEXT NOT NULL,
    wholesaler_name TEXT DEFAULT 'Central Confectionery Agency',
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    boxes_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('verified', 'pending', 'rejected')) DEFAULT 'verified',
    items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    products JSONB DEFAULT '[]'::jsonb,
    ocr_confidence NUMERIC(4,2) DEFAULT 0.98,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. REWARDS CATALOG ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rewards_catalog (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Vouchers',
    points_required INT NOT NULL DEFAULT 1000,
    reward_value NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    brand TEXT NOT NULL DEFAULT 'Ferrero',
    reward_type TEXT DEFAULT 'voucher',
    is_194r_applicable BOOLEAN DEFAULT false,
    tds_percentage NUMERIC(5,2) DEFAULT 0.00,
    tds_amount NUMERIC(10,2) DEFAULT 0.00,
    image_url TEXT,
    icon TEXT DEFAULT 'card_giftcard',
    terms TEXT DEFAULT 'Valid for 12 months. 10% Section 194R TDS applicable for high-value rewards.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. REWARD REDEMPTIONS & ACTIVE VOUCHERS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_id TEXT NOT NULL,
    voucher_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    points_used INT NOT NULL DEFAULT 0,
    cashback_amount NUMERIC(10,2) DEFAULT 0.00,
    compliance_status TEXT DEFAULT 'Approved',
    tds_applied NUMERIC(10,2) DEFAULT 0.00,
    net_benefit NUMERIC(10,2) DEFAULT 0.00,
    kyc_doc_id TEXT,
    compliance_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- ─── 8. KYC DOCUMENTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pan_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    address TEXT,
    id_proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'Verified',
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 9. COMPLIANCE & SECTION 194R AUDIT LOGS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    redemption_id UUID,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pan_number TEXT,
    action TEXT DEFAULT 'Reward Direct Redemption',
    event_type TEXT DEFAULT 'REDEMPTION',
    status_from TEXT,
    status_to TEXT DEFAULT 'Approved',
    performed_by TEXT DEFAULT 'Retailer',
    reward_value NUMERIC(10,2) DEFAULT 0.00,
    tds_amount NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 10. REALTIME NOTIFICATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'retailer',
    type TEXT NOT NULL DEFAULT 'notification',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 11. SUPPORT TICKETS & GRIEVANCES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    retailer_name TEXT NOT NULL,
    retailer_phone TEXT NOT NULL,
    category TEXT NOT NULL, -- 'wrong_upload', 'claim_issue', 'points_discrepancy', 'stock_issue', 'other'
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    invoice_number TEXT,
    priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
    status TEXT NOT NULL DEFAULT 'Open', -- 'Open', 'In Review', 'Resolved', 'Closed'
    assigned_to TEXT DEFAULT 'Ferrero Support Desk',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 11. AUTOMATED SMART POSTGRESQL TRIGGERS & BUSINESS LOGIC
-- ══════════════════════════════════════════════════════════════════════════════

-- FUNCTION: Process Sub-DB Invoice -> Auto-credit Inventory, Target & Notification
CREATE OR REPLACE FUNCTION public.handle_subdb_invoice_processed()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    current_month_key TEXT;
    subdb_rep_name TEXT;
BEGIN
    -- Only run for verified invoices
    IF NEW.status = 'verified' THEN
        current_month_key := LOWER(TO_CHAR(NEW.invoice_date, 'FMMonth_YYYY'));

        -- Fetch Sub-DB rep name
        SELECT name INTO subdb_rep_name FROM public.profiles WHERE id = NEW.subdb_id;
        IF subdb_rep_name IS NULL THEN
            subdb_rep_name := 'Sub-DB Field Representative';
        END IF;

        -- 1. Auto-credit/increment inventory for each item in the invoice JSON
        FOR item IN SELECT * FROM jsonb_to_recordset(NEW.items_json) AS x(
            sku_code TEXT, product_name TEXT, category TEXT, quantity INT, price NUMERIC
        )
        LOOP
            INSERT INTO public.inventory (user_id, sku_code, product_name, category, stock_quantity, wholesale_price, mrp, is_subdb_verified, last_restocked_at)
            VALUES (
                NEW.retailer_id,
                item.sku_code,
                item.product_name,
                COALESCE(item.category, 'Chocolates'),
                COALESCE(item.quantity, 0),
                COALESCE(item.price, 1120.00),
                COALESCE(item.price, 1120.00) * 1.25,
                true,
                NOW()
            )
            ON CONFLICT (user_id, sku_code)
            DO UPDATE SET
                stock_quantity = public.inventory.stock_quantity + EXCLUDED.stock_quantity,
                wholesale_price = EXCLUDED.wholesale_price,
                is_subdb_verified = true,
                last_restocked_at = NOW(),
                updated_at = NOW();
        END LOOP;

        -- 2. Advance Monthly Restock Targets
        INSERT INTO public.retailer_monthly_targets (retailer_id, month, target_boxes, restocked_boxes, spend_amount, last_updated)
        VALUES (
            NEW.retailer_id,
            current_month_key,
            40,
            NEW.boxes_count,
            NEW.total_amount,
            NOW()
        )
        ON CONFLICT (retailer_id, month)
        DO UPDATE SET
            restocked_boxes = public.retailer_monthly_targets.restocked_boxes + EXCLUDED.restocked_boxes,
            spend_amount = public.retailer_monthly_targets.spend_amount + EXCLUDED.spend_amount,
            last_updated = NOW();

        -- 3. Insert Instant Realtime Notification for the Retailer
        INSERT INTO public.notifications (user_id, title, body, role, type, is_read, created_at)
        VALUES (
            NEW.retailer_id,
            '📦 Stock Delivered & Credited',
            FORMAT('Sub-DB rep %s credited %s boxes (₹%s) to your inventory. Invoice #%s.', 
                   subdb_rep_name, NEW.boxes_count, NEW.total_amount, NEW.invoice_number),
            'retailer',
            'notification',
            false,
            NOW()
        );

        -- 4. Record Wholesale Restock Transaction
        INSERT INTO public.transactions (user_id, type, amount, points, description, reference_id, created_at)
        VALUES (
            NEW.retailer_id,
            'RESTOCK',
            NEW.total_amount,
            NEW.boxes_count * 25, -- 25 bonus points per box
            FORMAT('Wholesale Restock via Sub-DB (%s boxes delivered)', NEW.boxes_count),
            NEW.invoice_number,
            NOW()
        );

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Attach to subdb_invoices
DROP TRIGGER IF EXISTS trg_subdb_invoice_processed ON public.subdb_invoices;
CREATE TRIGGER trg_subdb_invoice_processed
AFTER INSERT ON public.subdb_invoices
FOR EACH ROW
EXECUTE FUNCTION public.handle_subdb_invoice_processed();


-- FUNCTION: Target Milestone Achievement Checker
CREATE OR REPLACE FUNCTION public.handle_target_milestone_check()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if target completed
    IF NEW.restocked_boxes >= NEW.target_boxes AND OLD.status = 'IN_PROGRESS' THEN
        NEW.status := 'COMPLETED';

        -- Auto-credit bonus points
        INSERT INTO public.transactions (user_id, type, amount, points, description, reference_id, created_at)
        VALUES (
            NEW.retailer_id,
            'POINTS_CREDIT',
            0.00,
            NEW.bonus_points,
            FORMAT('🎯 Monthly Target Milestone Completed for %s!', NEW.month),
            NEW.month,
            NOW()
        );

        -- Send Realtime Milestone Notification
        INSERT INTO public.notifications (user_id, title, body, role, type, is_read, created_at)
        VALUES (
            NEW.retailer_id,
            '🎯 Monthly Milestone Completed!',
            FORMAT('Congratulations! You completed 100%% of your restock target for %s and earned +%s bonus points!', 
                   NEW.month, NEW.bonus_points),
            'retailer',
            'notification',
            false,
            NOW()
        );
    ELSIF NEW.restocked_boxes > NEW.target_boxes THEN
        NEW.status := 'EXCEEDED';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Attach to retailer_monthly_targets
DROP TRIGGER IF EXISTS trg_target_milestone_check ON public.retailer_monthly_targets;
CREATE TRIGGER trg_target_milestone_check
BEFORE UPDATE ON public.retailer_monthly_targets
FOR EACH ROW
EXECUTE FUNCTION public.handle_target_milestone_check();

-- ══════════════════════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdb_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
-- ══════════════════════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdb_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent 42710 conflict
DROP POLICY IF EXISTS "Allow public read-write profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read-write inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow public read-write transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public read-write targets" ON public.retailer_monthly_targets;
DROP POLICY IF EXISTS "Allow public read-write invoices" ON public.subdb_invoices;
DROP POLICY IF EXISTS "Allow public read-write rewards" ON public.rewards_catalog;
DROP POLICY IF EXISTS "Allow public read-write redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Allow public read-write kyc" ON public.kyc_documents;
DROP POLICY IF EXISTS "Allow public read-write compliance" ON public.compliance_audit_logs;
DROP POLICY IF EXISTS "Allow public read-write notifications" ON public.notifications;

-- Allow public access with anon key for CounterOS client app
CREATE POLICY "Allow public read-write profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write targets" ON public.retailer_monthly_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write invoices" ON public.subdb_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write rewards" ON public.rewards_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write redemptions" ON public.reward_redemptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write kyc" ON public.kyc_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write compliance" ON public.compliance_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 13. ENABLE REALTIME SYNC (SUPABASE REALTIME PUBLICATION)
-- ══════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.retailer_monthly_targets;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subdb_invoices;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_redemptions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 14. SEED DATA FOR END-TO-END DEMOS (RETAILERS, SUB-DB REPS, ASMS, PRODUCTS)
-- ══════════════════════════════════════════════════════════════════════════════

-- A. Area Sales Managers (ASMs)
INSERT INTO public.profiles (id, phone, name, role, shop_name, location, zone)
VALUES 
('a1000000-0000-0000-0000-000000000001', '9899012345', 'Vikram Malhotra', 'asm', 'Ferrero MP-Central Regional HQ', 'Indore, MP', 'Central'),
('a1000000-0000-0000-0000-000000000002', '9899012346', 'Amitabh Verma', 'asm', 'Ferrero North Regional HQ', 'New Delhi', 'North')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- B. Sub-DB Field Representatives
INSERT INTO public.profiles (id, phone, name, role, shop_name, location, zone, reporting_asm_id)
VALUES 
('b1000000-0000-0000-0000-000000000001', '9826011234', 'Rajesh Sharma', 'subdb', 'Central Confectionery Agency (EMP-4821)', 'Indore & Ujjain', 'Central', 'a1000000-0000-0000-0000-000000000001'),
('b1000000-0000-0000-0000-000000000002', '9811033456', 'Suresh Yadav', 'subdb', 'North Star Distributors (EMP-5104)', 'Delhi NCR (South)', 'North', 'a1000000-0000-0000-0000-000000000002')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- C. Sweet Shop Retailers (Different Use Cases)
-- Use Case 1: Ramesh Kumar (Fully KYC Verified, High Stock)
INSERT INTO public.profiles (id, phone, name, role, shop_name, location, zone, pan_number, is_kyc_verified, assigned_subdb_id, reporting_asm_id)
VALUES 
('c1000000-0000-0000-0000-000000000001', '9876543210', 'Ramesh Kumar', 'retailer', 'Kumar Sweet House', 'Khetgaon, Indore, MP', 'Central', 'ABCDE1234F', true, 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, pan_number = EXCLUDED.pan_number, is_kyc_verified = EXCLUDED.is_kyc_verified;

-- Use Case 2: Sanjay Agrawal (KYC Unverified - tests on-demand 1st claim KYC flow)
INSERT INTO public.profiles (id, phone, name, role, shop_name, location, zone, pan_number, is_kyc_verified, assigned_subdb_id, reporting_asm_id)
VALUES 
('c1000000-0000-0000-0000-000000000002', '9876543211', 'Sanjay Agrawal', 'retailer', 'Agrawal Mishthan Bhandar', 'Sarafa Bazar, Indore, MP', 'Central', NULL, false, 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name;

-- Use Case 3: Nitin Jain (Bhopal Store)
INSERT INTO public.profiles (id, phone, name, role, shop_name, location, zone, pan_number, is_kyc_verified, assigned_subdb_id, reporting_asm_id)
VALUES 
('c1000000-0000-0000-0000-000000000003', '9876543212', 'Nitin Jain', 'retailer', 'Chhappan Sweets', 'New Market, Bhopal, MP', 'Central', 'CDEFG3456H', true, 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name;

-- Use Case 4: Harish Bikaneri (Delhi Super Store)
INSERT INTO public.profiles (id, phone, name, role, shop_name, location, zone, pan_number, is_kyc_verified, assigned_subdb_id, reporting_asm_id)
VALUES 
('c1000000-0000-0000-0000-000000000004', '9876543213', 'Harish Bikaneri', 'retailer', 'Bikanervala South Ex', 'South Extension, New Delhi', 'North', 'DEFGH4567I', true, 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002')
ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name;

-- D. Initial Verified Stock for Ramesh Kumar
INSERT INTO public.inventory (user_id, sku_code, product_name, category, stock_quantity, unit_price, mrp, wholesale_price, batch_number, is_subdb_verified)
VALUES 
('c1000000-0000-0000-0000-000000000001', 'FR-16', 'Ferrero Rocher 16-Piece Gift Box', 'Chocolates', 24, 1120.00, 1400.00, 1120.00, 'BATCH-FR26-08', true),
('c1000000-0000-0000-0000-000000000001', 'FR-48', 'Ferrero Rocher 48-Piece Pyramid Hamper', 'Festive Hampers', 14, 1680.00, 2100.00, 1680.00, 'BATCH-FR26-09', true),
('c1000000-0000-0000-0000-000000000001', 'RAF-20', 'Raffaello Coconut Confectionery 20pc', 'Specialty Conf.', 18, 840.00, 1050.00, 840.00, 'BATCH-RAF26-01', true),
('c1000000-0000-0000-0000-000000000001', 'GG-18', 'Ferrero Golden Gallery 18-Piece Luxe', 'Luxury Assortment', 10, 875.00, 1100.00, 875.00, 'BATCH-GG26-04', true)
ON CONFLICT (user_id, sku_code) DO NOTHING;

-- E. Monthly Targets for Ramesh Kumar
INSERT INTO public.retailer_monthly_targets (retailer_id, month, target_boxes, restocked_boxes, bonus_points, status, spend_amount, top_sku)
VALUES 
('c1000000-0000-0000-0000-000000000001', 'june_2026', 30, 26, 1200, 'IN_PROGRESS', 29120.00, 'Ferrero Rocher 16pc'),
('c1000000-0000-0000-0000-000000000001', 'july_2026', 34, 34, 1500, 'COMPLETED', 38080.00, 'Ferrero Rocher 48pc'),
('c1000000-0000-0000-0000-000000000001', 'august_2026', 35, 38, 1800, 'EXCEEDED', 42560.00, 'Golden Gallery 18pc')
ON CONFLICT (retailer_id, month) DO NOTHING;

-- F. Rewards Catalog (Rural Utilities, Business Assets & Section 194R Compliance)
INSERT INTO public.rewards_catalog (id, title, category, points_required, reward_value, brand, is_194r_applicable, image_url, terms)
VALUES 
-- Tier 1: Rural Utilities & Direct Cash (No 194R TDS)
('d1000000-0000-0000-0000-000000000001', '₹250 Direct UPI / Gramin Bank Cashback', 'cashback', 500, 250.00, 'UPI Direct', false, 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500', 'Instant transfer. No TDS deduction required for direct micro cashbacks.'),
('d1000000-0000-0000-0000-000000000002', '₹500 Rural Diesel / Petrol Fuel Card', 'travel', 1000, 500.00, 'IndianOil', false, 'https://images.unsplash.com/photo-1527018607636-0802773181d3?w=500', 'Valid on petrol and diesel purchases at 35,000+ pumps across India.'),
('d1000000-0000-0000-0000-000000000003', 'Jio / Airtel 1-Year Shop 5G Data Pack', 'electronics', 1800, 899.00, 'Telecom Partner', false, 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=500', 'Direct prepaid recharge coupon instantly applied to your mobile number.'),
('d1000000-0000-0000-0000-000000000004', 'Amazon Pay ₹500 E-Gift Voucher', 'gift_card', 1000, 500.00, 'Amazon', false, 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500', 'Direct voucher delivery. Can be added to Amazon Pay balance.'),

-- Tier 2: Rural Shop Utilities & Household Assets (10% TDS under Section 194R)
('d1000000-0000-0000-0000-000000000005', 'Havells 16-Inch High-Speed Counter Fan', 'appliances', 5000, 2500.00, 'Havells', true, 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=500', 'Section 194R business perquisite: 10% TDS (₹250) logged with Form 16A credit.'),
('d1000000-0000-0000-0000-000000000006', 'Bajaj 3-Jar Heavy-Duty Commercial Mixer', 'appliances', 7500, 3800.00, 'Bajaj', true, 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500', 'Business benefit under Section 194R: 10% TDS (₹380) recorded with tax invoice.'),
('d1000000-0000-0000-0000-000000000007', 'Luminous Solar Inverter & Battery Voucher', 'appliances', 9000, 4500.00, 'Luminous', true, 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500', 'Section 194R applicable: 10% TDS (₹450) deducted. Protects store inventory from power cuts.'),
('d1000000-0000-0000-0000-000000000008', 'Flipkart ₹2,000 Festive Shopping Card', 'gift_card', 4000, 2000.00, 'Flipkart', true, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500', 'Section 194R compliance: 10% TDS (₹200) logged. Requires verified PAN on file.'),

-- Tier 3: High-Value Rural Assets & Aspirational Rewards (194R High Value)
('d1000000-0000-0000-0000-000000000009', 'Tanishq 24K Gold Coin (₹10,000)', 'luxury_gold', 20000, 10000.00, 'Tanishq', true, 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500', 'Section 194R High-Value Gold Benefit: 10% TDS (₹1,000) deducted with compliance audit trail.'),
('d1000000-0000-0000-0000-000000000010', 'Samsung 253L Smart Inverter Refrigerator', 'appliances', 45000, 32000.00, 'Samsung', true, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500', 'High-Value Commercial Asset: 10% TDS (₹3,200) deducted under Section 194R with PAN verification.'),
('d1000000-0000-0000-0000-000000000011', 'Hero HF Deluxe / Splendor Bike Bonanza', 'travel', 100000, 72000.00, 'Hero MotoCorp', true, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500', 'Grand Dealer Perquisite under Section 194R: 10% TDS (₹7,200) logged with Form 16A tax certificate.')
ON CONFLICT (id) DO NOTHING;

-- G. Sample KYC Record for Ramesh Kumar
INSERT INTO public.kyc_documents (user_id, pan_number, full_name, address, status, verified_at)
VALUES 
('c1000000-0000-0000-0000-000000000001', 'ABCDE1234F', 'Ramesh Kumar', 'Khetgaon Main Road, Indore, MP - 452001', 'Verified', NOW())
ON CONFLICT DO NOTHING;

-- H. Sample Notifications
INSERT INTO public.notifications (user_id, title, body, role, type, is_read, created_at)
VALUES 
('c1000000-0000-0000-0000-000000000001', '🎉 Welcome to Ferrero CounterOS', 'Your sweet shop is linked with Sub-DB rep Rajesh Sharma (EMP-4821).', 'retailer', 'notification', false, NOW() - INTERVAL '3 days'),
('c1000000-0000-0000-0000-000000000001', '🎯 Target Milestone Achieved', 'You achieved 100% of your July restock target and earned +1,500 bonus points!', 'retailer', 'notification', false, NOW() - INTERVAL '1 day'),
('c1000000-0000-0000-0000-000000000001', '📦 Stock Credited from Sub-DB', 'Rajesh Sharma credited 12 boxes of Ferrero Rocher 16pc (Bill #INV-FR-9821).', 'retailer', 'notification', false, NOW())
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════
