import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { generateTokenAndSetCookie } from '../utils/token.js';
import crypto from 'crypto';
import { sendOtpEmail, sendPasswordResetEmail } from '../utils/email.js';

// Send OTP to User's Email
export const sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Check if email already exists in User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save/update OTP in database
    await Otp.findOneAndUpdate(
      { email },
      { otp, isVerified: false, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send the OTP email
    const emailRes = await sendOtpEmail(email, name, otp);
    if (!emailRes.success) {
      return res.status(500).json({ success: false, message: emailRes.error || 'Failed to send verification email' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email! Please check your inbox.',
    });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const otpDoc = await Otp.findOne({ email });
    if (!otpDoc || otpDoc.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Code expired or invalid. Please request a new code.' });
    }

    if (otpDoc.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Generate a secure verification token for register confirmation
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes to finish signup

    otpDoc.isVerified = true;
    otpDoc.verificationToken = verificationToken;
    otpDoc.expiresAt = expiresAt;
    await otpDoc.save();

    return res.status(200).json({
      success: true,
      emailToken: verificationToken,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// User Registration
export const register = async (req, res) => {
  try {
    const { name, email, password, avatar, emailToken } = req.body;

    if (!name || !email || !password || !emailToken) {
      return res.status(400).json({ success: false, message: 'All fields and verification token are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be alphanumeric (contain both letters and numbers)' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Verify the emailToken
    const otpDoc = await Otp.findOne({ email });
    if (!otpDoc || !otpDoc.isVerified || otpDoc.verificationToken !== emailToken || otpDoc.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'Email verification session expired or invalid. Please verify your email again.' });
    }

    // Delete the OTP verification session
    await Otp.deleteOne({ email });

    // Assign a default avatar (e.g. dicebear or multiavatar) if none is provided
    const userAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    const user = new User({
      name,
      email,
      password,
      avatar: userAvatar,
      isVerified: true,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// User Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Set cookie and generate JWT token
    const token = generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// User Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get current user session
export const me = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    console.error('Me check error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Request password reset link
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });
    // Industry standard / security practice: Do not reveal if email exists.
    // Return a generic success message even if the user doesn't exist.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If a matching account exists, a password reset link has been sent to your email.'
      });
    }

    // Generate secure reset token (32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration
    await user.save();

    // Send the password reset email
    const emailRes = await sendPasswordResetEmail(user.email, user.name, resetToken);
    if (!emailRes.success) {
      return res.status(500).json({ success: false, message: emailRes.error || 'Failed to send reset email' });
    }

    return res.status(200).json({
      success: true,
      message: 'If a matching account exists, a password reset link has been sent to your email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Reset password using token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be alphanumeric (contain both letters and numbers)' });
    }

    // Find user by reset token and ensure the token hasn't expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired' });
    }

    // Update password (pre-save hook hashes this automatically)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
