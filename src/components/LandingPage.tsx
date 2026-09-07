import React, { useState } from 'react';
import { College, UserRole, User } from '../types/index.ts';
import { 
  GraduationCap, 
  ShieldAlert, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  Wrench, 
  MapPin, 
  Flame, 
  Crown, 
  Mail, 
  KeyRound, 
  Send,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface LandingPageProps {
  colleges: College[];
  onLogin: (role: UserRole, collegeId: string, email?: string) => void;
  onVerifiedLogin: (user: User) => void;
}

const DEMO_ACCOUNTS: Record<string, { name: string; email: string; role: UserRole }[]> = {
  col_engineering: [
    { name: 'Aarav Sharma (Student 1)', email: 'aarav.sharma@apex.edu', role: 'STUDENT' },
    { name: 'Sneha Roy (Student 2)', email: 'sneha.roy@apex.edu', role: 'STUDENT' },
    { name: 'Dr. S. K. Gupta (Dean Admin)', email: 'dean.eng@apex.edu', role: 'COLLEGE_ADMIN' },
  ],
  col_medical: [
    { name: 'Dr. Simran Kaur (Intern 1)', email: 'simran.kaur@apex.edu', role: 'STUDENT' },
    { name: 'Rohan Joshi (Student 2)', email: 'rohan.joshi@apex.edu', role: 'STUDENT' },
    { name: 'Dr. Alok Nath (Medical Supdt)', email: 'dean.med@apex.edu', role: 'COLLEGE_ADMIN' },
  ]
};

export default function LandingPage({ colleges, onLogin, onVerifiedLogin }: LandingPageProps) {
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(colleges[0]?.id || 'col_engineering');
  const [activeRole, setActiveRole] = useState<UserRole>('STUDENT');
  const [loginMode, setLoginMode] = useState<'PERSONAL_EMAIL' | 'QUICK_DEMO'>('PERSONAL_EMAIL');

  // Personal Email Verification States
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'ENTER_EMAIL' | 'ENTER_OTP'>('ENTER_EMAIL');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentCollege = colleges.find(c => c.id === selectedCollegeId) || colleges[0];
  const quickAccounts = DEMO_ACCOUNTS[selectedCollegeId] || [];

  // Step 1: Send OTP to personal email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSendingOtp(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setStep('ENTER_OTP');
        setInfoMessage(data.message || `Verification code dispatched to ${email}`);
      } else {
        setErrorMessage(data.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while requesting OTP: ' + err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setVerifyingOtp(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          collegeId: selectedCollegeId,
          role: activeRole,
          name: name.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onVerifiedLogin(data.user);
      } else {
        setErrorMessage(data.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to verify OTP: ' + err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldAlert size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">CampusResolve AI</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 size={10} /> Email Verification Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Institutional Governance, Multi-Student & OTP Verification</p>
          </div>
        </div>

        {/* Super Admin Quick Button */}
        <button
          onClick={() => onLogin('SUPER_ADMIN', selectedCollegeId, 'chancellor@apex.edu')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Crown size={15} className="text-black" />
          <span>Super Admin Window</span>
        </button>
      </header>

      {/* Hero & Authentication Card */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center flex-1">
        {/* Left Column: Platform Features */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Mail size={14} />
            <span>Secure Email OTP Authentication</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            Verify With Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-300 to-indigo-400">
              Personal Email Address
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
            Enter your personal email (Gmail, university ID, or domain email). We dispatch a 6-digit one-time password (OTP) directly to your inbox to authenticate your identity before filing or tracking campus grievances.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit mb-2">
                <Mail size={18} />
              </div>
              <h4 className="font-bold text-sm text-white">Inbox OTP Dispatch</h4>
              <p className="text-xs text-slate-400 mt-1">Direct 6-digit code delivered to your personal mailbox.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 w-fit mb-2">
                <GraduationCap size={18} />
              </div>
              <h4 className="font-bold text-sm text-white">Individual Student Profiles</h4>
              <p className="text-xs text-slate-400 mt-1">Multiple students can each maintain isolated complaint logs.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 w-fit mb-2">
                <UserCheck size={18} />
              </div>
              <h4 className="font-bold text-sm text-white">Admin Staff Panel</h4>
              <p className="text-xs text-slate-400 mt-1">Deans delegate work orders to least-loaded technicians.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5 bg-slate-800/85 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/50 space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound size={18} className="text-emerald-400" />
              <span>Email Verification Sign In</span>
            </h3>
            <p className="text-xs text-slate-400">Sign in with your personal email to verify your student or admin profile</p>
          </div>

          {/* Campus Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Selected Campus
            </label>
            <div className="grid grid-cols-2 gap-2">
              {colleges.map((col) => {
                const isSelected = selectedCollegeId === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedCollegeId(col.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                        : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs truncate">{col.name}</div>
                    <div className="text-[10px] font-mono text-indigo-300 mt-0.5">{col.code}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <button
              type="button"
              onClick={() => setLoginMode('PERSONAL_EMAIL')}
              className={`text-xs font-bold transition flex items-center gap-1.5 ${
                loginMode === 'PERSONAL_EMAIL'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 pb-1'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail size={13} />
              <span>Personal Email (OTP)</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('QUICK_DEMO')}
              className={`text-xs font-bold transition flex items-center gap-1.5 ${
                loginMode === 'QUICK_DEMO'
                  ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck size={13} />
              <span>Quick Demo Accounts</span>
            </button>
          </div>

          {/* Error & Info Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* MODE 1: Personal Email OTP Verification */}
          {loginMode === 'PERSONAL_EMAIL' ? (
            step === 'ENTER_EMAIL' ? (
              <form onSubmit={handleSendOTP} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Your Personal Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com or college email"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Your Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-500"
                  />
                </div>

                {/* Role Switch */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Sign In As
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRole('STUDENT')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        activeRole === 'STUDENT'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-900/60 text-slate-400 border-slate-700'
                      }`}
                    >
                      <GraduationCap size={14} />
                      <span>Student</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveRole('COLLEGE_ADMIN')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        activeRole === 'COLLEGE_ADMIN'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900/60 text-slate-400 border-slate-700'
                      }`}
                    >
                      <UserCheck size={14} />
                      <span>College Admin</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {sendingOtp ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Dispatching Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send 6-Digit OTP to My Email</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter OTP Form */
              <form onSubmit={handleVerifyOTP} className="space-y-4 animate-fade-in">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <KeyRound size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-white">Enter One-Time Password</h4>
                  <p className="text-xs text-slate-400">
                    We sent a 6-digit code to <strong className="text-emerald-300">{email}</strong>
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full py-3 px-4 text-center tracking-[8px] font-mono text-xl font-black rounded-xl border border-emerald-500/60 bg-slate-900 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:tracking-normal placeholder:text-slate-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('ENTER_EMAIL');
                      setErrorMessage(null);
                    }}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
                  >
                    Change Email
                  </button>

                  <button
                    type="submit"
                    disabled={verifyingOtp}
                    className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    {verifyingOtp ? (
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Verify & Enter Portal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* MODE 2: Quick Demo Accounts */
            <div className="space-y-2">
              <p className="text-xs text-slate-400 mb-1">Click any account below for instant demo login without typing:</p>
              {quickAccounts.map((acc) => {
                const isStudent = acc.role === 'STUDENT';
                return (
                  <div
                    key={acc.email}
                    onClick={() => onLogin(acc.role, selectedCollegeId, acc.email)}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/30 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isStudent ? 'bg-indigo-900/60 text-indigo-300' : 'bg-amber-900/60 text-amber-300'
                      }`}>
                        {isStudent ? <GraduationCap size={15} /> : <UserCheck size={15} />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white leading-snug">{acc.name}</div>
                        <div className="text-[10px] text-slate-400">{acc.email}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      isStudent 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {acc.role}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Chancellor Authority:</span>
            <button
              type="button"
              onClick={() => onLogin('SUPER_ADMIN', selectedCollegeId, 'chancellor@apex.edu')}
              className="text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <Crown size={12} /> Open Super Admin Window
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-800/80">
        <div>&copy; 2026 CampusResolve AI Multi-Campus Governance &bull; Verified via Personal Email OTP</div>
        <div>
          <a
            href="https://campusresolveaiv12.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-bold transition hover:underline"
          >
            Live: campusresolveaiv12.vercel.app &rarr;
          </a>
        </div>
      </footer>
    </div>
  );
}
