import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase, getUserId } from "../services/supabaseClient";
import { useCart } from "../contexts/CartContext";

const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const { totalItems } = useCart();

    const loadExistingAvatar = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;
          setUserId(session.user.id);

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

    useEffect(() => {
        if (!userId) return;
        const channel = supabase
                .channel('notifications')
                .on(
                'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`,
                    },
                    async (payload) => {
                        setNotifications((prev) => [payload.new, ...prev]);
                        const { count } = await supabase
                            .from('notifications')
                            .select('*', { count: 'exact', head: true })
                            .eq('is_read', false);
                        setUnreadCount(count ?? 0);
                    }
                )
                .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false);
            setUnreadCount(count ?? 0);
        };
        fetchUnreadCount();

        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            setNotifications(data ?? []);
        };

        fetchNotifications();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate("/login");
    };

    return (
        <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 shadow-lg w-full">
        <div className="flex items-center justify-between px-6 py-2">
            <div className="flex items-center gap-2">
                <button 
                    className="btn btn-ghost text-white hover:bg-gray-700 hover:text-yellow-300 lg:hidden" 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Menu de navigation"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                </button>
                <a href="/" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-yellow-300">
                    <span>🛍️</span>
                    <span className="font-extrabold">ShopIci</span>
                </a>
            </div>

            <div className="hidden lg:flex">
                <ul className="flex gap-4">
                    <li><a href="/" className="text-gray-100 hover:bg-blue-600 hover:text-white rounded-lg px-4 py-2">Home</a></li>
                    <li><a href="/products" className="text-gray-100 hover:bg-blue-600 hover:text-white rounded-lg px-4 py-2">Products</a></li>
                    <li><a href="/about" className="text-gray-100 hover:bg-blue-600 hover:text-white rounded-lg px-4 py-2">About</a></li>
                    <li><a href="/contact" className="text-gray-100 hover:bg-blue-600 hover:text-white rounded-lg px-4 py-2">Contact</a></li>
                </ul>
            </div>

            <div className="flex items-center gap-8">
                <div className="hidden xl:block">
                    <input 
                        type="text" 
                        placeholder="Rechercher des produits..." 
                        className="input input-bordered input-sm w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    />
                </div>
                <div className="indicator dropdown dropdown-end">
                    <div
                        tabIndex={0}
                        role="button"
                        className="relative group"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-7 w-7 text-white group-hover:text-yellow-300 drop-shadow-lg transition-colors duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 17h5l-1.405-1.405A2 2 0 0018 14V10a6 6 0 00-12 0v4a2 2 0 00-.595 1.595L5 17h5m5 0a2 2 0 100 4 2 2 0 000-4z"
                            />
                        </svg>
                        <span className="badge badge-primary badge-sm indicator-item  bg-gradient-to-r blue-500  text-white shadow-lg border-0">
                            {unreadCount}
                        </span>
                    </div>
                    <ul className="menu menu-sm dropdown-content bg-gray-100/95 backdrop-blur-md rounded-xl z-50 mt-3 p-3 shadow-xl border border-gray-300 min-w-[300px] animate-fade-in">
                    {notifications.filter(n => n.is_read === false).length === 0 ? (
                        <li className="text-center text-gray-500 py-8 italic tracking-wide">Aucune notification</li>
                    ) : (
                        notifications.filter(n => n.is_read === false).map((notification, idx, arr) => {
                            let icon, iconBg;
                            switch(notification.type) {
                                case 'Message':
                                    icon = (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
                                    );
                                    iconBg = 'bg-blue-100';
                                    break;
                                case 'Alerte':
                                    icon = (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
                                    );
                                    iconBg = 'bg-blue-200';
                                    break;
                                default:
                                    icon = (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2 2 0 0018 14V10a6 6 0 00-12 0v4a2 2 0 00-.595 1.595L5 17h5m5 0a2 2 0 100 4 2 2 0 000-4z" /></svg>
                                    );
                                    iconBg = 'bg-gray-200';
                            }
                            return (
                                <li key={notification.id}>
                                    <a href={`/conversations/${notification.conversation_id}`} className="flex items-center gap-4 p-4 text-gray-800 hover:bg-blue-100 hover:shadow-lg rounded-xl transition-all duration-200 group relative">
                                        <span className={`inline-block w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center shadow group-hover:scale-105 transition-transform duration-200`}>
                                            {icon}
                                        </span>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-semibold text-base truncate leading-tight">{notification.type}</span>
                                            <span className="text-xs text-gray-500 group-hover:text-gray-700 mt-1">{new Date(notification.created_at).toLocaleString()}</span>
                                        </div>
                                        <span className="absolute left-4 right-4 -bottom-2 h-px bg-gray-300" style={{display: idx === arr.length-1 ? 'none' : 'block'}}></span>
                                    </a>
                                </li>
                            );
                        })
                    )}
                    </ul>
                </div>

                <a href="/cart" className="btn btn-ghost btn-circle text-white mr-3 hidden lg:flex items-center cursor-pointer">
                    <div className="indicator">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full ">
                            <svg className="h-5 w-5 text-white-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h7.72a2 2 0 002-1.61L23 6H6" />
                            </svg>
                        </span>
                        {totalItems > 0 && (
                            <span className="badge badge-sm badge-primary indicator-item">{totalItems}</span>
                        )}
                    </div>
                </a>

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
                                href="/chat" 
                                className="hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-3 p-2 text-gray-700 font-medium"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Chat
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
                                    <span className="badge badge-primary badge-sm">{totalItems}</span>
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
        {/* Menu mobile */}
        {isMobileMenuOpen && (
            <div className="absolute left-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50">
                <div className="py-2">
                    <a href="/" className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors">🏠 Accueil</a>
                    <a href="/about" className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors">ℹ️ À propos</a>
                    <a href="/contact" className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors">📞 Contact</a>
                    <hr className="my-2 mx-4" />
                    <a href="/search" className="block px-4 py-3 text-gray-800 hover:bg-blue-600 hover:text-white font-medium transition-colors">🔍 Rechercher</a>
                </div>
            </div>
        )}
    </nav>
    );
};

export default Navbar;
