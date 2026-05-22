import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import { forgotPassword, resetPassword, login } from './controllers/authController.js';

// Load environment variables
dotenv.config();

// Force test environment
process.env.NODE_ENV = 'test';

const testEmail = 'test_reset_user@example.com';
const testName = 'Test Reset User';
const testOldPassword = 'OldPassword123';
const testNewPassword = 'NewPassword456';

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
  console.log('--- STARTING INTEGRATION TESTS FOR PASSWORD RESET FLOW ---');
  
  // 1. Connect to Database
  await connectDB();
  
  try {
    // Clean up test data
    console.log('Cleaning up existing test data...');
    await User.deleteOne({ email: testEmail });
    
    // Create test user directly in DB
    console.log('Creating initial test user...');
    const user = new User({
      name: testName,
      email: testEmail,
      password: testOldPassword,
      isVerified: true
    });
    await user.save();
    console.log('Test user created successfully.');

    // Test Case 1: Forgot Password - Non-existent email (should return 200 for security/privacy)
    console.log('\n[Test Case 1] Requesting password reset for non-existent email...');
    const req1Invalid = { body: { email: 'nonexistent@example.com' } };
    const res1Invalid = createResponseMock();
    await forgotPassword(req1Invalid, res1Invalid);
    console.log('Response Status (Expected 200):', res1Invalid.statusCode);
    console.log('Response Body:', res1Invalid.jsonData);
    if (res1Invalid.statusCode !== 200 || !res1Invalid.jsonData.success) {
      throw new Error('Forgot password request for non-existent email should return 200 success for privacy reasons');
    }

    // Test Case 2: Forgot Password - Valid email
    console.log('\n[Test Case 2] Requesting password reset for valid test email...');
    const req1Valid = { body: { email: testEmail } };
    const res1Valid = createResponseMock();
    await forgotPassword(req1Valid, res1Valid);
    console.log('Response Status:', res1Valid.statusCode);
    console.log('Response Body:', res1Valid.jsonData);
    if (res1Valid.statusCode !== 200 || !res1Valid.jsonData.success) {
      throw new Error('Forgot password request failed for valid email');
    }

    // Verify token exists in database
    const userWithToken = await User.findOne({ email: testEmail });
    if (!userWithToken.resetPasswordToken || !userWithToken.resetPasswordExpires) {
      throw new Error('Reset password token or expiration date not saved in database');
    }
    console.log('Token generated and stored successfully. Expiration:', userWithToken.resetPasswordExpires);
    const validToken = userWithToken.resetPasswordToken;

    // Test Case 3: Reset Password - Invalid Token
    console.log('\n[Test Case 3] Attempting password reset with invalid token...');
    const req2InvalidToken = { params: { token: 'invalid_token_value' }, body: { password: testNewPassword } };
    const res2InvalidToken = createResponseMock();
    await resetPassword(req2InvalidToken, res2InvalidToken);
    console.log('Response Status (Expected 400):', res2InvalidToken.statusCode);
    console.log('Response Body:', res2InvalidToken.jsonData);
    if (res2InvalidToken.statusCode !== 400) {
      throw new Error('Password reset with invalid token should have failed');
    }

    // Test Case 4: Reset Password - Expired Token
    console.log('\n[Test Case 4] Attempting password reset with expired token...');
    // Artificially expire the token in database
    userWithToken.resetPasswordExpires = new Date(Date.now() - 1000); // 1 second ago
    await userWithToken.save();
    
    const req2ExpiredToken = { params: { token: validToken }, body: { password: testNewPassword } };
    const res2ExpiredToken = createResponseMock();
    await resetPassword(req2ExpiredToken, res2ExpiredToken);
    console.log('Response Status (Expected 400):', res2ExpiredToken.statusCode);
    console.log('Response Body:', res2ExpiredToken.jsonData);
    if (res2ExpiredToken.statusCode !== 400) {
      throw new Error('Password reset with expired token should have failed');
    }

    // Restore token expiration to future for subsequent tests
    userWithToken.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    await userWithToken.save();

    // Test Case 5: Reset Password - Weak Password (Too Short)
    console.log('\n[Test Case 5] Attempting password reset with weak password (too short)...');
    const req2ShortPass = { params: { token: validToken }, body: { password: '123' } };
    const res2ShortPass = createResponseMock();
    await resetPassword(req2ShortPass, res2ShortPass);
    console.log('Response Status (Expected 400):', res2ShortPass.statusCode);
    console.log('Response Body:', res2ShortPass.jsonData);
    if (res2ShortPass.statusCode !== 400) {
      throw new Error('Password reset with too short password should have failed');
    }

    // Test Case 6: Reset Password - Weak Password (Non-Alphanumeric)
    console.log('\n[Test Case 6] Attempting password reset with non-alphanumeric password...');
    const req2NonAlphaPass = { params: { token: validToken }, body: { password: 'letters' } };
    const res2NonAlphaPass = createResponseMock();
    await resetPassword(req2NonAlphaPass, res2NonAlphaPass);
    console.log('Response Status (Expected 400):', res2NonAlphaPass.statusCode);
    console.log('Response Body:', res2NonAlphaPass.jsonData);
    if (res2NonAlphaPass.statusCode !== 400) {
      throw new Error('Password reset with non-alphanumeric password should have failed');
    }

    // Test Case 7: Reset Password - Valid Token & Password
    console.log('\n[Test Case 7] Resetting password with valid token and strong password...');
    const req2Valid = { params: { token: validToken }, body: { password: testNewPassword } };
    const res2Valid = createResponseMock();
    await resetPassword(req2Valid, res2Valid);
    console.log('Response Status:', res2Valid.statusCode);
    console.log('Response Body:', res2Valid.jsonData);
    if (res2Valid.statusCode !== 200 || !res2Valid.jsonData.success) {
      throw new Error('Password reset failed with valid inputs');
    }

    // Verify token was cleared from the user document
    const updatedUser = await User.findOne({ email: testEmail });
    if (updatedUser.resetPasswordToken || updatedUser.resetPasswordExpires) {
      throw new Error('Reset password token and/or expiration fields were not cleared after reset');
    }
    console.log('Database reset fields cleared successfully.');

    // Test Case 8: Authenticate - Old Password should fail
    console.log('\n[Test Case 8] Attempting login with old password...');
    const req3Old = { body: { email: testEmail, password: testOldPassword } };
    const res3Old = createResponseMock();
    await login(req3Old, res3Old);
    console.log('Response Status (Expected 400):', res3Old.statusCode);
    console.log('Response Body:', res3Old.jsonData);
    if (res3Old.statusCode !== 400) {
      throw new Error('Login with old password should have failed');
    }

    // Test Case 9: Authenticate - New Password should succeed
    console.log('\n[Test Case 9] Attempting login with new password...');
    const req3New = { body: { email: testEmail, password: testNewPassword } };
    const res3New = createResponseMock();
    await login(req3New, res3New);
    console.log('Response Status:', res3New.statusCode);
    console.log('Response Body:', res3New.jsonData);
    if (res3New.statusCode !== 200 || !res3New.jsonData.success) {
      throw new Error('Login with new password failed');
    }
    console.log('Login successful with new password! JWT token correctly generated.');

    // Clean up test data
    console.log('\nCleaning up database test records...');
    await User.deleteOne({ email: testEmail });
    
    console.log('\n--- ALL PASSWORD RESET TEST CASES PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    // Cleanup if possible
    await User.deleteOne({ email: testEmail }).catch(() => {});
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
