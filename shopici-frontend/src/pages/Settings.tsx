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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/80">Manage your account security and preferences</p>
        </div>

        {/* Security Section */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 sm:p-10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Security</h2>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/20">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Two-Factor Authentication</h3>
              <p className="text-white/70 text-sm">
                {twoFAEnabled
                  ? "Two-factor authentication is enabled. You'll receive a verification code by email when you sign in."
                  : "Protect your account with two-factor authentication. You'll receive a verification code by email when you sign in."}
              </p>
            </div>
            <div className="form-control ml-4">
              <label className="cursor-pointer label">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-lg"
                  checked={twoFAEnabled}
                  onChange={handleToggle2FA}
                />
              </label>
            </div>
          </div>

          {twoFAEnabled && (
            <div className="alert alert-info rounded-xl mb-6 bg-blue-500/20 border border-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm">You will need to verify your identity with a code sent to your email during login.</span>
            </div>
          )}

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} rounded-xl mb-6`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                {message.includes("success") ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Account Section */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white mb-6">Account</h2>
          <p className="text-white/80 mb-4">
            Account customization is managed from your profile page.
          </p>
          <Link
            to="/profile"
            className="inline-block px-5 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Settings;
