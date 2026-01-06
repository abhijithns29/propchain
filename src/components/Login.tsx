import React, { useState, useEffect } from 'react';
import { Mail, Lock, Wallet, User, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import MinimalHeader from './layout/MinimalHeader';
import OTPInput from './OTPInput';
import apiService from '../services/api';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'details' | 'otp'>('details');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    walletAddress: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    walletAddress: ''
  });
  const [fieldValid, setFieldValid] = useState({
    fullName: false,
    email: false,
    password: false,
    walletAddress: false
  });
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [otpTimer, setOtpTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const { login, connectWallet } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (registrationStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [registrationStep, otpTimer]);

  useEffect(() => {
    if (otp.length === 6 && registrationStep === 'otp') {
      handleVerifyOTP();
    }
  }, [otp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.sendRegistrationOTP(formData.email, formData.fullName);
      setSuccess('Verification code sent to your email!');
      setRegistrationStep('otp');
      setOtpTimer(300);
      setCanResend(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.verifyAndRegister({
        ...formData,
        otp,
      });

      const { token } = response;
      localStorage.setItem('token', token);

      window.location.reload();
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.sendRegistrationOTP(formData.email, formData.fullName);
      setSuccess('New verification code sent!');
      setOtpTimer(300);
      setCanResend(false);
      setOtp('');
    } catch (error: any) {
      setError(error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setRegistrationStep('details');
    setOtp('');
    setError('');
    setSuccess('');
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    setError('');

    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        await connectWallet();
      } else {
        throw new Error('MetaMask is not installed. Please install MetaMask to use wallet connection.');
      }
    } catch (error: any) {
      setError(error.message || 'Wallet connection failed');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWalletAddress = (address: string): boolean => {
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    return walletRegex.test(address);
  };

  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    let isValid = false;
    let errorMsg = '';

    switch (name) {
      case 'fullName':
        isValid = value.trim().length >= 2;
        errorMsg = isValid ? '' : 'Name must be at least 2 characters';
        break;
      case 'email':
        isValid = validateEmail(value);
        errorMsg = isValid ? '' : value ? 'Please enter a valid email address' : '';
        break;
      case 'password':
        isValid = value.length >= 6;
        errorMsg = isValid ? '' : value ? 'Password must be at least 6 characters' : '';
        if (value) {
          setPasswordStrength(calculatePasswordStrength(value));
        } else {
          setPasswordStrength(null);
        }
        break;
      case 'walletAddress':
        isValid = validateWalletAddress(value);
        errorMsg = isValid ? '' : value ? 'Invalid wallet address format (0x + 40 hex characters)' : '';
        break;
    }

    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
    setFieldValid(prev => ({ ...prev, [name]: isValid }));
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setRegistrationStep('details');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <>
      <MinimalHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Gradient Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-500/50 to-indigo-500/50 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Login Card with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/60"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#012970] mb-1">
                {isLogin ? 'Sign In' :
                  registrationStep === 'otp' ? 'Verify Email' : 'Sign Up'}
              </h2>
              <p className="text-gray-600 text-sm">
                {registrationStep === 'otp'
                  ? `Enter the code sent to ${formData.email}`
                  : isLogin
                    ? 'Welcome back! Please enter your details'
                    : 'Create an account to get started'}
              </p>
            </div>

            {/* OTP Verification Step */}
            {!isLogin && registrationStep === 'otp' ? (
              <div className="space-y-5">
                <div className="text-center">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    error={!!error}
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {success}
                  </motion.div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className={otpTimer <= 60 ? 'text-red-600 font-medium' : ''}>
                      {formatTime(otpTimer)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                    className="text-[#4154f1] hover:text-[#3346d8] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Resend Code
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleBackToDetails}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to edit details
                </motion.button>

                {loading && (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#4154f1]"></div>
                    <p className="text-sm text-gray-600 mt-2">Verifying...</p>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Registration Form */
              <form className="space-y-4" onSubmit={isLogin ? handleLoginSubmit : handleSendOTP}>
                <div className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required={!isLogin}
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`block w-full pl-10 pr-10 py-3 border bg-white placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-transparent transition-all ${formData.fullName && fieldErrors.fullName ? 'border-red-300' :
                            formData.fullName && fieldValid.fullName ? 'border-green-300' : 'border-gray-300'
                            }`}
                          placeholder="Enter your full name"
                        />
                        {formData.fullName && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {fieldValid.fullName ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {fieldErrors.fullName && formData.fullName && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-10 py-3 border bg-white placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-transparent transition-all ${formData.email && fieldErrors.email ? 'border-red-300' :
                          formData.email && fieldValid.email ? 'border-green-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter your email"
                      />
                      {formData.email && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          {fieldValid.email ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {fieldErrors.email && formData.email && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-10 py-3 border bg-white placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-transparent transition-all ${formData.password && fieldErrors.password ? 'border-red-300' :
                          formData.password && fieldValid.password ? 'border-green-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {formData.password && passwordStrength && !isLogin && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Password strength:</span>
                          <span className={`text-xs font-medium ${passwordStrength === 'strong' ? 'text-green-600' :
                            passwordStrength === 'medium' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                            {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${passwordStrength === 'strong' ? 'w-full bg-green-500' :
                            passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                              'w-1/3 bg-red-500'
                            }`} />
                        </div>
                      </div>
                    )}
                    {fieldErrors.password && formData.password && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {!isLogin && (
                    <div>
                      <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Wallet Address <span className="text-gray-500 text-xs">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Wallet className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="walletAddress"
                          name="walletAddress"
                          type="text"
                          value={formData.walletAddress}
                          onChange={handleInputChange}
                          className={`block w-full pl-10 pr-10 py-3 border bg-white placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-transparent transition-all ${formData.walletAddress && fieldErrors.walletAddress ? 'border-red-300' :
                            formData.walletAddress && fieldValid.walletAddress ? 'border-green-300' : 'border-gray-300'
                            }`}
                          placeholder="0x..."
                        />
                        {formData.walletAddress && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {fieldValid.walletAddress ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {fieldErrors.walletAddress && formData.walletAddress && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {fieldErrors.walletAddress}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {isLogin && (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => window.location.href = '/forgot-password'}
                      className="text-sm text-[#4154f1] hover:text-[#3346d8] font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    {success}
                  </motion.div>
                )}

                <div className="space-y-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-[#4154f1] to-[#3346d8] hover:from-[#3346d8] hover:to-[#2235c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154f1] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </motion.button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleWalletConnect}
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4154f1] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    Connect with MetaMask
                  </motion.button>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-sm text-gray-600 hover:text-[#4154f1] font-medium transition-colors"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>© 2025 PropChain Inc. All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;