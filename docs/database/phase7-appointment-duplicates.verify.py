"""Disposable local PostgreSQL 17 checks. Requires a running Docker daemon.
Run: python docs/database/phase7-appointment-duplicates.verify.py
Creates/removes only its uniquely named container; never reads project credentials.
"""
import concurrent.futures
import pathlib
import subprocess
import time
import uuid

name = "thirasara-booking-" + uuid.uuid4().hex[:12]
root = pathlib.Path(__file__).parent
migration = (root / "phase7-appointment-duplicates.hosted-review.sql").read_text(encoding="utf-8")
preflight = (root / "phase7-appointment-duplicates.preflight-readonly.sql").read_text(encoding="utf-8")

def docker(*args, sql=None, check=True):
    result = subprocess.run(["docker", *args], input=sql, encoding="utf-8", capture_output=True)
    if check and result.returncode:
        raise RuntimeError(result.stderr)
    return result

def query(sql, check=True):
    return docker("exec", "-i", name, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-At", sql=sql, check=check)

def scalar(sql):
    return query(sql).stdout.strip()

buyer = "00000000-0000-0000-0000-000000000001"
prop = "00000000-0000-0000-0000-000000000002"
agent = "00000000-0000-0000-0000-000000000003"
source = "Booking (In-person): 2026-12-01 Morning (9:00 AM - 12:00 PM)"

def insert(id, source_value=source, property_value=prop, buyer_value=buyer, agent_value=agent, structured=False):
    cols = "lead_id,buyer_id,property_id,assigned_agent_id,lead_source"
    values = ["'"+id+"'", "NULL" if buyer_value is None else "'"+buyer_value+"'", "NULL" if property_value is None else "'"+property_value+"'", "'"+agent_value+"'", "'"+source_value.replace("'", "''")+"'"]
    if structured:
        cols += ",booking_date,booking_time_window"
        values += ["'2026-12-01'", "'Morning (9:00 AM - 12:00 PM)'"]
    return "INSERT INTO leads ("+cols+") VALUES ("+",".join(values)+");"

def ident(): return str(uuid.uuid4())

try:
    docker("run", "--detach", "--name", name, "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "postgres:17")
    for attempt in range(60):
        if docker("exec", name, "pg_isready", "-U", "postgres", check=False).returncode == 0:
            break
        time.sleep(1)
    else: raise RuntimeError("Disposable PostgreSQL did not become ready")
    query("""CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE users(id uuid PRIMARY KEY);
    CREATE TABLE leads(lead_id uuid PRIMARY KEY, buyer_id uuid REFERENCES users(id) ON DELETE SET NULL,
      property_id uuid, assigned_agent_id uuid, lead_source varchar(100));
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    GRANT SELECT,INSERT,UPDATE,DELETE ON leads TO service_role;
    INSERT INTO users VALUES ('"""+buyer+"');")
    # Refusal is atomic for invalid legacy slots and duplicates, preserving every row and varchar type.
    for bad in ["Booking (In-person): 2026-12-01 Morning", "Booking (In-person): 2026-02-30 Morning (9:00 AM - 12:00 PM)", "Direct Profile Booking"]:
        record=ident(); query(insert(record,bad))
        assert "unparseable_or_incomplete" in query(preflight).stdout
        assert query(migration,check=False).returncode != 0
        assert scalar("SELECT count(*) FROM leads") == "1"
        assert scalar("SELECT count(*) FROM information_schema.columns WHERE table_name='leads' AND column_name='booking_date'") == "0"
        assert scalar("SELECT character_maximum_length FROM information_schema.columns WHERE table_name='leads' AND column_name='lead_source'") == "100"
        query("DELETE FROM leads")
    query(insert(ident())+insert(ident(),agent_value=ident()))
    assert "property_duplicate" in query(preflight).stdout
    assert query(migration,check=False).returncode != 0
    assert scalar("SELECT count(*) FROM leads") == "2"
    query("DELETE FROM leads")
    # Both original notes delimiters parse without changing the display value.
    for separator in ["\u2022", "\u00e2\u20ac\u00a2"]:
        query(insert(ident(),source + ' ' + separator + ' Note: "test"'))
        assert "unparseable_or_incomplete" not in query(preflight).stdout
        query(migration.replace("COMMIT;", "ROLLBACK;"))
        query("DELETE FROM leads")
    historic=ident(); guest=ident(); crm=ident()
    query(insert(historic)+insert(guest,"Booking (Video): unknown",buyer_value=None)+insert(crm,"Referral"))
    before=scalar("SELECT string_agg(lead_id::text||lead_source,'|' ORDER BY lead_id) FROM leads")
    query(migration.replace("COMMIT;", "ROLLBACK;"))
    assert scalar("SELECT count(*) FROM information_schema.columns WHERE table_name='leads' AND column_name='booking_date'") == "0"
    assert scalar("SELECT string_agg(lead_id::text||lead_source,'|' ORDER BY lead_id) FROM leads") == before
    query(migration)
    assert scalar("SELECT string_agg(lead_id::text||lead_source,'|' ORDER BY lead_id) FROM leads") == before
    assert scalar("SELECT count(*) FROM leads WHERE booking_date IS NOT NULL") == "1"
    assert scalar("SELECT data_type FROM information_schema.columns WHERE table_name='leads' AND column_name='lead_source'") == "text"
    query("DELETE FROM leads WHERE lead_id='"+historic+"'")
    # Independent sessions contend on the exact same key; exactly one insert persists.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(lambda _: query(insert(ident(),structured=True),check=False),range(2)))
    assert sorted(r.returncode == 0 for r in results) == [False,True]
    assert any("leads_buyer_property_slot_uidx" in r.stderr for r in results)
    assert scalar("SELECT count(*) FROM leads WHERE booking_date IS NOT NULL") == "1"
    assert query(insert(ident(),source_value=source+' different notes',agent_value=ident(),structured=True),check=False).returncode != 0
    query("DELETE FROM leads WHERE booking_date IS NOT NULL")
    query(insert(ident(),structured=True)) # cancellation permits rebooking
    query(insert(ident(),property_value=None,structured=True))
    conflict=query(insert(ident(),property_value=None,structured=True),check=False)
    assert conflict.returncode and "leads_buyer_consultation_slot_uidx" in conflict.stderr
    query(insert(ident(),property_value=None,agent_value=ident(),structured=True))
    assert query(insert(ident()),check=False).returncode != 0 # cannot bypass structured slot
    assert query("UPDATE leads SET booking_time_window='Morning' WHERE booking_date IS NOT NULL",check=False).returncode != 0
    query(insert(ident(),source_value=source+' '+('x'*2000),property_value=ident(),structured=True))
    print("PASS: historical refusal/atomic rollback, duplicates and ID inventory, preservation, concurrency, named conflicts, cross-agent identity, consultation, cancellation/rebooking, slot constraints, long notes")
finally:
    docker("rm", "--force", name, check=False)
