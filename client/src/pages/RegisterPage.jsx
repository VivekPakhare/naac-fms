import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyOtp, resendOtp } from '../services/api';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Building2, Briefcase, BookOpen, AlertCircle, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // ── Form state ────────────────────────────────────────────
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    designation: '',
    subjects_taught: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── OTP verification state ────────────────────────────────
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef(null);

  // ── Resend cooldown timer ─────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus OTP input when switching to verify step
  useEffect(() => {
    if (step === 'verify' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = form;
      const result = await register(submitData);

      if (result?.requiresVerification) {
        setVerifyEmail(result.email);
        setStep('verify');
        setResendCooldown(60);
        toast.success('Registration successful! Check your email for the verification code.');
      } else {
        // Already verified (fallback)
        toast.success(`Welcome, ${result.fullName}! Account created successfully.`);
        navigate('/dashboard/teacher', { replace: true });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setVerifyError('');

    if (!otp || otp.length !== 6) {
      setVerifyError('Please enter the 6-digit code.');
      return;
    }

    setVerifyLoading(true);

    try {
      const res = await verifyOtp({ email: verifyEmail, otp });
      const { user, token } = res.data.data;

      // Store auth and redirect
      localStorage.setItem('naac_token', token);
      toast.success(`Welcome, ${user.fullName}! Email verified successfully.`);
      // Reload to pick up auth state
      window.location.href = '/dashboard/teacher';
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed. Please try again.';
      setVerifyError(message);
      toast.error(message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendOtp({ email: verifyEmail });
      setResendCooldown(60);
      toast.success('A new verification code has been sent to your email.');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend code.';
      toast.error(message);
    }
  };

  // ── OTP Verification View ────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex">
        {/* Left — Branding Panel */}
        <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 items-center justify-center p-12">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl tracking-tight">college accreditation & document workflow platform</h2>
                <p className="text-emerald-300 text-xs">Email Verification</p>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Almost<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                There!
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              We've sent a verification code to your email address. 
              Enter the 6-digit code to complete your registration.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <span>Secure email verification</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <span>Code expires in 15 minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — OTP Verification Form */}
        <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
          <div className="w-full max-w-md">
            <button
              onClick={() => { setStep('register'); setOtp(''); setVerifyError(''); }}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Registration
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
            <p className="text-slate-400 mb-8">
              We sent a 6-digit code to{' '}
              <span className="text-emerald-400 font-medium">{verifyEmail}</span>
            </p>

            {verifyError && (
              <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label htmlFor="otp-input" className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    ref={otpInputRef}
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifyLoading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
              >
                {verifyLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Verify Email
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform duration-500'}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form View ────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 items-center justify-center p-12">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl tracking-tight">college accreditation & document workflow platform</h2>
              <p className="text-emerald-300 text-xs">Teacher Registration</p>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Join Your<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              College Team
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Create your teacher account to start submitting NAAC documentation 
            for your department's accreditation process.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Submit forms for 20+ sub-criteria</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Upload supporting documents securely</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Track submission status and feedback</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Registration Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Back to login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <h2 className="text-2xl font-bold text-white mb-2">Create Teacher Account</h2>
          <p className="text-slate-400 mb-8">Fill in your details to get started.</p>

          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row: Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="reg-name"
                    name="full_name"
                    type="text"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Prof. John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@college.edu"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row: Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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

              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="reg-confirm"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row: Department + Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="reg-dept" className="block text-sm font-medium text-slate-300 mb-2">
                  Department
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="reg-dept"
                    name="department"
                    type="text"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-desig" className="block text-sm font-medium text-slate-300 mb-2">
                  Designation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="reg-desig"
                    name="designation"
                    type="text"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="e.g. Assistant Professor"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Subjects */}
            <div>
              <label htmlFor="reg-subjects" className="block text-sm font-medium text-slate-300 mb-2">
                Subjects Taught
              </label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                <textarea
                  id="reg-subjects"
                  name="subjects_taught"
                  rows={3}
                  value={form.subjects_taught}
                  onChange={handleChange}
                  placeholder="e.g. Data Structures, Algorithms, DBMS"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

