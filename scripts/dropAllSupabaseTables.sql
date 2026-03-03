-- Script SQL để xóa SẠCH TẤT CẢ các bảng trong Supabase
-- CẢNH BÁO: Script này sẽ xóa TẤT CẢ dữ liệu và cấu trúc bảng!
-- Chạy trong Supabase SQL Editor

-- Xóa TẤT CẢ bảng tự động (không cần liệt kê từng bảng)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Xóa tất cả views trước
    FOR r IN (SELECT schemaname, viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
        RAISE NOTICE 'Đã xóa view: %', r.viewname;
    END LOOP;

    -- Xóa tất cả tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%' AND tablename NOT LIKE '_realtime%' AND tablename != 'schema_migrations') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Đã xóa bảng: %', r.tablename;
    END LOOP;

    -- Xóa tất cả functions (trừ system functions)
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc
        INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid)
        WHERE ns.nspname = 'public'
        AND proname NOT LIKE 'pg_%'
    ) LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
            RAISE NOTICE 'Đã xóa function: %', r.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Không thể xóa function: % - %', r.proname, SQLERRM;
        END;
    END LOOP;

    -- Xóa tất cả sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Đã xóa sequence: %', r.sequence_name;
    END LOOP;

    -- Xóa tất cả types (custom types)
    FOR r IN (
        SELECT typname FROM pg_type
        INNER JOIN pg_namespace ns ON (pg_type.typnamespace = ns.oid)
        WHERE ns.nspname = 'public'
        AND typtype = 'c' -- composite type
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        RAISE NOTICE 'Đã xóa type: %', r.typname;
    END LOOP;

    RAISE NOTICE '✅ Đã xóa sạch tất cả bảng, views, functions, sequences và types!';
END $$;

-- Xác nhận: Kiểm tra xem còn bảng nào không
SELECT 
    'Bảng còn lại: ' || COUNT(*)::text as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%' 
AND tablename NOT LIKE '_realtime%' 
AND tablename != 'schema_migrations';
