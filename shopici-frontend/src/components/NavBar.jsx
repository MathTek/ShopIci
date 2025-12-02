import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate("/login");
    };
    
  return (
    <nav className="navbar sticky top-0 z-50  border-b border-gray-100 shadow-sm">
      <div className="flex-1">
        <a className="btn btn-ghost text-2xl font-semibold text-gray-900 hover:text-gray-700 transition-colors duration-200" href="/">
          🛍️ ShopIci
        </a>
      </div>

      <div className="flex justify-center flex-4 gap-4"> 


        <div className="">
          <a href="/" className="text-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200 inline-flex items-center gap-2 justify-start p-2">
            Accueil
          </a>
        </div>

        <div className="">
          <a href="/about" className="text-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200 inline-flex items-center gap-2 justify-start p-2">
            À propos
          </a>
        </div>

        <div className="">
          <a href="/contact" className="text-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200 inline-flex items-center gap-2 justify-start p-2">
            Contact
          </a>
        </div>
      </div>

      

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="form-control hidden md:block">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="input input-bordered input-sm w-auto bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400 focus:border-gray-300 focus:outline-none transition-colors duration-200" 
          />
        </div>

        {/* Shopping Cart */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-200">
            <div className="indicator">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 block"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="badge bg-gray-700 text-white badge-sm indicator-item">8</span>
            </div>
          </div>

          <div
            tabIndex={0}
            className="card card-compact dropdown-content bg-white z-50 mt-3 w-64 shadow-lg border border-gray-100"
          >
            <div className="card-body">
              <span className="text-lg font-semibold text-gray-800">8 Items</span>
              <span className="text-gray-600">Subtotal: $999</span>
              <div className="card-actions mt-4">
                <button className="btn bg-gray-800 text-white hover:bg-gray-700 btn-block transition-colors duration-200">
                  🛒 View Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 rounded-full ring-2 ring-gray-200 ring-offset-2 ring-offset-white">
              <img
                alt="User Avatar"
                src={user?.user_metadata?.avatar_url || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                className="rounded-full"
              />
            </div>
          </div>

          <ul
            tabIndex={-1}
            className="menu menu-sm dropdown-content bg-white rounded-lg z-50 mt-3 w-56 p-3 shadow-lg border border-gray-100"
          >
           
            <li>
              <a href="/profile" className="hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white hover:scale-105 hover:shadow-lg rounded-xl transition-all duration-300 inline-flex items-center gap-2 justify-start p-2 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
                <span className="badge badge-accent group-hover:badge-white transition-colors duration-300">View</span>
              </a>
            </li>
            <li>
              <a href="/orders" className="hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white hover:scale-105 hover:shadow-lg rounded-xl transition-all duration-300 inline-flex items-center gap-2 justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Orders
              </a>
            </li>
            <li>
              <a href="/settings" className="hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white hover:scale-105 hover:shadow-lg rounded-xl transition-all duration-300 inline-flex items-center gap-2 justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </a>
            </li>
            <div className="divider my-2"></div>
            {user ? (
              <li>
                <button onClick={handleLogout} className="inline-flex items-center justify-center gap-2 bg-red-500 rounded-xl text-center duration-300 px-3 py-2 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </li>
            ) : (
              <li>
                <a href="/login" className="inline-flex items-center justify-center gap-2 hover:btn-success hover:text-white rounded-xl transition-all duration-300 px-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
