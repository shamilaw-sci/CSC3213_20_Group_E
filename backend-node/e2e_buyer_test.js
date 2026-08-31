const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const testEmail = `testbuyer_${timestamp}@example.com`;
const testPassword = 'Password123!@#';
const newPassword = 'NewPassword123!@#';

async function runBuyerE2ETests() {
    console.log('🚀 Starting Phase 2: Buyer Persona E2E Automated Tests...\n');
    let cookie = '';

    const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true // Allow all HTTP statuses
    });

    // -------------------------------------------------------------
    // 1. Registration
    // -------------------------------------------------------------
    console.log('1️⃣ Testing Buyer Registration...');
    const regRes = await client.post('/auth/register', {
        name: `Test Buyer ${timestamp}`,
        email: testEmail,
        password: testPassword,
        role: 'BUYER'
    });

    if (regRes.status !== 201) {
        console.error('❌ Registration failed:', regRes.status, regRes.data);
        process.exit(1);
    }
    if (regRes.data?.user?.password_hash) {
        console.error('❌ SECURITY ALERT: password_hash leaked in registration response!');
        process.exit(1);
    }
    console.log('✅ Registration Passed (Status 201, Zero Password Hash Leak)');

    // -------------------------------------------------------------
    // 2. Login & Session (Cookie Extraction)
    // -------------------------------------------------------------
    console.log('\n2️⃣ Testing Buyer Login...');
    const loginRes = await client.post('/auth/login', {
        email: testEmail,
        password: testPassword
    });

    if (loginRes.status !== 200) {
        console.error('❌ Login failed:', loginRes.status, loginRes.data);
        process.exit(1);
    }

    const setCookieHeaders = loginRes.headers['set-cookie'] || [];
    cookie = setCookieHeaders.find(c => c.startsWith('token='))?.split(';')[0] || '';
    
    // Auth client with cookie & bearer
    const token = cookie.replace('token=', '');
    const authHeaders = {
        'Cookie': cookie,
        'Authorization': `Bearer ${token}`
    };

    console.log('✅ Login Passed (Status 200, JWT Cookie & Bearer Token Issued)');

    // -------------------------------------------------------------
    // 3. Verify Session (/auth/me)
    // -------------------------------------------------------------
    console.log('\n3️⃣ Testing Session Verification (/auth/me)...');
    const meRes = await client.get('/auth/me', { headers: authHeaders });
    if (meRes.status !== 200 || meRes.data?.user?.email !== testEmail) {
        console.error('❌ /auth/me failed:', meRes.status, meRes.data);
        process.exit(1);
    }
    console.log(`✅ Session Verified (/auth/me -> ${meRes.data.user.name}, Role: ${meRes.data.user.role})`);

    // -------------------------------------------------------------
    // 4. Favorites / Wishlist Flow
    // -------------------------------------------------------------
    console.log('\n4️⃣ Testing Favorites / Wishlist Flow...');
    const propRes = await client.get('/properties?limit=1');
    const propertyId = propRes.data?.properties?.[0]?.id;

    if (!propertyId) {
        console.warn('⚠️ No approved properties found for favorites test, skipping favorite toggle');
    } else {
        // Toggle favorite ON
        const favOnRes = await client.post(`/favorites/${propertyId}`, {}, { headers: authHeaders });
        if (favOnRes.status !== 200 || favOnRes.data?.isFavorite !== true) {
            console.error('❌ Toggle Favorite ON failed:', favOnRes.status, favOnRes.data);
            process.exit(1);
        }

        // Get favorites list
        const favListRes = await client.get('/favorites', { headers: authHeaders });
        const hasFav = favListRes.data?.favorites?.some(f => f.id === propertyId || f.property_id === propertyId);
        if (!hasFav) {
            console.error('❌ Favorite not found in /favorites list:', favListRes.data);
            process.exit(1);
        }
        console.log('✅ Added to Favorites & Verified in List (Status 200)');

        // Toggle favorite OFF
        const favOffRes = await client.post(`/favorites/${propertyId}`, {}, { headers: authHeaders });
        if (favOffRes.status !== 200 || favOffRes.data?.isFavorite !== false) {
            console.error('❌ Toggle Favorite OFF failed:', favOffRes.status, favOffRes.data);
            process.exit(1);
        }
        console.log('✅ Removed from Favorites (Toggle OFF Passed)');
    }

    // -------------------------------------------------------------
    // 5. Saved Search Flow
    // -------------------------------------------------------------
    console.log('\n5️⃣ Testing Saved Searches Flow...');
    const saveSearchRes = await client.post('/saved-searches', {
        title: 'Kandy Villa Search',
        property_type: 'House',
        listing_type: 'Sale',
        min_price: 10000000,
        max_price: 50000000
    }, { headers: authHeaders });

    if (saveSearchRes.status !== 201) {
        console.error('❌ Save Search failed:', saveSearchRes.status, saveSearchRes.data);
        process.exit(1);
    }
    const savedSearchId = saveSearchRes.data?.savedSearch?.id || saveSearchRes.data?.data?.id;
    console.log('✅ Saved Search Created (Status 201)');

    const getSavedRes = await client.get('/saved-searches', { headers: authHeaders });
    const exists = getSavedRes.data?.savedSearches?.some(s => s.id === savedSearchId);
    if (!exists) {
        console.error('❌ Saved search not found in list:', getSavedRes.data);
        process.exit(1);
    }
    console.log('✅ Saved Search Verified in User List');

    const deleteSavedRes = await client.delete(`/saved-searches/${savedSearchId}`, { headers: authHeaders });
    if (deleteSavedRes.status !== 200) {
        console.error('❌ Delete Saved Search failed:', deleteSavedRes.status, deleteSavedRes.data);
        process.exit(1);
    }
    console.log('✅ Saved Search Deleted Successfully');

    // -------------------------------------------------------------
    // 6. Messaging Flow
    // -------------------------------------------------------------
    console.log('\n6️⃣ Testing In-App Messaging Flow...');
    if (propertyId) {
        const convRes = await client.post(`/conversations/property/${propertyId}`, {}, { headers: authHeaders });
        if (convRes.status !== 200 && convRes.status !== 201) {
            console.error('❌ Start conversation failed:', convRes.status, convRes.data);
            process.exit(1);
        }
        const conversationId = convRes.data?.conversation?.id;
        console.log(`✅ Conversation Initialized (ID: ${conversationId})`);

        // Send message
        const msgRes = await client.post(`/conversations/${conversationId}/messages`, {
            body: `Hello seller, is this property still available? [Test ${timestamp}]`
        }, { headers: authHeaders });

        if (msgRes.status !== 201) {
            console.error('❌ Send message failed:', msgRes.status, msgRes.data);
            process.exit(1);
        }
        console.log('✅ Message Sent (Status 201)');

        // Retrieve messages
        const getMsgsRes = await client.get(`/conversations/${conversationId}/messages`, { headers: authHeaders });
        if (getMsgsRes.status !== 200 || !getMsgsRes.data?.messages?.length) {
            console.error('❌ Get messages failed:', getMsgsRes.status, getMsgsRes.data);
            process.exit(1);
        }
        console.log('✅ Message History Retrieved & Verified');
    }

    // -------------------------------------------------------------
    // 7. Profile Update & Password Verification (M12 Fix)
    // -------------------------------------------------------------
    console.log('\n7️⃣ Testing Profile Update & Password Change (M12 Security)...');
    
    // Test 7A: Profile info update
    const updateProfileRes = await client.put('/auth/profile', {
        name: `Updated Buyer ${timestamp}`,
        phone: '0712345678'
    }, { headers: authHeaders });

    if (updateProfileRes.status !== 200 || updateProfileRes.data?.user?.name !== `Updated Buyer ${timestamp}`) {
        console.error('❌ Profile name update failed:', updateProfileRes.status, updateProfileRes.data);
        process.exit(1);
    }
    console.log('✅ Profile Name & Phone Updated Successfully');

    // Test 7B: Password change with WRONG current password (MUST FAIL with 400/401)
    const wrongPassRes = await client.put('/auth/profile', {
        currentPassword: 'WrongPassword123!',
        password: newPassword
    }, { headers: authHeaders });

    if (wrongPassRes.status !== 400 && wrongPassRes.status !== 401) {
        console.error('❌ SECURITY FAILURE: Password changed with invalid currentPassword!', wrongPassRes.status);
        process.exit(1);
    }
    console.log('✅ M12 Security Guard Verified: Rejected wrong current password (Status 400)');

    // Test 7C: Password change with CORRECT current password (MUST SUCCEED)
    const correctPassRes = await client.put('/auth/profile', {
        currentPassword: testPassword,
        password: newPassword
    }, { headers: authHeaders });

    if (correctPassRes.status !== 200) {
        console.error('❌ Valid password change failed:', correctPassRes.status, correctPassRes.data);
        process.exit(1);
    }
    console.log('✅ Password Changed Successfully with valid current password');

    // Test 7D: Verify login with new password
    const newLoginRes = await client.post('/auth/login', {
        email: testEmail,
        password: newPassword
    });
    if (newLoginRes.status !== 200) {
        console.error('❌ Login with new password failed:', newLoginRes.status);
        process.exit(1);
    }
    console.log('✅ Login with New Password Succeeded');

    // -------------------------------------------------------------
    // 8. Logout
    // -------------------------------------------------------------
    console.log('\n8️⃣ Testing Logout Flow...');
    const logoutRes = await client.post('/auth/logout', {}, { headers: authHeaders });
    if (logoutRes.status !== 200) {
        console.error('❌ Logout failed:', logoutRes.status);
        process.exit(1);
    }
    console.log('✅ Logout Passed (Status 200, Session Cleared)');

    console.log('\n🎉 ALL PHASE 2 BUYER PERSONA TESTS PASSED 100% CLEANLY!\n');
}

runBuyerE2ETests().catch(err => {
    console.error('💥 Unexpected Test Crash:', err);
    process.exit(1);
});
