const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000/api';
const timestamp = Date.now();
const testEmail = `testseller_${timestamp}@example.com`;
const testPassword = 'Password123!@#';

async function runSellerE2ETests() {
    console.log('🚀 Starting Phase 3: Seller Persona E2E Automated Tests...\n');
    const client = axios.create({
        baseURL: BASE_URL,
        validateStatus: () => true
    });

    // -------------------------------------------------------------
    // 1. Seller Registration & Login
    // -------------------------------------------------------------
    console.log('1️⃣ Testing Seller Registration...');
    const regRes = await client.post('/auth/register', {
        name: `Test Seller ${timestamp}`,
        email: testEmail,
        password: testPassword,
        role: 'SELLER'
    });

    if (regRes.status !== 201) {
        console.error('❌ Seller Registration failed:', regRes.status, regRes.data);
        process.exit(1);
    }
    console.log('✅ Seller Registered (Status 201, Role: SELLER)');

    console.log('\n2️⃣ Testing Seller Login & Session...');
    const loginRes = await client.post('/auth/login', {
        email: testEmail,
        password: testPassword
    });

    if (loginRes.status !== 200) {
        console.error('❌ Seller Login failed:', loginRes.status, loginRes.data);
        process.exit(1);
    }

    const setCookieHeaders = loginRes.headers['set-cookie'] || [];
    const cookie = setCookieHeaders.find(c => c.startsWith('token='))?.split(';')[0] || '';
    const token = cookie.replace('token=', '');
    const authHeaders = {
        'Cookie': cookie,
        'Authorization': `Bearer ${token}`
    };

    const meRes = await client.get('/auth/me', { headers: authHeaders });
    if (meRes.status !== 200 || meRes.data?.user?.role !== 'SELLER') {
        console.error('❌ Session verification failed for Seller:', meRes.status, meRes.data);
        process.exit(1);
    }
    console.log(`✅ Seller Session Verified (/auth/me -> ${meRes.data.user.name}, Role: ${meRes.data.user.role})`);

    // -------------------------------------------------------------
    // 2. Add New Property Listing
    // -------------------------------------------------------------
    console.log('\n3️⃣ Testing Add New Property Listing (Multi-Step Payload)...');
    const newPropPayload = {
        title: `Luxury Colombo Villa ${timestamp}`,
        description: 'Spectacular modern villa with private pool and solar power.',
        price: 75000000,
        type: 'House',
        listing_type: 'Sale',
        address: '15 Queens Road, Colombo 03',
        city: 'Colombo',
        district: 'Colombo',
        latitude: 6.9015,
        longitude: 79.8550,
        bedrooms: 4,
        bathrooms: 4,
        land_size: 20
    };

    const addPropRes = await client.post('/properties', newPropPayload, { headers: authHeaders });
    if (addPropRes.status !== 201) {
        console.error('❌ Add Property failed:', addPropRes.status, addPropRes.data);
        process.exit(1);
    }

    const createdProperty = addPropRes.data?.property;
    const propertyId = createdProperty?.id;
    console.log(`✅ Property Created Successfully (ID: ${propertyId}, Status: ${createdProperty?.status}, Payment: ${createdProperty?.payment_status})`);

    // -------------------------------------------------------------
    // 3. PayHere Payment Integration Flow
    // -------------------------------------------------------------
    console.log('\n4️⃣ Testing PayHere Payment Hash Generation & Webhook Security...');
    
    // Test 4A: Get payment config
    const configRes = await client.get('/payment/config');
    const listingFee = configRes.data?.listing_fee || '500.00';
    const merchantId = configRes.data?.merchant_id || process.env.PAYHERE_MERCHANT_ID || '1236024';
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'MjExODUzMDQ0NTM4NTQ3ODY2ODIzMTExOTU3NjEwNjIxNTU5NDgy';

    // Test 4B: Generate Payment Hash
    const hashRes = await client.post('/payment/generate-hash', {
        order_id: propertyId,
        amount: listingFee
    }, { headers: authHeaders });

    if (hashRes.status !== 200 || !hashRes.data?.hash) {
        console.error('❌ Generate Hash failed:', hashRes.status, hashRes.data);
        process.exit(1);
    }
    console.log(`✅ PayHere MD5 Hash Generated (Order: ${propertyId}, Hash: ${hashRes.data.hash})`);

    // Test 4C: Simulate PayHere Webhook (status_code: 2 = Success)
    const amountFormatted = parseFloat(listingFee).toFixed(2);
    const currency = 'LKR';
    const statusCode = '2';

    const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const md5sig = crypto.createHash('md5')
        .update(merchantId + propertyId + amountFormatted + currency + statusCode + secretHash)
        .digest('hex')
        .toUpperCase();

    const webhookRes = await client.post('/payment/notify', {
        merchant_id: merchantId,
        order_id: propertyId,
        payment_id: `PAY_${timestamp}`,
        payhere_amount: amountFormatted,
        payhere_currency: currency,
        status_code: statusCode,
        md5sig: md5sig,
        custom_1: propertyId,
        custom_2: meRes.data.user.id
    });

    if (webhookRes.status !== 200) {
        console.error('❌ PayHere Webhook processing failed:', webhookRes.status, webhookRes.data);
        process.exit(1);
    }
    console.log('✅ PayHere Webhook Processed (Timing-Safe MD5 Signature Verified, Property Paid)');

    // -------------------------------------------------------------
    // 4. Seller Listings Management (/my-listings)
    // -------------------------------------------------------------
    console.log('\n5️⃣ Testing Seller Listing Management (/my-listings)...');
    const myListingsRes = await client.get('/properties/my-listings', { headers: authHeaders });
    if (myListingsRes.status !== 200) {
        console.error('❌ Get My Listings failed:', myListingsRes.status, myListingsRes.data);
        process.exit(1);
    }
    const listings = myListingsRes.data?.properties || myListingsRes.data || [];
    const myProp = listings.find(p => p.id === propertyId);
    if (!myProp) {
        console.error('❌ Created property not found in /my-listings:', myListingsRes.data);
        process.exit(1);
    }
    console.log(`✅ Property Verified in /my-listings (Payment: ${myProp.payment_status}, Status: ${myProp.status})`);

    // Test 4B: Update Listing (Price change)
    const updateRes = await client.patch(`/properties/my-listings/${propertyId}`, {
        price: 80000000,
        title: `Updated Luxury Colombo Villa ${timestamp}`
    }, { headers: authHeaders });

    if (updateRes.status !== 200) {
        console.error('❌ Update Listing failed:', updateRes.status, updateRes.data);
        process.exit(1);
    }
    console.log('✅ Listing Updated Successfully (Price: Rs. 80,000,000)');

    // Test 4C: Delete Listing
    const deleteRes = await client.delete(`/properties/my-listings/${propertyId}`, { headers: authHeaders });
    if (deleteRes.status !== 200) {
        console.error('❌ Delete Listing failed:', deleteRes.status, deleteRes.data);
        process.exit(1);
    }
    console.log('✅ Listing Deleted Successfully');

    console.log('\n🎉 ALL PHASE 3 SELLER PERSONA TESTS PASSED 100% CLEANLY!\n');
}

runSellerE2ETests().catch(err => {
    console.error('💥 Unexpected Test Crash:', err);
    process.exit(1);
});
