-- Script SQL để XÓA DỮ LIỆU trong tất cả bảng (giữ lại cấu trúc)
-- Chạy trong Supabase SQL Editor nếu chỉ muốn xóa dữ liệu, không xóa bảng

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Xóa dữ liệu trong tất cả tables
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%' 
        AND tablename NOT LIKE '_realtime%' 
        AND tablename != 'schema_migrations'
    ) LOOP
        BEGIN
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
            RAISE NOTICE 'Đã xóa dữ liệu trong bảng: %', r.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Không thể xóa dữ liệu trong bảng: % - %', r.tablename, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '✅ Đã xóa sạch dữ liệu trong tất cả bảng!';
END $$;
