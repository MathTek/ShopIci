import { supabase } from "../services/supabaseClient";
import { useEffect, useState } from "react";

const Home = () => {

  const [username, setUsername] = useState("");

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
    // run once on mount
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
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              Welcome to{" "}
              <span className="text-gradient floating-animation inline-block">
                ShopIci
              </span>
              {username && (
                <div className="text-4xl md:text-5xl mt-4 text-base-content/80">
                  Hello, <span className="text-gradient">{username}</span>! 🎉
                </div>
              )}
            </h1>
          </div>

          <div className="animate-slide-up">
            <p className="text-xl md:text-2xl mb-12 text-base-content/70 max-w-3xl mx-auto leading-relaxed">
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
