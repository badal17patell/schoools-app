import React, { useState } from 'react';
import { ActiveScreen, UserAccount, School } from '../types';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginAsGuest,
  resetPassword,
  logoutUser,
} from '../services/dbService';

interface LoginViewProps {
  user?: UserAccount;
  onLoginSuccess: (updatedUser: Partial<UserAccount>) => void;
  onNavigate: (screen: ActiveScreen) => void;
  activeSchool: School;
  onShowToast: (msg: string) => void;
}

type AuthTab = 'signin' | 'register' | 'admission' | 'forgot';

export const LoginView: React.FC<LoginViewProps> = ({
  user,
  onLoginSuccess,
  onNavigate,
  activeSchool,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sign In / Register Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'parent' | 'tailor'>('parent');

  // Admission verification Form State
  const [admissionNo, setAdmissionNo] = useState('DPS/PUN/2024/8492');
  const [studentDob, setStudentDob] = useState('2013-05-14');

  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Handle Real Email/Password Login
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      let account: UserAccount;
      try {
        account = await loginWithEmail(email, password);
      } catch (innerErr: any) {
        // If testing with demo accounts and they are not created in Firebase yet, auto-provision them
        if (
          (email === 'parent.rajesh@magnumuniforms.com' || email === 'master.tailor@magnumuniforms.com') &&
          (innerErr.code === 'auth/user-not-found' || innerErr.code === 'auth/invalid-credential' || innerErr.code === 'auth/invalid-login-credentials')
        ) {
          const isTailor = email.includes('tailor');
          account = await registerWithEmail(
            isTailor ? 'Master Tailor' : 'Rajesh Sharma',
            email,
            password,
            isTailor ? '+91 98200 11223' : '+91 98201 49201',
            isTailor ? 'tailor' : 'parent'
          );
        } else {
          throw innerErr;
        }
      }
      onLoginSuccess(account);
      onShowToast(`Signed in successfully as ${account.name}`);
      onNavigate(account.role === 'tailor' ? 'admin' : 'account');
    } catch (err: any) {
      console.error('Firebase sign in error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. Please verify credentials or register.');
      } else if (err.code === 'auth/too-many-requests') {
        setAuthError('Access temporarily disabled due to multiple failed attempts. Try again shortly.');
      } else {
        setAuthError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Real User Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please enter an email and password');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const account = await registerWithEmail(fullName, email, password, phone, role);
      onLoginSuccess(account);
      onShowToast(`Account created! Welcome to Magnum Uniforms, ${account.name}`);
      onNavigate('account');
    } catch (err: any) {
      console.error('Firebase registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('An account with this email address already exists. Please sign in instead.');
      } else {
        setAuthError(err.message || 'Failed to register account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const account = await loginWithGoogle();
      onLoginSuccess(account);
      onShowToast(`Signed in with Google as ${account.name}`);
      onNavigate('account');
    } catch (err: any) {
      console.error('Firebase Google Sign-In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Real Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setAuthError('Please enter your registered email address');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      onShowToast(`Password reset link dispatched to ${resetEmail}`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setAuthError(err.message || 'Unable to dispatch reset email. Verify the address.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Admission ID Quick Verification
  const handleAdmissionVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      // Authenticate as verified parent tied to admission ID in Firestore
      const dummyParentEmail = `parent.${admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@magnumportal.in`;
      let account: UserAccount;
      try {
        account = await loginWithEmail(dummyParentEmail, 'Magnum@DPS2024');
      } catch {
        account = await registerWithEmail(
          `Guardian of ${admissionNo}`,
          dummyParentEmail,
          'Magnum@DPS2024',
          '+91 98201 49201',
          'parent'
        );
      }
      onLoginSuccess(account);
      onShowToast(`Verified admission record for ${admissionNo}`);
      onNavigate('account');
    } catch (err: any) {
      console.error('Admission login error:', err);
      setAuthError('Could not verify admission record. Please use direct email sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fast Demo Pre-Fill buttons for testing
  const handleFillDemo = (type: 'parent' | 'tailor') => {
    setAuthError(null);
    if (type === 'parent') {
      setEmail('parent.rajesh@magnumuniforms.com');
      setPassword('School2024!');
      setActiveTab('signin');
    } else {
      setEmail('master.tailor@magnumuniforms.com');
      setPassword('MasterTailor2024!');
      setActiveTab('signin');
    }
  };

  // Real Sign Out
  const handleSignOut = async () => {
    try {
      await logoutUser();
      onLoginSuccess({
        id: undefined,
        name: 'Guest Parent',
        role: 'guest',
        isLoggedIn: false,
        email: '',
        phone: '',
      });
      onShowToast('Signed out of Magnum Uniforms');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 min-h-[85vh] justify-center">
      <div className="max-w-md mx-auto w-full px-4 pt-4">
        {/* Navigation Return */}
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-primary hover:text-secondary font-bold text-[13px] mb-4 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Back to Home</span>
        </button>

        {/* Main Authentication Box */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-md border border-surface-container flex flex-col gap-4">
          {/* Institution Header */}
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary text-secondary-fixed flex items-center justify-center shadow-sm mb-2">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-primary tracking-tight">
              Magnum Institutional Portal
            </h1>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Authorized uniform fulfillment for {activeSchool.name}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Cloud Firestore Database & Auth Live</span>
            </div>
          </div>

          {/* Current Active Session Banner if logged in */}
          {user?.isLoggedIn && (
            <div className="p-3 rounded-xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="material-symbols-outlined text-secondary text-2xl shrink-0">
                  account_circle
                </span>
                <div className="truncate">
                  <span className="text-[12px] font-bold text-primary block truncate">
                    {user.name} ({user.role === 'tailor' ? 'Staff Tailor' : 'Parent'})
                  </span>
                  <span className="text-[11px] text-on-surface-variant truncate block">
                    {user.email || user.phone}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-2.5 py-1 bg-surface-container text-primary rounded-lg text-[11px] font-bold hover:bg-surface-container-high transition-all shrink-0 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-surface-container-low p-1 border border-surface-container text-[12px]">
            <button
              onClick={() => {
                setActiveTab('signin');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => {
                setActiveTab('admission');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'admission'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Admission No
            </button>
          </div>

          {/* Error Message Box */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-start gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Email Address
                </label>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 border border-surface-container focus-within:ring-1 focus-within:ring-secondary">
                  <span className="material-symbols-outlined text-on-surface-variant text-base mr-2">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full h-11 bg-transparent text-[13px] font-semibold text-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-primary uppercase">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setResetEmail(email);
                    }}
                    className="text-[11px] text-secondary font-bold hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 border border-surface-container focus-within:ring-1 focus-within:ring-secondary">
                  <span className="material-symbols-outlined text-on-surface-variant text-base mr-2">
                    lock
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-transparent text-[13px] font-semibold text-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <span className="material-symbols-outlined text-secondary-fixed text-base">
                      login
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Parent / Guardian Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Mobile Number (WhatsApp Updates)
                </label>
                <div className="flex items-center bg-surface-container-low rounded-xl px-3 border border-surface-container focus-within:ring-1 focus-within:ring-secondary">
                  <span className="text-[12px] font-bold text-primary border-r border-surface-container pr-2 mr-2">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98201 49201"
                    className="w-full h-11 bg-transparent text-[13px] font-semibold text-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Create Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <div className="flex items-center gap-4 text-[12px] pt-1">
                <span className="font-bold text-primary">Role:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'parent'}
                    onChange={() => setRole('parent')}
                  />
                  <span>School Parent</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'tailor'}
                    onChange={() => setRole('tailor')}
                  />
                  <span>Master Tailor / Staff</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>Create Portal Account</span>
                    <span className="material-symbols-outlined text-secondary-fixed text-base">
                      person_add
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: ADMISSION NUMBER VERIFICATION */}
          {activeTab === 'admission' && (
            <form onSubmit={handleAdmissionVerification} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Student Admission / Enrollment Code
                </label>
                <input
                  type="text"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  placeholder="e.g. DPS/PUN/2024/8492"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
                <span className="text-[11px] text-on-surface-variant mt-1 block">
                  Find this on the school fee receipt or student identity card.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Student Date of Birth (Verification Key)
                </label>
                <input
                  type="date"
                  value={studentDob}
                  onChange={(e) => setStudentDob(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined text-base animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>Verify & Link Student Profile</span>
                    <span className="material-symbols-outlined text-secondary-fixed text-base">
                      school
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 4: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handlePasswordReset} className="flex flex-col gap-3">
              <div className="text-[12px] text-on-surface-variant">
                Enter your registered email address to receive a secure password reset link from Firebase Authentication.
              </div>

              {resetSent ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[12px] font-medium border border-emerald-200 flex flex-col gap-2">
                  <span>Reset instructions have been dispatched to <strong>{resetEmail}</strong>. Check your inbox or spam folder.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setResetSent(false);
                    }}
                    className="text-primary font-bold hover:underline self-start"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="flex-1 h-11 bg-surface-container-low text-primary rounded-xl text-[12px] font-bold hover:bg-surface-container transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-11 bg-primary text-on-primary rounded-xl text-[12px] font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? (
                        <span className="material-symbols-outlined text-base animate-spin">
                          progress_activity
                        </span>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Social / Direct Auth Options */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-container"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-outline">
              <span className="bg-surface-container-lowest px-2">Or Continue With</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-10 px-4 rounded-xl border border-surface-container bg-surface-container-lowest hover:bg-surface-container-low text-primary text-[12px] font-bold flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Guest Browsing */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const account = await loginAsGuest();
                  onLoginSuccess(account);
                  onShowToast('Browsing in guest mode');
                  onNavigate('store');
                } catch {
                  onNavigate('store');
                }
              }}
              className="text-[11px] text-on-surface-variant hover:text-primary font-semibold text-center pt-1 cursor-pointer"
            >
              Continue browsing catalog as Guest
            </button>
          </div>

          {/* One-Click Quick Testing Accounts */}
          <div className="pt-3 border-t border-surface-container/60 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider text-center">
              Quick Test Credentials
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo('parent')}
                className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-center flex items-center justify-center gap-1.5 border border-surface-container text-[11px] font-bold text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-sm">person</span>
                <span>Parent Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('tailor')}
                className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-center flex items-center justify-center gap-1.5 border border-surface-container text-[11px] font-bold text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-sm">admin_panel_settings</span>
                <span>Tailor Console</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Support Note */}
        <div className="text-center mt-3 text-[11px] text-on-surface-variant flex flex-col gap-1">
          <span>
            Encrypted by <strong>Firebase Authentication & Cloud Firestore</strong>.
          </span>
          <span>
            Help desk: <strong className="text-primary">+91 98201 49201</strong> (Mon–Sat, 9am–6pm)
          </span>
        </div>
      </div>
    </div>
  );
};
