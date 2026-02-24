import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("customer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      console.log("User after signup:", user);
      console.log("Username, role:", username, role);

      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            [
              {
                id: user.id,
                username: username,
                role: role,
                email: email,
              },
            ],
            { onConflict: "id" }
          );

        if (profileError) {
          console.error("Profile upsert error:", profileError);
          setMessage(profileError.message || "Failed to create profile");
          return;
        }
      }

      setMessage("Signup successful! Check your email to confirm.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setMessage("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Overlay supprimé pour sobriété et cohérence */}
      <div className="card-gradient w-full max-w-lg rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-4xl font-bold text-gradient mb-2">Join ShopIci!</h2>
          <p className="text-base-content/70">Create your account to start shopping</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </span>
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Username
              </span>
            </label>
            <input
              type="text"
              placeholder="Choose a unique username"
              className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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
                placeholder="Create password"
                className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm
                </span>
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                className="input input-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2v0" />
                </svg>
                Account Type
              </span>
            </label>
            <select
              className="select select-bordered w-full bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80 transition-all duration-300 rounded-xl h-14"
              defaultValue="customer"
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="customer">🛒 Customer - Shop & Buy</option>
              <option value="seller">🏪 Seller - Sell Products</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-gradient w-full h-14 text-lg font-semibold rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            Create Account
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
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:text-secondary transition-colors duration-300">
              Sign in here →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
