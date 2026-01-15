import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { MdModeEditOutline } from "react-icons/md";

export default function ProfileForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false); 
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        setEmail(user.email || "");
      }
    }

    async function fetchProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone, username, bio, address")
          .eq("id", user.id)
          .single();

        if (data) {
          setName(data.full_name || "");
          setPhone(data.phone || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
          setAddress(data.address || "");
        }
        if (error) {
          console.error("Error fetching profile:", error.message);
        }
      }
    }

    fetchUser();
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const { error } = await supabase.auth.updateUser({ email });

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: name,
          phone: phone,
          username: username,
          bio: bio,
          address: address
        });

      if (profileError) {
        console.error("Error updating profile:", profileError.message);
      }
    }

    setLoading(false);
    if (error) {
      console.error("Error updating profile:", error.message);
      alert(`Error updating profile: ${error.message}`);
    } else {
      setSuccess(true);
      setIsEditing(false); 
    }
  };

return (
    <div className="card-gradient w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
    
        <div className="flex flex-col sm:flex-row sm:items-start md:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-2 lg:gap-4">
          <div className=" sm:text-left flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient mb-2">Profile Settings</h2>
            <p className="text-sm sm:text-base text-base-content/70">
              {isEditing ? "Update your information" : "View your profile details"}
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`btn btn-sm sm:btn-md lg:btn-lg xl:btn-lg ${isEditing ? 'btn-success' : 'btn-primary'} shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 w-full sm:w-auto max-w-xs sm:max-w-none`}
              aria-label="Edit profile"
            >
            {isEditing ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <MdModeEditOutline className="text-white h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
            )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
         
            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm sm:text-base font-semibold text-base-content/80 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Username
                    </span>
                </label>
                <input
                    type="text"
                    placeholder="Enter your username"
                    className={`input input-bordered w-full rounded-lg sm:rounded-xl h-12 sm:h-14 text-sm sm:text-base transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                />
            </div>
            
           
            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm sm:text-base font-semibold text-base-content/80 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Full Name
                    </span>
                </label>
                <input
                    type="text"
                    placeholder="Enter your full name"
                    className={`input input-bordered w-full rounded-lg sm:rounded-xl h-12 sm:h-14 text-sm sm:text-base transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing} 
                />
            </div>

          
            <div className="form-control">  
              <label className="label">
                <span className="label-text text-sm sm:text-base font-semibold text-base-content/80 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Bio
                </span>
              </label>
              <textarea
                placeholder="Tell us about yourself"
                className={`textarea textarea-bordered text-base-content placeholder:text-base-content/60 w-full rounded-lg sm:rounded-xl h-20 sm:h-24 text-sm sm:text-base transition-all duration-300 ${
                  isEditing 
                    ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                    : 'bg-base-300/30 cursor-not-allowed'
                }`}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm sm:text-base font-semibold text-base-content/80 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Address
                    </span>
                </label>
                <input
                    type="email"
                    placeholder="Enter your email address"
                    className={`input input-bordered w-full rounded-lg sm:rounded-xl h-12 sm:h-14 text-sm sm:text-base transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                />
            </div>

           
            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm sm:text-base font-semibold text-base-content/80 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone Number
                    </span>
                </label>
                <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className={`input input-bordered w-full rounded-lg sm:rounded-xl h-12 sm:h-14 text-sm sm:text-base transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                />
            </div>

          

            <div className="form-control">
                <label className="label">
                    <span className="label-text text-sm sm:text-base font-semibold text-base-content/80 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Address
                    </span>
                </label>
                <input
                    type="text"
                    placeholder="Enter your address"
                    className={`input input-bordered w-full rounded-lg sm:rounded-xl h-12 sm:h-14 text-sm sm:text-base transition-all duration-300 ${
                        isEditing
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80'
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!isEditing}
                />
            </div>

      
            {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                    <button
                        type="submit"
                        className={`btn-gradient flex-1 h-12 sm:h-14 text-sm sm:text-base lg:text-lg font-semibold rounded-lg sm:rounded-xl ${
                            loading ? "loading" : ""
                        } hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm sm:loading-md mr-2"></span>
                                <span className="text-xs sm:text-sm lg:text-base">Saving...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xs sm:text-sm lg:text-base">Save Changes</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn bg-red-500 flex-1 h-12 sm:h-14 text-xs sm:text-sm lg:text-base font-semibold rounded-lg sm:rounded-xl hover:scale-105 transition-all duration-300"
                    >
                        Cancel
                    </button>
                </div>
            )}

     
            {success && (
                <div className="alert alert-success animate-fade-in rounded-lg sm:rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-sm sm:text-base">Profile updated successfully! 🎉</span>
                </div>
            )}
        </form>
    </div>
);
}
