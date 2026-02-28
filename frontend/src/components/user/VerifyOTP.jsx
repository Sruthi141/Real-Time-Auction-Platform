import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Cookies from 'js-cookie';
import axios from 'axios';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Get email from location state (passed from Register page)
  const email = location.state?.email || '';
  const isSeller = location.state?.isSeller || false;
  const devOtp = location.state?.devOtp || null; // For development when email fails

  useEffect(() => {
    // If no email, redirect back to register
    if (!email) {
      navigate(isSeller ? '/sellerlogin' : '/register');
    }
  }, [email, navigate, isSeller]);

  useEffect(() => {
    // Countdown timer for resend OTP
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = isSeller 
        ? `${process.env.REACT_APP_BACKENDURL}/seller/verify/otp`
        : `${process.env.REACT_APP_BACKENDURL}/verify/otp`;

      const response = await axios.post(endpoint, {
        email,
        otp: otpString
      });

      if (response.data.message.includes('verified successfully')) {
        setSuccess('Email verified successfully!');
        
        // Set cookie and redirect
        if (isSeller && response.data.sellerId) {
          Cookies.set('seller', response.data.sellerId, { expires: 7 });
          setTimeout(() => navigate('/sellerhome'), 1500);
        } else if (response.data.userId) {
          Cookies.set('user', response.data.userId, { expires: 7 });
          setTimeout(() => navigate('/home'), 1500);
        } else {
          setTimeout(() => navigate(isSeller ? '/sellerlogin' : '/login'), 1500);
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      const endpoint = isSeller 
        ? `${process.env.REACT_APP_BACKENDURL}/seller/verify/resend-otp`
        : `${process.env.REACT_APP_BACKENDURL}/verify/resend-otp`;

      const response = await axios.post(endpoint, { email });
      
      if (response.data.message.includes('sent')) {
        setSuccess('New OTP sent to your email!');
        setCountdown(60); // 60 second cooldown
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>

        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-teal-600"
          >
            Verify Your Email
          </motion.h2>
          <p className="mt-2 text-gray-600">
            We've sent a 6-digit OTP to<br />
            <span className="font-medium text-gray-900">{email}</span>
          </p>
          {devOtp && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Email service unavailable.<br/>
                Your OTP is: <span className="font-mono font-bold text-lg">{devOtp}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <motion.input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none transition"
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-600 flex items-center justify-center"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </motion.p>
        )}

        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-green-600 flex items-center justify-center"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {success}
          </motion.p>
        )}

        <motion.button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition
            ${loading || otp.join('').length !== 6
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700'
            }`}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </motion.button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{' '}
            <button
              onClick={handleResendOTP}
              disabled={resendLoading || countdown > 0}
              className={`font-medium inline-flex items-center
                ${countdown > 0 || resendLoading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-teal-600 hover:text-teal-500'
                }`}
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend OTP'
              )}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
