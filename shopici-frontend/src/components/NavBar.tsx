import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const loadExistingAvatar = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;
    
          const { data, error } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", session.user.id)
            .single();
    
          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
            console.log("✅ Avatar existant chargé:", data.avatar_url);
          }
        } catch (err) {
          console.log("Pas d'avatar existant trouvé");
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
          setUser(data.session?.user ?? null);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });

        loadExistingAvatar();

        const handleClickOutside = (event) => {
          if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
            setIsMobileMenuOpen(false);
          }
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
          listener.subscription.unsubscribe();
          document.removeEventListener('click', handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate("/login");
    };

    return (
        <div className="navbar sticky top-0 z-50 bg-gray-900 border-b border-gray-700 shadow-lg">
           
            <div className="navbar-start">
                <div className="lg:hidden relative mobile-menu-container">
                    <button 
                        className="btn btn-ghost text-white hover:bg-gray-700 hover:text-yellow-300" 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Menu de navigation"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </button>
                    
                    {isMobileMenuOpen && (
                        <div className="absolute left-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50">
                            <div className="py-2">
                                <a 
                                    href="/" 
                                    className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    🏠 Accueil
                                </a>
                                <a 
                                    href="/about" 
                                    className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    ℹ️ À propos
                                </a>
                                <a 
                                    href="/contact" 
                                    className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    📞 Contact
                                </a>
                                <hr className="my-2 mx-4" />
                                <a 
                                    href="/search" 
                                    className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    🔍 Rechercher
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden lg:block">
                    <a
                        href="/"
                        className="btn btn-ghost text-2xl font-bold
                        text-white hover:text-yellow-300 hover:bg-gray-700
                        transition-all duration-200
                        flex items-center gap-2"
                    >
                        <span className="text-2xl">🛍️</span>
                        <span className="font-extrabold">ShopIci</span>
                    </a>
                </div>
            </div>

            <div className="navbar-center lg:hidden">
                <a
                    href="/"
                    className="btn btn-ghost text-xl font-bold
                    text-white hover:text-yellow-300 hover:bg-gray-700
                    transition-all duration-200
                    flex items-center gap-2"
                >
                    <span className="text-xl">🛍️</span>
                    <span className="font-extrabold">ShopIci</span>
                </a>
            </div>
           
            
            <div className="navbar-center hidden lg:flex">
                <ul className=" menu-horizontal px-1 gap-2">
                    <li>
                        <a href="/" className="text-gray-100 hover:bg-blue-600 hover:text-white hover:shadow-lg rounded-lg transition-all duration-200 font-medium px-4 py-2">
                            Home
                        </a>
                    </li>
                     <li>
                        <a href="/catalog" className="text-gray-100 hover:bg-blue-600 hover:text-white hover:shadow-lg rounded-lg transition-all duration-200 font-medium px-4 py-2">
                            Catalog
                        </a>
                    </li>
                    <li>
                        <a href="/about" className="text-gray-100 hover:bg-blue-600 hover:text-white hover:shadow-lg rounded-lg transition-all duration-200 font-medium px-4 py-2">
                            About
                        </a>
                    </li>
                    <li>
                        <a href="/contact" className="text-gray-100 hover:bg-blue-600 hover:text-white hover:shadow-lg rounded-lg transition-all duration-200 font-medium px-4 py-2">
                            Contact
                        </a>
                    </li>
                </ul>
            </div>
            
            <div className="navbar-end">
                <div className="form-control hidden xl:block mr-4">
                    <input 
                        type="text" 
                        placeholder="Rechercher des produits..." 
                        className="input input-bordered input-sm w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                </div>

                <div className="dropdown dropdown-end hidden sm:block mr-2">
                    <div 
                        tabIndex={0} 
                        role="button" 
                        className="btn btn-ghost btn-circle text-white hover:text-yellow-300 hover:bg-gray-700 transition-colors duration-200"
                    >
                        <div className="indicator">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
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
                            <span className="badge badge-primary badge-sm indicator-item">3</span>
                        </div>
                    </div>

                    <div
                        tabIndex={0}
                        className="card card-compact dropdown-content bg-white z-50 mt-3 w-64 shadow-xl border border-gray-200"
                    >
                        <div className="card-body">
                            <span className="text-lg font-bold text-gray-800">3 items</span>
                            <span className="text-gray-600">Total: 99€</span>
                            <div className="card-actions mt-4">
                                <button className="btn btn-primary btn-block">
                                    🛒 Show cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dropdown dropdown-end">
                    <div 
                        tabIndex={0} 
                        role="button" 
                        className="btn btn-ghost btn-circle avatar hover:bg-gray-700 transition-colors duration-200"
                    >
                        <div className="w-10 rounded-full ring-2 ring-gray-600 hover:ring-blue-400 transition-all duration-200">
                            <img
                                alt="Avatar utilisateur"
                                src={avatarUrl || "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"}
                                className="rounded-full w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-white rounded-lg z-50 mt-3 w-56 p-3 shadow-xl border border-gray-200"
                    >
                        <li>
                            <a 
                                href="/profile" 
                                className="hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-gray-700 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                My profile
                            </a>
                        </li>
                        <li>
                            <a 
                                href="/orders" 
                                className="hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-gray-700 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                My orders
                            </a>
                        </li>
                        <li>
                            <a 
                                href="/my-products" 
                                className="hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-gray-700 font-medium"
                            >
                                <svg  className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M20.337 3.664c.213.212.354.486.404.782.294 1.711.657 5.195-.906 6.76-1.77 1.768-8.485 5.517-10.611 6.683a.987.987 0 0 1-1.176-.173l-.882-.88-.877-.884a.988.988 0 0 1-.173-1.177c1.165-2.126 4.913-8.841 6.682-10.611 1.562-1.563 5.046-1.198 6.757-.904.296.05.57.191.782.404ZM5.407 7.576l4-.341-2.69 4.48-2.857-.334a.996.996 0 0 1-.565-1.694l2.112-2.111Zm11.357 7.02-.34 4-2.111 2.113a.996.996 0 0 1-1.69-.565l-.422-2.807 4.563-2.74Zm.84-6.21a1.99 1.99 0 1 1-3.98 0 1.99 1.99 0 0 1 3.98 0Z" clip-rule="evenodd"/>
                                </svg>                                
                                My products
                            </a>
                        </li>
                        <li>
                            <a 
                                href="/settings" 
                                className="hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-gray-700 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </a>
                        </li>
                        
                        <li className="sm:hidden">
                            <a 
                                href="/cart" 
                                className="hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-gray-700 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                  Cart
                                <span className="badge badge-primary badge-sm">3</span>
                            </a>
                        </li>

                        <div className="divider my-1"></div>
                        
                        {user ? (
                            <li>
                                <button 
                                    onClick={handleLogout} 
                                    className="hover:bg-red-600 hover:text-white bg-red-50 rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-red-700 font-medium border border-red-200 hover:border-red-600 hover:shadow-lg w-full"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
                                </button>
                            </li>
                        ) : (
                            <li>
                                <a 
                                    href="/login" 
                                    className="hover:bg-green-600 hover:text-white bg-green-50 rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-green-700 font-medium border border-green-200 hover:border-green-600 hover:shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Login
                                </a>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
