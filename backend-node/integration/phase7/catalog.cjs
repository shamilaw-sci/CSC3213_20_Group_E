const assert = require('node:assert/strict');
const { tables } = require('./state.cjs');
const signatures = ['claim_payment_receipts(uuid)','create_listing_checkout(uuid,uuid,numeric,text,text,text)',
    'increment_property_views(uuid)','search_properties(text)','settle_listing_checkout(uuid,text,numeric,text,text,text)'];
async function verifyCatalog(client) {
    for (const table of tables) {
        const meta = (await client.query(`SELECT relrowsecurity,pg_get_userbyid(relowner) AS owner
            FROM pg_class WHERE oid=$1::regclass`,[`public.${table}`])).rows[0];
        assert.equal(meta?.owner,'postgres');assert.equal(meta.relrowsecurity,true);
        for (const role of ['anon','authenticated']) {
            const grants=(await client.query(`SELECT has_table_privilege($1,$2,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') AS table_access,
                has_any_column_privilege($1,$2,'SELECT,INSERT,UPDATE,REFERENCES') AS column_access`,[role,`public.${table}`])).rows[0];
            assert.deepEqual(grants,{table_access:false,column_access:false});
        }
        for (const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN']) {
            assert.equal((await client.query('SELECT has_table_privilege($1,$2,$3) allowed',['service_role',`public.${table}`,privilege])).rows[0].allowed,true);
        }
    }
    for(const signature of signatures) {
        for(const role of ['anon','authenticated','service_role'])assert.equal(
            (await client.query('SELECT has_function_privilege($1,$2,$3) allowed',[role,`public.${signature}`,'EXECUTE'])).rows[0].allowed,role==='service_role');
        const meta=(await client.query('SELECT prosecdef,pg_get_userbyid(proowner) owner FROM pg_proc WHERE oid=$1::regprocedure',[`public.${signature}`])).rows[0];
        assert.deepEqual(meta,{prosecdef:false,owner:'postgres'});
    }
    const owner=(await client.query(`SELECT a.atttypid='uuid'::regtype AS uuid,NOT a.attnotnull AS nullable,
        EXISTS(SELECT 1 FROM pg_constraint f WHERE f.conrelid=a.attrelid AND f.conname='leads_buyer_id_fkey'
            AND f.contype='f' AND f.confrelid='public.users'::regclass AND f.confdeltype='n' AND f.conkey=ARRAY[a.attnum]
            AND f.confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.users'::regclass AND attname='id')]) AS fk,
        EXISTS(SELECT 1 FROM pg_index i WHERE i.indrelid=a.attrelid AND i.indexrelid='public.leads_buyer_id_idx'::regclass
            AND i.indisvalid AND i.indisready AND i.indnkeyatts=1 AND i.indkey[0]=a.attnum AND i.indpred IS NULL) AS indexed
        FROM pg_attribute a WHERE a.attrelid='public.leads'::regclass AND a.attname='buyer_id' AND NOT a.attisdropped`)).rows[0];
    assert.deepEqual(owner,{uuid:true,nullable:true,fk:true,indexed:true});
}
module.exports={verifyCatalog};
