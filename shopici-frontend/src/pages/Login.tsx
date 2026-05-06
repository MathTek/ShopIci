import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [twoFACode, setTwoFACode] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [usesTwoFA, setUsesTwoFA] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      let currentEmail = email;
      let currentUserId = "";
      
      if (!email.includes("@")) {
        const { data: user, error: userError } = await supabase
          .from("profiles")
          .select("email, id")
          .eq("username", email)
          .single();

        if (userError || !user?.email) {
          setMessage("User not found");
          setIsLoading(false);
          return;
        }
        currentEmail = user.email;
        currentUserId = user.id;
      } else {
        const { data: user, error: userError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();

        if (userError || !user?.id) {
          setMessage("User not found");
          setIsLoading(false);
          return;
        }
        currentUserId = user.id;
      }

      const { data: twoFASettings, error: settingsError } = await supabase
        .from("user_2fa_settings")
        .select("is_enabled")
        .eq("user_id", currentUserId)
        .single();

      const isTwoFAEnabled = twoFASettings?.is_enabled ?? false;
      setUsesTwoFA(isTwoFAEnabled);
      setUserEmail(currentEmail);
      setUserId(currentUserId);

      if (isTwoFAEnabled) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const { error: insertError } = await supabase
          .from("user_2fa_codes")
          .insert([
            {
              user_id: currentUserId,
              code: code,
            },
          ]);

        if (insertError) {
          setMessage("Error generating code");
          return;
        }

        try {
          const { error: functionError } = await supabase.functions.invoke('send-2fa-code', {
            body: {
              email: currentEmail,
              code: code,
            },
          });

          if (functionError) {
            setMessage("Code generated but email sending failed. Code: " + code);
          } else {
            setMessage(`Code sent to ${currentEmail}`);
          }
        } catch (error) {
          setMessage("Code generated but email failed. Code: " + code);
        }
      } else {
        setMessage("Please enter your password");
      }

      setIsCodeSent(true);
      setEmail("");
    } catch (error) {
      setMessage("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMessage("");

    if (!twoFACode || twoFACode.length !== 6) {
      setMessage("Please enter a 6-digit code");
      return;
    }

    try {
      const { data: codeData, error: codeError } = await supabase
        .from("user_2fa_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("code", twoFACode)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (codeError || !codeData) {
        setMessage("Invalid or expired code");
        return;
      }

      await supabase
        .from("user_2fa_codes")
        .update({ is_used: true })
        .eq("id", codeData.id);

      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('create-auth-session', {
        body: {
          userId: userId,
        },
      });

      if (tokenError || !tokenData?.token) {
        setMessage("Could not create session");
        return;
      }

      const { data: session, error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: tokenData.token,
        type: "magiclink",
      });

      if (sessionError) {
        setMessage("Session verification failed");
        return;
      }

      setMessage("Login successful!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      setMessage("An error occurred during verification");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password,
      });

      if (signInError) {
        setMessage("Invalid password");
        setIsLoading(false);
        return;
      }

      setMessage("Login successful!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      setMessage("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-30"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-800/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-10">
          <div className="text-center mb-10">
            <div className="inline-block mb-5 p-3 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30">
              <div className="text-5xl">🛍️</div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">ShopIci</h1>
            <p className="text-slate-400 text-sm tracking-wide">Welcome back</p>
          </div>

          <form onSubmit={isCodeSent ? (usesTwoFA ? handle2FAVerification : handlePasswordLogin) : handleSendCode} className="space-y-6">
            {!isCodeSent ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3 tracking-wide">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 border border-slate-600/50 bg-slate-700/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-white placeholder:text-slate-500 hover:border-slate-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isCodeSent || isLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isCodeSent}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </>
            ) : usesTwoFA ? (
              <>
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-2 backdrop-blur-sm">
                  <p className="text-sm text-blue-300">
                    Verification code sent to <strong className="font-semibold">{userEmail}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3 tracking-wide">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-slate-600/50 bg-slate-700/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest font-mono hover:border-slate-600"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  Verify
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCodeSent(false);
                    setTwoFACode("");
                    setMessage("");
                  }}
                  className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all duration-300 border border-slate-600/50 hover:border-slate-600"
                >
                  Back
                </button>
              </>
            ) : (
              <>
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-2 backdrop-blur-sm">
                  <p className="text-sm text-blue-300">
                    Signing in to <strong className="font-semibold">{userEmail}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-3 tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-slate-600/50 bg-slate-700/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 text-white placeholder:text-slate-500 hover:border-slate-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCodeSent(false);
                    setPassword("");
                    setMessage("");
                  }}
                  className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-all duration-300 border border-slate-600/50 hover:border-slate-600"
                >
                  Back
                </button>
              </>
            )}

            {message && (
              <div className={`rounded-xl p-4 text-sm border backdrop-blur-sm ${
                message.includes("sent") || message.includes("successful") || message.includes("verified")
                  ? "bg-green-900/20 border-green-800/50 text-green-300"
                  : "bg-red-900/20 border-red-800/50 text-red-300"
              }`}>
                {message}
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
