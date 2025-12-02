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
  const [isEditing, setIsEditing] = useState(false); // ✅ mode édition

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
          .select("full_name, phone, username")
          .eq("id", user.id)
          .single();

        if (data) {
          setName(data.full_name || "");
          setPhone(data.phone || "");
          setUsername(data.username || "");
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
    <div className="card-gradient w-full max-w-2xl rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gradient mb-2">Profile Settings</h2>
            <p className="text-base-content/70">
              {isEditing ? "Update your information" : "View your profile details"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`btn  ${isEditing ? 'btn-success' : 'btn-primary'} shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300`}
            aria-label="Edit profile"
          >
            {isEditing ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              // ensure the react-icon is visible: give it an explicit size and color class
              <MdModeEditOutline className="text-white" size={20} />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
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
                    placeholder="Enter your username"
                    className={`input input-bordered w-full rounded-xl h-14 transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                />
            </div>
            
            {/* Name Field */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Full Name
                    </span>
                </label>
                <input
                    type="text"
                    placeholder="Enter your full name"
                    className={`input input-bordered w-full rounded-xl h-14 transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing} 
                />
            </div>

            {/* Email Field */}
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
                    className={`input input-bordered w-full rounded-xl h-14 transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                />
            </div>

            {/* Phone Field */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold text-base-content/80 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone Number
                    </span>
                </label>
                <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className={`input input-bordered w-full rounded-xl h-14 transition-all duration-300 ${
                        isEditing 
                            ? 'bg-base-200/50 backdrop-blur-sm border-base-300/50 focus:border-primary focus:bg-base-200/80' 
                            : 'bg-base-300/30 cursor-not-allowed'
                    }`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                />
            </div>

            {/* Action Buttons */}
            {isEditing && (
                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        className={`btn-gradient flex-1 h-14 text-lg font-semibold rounded-xl ${
                            loading ? "loading" : ""
                        } hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-md mr-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                Save Changes
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn bg-red-500 flex-1 h-14 text-lg font-semibold rounded-xl hover:scale-105 transition-all duration-300 "
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="alert alert-success animate-fade-in rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Profile updated successfully! 🎉</span>
                </div>
            )}
        </form>
    </div>
);
}
