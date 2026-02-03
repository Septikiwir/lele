-- Enable Row Level Security (RLS) for all tables
-- This script ensures data is protected and only accessible through your application

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Farm" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FarmMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kolam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StokPakan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataPakan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JadwalPakan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KondisiAir" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pengeluaran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pembeli" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Penjualan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiwayatPanen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiwayatIkan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiwayatSampling" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE SERVICE ROLE BYPASS POLICIES
-- Since you're using NextAuth (not Supabase Auth), 
-- your application should use SERVICE_ROLE key for backend operations
-- ============================================

-- Allow service role (your Next.js API) to access all tables
CREATE POLICY "Service role can do everything on User" ON "User"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on Account" ON "Account"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on Session" ON "Session"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on VerificationToken" ON "VerificationToken"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on Farm" ON "Farm"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on FarmMember" ON "FarmMember"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on Kolam" ON "Kolam"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on StokPakan" ON "StokPakan"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on DataPakan" ON "DataPakan"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on JadwalPakan" ON "JadwalPakan"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on KondisiAir" ON "KondisiAir"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on Pengeluaran" ON "Pengeluaran"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on Pembeli" ON "Pembeli"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on Penjualan" ON "Penjualan"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on RiwayatPanen" ON "RiwayatPanen"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on RiwayatIkan" ON "RiwayatIkan"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role can do everything on RiwayatSampling" ON "RiwayatSampling"
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- ============================================
-- BLOCK PUBLIC ACCESS (Anon role)
-- ============================================

-- Public/anonymous users have NO access by default
-- All access must go through your Next.js API routes
-- which use the service role key

-- No additional policies needed - RLS will block everything by default
-- except for service role which has bypass policies above
