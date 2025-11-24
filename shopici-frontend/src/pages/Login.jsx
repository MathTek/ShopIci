import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Login successful!");
      navigate("/"); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-50">
      <div className="card w-full max-w-md bg-white shadow-2xl rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">Welcome Back</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Email</span>
            </label>
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered w-full focus:ring-2 focus:ring-indigo-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Password</span>
            </label>
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full focus:ring-2 focus:ring-indigo-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2 transition-transform transform hover:scale-105"
          >
            Login
          </button>

          {message && (
            <p className="text-center text-red-500 mt-2">{message}</p>
          )}
        </form>

        <p className="text-center text-sm mt-4 text-gray-500">
          Don’t have an account?{" "}
          <a href="/signup" className="text-indigo-500 font-semibold hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
