import { supabase } from "../services/supabaseClient";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [username, setUsername] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const products = [
    {
      id: 1,
      name: "Smartphone Pro Max",
      price: 899.99,
      originalPrice: 1199.99,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      category: "Electronics",
      discount: 25
    },
    {
      id: 2,
      name: "Wireless Headphones",
      price: 129.99,
      originalPrice: 199.99,
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      category: "Audio",
      discount: 35
    },
    {
      id: 3,
      name: "Gaming Laptop",
      price: 1299.99,
      originalPrice: 1699.99,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      category: "Computers",
      discount: 20
    },
    {
      id: 4,
      name: "Smart Watch",
      price: 249.99,
      originalPrice: 329.99,
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      category: "Wearables",
      discount: 24
    },
    {
      id: 5,
      name: "Digital Camera",
      price: 599.99,
      originalPrice: 799.99,
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop",
      category: "Photography",
      discount: 25
    },
    {
      id: 6,
      name: "Bluetooth Speaker",
      price: 79.99,
      originalPrice: 119.99,
      rating: 4.4,
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
      category: "Audio",
      discount: 33
    }
  ];

  const itemsPerSlide = {
    mobile: 1,
    tablet: 2,
    desktop: 4
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(products.length / itemsPerSlide.desktop));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(products.length / itemsPerSlide.desktop)) % Math.ceil(products.length / itemsPerSlide.desktop));
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

 useEffect(() => {

  const getUsername = async () => {
    try {
      console.log("Getting session...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        return;
      }

      console.log("Session data:", sessionData);
      const user = sessionData?.session?.user;
      console.log("Session user:", user);
      
      if (user) {
        console.log("User found:", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching username:", error);
          return;
        }

        console.log("Fetched username:", data?.username);
        if (data?.username) setUsername(data.username);
      }
    } catch (err) {
      console.error("Unexpected error in getUsername:", err);
    }
  }
    console.log("Fetching username...");
    getUsername().catch((err) => console.error("getUsername failed:", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

     
      <div className="hero-section px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
         
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-white">
              Welcome to{" "}
              <span className="text-gradient floating-animation inline-block">
                ShopIci
              </span>
              {username && (
                <div className="text-4xl md:text-5xl mt-4 text-white/90">
                  Hello, <span className="text-gradient">{username}</span>! 🎉
                </div>
              )}
            </h1>
          </div>

          <div className="animate-slide-up">
            <p className="text-xl md:text-2xl mb-12 text-white/80 max-w-3xl mx-auto leading-relaxed">
              Discover amazing products at unbeatable prices. Your one-stop destination for everything you need and more! ✨
            </p>
          </div>


          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <button
              className="btn-gradient text-lg px-8 py-4 hover:shadow-2xl transform hover:scale-110 transition-all duration-500 rounded-2xl"
              onClick={() => {
                navigate("/products");
              }}
            >
              🛒 Start Shopping
            </button>
            <button className="btn btn-outline btn-lg px-8 py-4 rounded-2xl hover:btn-secondary transition-all duration-300"
            onClick={() => {
              navigate("/about");
            }}>
              📖 Learn More
            </button>
          </div>

        </div>
      </div>

      

      
      <div className="fixed bottom-8 right-8 z-50">
        <button className="btn btn-circle btn-lg btn-primary shadow-2xl hover:scale-110 transform transition-all duration-300 animate-bounce-gentle">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Home;
