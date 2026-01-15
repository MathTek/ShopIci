import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [cred, setCred] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const checkCredExists = async (cred) => {
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

  const findAssociatedEmail = async (credId) => {
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

  const handleLogin = async (e) => {
    e.preventDefault();
    const credId = await checkCredExists(cred);

    if (!credId) {
      setMessage("User not found.");
      return;
    }

    const emailData = await findAssociatedEmail(credId);

    console.log("Email Data:", emailData.email);
    if (!emailData) {
      setMessage("Email not found.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: emailData.email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Login successful!");
      navigate("/"); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
   
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
              <a href="/forgot-password" className="label-text-alt link link-hover text-primary">
                Forgot password?
              </a>
            </label>
          </div>

 
          <button
            type="submit"
            className="btn-gradient w-full h-14 text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
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

        
        <div className="divider my-6 text-base-content/50">or</div>

 
        <div className="space-y-3">
          <button className="btn btn-outline w-full h-12 rounded-xl hover:btn-primary transition-all duration-300">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

       
        <div className="text-center mt-8 p-4 bg-base-200/30 rounded-xl">
          <p className="text-base-content/70">
            Don't have an account?{" "}
            <a href="/signup" className="text-primary font-semibold hover:text-secondary transition-colors duration-300">
              Create one now →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
