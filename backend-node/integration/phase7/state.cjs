const tables = Object.freeze(['agent_profiles','agent_reviews','contact_inquiries','conversations','favorites',
    'feasibility_history','inquiries','leads','message_receipts','messages','payment_orders','payment_receipt_outbox',
    'platform_settings','properties','property_sales_history','role_requests','saved_searches','transactions','users']);
async function snapshot(client) {
    const data = {};
    for (const table of tables) data[table] = (await client.query(`SELECT coalesce(jsonb_agg(j ORDER BY j::text),'[]') rows
        FROM (SELECT to_jsonb(t) j FROM public.${table} t) q`)).rows[0].rows;
    const catalog = (await client.query(`SELECT jsonb_build_object(
        'relations',(SELECT jsonb_agg(jsonb_build_array(c.oid,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity,c.reloptions) ORDER BY c.oid)
            FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'),
        'columns',(SELECT jsonb_agg(jsonb_build_array(a.attrelid,a.attnum,a.attname,a.atttypid,a.attnotnull,a.attacl,a.attidentity,a.attgenerated) ORDER BY a.attrelid,a.attnum)
            FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND a.attnum>0),
        'constraints',(SELECT jsonb_agg(to_jsonb(x) ORDER BY x.oid) FROM pg_constraint x JOIN pg_namespace n ON n.oid=x.connamespace WHERE n.nspname='public'),
        'functions',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
        'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY p.oid) FROM pg_policy p),
        'defaults',(SELECT jsonb_agg(to_jsonb(d) ORDER BY d.oid) FROM pg_default_acl d),
        'ledger',(SELECT jsonb_agg(to_jsonb(m) ORDER BY version) FROM supabase_migrations.schema_migrations m)
    ) state`)).rows[0].state;
    return { data, catalog };
}
module.exports = { tables, snapshot };
