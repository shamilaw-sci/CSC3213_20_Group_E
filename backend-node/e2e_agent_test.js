const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const agentEmail = `testagent_${timestamp}@example.com`;
const agentPassword = 'Password123!@#';
const buyerEmail = `testclient_${timestamp}@example.com`;
const buyerPassword = 'Password123!@#';

async function runAgentE2ETests() {
    console.log('🚀 Starting Phase 4: Agent Persona E2E Automated Tests...\n');
    const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true
    });

    // -------------------------------------------------------------
    // 1. Agent Registration & Login
    // -------------------------------------------------------------
    console.log('1️⃣ Testing Agent Registration...');
    const regRes = await client.post('/auth/register', {
        name: `Agent Test ${timestamp}`,
        email: agentEmail,
        password: agentPassword,
        role: 'AGENT'
    });

    if (regRes.status !== 201) {
        console.error('❌ Agent Registration failed:', regRes.status, regRes.data);
        process.exit(1);
    }
    const agentId = regRes.data?.user?.id;
    console.log(`✅ Agent Registered (Status 201, ID: ${agentId}, Initial Role: PENDING_AGENT)`);

    // Simulate Admin Approval: Promote role to AGENT
    const supabase = require('./config/supabase');
    await supabase.from('users').update({ role: 'AGENT' }).eq('id', agentId);
    console.log('✅ Admin Approval Simulated: Promoted to AGENT role in DB');

    console.log('\n2️⃣ Testing Agent Login & Session...');
    const loginRes = await client.post('/auth/login', {
        email: agentEmail,
        password: agentPassword
    });

    if (loginRes.status !== 200) {
        console.error('❌ Agent Login failed:', loginRes.status, loginRes.data);
        process.exit(1);
    }

    const setCookieHeaders = loginRes.headers['set-cookie'] || [];
    const agentCookie = setCookieHeaders.find(c => c.startsWith('token='))?.split(';')[0] || '';
    const agentToken = agentCookie.replace('token=', '');
    const agentAuthHeaders = {
        'Cookie': agentCookie,
        'Authorization': `Bearer ${agentToken}`
    };

    // -------------------------------------------------------------
    // 2. Update Agent Profile (Agency, Video Bio, Specialization)
    // -------------------------------------------------------------
    console.log('\n3️⃣ Testing Agent Profile Configuration (Video Bio, Specialization)...');
    const profilePayload = {
        agency_name: `Apex Realty ${timestamp}`,
        license_number: `AG-SL-${timestamp.toString().slice(-4)}`,
        bio: 'Senior Certified Real Estate Advisor with 10+ years experience in Colombo luxury properties.',
        specialization: 'Both',
        service_areas: 'Colombo 03, Colombo 07, Kandy',
        languages: 'English, Sinhala, Tamil',
        youtube_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    };

    const updateProfRes = await client.put('/agents/profile', profilePayload, { headers: agentAuthHeaders });
    if (updateProfRes.status !== 200) {
        console.error('❌ Agent Profile Update failed:', updateProfRes.status, updateProfRes.data);
        process.exit(1);
    }
    console.log(`✅ Agent Profile Updated (Agency: ${profilePayload.agency_name}, YouTube Bio Attached)`);

    // -------------------------------------------------------------
    // 3. Agent Dashboard Stats
    // -------------------------------------------------------------
    console.log('\n4️⃣ Testing Agent Dashboard Stats (/agents/dashboard-stats)...');
    const statsRes = await client.get('/agents/dashboard-stats', { headers: agentAuthHeaders });
    if (statsRes.status !== 200) {
        console.error('❌ Agent Dashboard Stats failed:', statsRes.status, statsRes.data);
        process.exit(1);
    }
    console.log('✅ Agent Dashboard Stats Retrieved Successfully');

    // -------------------------------------------------------------
    // 4. Agent CRM Leads & RBAC Guard
    // -------------------------------------------------------------
    console.log('\n5️⃣ Testing Agent CRM Leads Pipeline & RBAC Security...');
    
    // Register a buyer to test 403 Forbidden RBAC guard
    const buyerRegRes = await client.post('/auth/register', {
        name: `Client ${timestamp}`,
        email: buyerEmail,
        password: buyerPassword,
        role: 'BUYER'
    });
    const buyerLoginRes = await client.post('/auth/login', { email: buyerEmail, password: buyerPassword });
    const buyerCookie = (buyerLoginRes.headers['set-cookie'] || []).find(c => c.startsWith('token='))?.split(';')[0] || '';
    const buyerToken = buyerCookie.replace('token=', '');
    const buyerAuthHeaders = {
        'Cookie': buyerCookie,
        'Authorization': `Bearer ${buyerToken}`
    };

    // Buyer trying to access Agent CRM (MUST FAIL 403)
    const unauthorizedLeadsRes = await client.get('/agents/leads', { headers: buyerAuthHeaders });
    if (unauthorizedLeadsRes.status !== 403) {
        console.error('❌ RBAC SECURITY FAILURE: Non-agent accessed Agent CRM!', unauthorizedLeadsRes.status);
        process.exit(1);
    }
    console.log('✅ RBAC Guard Verified: Buyer blocked from Agent CRM with 403 Forbidden');

    // Agent accessing CRM (MUST SUCCEED 200)
    const agentLeadsRes = await client.get('/agents/leads', { headers: agentAuthHeaders });
    if (agentLeadsRes.status !== 200) {
        console.error('❌ Agent CRM Leads failed:', agentLeadsRes.status, agentLeadsRes.data);
        process.exit(1);
    }
    console.log('✅ Agent Authorized: CRM Leads Pipeline Accessible (Status 200)');

    // -------------------------------------------------------------
    // 5. Client Review Submission & Public Profile Verification
    // -------------------------------------------------------------
    console.log('\n6️⃣ Testing Client Review Submission & Public Profile Showcase...');
    
    // Buyer posts review for Agent
    const reviewRes = await client.post(`/agents/${agentId}/reviews`, {
        rating: 5,
        comment: 'Outstanding service! Highly knowledgeable and transparent throughout the property search.'
    }, { headers: buyerAuthHeaders });

    if (reviewRes.status !== 201) {
        console.error('❌ Post Review failed:', reviewRes.status, reviewRes.data);
        process.exit(1);
    }
    console.log('✅ 5-Star Review Posted by Buyer (Status 201)');

    // Fetch Public Agent Profile
    const publicAgentRes = await client.get(`/agents/${agentId}`);
    if (publicAgentRes.status !== 200) {
        console.error('❌ Get Public Agent Profile failed:', publicAgentRes.status, publicAgentRes.data);
        process.exit(1);
    }
    const publicProfile = publicAgentRes.data?.agent;
    if (publicProfile?.agent_profiles?.agency_name !== profilePayload.agency_name) {
        console.error('❌ Agency name mismatch in public profile:', publicProfile);
        process.exit(1);
    }
    const hasReview = publicProfile?.agent_reviews?.some(r => r.rating === 5);
    if (!hasReview) {
        console.error('❌ Review not found in public profile:', publicProfile?.agent_reviews);
        process.exit(1);
    }
    console.log(`✅ Public Agent Profile Verified (Name: ${publicProfile.name}, Reviews: ${publicProfile.agent_reviews?.length})`);

    console.log('\n🎉 ALL PHASE 4 AGENT PERSONA TESTS PASSED 100% CLEANLY!\n');
}

runAgentE2ETests().catch(err => {
    console.error('💥 Unexpected Test Crash:', err);
    process.exit(1);
});
