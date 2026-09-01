import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertTriangle, Key, Mail, Lock, LogIn } from 'lucide-react';

interface LoginProps {
  currentClientId?: string;
  onUpdateClientId?: (newId: string) => void;
}

export const Login: React.FC<LoginProps> = ({ currentClientId = '', onUpdateClientId }) => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputClientId, setInputClientId] = useState(currentClientId);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err: any) {
      console.error('Google OAuth Login error:', err);
      setError(
        err.message ||
          'Google Login failed: The backend could not verify the token.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.warn('Google OAuth login error or popup closed.');
    setError(
      'Google OAuth Error: Client ID is invalid or origin is not authorized for http://localhost:3000.'
    );
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(undefined, {
        id: 'demo-user-101',
        email: emailInput.trim() || 'alex.intern@reachinbox.ai',
        name: emailInput.trim() ? emailInput.split('@')[0] : 'Oliver Brown',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateClientId) {
      onUpdateClientId(inputClientId);
      setShowConfigModal(false);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between items-center px-4 py-8 relative font-['Inter',sans-serif]">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 px-4">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-2xl text-slate-900 tracking-tight font-['Outfit']">
            ONE<span className="text-[#00A651]">.</span>
          </span>
        </div>

        <button
          onClick={() => setShowConfigModal(!showConfigModal)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
        >
          <Key className="w-3.5 h-3.5 text-slate-500" />
          <span>OAuth Config</span>
        </button>
      </header>

      {/* Center Card */}
      <main className="w-full max-w-md my-auto">
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-6 font-['Outfit']">
            Login
          </h1>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Google OAuth Login Button */}
          <div className="w-full flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              shape="pill"
              width="340"
            />
          </div>

          <div className="flex items-center w-full my-5">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-[11px] text-slate-400 font-medium lowercase">
              or sign up through email
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Email & Password Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDemoLogin();
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="email"
                placeholder="Email ID"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F3F4F6] border border-transparent text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A651] focus:outline-none transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F3F4F6] border border-transparent text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A651] focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00A651] hover:bg-[#009247] text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Intern Demo Fast Access CTA */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#00A651] text-xs font-semibold border border-emerald-200 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fast 1-Click Evaluation Login</span>
            </button>
          </div>
        </div>
      </main>

      {/* OAuth Config Drawer/Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
                <Key className="w-4 h-4 text-[#00A651]" />
                <span>Google OAuth Client ID</span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveClientId} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Client ID (.apps.googleusercontent.com)
                </label>
                <input
                  type="text"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  placeholder="50562516469-a6oelj1gtns22nmtgd2m02fgpuhqdp78.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#00A651]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00A651] hover:bg-[#009247] text-white text-xs font-semibold shadow"
                >
                  Save Client ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400">
        © 2026 ONE · ReachInbox Email Job Scheduler Engine
      </footer>
    </div>
  );
};


