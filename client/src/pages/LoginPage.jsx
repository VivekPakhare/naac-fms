import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { forgotPassword, resetPassword } from '../services/api';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Login form state ──────────────────────────────────────
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Forgot password state ─────────────────────────────────
  // Steps: 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset' | 'forgot-success'
  const [fpStep, setFpStep] = useState('login');
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpShowPassword, setFpShowPassword] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const otpInputRef = useRef(null);

  // Focus OTP input when switching to OTP step
  useEffect(() => {
    if (fpStep === 'forgot-otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [fpStep]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.fullName}!`);

      // Role-aware redirect
      if (user.role === 'hod') {
        navigate('/dashboard/hod', { replace: true });
      } else {
        navigate('/dashboard/teacher', { replace: true });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password: Step 1 — Submit email ───────────────
  const handleForgotEmail = async (e) => {
    e.preventDefault();
    setFpError('');

    if (!fpEmail) {
      setFpError('Please enter your email address.');
      return;
    }

    setFpLoading(true);

    try {
      await forgotPassword({ email: fpEmail });
      setFpStep('forgot-otp');
      toast.success('If an account exists, a reset code has been sent.');
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      setFpError(message);
    } finally {
      setFpLoading(false);
    }
  };

  // ── Forgot Password: Step 2 — Submit OTP ─────────────────
  const handleForgotOtp = async (e) => {
    e.preventDefault();
    setFpError('');

    if (!fpOtp || fpOtp.length !== 6) {
      setFpError('Please enter the 6-digit reset code.');
      return;
    }

    // Just advance to password step — we verify OTP with the password reset call
    setFpStep('forgot-reset');
  };

  // ── Forgot Password: Step 3 — Submit new password ────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFpError('');

    if (fpNewPassword.length < 6) {
      setFpError('Password must be at least 6 characters.');
      return;
    }

    if (fpNewPassword !== fpConfirmPassword) {
      setFpError('Passwords do not match.');
      return;
    }

    setFpLoading(true);

    try {
      await resetPassword({ email: fpEmail, otp: fpOtp, new_password: fpNewPassword });
      setFpStep('forgot-success');
      toast.success('Password reset successfully!');
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed. Please try again.';
      setFpError(message);
      // If OTP was invalid/expired, go back to OTP step
      if (message.toLowerCase().includes('code') || message.toLowerCase().includes('otp')) {
        setFpStep('forgot-otp');
        setFpOtp('');
      }
    } finally {
      setFpLoading(false);
    }
  };

  const resetForgotState = () => {
    setFpStep('login');
    setFpEmail('');
    setFpOtp('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpShowPassword(false);
    setFpError('');
  };

  // ── Forgot Password Views ────────────────────────────────
  if (fpStep !== 'login') {
    return (
      <div className="min-h-screen flex">
        {/* Left — Branding Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 items-center justify-center p-12">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <span className="text-white font-bold text-[10px] tracking-wide leading-none">CAD-WP</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl tracking-tight">college accreditation & document workflow platform</h2>
                <p className="text-indigo-300 text-xs">Password Recovery</p>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Reset Your<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Password
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Don't worry! We'll help you regain access to your account 
              through a secure verification process.
            </p>

            {/* Progress indicator */}
            <div className="mt-10 flex items-center gap-3">
              {['Email', 'Code', 'Password'].map((label, i) => {
                const stepIndex = i;
                const currentIndex = fpStep === 'forgot-email' ? 0 : fpStep === 'forgot-otp' ? 1 : fpStep === 'forgot-reset' ? 2 : 3;
                const isActive = stepIndex === currentIndex;
                const isComplete = stepIndex < currentIndex;

                return (
                  <div key={label} className="flex items-center gap-3">
                    {i > 0 && (
                      <div className={`w-8 h-px ${isComplete ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isComplete ? 'bg-indigo-500 text-white' :
                        isActive ? 'bg-indigo-500/20 border-2 border-indigo-400 text-indigo-400' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {isComplete ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm ${isActive || isComplete ? 'text-slate-300' : 'text-slate-600'}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Forgot Password Steps */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
          <div className="w-full max-w-md">
            <button
              onClick={resetForgotState}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>

            {/* ── Step: Enter Email ───────────────────────── */}
            {fpStep === 'forgot-email' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-indigo-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                <p className="text-slate-400 mb-8">Enter your email and we'll send you a reset code.</p>

                {fpError && (
                  <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{fpError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotEmail} className="space-y-5">
                  <div>
                    <label htmlFor="fp-email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        id="fp-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={fpEmail}
                        onChange={(e) => { setFpEmail(e.target.value); setFpError(''); }}
                        placeholder="your.email@college.edu"
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={fpLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                  >
                    {fpLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send Reset Code
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ── Step: Enter OTP ─────────────────────────── */}
            {fpStep === 'forgot-otp' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Enter Reset Code</h2>
                <p className="text-slate-400 mb-8">
                  We sent a 6-digit code to{' '}
                  <span className="text-indigo-400 font-medium">{fpEmail}</span>
                </p>

                {fpError && (
                  <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{fpError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotOtp} className="space-y-5">
                  <div>
                    <label htmlFor="fp-otp" className="block text-sm font-medium text-slate-300 mb-2">
                      Reset Code
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        ref={otpInputRef}
                        id="fp-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={fpOtp}
                        onChange={(e) => { setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setFpError(''); }}
                        placeholder="000000"
                        className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={fpOtp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                  >
                    <KeyRound className="w-5 h-5" />
                    Verify Code
                  </button>
                </form>
              </>
            )}

            {/* ── Step: New Password ──────────────────────── */}
            {fpStep === 'forgot-reset' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                  <KeyRound className="w-8 h-8 text-indigo-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
                <p className="text-slate-400 mb-8">Choose a strong password for your account.</p>

                {fpError && (
                  <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{fpError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label htmlFor="fp-newpass" className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        id="fp-newpass"
                        type={fpShowPassword ? 'text' : 'password'}
                        required
                        value={fpNewPassword}
                        onChange={(e) => { setFpNewPassword(e.target.value); setFpError(''); }}
                        placeholder="Min 6 characters"
                        className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setFpShowPassword(!fpShowPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={fpShowPassword ? 'Hide password' : 'Show password'}
                      >
                        {fpShowPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fp-confirm" className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        id="fp-confirm"
                        type={fpShowPassword ? 'text' : 'password'}
                        required
                        value={fpConfirmPassword}
                        onChange={(e) => { setFpConfirmPassword(e.target.value); setFpError(''); }}
                        placeholder="Re-enter password"
                        className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={fpLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                  >
                    {fpLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-5 h-5" />
                        Reset Password
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ── Step: Success ───────────────────────────── */}
            {fpStep === 'forgot-success' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                <p className="text-slate-400 mb-8">
                  Your password has been successfully changed. You can now login with your new password.
                </p>

                <button
                  onClick={resetForgotState}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 transition-all shadow-lg shadow-indigo-500/25"
                >
                  <LogIn className="w-5 h-5" />
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Login Form View ────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-[10px] tracking-wide leading-none">CAD-WP</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl tracking-tight">college accreditation & document workflow platform</h2>
              <p className="text-indigo-300 text-xs">File Management System</p>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Manage Your<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Accreditation Files
            </span><br />
            Digitally.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            A streamlined portal for Indian colleges to manage NAAC documentation — 
            7 criteria, 20+ sub-criteria, and 34+ required documents in one place.
          </p>

          <div className="mt-10 flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">7</div>
              <div className="text-xs text-slate-500 mt-1">Criteria</div>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">20+</div>
              <div className="text-xs text-slate-500 mt-1">Sub-Criteria</div>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">34+</div>
              <div className="text-xs text-slate-500 mt-1">Documents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-[9px] tracking-wide leading-none">CAD-WP</span>
            </div>
            <h2 className="text-white font-bold text-lg">college accreditation & document workflow platform</h2>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 mb-8">Enter your credentials to access your dashboard.</p>

          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your.email@college.edu"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setFpStep('forgot-email')}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Register as Teacher
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>HOD:</span>
                <span className="font-mono text-slate-300">hod@naac.edu / HOD@2024</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Teacher:</span>
                <span className="font-mono text-slate-300">anita.sharma@naac.edu / Teacher@123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

