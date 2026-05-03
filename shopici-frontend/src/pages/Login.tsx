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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="card-gradient w-full max-w-md rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="text-4xl font-bold text-gradient mb-2">Welcome Back!</h2>
          <p className="text-base-content/70">Sign in to continue your shopping journey</p>
        </div>

        <form onSubmit={isCodeSent ? (usesTwoFA ? handle2FAVerification : handlePasswordLogin) : handleSendCode} className="space-y-6">
          {!isCodeSent ? (
            <>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Email or Username
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your email or username"
                  className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isCodeSent || isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || isCodeSent}
                className="btn-gradient w-full h-14 text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : isCodeSent ? (
                  "✓ Code Sent"
                ) : (
                  "Continue"
                )}
              </button>
            </>
          ) : usesTwoFA ? (
            <>
              <div className="space-y-3 text-center mb-6">
                <div className="inline-block p-3 bg-primary/20 rounded-full mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Verify Your Identity</h3>
                <p className="text-base-content/70">
                  We've sent a 6-digit code to <strong>{userEmail}</strong>
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Verification Code (6 digits)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14 text-center text-2xl tracking-widest font-mono"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-gradient w-full h-14 text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Verify Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCodeSent(false);
                  setTwoFACode("");
                  setMessage("");
                }}
                className="btn btn-ghost w-full h-12 rounded-xl"
              >
                ← Try Different Email
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3 text-center mb-6">
                <div className="inline-block p-3 bg-primary/20 rounded-full mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Sign In</h3>
                <p className="text-base-content/70">
                  Enter your password for <strong>{userEmail}</strong>
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Password
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-gradient w-full h-14 text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="btn btn-ghost w-full h-12 rounded-xl"
              >
                ← Try Different Email
              </button>
            </>
          )}

          {message && (
            <div className={`alert ${message.includes("sent") || message.includes("successful") || message.includes("verified") ? "alert-success" : "alert-error"} animate-fade-in rounded-xl`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                {message.includes("sent") || message.includes("successful") || message.includes("verified") ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span>{message}</span>
            </div>
          )}
        </form>

        <div className="text-center mt-8 p-4 bg-base-200/30 rounded-xl">
          <p className="text-base-content/70">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:text-secondary transition-colors duration-300">
              Create one now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
