import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

// Types
interface CredentialResult {
  email?: string;
  id?: string;
}

interface EmailResult {
  email: string;
}

const Login: React.FC = () => {
  const [cred, setCred] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const checkCredExists = async (cred: string): Promise<CredentialResult | null> => {
    if (cred.includes("@")) {
      return { email: cred };
    } else {
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cred)
        .single();

      if (userError) {
        console.error("Error fetching user id by username:", userError);
        return null;
      }

      return { id: user?.id };
    }
  };

  const findAssociatedEmail = async (credId: CredentialResult): Promise<EmailResult | null> => {
    if (credId?.email) {
      return { email: credId.email };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", credId.id)
      .single();

    if (error) {
      console.error("Error fetching email from profiles:", error);
      return null;
    }

    if (!data?.email) {
      console.error("No email found for user id:", credId.id);
      return null;
    }

    return { email: data.email };
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMessage("");

    try {
      const credResult = await checkCredExists(cred);
      if (!credResult) {
        setMessage("User not found");
        return;
      }

      const emailResult = await findAssociatedEmail(credResult);
      if (!emailResult) {
        setMessage("Email not found for this user");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailResult.email,
        password: password,
      });

      if (error) {
        setMessage(error.message);
      } else if (data?.user) {
        setMessage("Login successful!");
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("An unexpected error occurred");
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

        <form onSubmit={handleLogin} className="space-y-6">
        
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
              value={cred}
              onChange={(e) => setCred(e.target.value)}
              required
            />
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
              placeholder="Enter your password"
              className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="label">
              <Link to="/forgot-password" className="label-text-alt link link-hover text-primary">
                Forgot password?
              </Link>
            </label>
          </div>

         
          <button
            type="submit"
            className="btn-gradient w-full h-14 text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            
            Sign In
          </button>

          
          {message && (
            <div className={`alert ${message.includes("successful") ? "alert-success" : "alert-error"} animate-fade-in rounded-xl`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                {message.includes("successful") ? (
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
