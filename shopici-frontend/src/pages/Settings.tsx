import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface TwoFASettings {
  userId: string;
  isEnabled: boolean;
  createdAt: string;
}

const Settings = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }

        setUserId(user.id);

        // Check if user has 2FA settings
        const { data, error } = await supabase
          .from("user_2fa_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching 2FA settings:", error);
          return;
        }

        if (data) {
          setTwoFAEnabled(data.is_enabled);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleToggle2FA = async () => {
    setMessage("");
    const newState = !twoFAEnabled;

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("user_2fa_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("user_2fa_settings")
          .update({ is_enabled: newState })
          .eq("user_id", userId);

        if (error) {
          setMessage("Error updating 2FA settings");
          console.error(error);
          return;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from("user_2fa_settings")
          .insert([
            {
              user_id: userId,
              is_enabled: newState,
            },
          ]);

        if (error) {
          setMessage("Error creating 2FA settings");
          console.error(error);
          return;
        }
      }

      setTwoFAEnabled(newState);
      setMessage(newState ? "2FA enabled successfully" : "2FA disabled successfully");
    } catch (error) {
      console.error("Error:", error);
      setMessage("An unexpected error occurred");
    }
  };

  const handleLogout = async () => {
        await supabase.auth.signOut();
        // Clear 2FA authentication
        localStorage.removeItem('2fa_user_id');
        localStorage.removeItem('2fa_user_email');
        navigate("/login");
    };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a1f3a] to-[#0f172a] text-slate-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-cyan-400">⚙️</span>
            <span className="text-sm font-semibold text-cyan-400/80">ACCOUNT</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Settings</h1>
          <p className="text-white/60 text-lg">Manage your account security and preferences</p>
        </div>

        {message && (
          <div className={`mb-8 rounded-2xl p-4 border flex items-center gap-3 animate-fadeIn ${
            message.includes("success") 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-red-500/10 border-red-500/30"
          }`}>
            {message.includes("success") ? (
              <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className={message.includes("success") ? "text-emerald-300" : "text-red-300"}>{message}</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-3xl p-8 sm:p-10 transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex-shrink-0 mt-1">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Two-Factor Authentication</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {twoFAEnabled
                      ? "Your account is protected with two-factor authentication. You'll receive a verification code by email when signing in."
                      : "Add an extra layer of security to your account. Receive a verification code via email during sign-in."}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={twoFAEnabled}
                    onChange={handleToggle2FA}
                  />
                  <div className="w-14 h-8 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>

            {twoFAEnabled && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-300 text-sm">You'll need to verify your identity with a code sent to your registered email during each login.</span>
                </div>
              </div>
            )}
          </div>

          <div className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-3xl p-8 sm:p-10 transition-all duration-300">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Profile Management</h3>
                <p className="text-white/60 text-sm mb-4">Update your personal information, avatar, and profile details.</p>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <span>Go to Profile</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>


          <div className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 backdrop-blur-sm rounded-3xl p-8 sm:p-10 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/20 flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Sign Out</h3>
                <p className="text-white/60 text-sm">Sign out from your account and end your session.</p>
                <button onClick={() => {handleLogout()}} className="mt-4 px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all duration-200 border border-red-500/30 hover:border-red-500/50">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Settings;
