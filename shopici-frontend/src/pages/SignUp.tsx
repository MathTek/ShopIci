import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
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

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signup successful! Check your email to confirm.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-50">
      <div className="card w-full max-w-md bg-white shadow-2xl rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">
          Create Account
        </h2>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
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

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Confirm Password</span>
            </label>
            <input
              type="password"
              placeholder="Confirm Password"
              className="input input-bordered w-full focus:ring-2 focus:ring-indigo-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2 transition-transform transform hover:scale-105"
          >
            Sign Up
          </button>

          {message && (
            <p className="text-center text-red-500 mt-2">{message}</p>
          )}
        </form>

        <p className="text-center text-sm mt-4 text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-500 font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
