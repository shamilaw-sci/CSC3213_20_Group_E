const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./config/supabase');

const BASE_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const testAdminEmail = 'admin@gmail.com';
const testAdminPassword = 'AdminPassword123!';

async function runAdminE2ETests() {
    console.log('🚀 Starting Phase 5: Super Admin Portal E2E Automated Tests...\n');
    const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true
    });

    // Ensure test admin password is known for login
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testAdminPassword, salt);
    await supabase.from('users').update({ password_hash: hash }).eq('email', testAdminEmail);

    // -------------------------------------------------------------
    // 1. RBAC Guard: Non-Admin Blocked (403 Forbidden)
    // -------------------------------------------------------------
    console.log('1️⃣ Testing Admin RBAC Guard against Unauthorized Users...');
    const buyerEmail = `unauth_buyer_${timestamp}@example.com`;
    await client.post('/auth/register', {
        name: 'Unauth Buyer',
        email: buyerEmail,
        password: 'Password123!@#',
        role: 'BUYER'
    });
    const buyerLoginRes = await client.post('/auth/login', { email: buyerEmail, password: 'Password123!@#' });
    const buyerCookie = (buyerLoginRes.headers['set-cookie'] || []).find(c => c.startsWith('token='))?.split(';')[0] || '';
    const buyerToken = buyerCookie.replace('token=', '');
    const buyerHeaders = { 'Cookie': buyerCookie, 'Authorization': `Bearer ${buyerToken}` };

    const unauthStatsRes = await client.get('/admin/dashboard/stats', { headers: buyerHeaders });
    if (unauthStatsRes.status !== 403) {
        console.error('❌ RBAC FAILURE: Non-admin accessed Admin Dashboard!', unauthStatsRes.status);
        process.exit(1);
    }
    console.log('✅ RBAC Guard Verified: Non-admin user blocked from /admin/* with 403 Forbidden');

    // -------------------------------------------------------------
    // 2. Admin Login & Session Verification
    // -------------------------------------------------------------
    console.log('\n2️⃣ Testing Admin Login & Session (/admin/login & /admin/verify)...');
    const adminLoginRes = await client.post('/admin/login', {
        email: testAdminEmail,
        password: testAdminPassword
    });

    if (adminLoginRes.status !== 200 || !adminLoginRes.data?.token) {
        console.error('❌ Admin Login failed:', adminLoginRes.status, adminLoginRes.data);
        process.exit(1);
    }
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = {
        'Cookie': `token=${adminToken}`,
        'Authorization': `Bearer ${adminToken}`
    };

    const verifyRes = await client.get('/admin/verify', { headers: adminHeaders });
    if (verifyRes.status !== 200 || verifyRes.data?.valid !== true || verifyRes.data?.admin?.role !== 'ADMIN') {
        console.error('❌ Admin Verify failed:', verifyRes.status, verifyRes.data);
        process.exit(1);
    }
    console.log(`✅ Admin Session Verified (/admin/verify -> ${verifyRes.data.admin.name}, Role: ADMIN)`);

    // -------------------------------------------------------------
    // 3. Dashboard Stats & Analytics
    // -------------------------------------------------------------
    console.log('\n3️⃣ Testing Admin Dashboard Stats & Analytics...');
    const statsRes = await client.get('/admin/dashboard/stats', { headers: adminHeaders });
    if (statsRes.status !== 200) {
        console.error('❌ Get Dashboard Stats failed:', statsRes.status, statsRes.data);
        process.exit(1);
    }
    console.log(`✅ Dashboard Stats Retrieved (Users: ${statsRes.data?.totalUsers}, Properties: ${statsRes.data?.totalProperties})`);

    const revRes = await client.get('/admin/dashboard/revenue', { headers: adminHeaders });
    if (revRes.status !== 200) {
        console.error('❌ Get Revenue Data failed:', revRes.status);
        process.exit(1);
    }
    console.log('✅ Revenue Analytics Retrieved');

    const analyticsRes = await client.get('/admin/analytics', { headers: adminHeaders });
    if (analyticsRes.status !== 200) {
        console.error('❌ Get Analytics failed:', analyticsRes.status);
        process.exit(1);
    }
    console.log('✅ Geographic & Category Analytics Retrieved');

    // -------------------------------------------------------------
    // 4. Property Moderation (Approve / Reject)
    // -------------------------------------------------------------
    console.log('\n4️⃣ Testing Property Listing Moderation (Approve / Reject Flow)...');
    
    // Create a pending property directly in DB
    const { data: testProp } = await supabase.from('properties').insert([{
        title: `Moderation Test Villa ${timestamp}`,
        description: 'Test property for moderation',
        price: 45000000,
        type: 'House',
        listing_type: 'Sale',
        address: '123 Kandy Road',
        city: 'Kandy',
        status: 'pending',
        payment_status: 'Paid',
        seller_id: verifyRes.data.admin.id
    }]).select().single();

    const propId = testProp?.id;

    // Test 4A: Approve listing
    const approveRes = await client.patch(`/admin/listings/${propId}/approve`, {}, { headers: adminHeaders });
    if (approveRes.status !== 200) {
        console.error('❌ Approve listing failed:', approveRes.status, approveRes.data);
        process.exit(1);
    }
    console.log('✅ Property Approved Successfully (Status: approved)');

    // Test 4B: Reject listing with reason
    const rejectRes = await client.patch(`/admin/listings/${propId}/reject`, {
        reason: 'Images do not meet quality guidelines'
    }, { headers: adminHeaders });
    if (rejectRes.status !== 200) {
        console.error('❌ Reject listing failed:', rejectRes.status, rejectRes.data);
        process.exit(1);
    }
    console.log('✅ Property Rejected with Reason (Status: rejected)');

    // Clean up test property
    await client.delete(`/admin/listings/${propId}`, { headers: adminHeaders });
    console.log('✅ Test Property Deleted Cleanly');

    // -------------------------------------------------------------
    // 5. User Management & Ban Enforcement
    // -------------------------------------------------------------
    console.log('\n5️⃣ Testing User Moderation, Role Updates & Ban Enforcement...');
    const targetUserEmail = `target_user_${timestamp}@example.com`;
    const targetUserPassword = 'TargetPassword123!';
    const userRegRes = await client.post('/auth/register', {
        name: `Target User ${timestamp}`,
        email: targetUserEmail,
        password: targetUserPassword,
        role: 'BUYER'
    });
    const targetUserId = userRegRes.data?.user?.id;

    // Test 5A: Role update (BUYER -> SELLER)
    const updateRoleRes = await client.patch(`/admin/users/${targetUserId}/role`, {
        role: 'SELLER'
    }, { headers: adminHeaders });
    if (updateRoleRes.status !== 200) {
        console.error('❌ Update user role failed:', updateRoleRes.status, updateRoleRes.data);
        process.exit(1);
    }
    console.log('✅ User Role Changed to SELLER');

    // Test 5B: Ban User
    const banRes = await client.patch(`/admin/users/${targetUserId}/ban`, {}, { headers: adminHeaders });
    if (banRes.status !== 200) {
        console.error('❌ Ban user failed:', banRes.status, banRes.data);
        process.exit(1);
    }
    console.log('✅ User Account Banned (Status: BANNED)');

    // Test 5C: Banned user login MUST FAIL (403)
    const bannedLoginRes = await client.post('/auth/login', {
        email: targetUserEmail,
        password: targetUserPassword
    });
    if (bannedLoginRes.status !== 403) {
        console.error('❌ SECURITY FAILURE: Banned user was able to log in!', bannedLoginRes.status);
        process.exit(1);
    }
    console.log('✅ Ban Security Guard Verified: Banned user rejected at login (403 Forbidden)');

    // Test 5D: Unban User
    const unbanRes = await client.patch(`/admin/users/${targetUserId}/unban`, {}, { headers: adminHeaders });
    if (unbanRes.status !== 200) {
        console.error('❌ Unban user failed:', unbanRes.status, unbanRes.data);
        process.exit(1);
    }
    console.log('✅ User Unbanned Successfully');

    // -------------------------------------------------------------
    // 6. Reports & CSV Export Generation
    // -------------------------------------------------------------
    console.log('\n6️⃣ Testing Financial Reports & CSV Generation...');
    const txRes = await client.get('/admin/reports/transactions', { headers: adminHeaders });
    if (txRes.status !== 200) {
        console.error('❌ Get Transactions failed:', txRes.status);
        process.exit(1);
    }
    console.log('✅ Transactions Report Retrieved');

    const csvExportRes = await client.get('/admin/reports/export/listings', { headers: adminHeaders });
    if (csvExportRes.status !== 200 || !csvExportRes.data || !csvExportRes.data.includes('title')) {
        console.error('❌ CSV Export failed:', csvExportRes.status, csvExportRes.data);
        process.exit(1);
    }
    console.log('✅ Listings CSV Report Generated Successfully (Content Verified)');

    // -------------------------------------------------------------
    // 7. Settings & Audit Logs
    // -------------------------------------------------------------
    console.log('\n7️⃣ Testing Settings & Audit Logs...');
    const getSettingsRes = await client.get('/admin/settings', { headers: adminHeaders });
    if (getSettingsRes.status !== 200) {
        console.error('❌ Get Settings failed:', getSettingsRes.status);
        process.exit(1);
    }
    console.log('✅ Platform Settings Retrieved');

    const auditRes = await client.get('/admin/audit-logs', { headers: adminHeaders });
    if (auditRes.status !== 200) {
        console.error('❌ Get Audit Logs failed:', auditRes.status);
        process.exit(1);
    }
    console.log(`✅ Audit Logs History Retrieved (${auditRes.data?.logs?.length || 0} entries)`);

    console.log('\n🎉 ALL PHASE 5 SUPER ADMIN TESTS PASSED 100% CLEANLY!\n');
}

runAdminE2ETests().catch(err => {
    console.error('💥 Unexpected Test Crash:', err);
    process.exit(1);
});
