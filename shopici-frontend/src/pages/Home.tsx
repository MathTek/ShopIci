import { supabase } from "../services/supabaseClient";
import { useEffect, useState } from "react";

const Home = () => {
  const [username, setUsername] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Hero Section */}
      <div className="hero-section px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Welcome Message */}
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

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <button
              className="btn-gradient text-lg px-8 py-4 hover:shadow-2xl transform hover:scale-110 transition-all duration-500 rounded-2xl"
              onClick={() => {
                // Navigate to products
              }}
            >
              🛒 Start Shopping
            </button>
            <button className="btn btn-outline btn-lg px-8 py-4 rounded-2xl hover:btn-secondary transition-all duration-300">
              📖 Learn More
            </button>
          </div>

        </div>
      </div>

      {/* Products Carousel Section */}
      <div className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16 animate-fade-in relative">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white/90 text-sm font-medium mb-8 hover:scale-105 transition-transform duration-300">
              <span className="text-xl animate-pulse">🔥</span>
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent font-bold">Hot Deals</span>
              <span className="w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl relative">
              Featured Products
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-cyan-200/5 to-blue-300/5 blur-2xl -z-10"></div>
            </h2>
            
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light">
              Discover our <span className="font-semibold text-cyan-300">handpicked selection</span> of trending products with 
              <span className="font-semibold text-purple-300"> amazing deals</span>
              <span className="inline-block animate-pulse ml-2">💎</span>
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Buttons */}
            <button 
              onClick={prevSlide}
              className="group absolute -left-8 sm:-left-16 lg:-left-20 top-1/2 transform -translate-y-1/2 z-20 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl shadow-2xl hover:shadow-cyan-500/30 border border-white/30 text-white hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/50 transition-all duration-500 hover:scale-110 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-blue-500/0 group-hover:from-cyan-400/20 group-hover:to-blue-500/20 transition-all duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform duration-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={nextSlide}
              className="group absolute -right-8 sm:-right-16 lg:-right-20 top-1/2 transform -translate-y-1/2 z-20 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl shadow-2xl hover:shadow-cyan-500/30 border border-white/30 text-white hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/50 transition-all duration-500 hover:scale-110 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-blue-500/0 group-hover:from-cyan-400/20 group-hover:to-blue-500/20 transition-all duration-300"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform duration-300 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel Track */}
            <div className="overflow-hidden mx-16 sm:mx-24 lg:mx-28">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: Math.ceil(products.length / itemsPerSlide.desktop) }).map((_, slideIndex) => (
                  <div key={slideIndex} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {products
                        .slice(slideIndex * itemsPerSlide.desktop, (slideIndex + 1) * itemsPerSlide.desktop)
                        .map((product) => (
                          <div key={product.id} className="group animate-fade-in">
                            {/* Product Card */}
                            <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border border-white/30 hover:border-cyan-400/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl hover:shadow-cyan-500/25 hover:bg-gradient-to-br hover:from-white/20 hover:via-cyan-500/10 hover:to-blue-500/5 transition-all duration-700 transform hover:scale-105 hover:-rotate-1">
                              
                              {/* Gradient Overlay Effect */}
                              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/5 group-hover:via-purple-500/3 group-hover:to-pink-500/5 transition-all duration-700 z-10 pointer-events-none rounded-3xl"></div>
                              
                              {/* Product Image */}
                              <div className="relative overflow-hidden">
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="w-full h-48 sm:h-56 lg:h-64 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                                />
                                
                                {/* Image Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Discount Badge */}
                                {product.discount && (
                                  <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
                                    <div className="bg-gradient-to-r from-red-500 via-pink-600 to-rose-600 text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-2xl border border-red-400/50 animate-pulse hover:animate-bounce transform hover:scale-110 transition-transform duration-300">
                                      <span className="flex items-center gap-2">
                                        <span className="text-lg animate-pulse">🔥</span>
                                        <span>-{product.discount}%</span>
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Quick Actions */}
                                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                                  <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md shadow-xl border border-white/30 flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:border-blue-400 hover:scale-110 transition-all duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  
                                  <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-md shadow-xl border border-white/30 flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-pink-500 hover:to-red-500 hover:border-pink-400 hover:scale-110 transition-all duration-300 hover:animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {/* Floating Effect Dots */}
                                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                                  <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"></span>
                                    <span className="w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.3s'}}></span>
                                    <span className="w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></span>
                                  </div>
                                </div>
                              </div>

                              {/* Product Info */}
                              <div className="p-4 sm:p-6 relative z-10">
                                <div className="mb-4">
                                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 hover:border-cyan-400/50 transition-all duration-300">
                                    <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></span>
                                    {product.category}
                                  </span>
                                </div>
                                
                                <h3 className="text-lg sm:text-xl font-black mb-4 text-white group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-blue-300 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 leading-tight">
                                  {product.name}
                                </h3>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <svg 
                                        key={i}
                                        className={`h-4 w-4 transition-all duration-300 ${
                                          i < Math.floor(product.rating) 
                                            ? 'text-yellow-400 hover:scale-110 drop-shadow-lg' 
                                            : 'text-white/30'
                                        }`}
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="text-xs sm:text-sm text-white/80 ml-1 font-medium">
                                    ({product.rating}) ⭐
                                  </span>
                                </div>

                                {/* Price */}
                                <div className="flex items-center gap-3 mb-6">
                                  <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                                    ${product.price}
                                  </span>
                                  {product.originalPrice && (
                                    <div className="flex flex-col">
                                      <span className="text-sm text-white/50 line-through">
                                        ${product.originalPrice}
                                      </span>
                                      <span className="text-xs text-green-400 font-semibold animate-pulse">
                                        Save ${(product.originalPrice - product.price).toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Add to Cart Button */}
                                <button className="group w-full relative overflow-hidden bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-gray-800 hover:border-white font-bold py-3.5 px-6 rounded-xl text-sm sm:text-base shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 flex items-center justify-center gap-3">
                                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all duration-300"></div>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:animate-bounce relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L17 18" />
                                  </svg>
                                  <span className="font-bold relative z-10">Add to Cart</span>
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">🛒</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center mt-8 sm:mt-10 gap-3">
              {Array.from({ length: Math.ceil(products.length / itemsPerSlide.desktop) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`relative rounded-full transition-all duration-500 hover:scale-125 ${
                    index === currentSlide 
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 w-10 sm:w-12 h-3 sm:h-4 shadow-lg shadow-cyan-500/50' 
                      : 'bg-white/40 hover:bg-white/60 w-3 sm:w-4 h-3 sm:h-4'
                  }`}
                >
                  {index === currentSlide && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* View All Products Button */}
          <div className="text-center mt-12 sm:mt-16">
            <button className="group relative overflow-hidden bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white hover:text-gray-800 hover:border-white font-bold px-12 sm:px-16 py-5 sm:py-6 rounded-2xl shadow-2xl hover:shadow-white/30 transform hover:scale-110 hover:-rotate-1 transition-all duration-500 text-sm sm:text-base inline-flex items-center gap-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/20 group-hover:via-purple-500/10 group-hover:to-pink-500/20 transition-all duration-500"></div>
              <span className="relative z-10 text-lg font-black">View All Products</span>
              <div className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xl">🚀</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
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
