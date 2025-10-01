const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register user
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, mobile, dob, password } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !email || !dob || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or mobile already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile,
      dob,
      password
    });
    
    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Development mode - bypass email for testing
    const isDev = process.env.NODE_ENV === 'development';
    const bypassEmail = process.env.DEV_OTP_BYPASS === 'true';
    
    if (isDev && bypassEmail) {
      console.log('DEVELOPMENT MODE: Bypassing email for testing');
      console.log(`OTP for ${email}: ${otp}`);
      
      return res.status(201).json({
        success: true,
        message: 'Registration successful! [DEV MODE] Check server console for OTP.',
        devMode: true,
        devOtp: otp
      });
    }
    
    // Create HTML template for OTP email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4073c0;">MindSpace</h1>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Verify Your Account</h2>
          <p>Thank you for registering with MindSpace. To complete your registration, please use the following OTP code:</p>
          <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; font-weight: bold; color: #4073c0;">
            ${otp}
          </div>
          <p>This code is valid for 10 minutes and can only be used once.</p>
        </div>
        <div style="color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          <p>If you didn't request this email, please ignore it.</p>
          <p>© ${new Date().getFullYear()} MindSpace. All rights reserved.</p>
        </div>
      </div>
    `;
    
    try {
      // Send OTP via email
      const emailResult = await sendEmail({
        to: email,
        subject: 'MindSpace Account Verification',
        text: `Your verification OTP is: ${otp}. This OTP is valid for 10 minutes.`,
        html: htmlContent
      });
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        
        if (isDev) {
          console.warn('DEV MODE: Proceeding with registration despite email failure');
          console.log(`OTP for ${email}: ${otp}`);
          
          return res.status(201).json({
            success: true,
            message: 'Registration successful! Email sending failed, but OTP is in server logs.',
            devMode: true,
            devOtp: otp
          });
        }
        
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({
          success: false,
          message: 'Registration failed: Could not send verification email. Please try again later.'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please verify your account with the OTP sent to your email.'
      });
      
    } catch (error) {
      console.error('Email error:', error);
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Registration failed: Email service error. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Admin Register
exports.adminRegister = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Validate input
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Validate role
    if (!['counselor', 'therapist', 'admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create admin user
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile: undefined,
      dob: new Date(),
      password,
      role
    });
    
    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Development mode - bypass email for testing
    const isDev = process.env.NODE_ENV === 'development';
    const bypassEmail = process.env.DEV_OTP_BYPASS === 'true';
    
    if (isDev && bypassEmail) {
      console.log('DEVELOPMENT MODE: Bypassing email for testing');
      console.log(`OTP for ${email}: ${otp}`);
      
      return res.status(201).json({
        success: true,
        message: 'Admin registration successful! [DEV MODE] Check server console for OTP.',
        devMode: true,
        devOtp: otp
      });
    }
    
    // Create HTML template for OTP email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4073c0;">MindSpace</h1>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Verify Your Admin Account</h2>
          <p>Thank you for registering as an admin with MindSpace. To complete your registration, please use the following OTP code:</p>
          <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0; font-weight: bold; color: #4073c0;">
            ${otp}
          </div>
          <p>This code is valid for 10 minutes and can only be used once.</p>
        </div>
        <div style="color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          <p>If you didn't request this email, please ignore it.</p>
          <p>© ${new Date().getFullYear()} MindSpace. All rights reserved.</p>
        </div>
      </div>
    `;
    
    try {
      // Send OTP via email
      const emailResult = await sendEmail({
        to: email,
        subject: 'MindSpace Admin Account Verification',
        text: `Your verification OTP is: ${otp}. This OTP is valid for 10 minutes.`,
        html: htmlContent
      });
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        
        if (isDev) {
          console.warn('DEV MODE: Proceeding with registration despite email failure');
          console.log(`OTP for ${email}: ${otp}`);
          
          return res.status(201).json({
            success: true,
            message: 'Admin registration successful! Email sending failed, but OTP is in server logs.',
            devMode: true,
            devOtp: otp
          });
        }
        
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({
          success: false,
          message: 'Admin registration failed: Could not send verification email. Please try again later.'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Admin registration successful! Please verify your account with the OTP sent to your email.'
      });
      
    } catch (error) {
      console.error('Email error:', error);
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Admin registration failed: Email service error. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Admin registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin registration'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }
    
    const hashedOTP = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    
    const user = await User.findOne({
      email,
      verificationToken: hashedOTP,
      verificationExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }
    
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();
    
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified'
      });
    }
    
    const otp = user.generateOTP();
    await user.save();
    
    const isDev = process.env.NODE_ENV === 'development';
    const bypassEmail = process.env.DEV_OTP_BYPASS === 'true';
    
    if (isDev && bypassEmail) {
      console.log('DEVELOPMENT MODE: Bypassing email for testing');
      console.log(`OTP for ${email}: ${otp}`);
      
      return res.status(200).json({
        success: true,
        message: 'New OTP generated! [DEV MODE] Check server console for OTP.',
        devMode: true,
        devOtp: otp
      });
    }
    
    try {
      await sendEmail({
        to: email,
        subject: 'MindSpace Account Verification - New OTP',
        text: `Your new verification OTP is: ${otp}. This OTP is valid for 10 minutes.`
      });
      
      res.status(200).json({
        success: true,
        message: 'New OTP sent successfully'
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not send verification email'
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP resend'
    });
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      
      await sendEmail({
        to: email,
        subject: 'MindSpace Account Verification',
        text: `Your verification OTP is: ${otp}. This OTP is valid for 10 minutes.`
      });
      
      return res.status(401).json({
        success: false,
        message: 'Account not verified. A new OTP has been sent to your email.'
      });
    }
    
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email address exists'
      });
    }
    
    const resetToken = user.getResetPasswordToken();
    await user.save();
    
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    try {
      await sendEmail({
        to: email,
        subject: 'MindSpace Password Reset',
        text: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}
        
        If you didn't request this, please ignore this email.`
      });
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      console.error('Failed to send reset email:', error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Could not send reset email'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user data'
    });
  }
};

// Admin Login
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin role required'
      });
    }
    
    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      
      await sendEmail({
        to: email,
        subject: 'MindSpace Admin Account Verification',
        text: `Your verification OTP is: ${otp}. This OTP is valid for 10 minutes.`
      });
      
      return res.status(401).json({
        success: false,
        message: 'Admin account not verified. A new OTP has been sent to your email.'
      });
    }
    
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
};