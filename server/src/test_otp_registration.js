import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Otp from './models/Otp.js';
import { sendOtp, verifyOtp, register, login } from './controllers/authController.js';

// Load environment variables
dotenv.config();

// Force test environment
process.env.NODE_ENV = 'test';

const testEmail = 'test_otp_user@example.com';
const testName = 'Test OTP User';
const testPassword = 'Password123';

// Helper to create mocked response objects
function createResponseMock() {
  return {
    statusCode: 200,
    headers: {},
    jsonData: null,
    cookieData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    cookie(name, val, options) {
      this.cookieData = { name, val, options };
      return this;
    },
    clearCookie(name, options) {
      this.cookieData = { cleared: true, name, options };
      return this;
    }
  };
}

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS FOR OTP REGISTRATION FLOW ---');
  
  // 1. Connect to Database
  await connectDB();
  
  try {
    // Clean up test data
    console.log('Cleaning up existing test data...');
    await User.deleteOne({ email: testEmail });
    await Otp.deleteOne({ email: testEmail });
    
    // Test Case 1: Send OTP
    console.log('\n[Test Case 1] Sending OTP...');
    const req1 = { body: { email: testEmail, name: testName } };
    const res1 = createResponseMock();
    await sendOtp(req1, res1);
    
    console.log('Response Status:', res1.statusCode);
    console.log('Response Body:', res1.jsonData);
    
    if (res1.statusCode !== 200 || !res1.jsonData.success) {
      throw new Error('Failed to send OTP');
    }
    
    // Verify OTP document exists in DB
    const otpDoc = await Otp.findOne({ email: testEmail });
    if (!otpDoc) {
      throw new Error('OTP document was not created in the database');
    }
    console.log('OTP Document found in DB. Code:', otpDoc.otp, 'isVerified:', otpDoc.isVerified);
    
    const correctOtp = otpDoc.otp;
    
    // Test Case 2: Verify OTP with invalid code
    console.log('\n[Test Case 2] Verifying OTP with incorrect code...');
    const req2Wrong = { body: { email: testEmail, otp: '000000' } };
    const res2Wrong = createResponseMock();
    await verifyOtp(req2Wrong, res2Wrong);
    console.log('Response Status (Expected 400):', res2Wrong.statusCode);
    console.log('Response Body:', res2Wrong.jsonData);
    if (res2Wrong.statusCode !== 400) {
      throw new Error('Verification should have failed with incorrect code');
    }
    
    // Test Case 3: Verify OTP with correct code
    console.log('\n[Test Case 3] Verifying OTP with correct code...');
    const req2 = { body: { email: testEmail, otp: correctOtp } };
    const res2 = createResponseMock();
    await verifyOtp(req2, res2);
    
    console.log('Response Status:', res2.statusCode);
    console.log('Response Body:', res2.jsonData);
    
    if (res2.statusCode !== 200 || !res2.jsonData.success) {
      throw new Error('OTP Verification failed');
    }
    const emailToken = res2.jsonData.emailToken;
    
    // Verify database state updated
    const verifiedOtpDoc = await Otp.findOne({ email: testEmail });
    if (!verifiedOtpDoc || !verifiedOtpDoc.isVerified) {
      throw new Error('OTP was not marked as verified in DB');
    }
    console.log('OTP database state updated to isVerified: true');
    
    // Test Case 4: Register without verification (e.g. using a different/unverified email)
    console.log('\n[Test Case 4] Trying to register an unverified email (Should fail)...');
    const req3Unverified = {
      body: {
        name: 'Unverified User',
        email: 'unverified_user@example.com',
        password: 'Password123'
      }
    };
    const res3Unverified = createResponseMock();
    await register(req3Unverified, res3Unverified);
    console.log('Response Status (Expected 400):', res3Unverified.statusCode);
    console.log('Response Body:', res3Unverified.jsonData);
    if (res3Unverified.statusCode !== 400) {
      throw new Error('Registration of unverified email should have failed');
    }
    
    // Test Case 5: Register with invalid password
    console.log('\n[Test Case 5] Trying to register with weak password (Should fail)...');
    const req3WeakPassword = {
      body: {
        name: testName,
        email: testEmail,
        password: '123',
        emailToken: emailToken
      }
    };
    const res3WeakPassword = createResponseMock();
    await register(req3WeakPassword, res3WeakPassword);
    console.log('Response Status (Expected 400):', res3WeakPassword.statusCode);
    console.log('Response Body:', res3WeakPassword.jsonData);
    if (res3WeakPassword.statusCode !== 400) {
      throw new Error('Weak password registration should have failed');
    }
    
    // Test Case 6: Register with verified email
    console.log('\n[Test Case 6] Registering user with verified email...');
    const req3 = {
      body: {
        name: testName,
        email: testEmail,
        password: testPassword,
        emailToken: emailToken
      }
    };
    const res3 = createResponseMock();
    await register(req3, res3);
    
    console.log('Response Status:', res3.statusCode);
    console.log('Response Body:', res3.jsonData);
    
    if (res3.statusCode !== 201 || !res3.jsonData.success) {
      throw new Error('User registration failed');
    }
    
    // Verify user is created and OTP record is deleted
    const userInDb = await User.findOne({ email: testEmail });
    if (!userInDb) {
      throw new Error('User was not found in database after registration');
    }
    console.log('User created in database successfully. Name:', userInDb.name, 'isVerified:', userInDb.isVerified);
    
    const otpDeleted = await Otp.findOne({ email: testEmail });
    if (otpDeleted) {
      throw new Error('OTP verification record was not deleted after registration');
    }
    console.log('Temporary OTP record cleaned up successfully.');
    
    // Test Case 7: Login with registered user
    console.log('\n[Test Case 7] Logging in with newly registered user...');
    const req4 = {
      body: {
        email: testEmail,
        password: testPassword
      }
    };
    const res4 = createResponseMock();
    await login(req4, res4);
    
    console.log('Response Status:', res4.statusCode);
    console.log('Response Body:', res4.jsonData);
    
    if (res4.statusCode !== 200 || !res4.jsonData.success) {
      throw new Error('User login failed');
    }
    console.log('Login successful! JWT Token generated and set in response.');
    
    // Clean up test data
    console.log('\nCleaning up database test records...');
    await User.deleteOne({ email: testEmail });
    
    console.log('\n--- ALL TEST CASES PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    // Cleanup if possible
    await User.deleteOne({ email: testEmail }).catch(() => {});
    await Otp.deleteOne({ email: testEmail }).catch(() => {});
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
