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
  <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 transition-all duration-300">

    {/* HEADER */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">

      <div className="flex-1">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Profile Settings
        </h2>
        <p className="text-sm text-white/50 mt-1">
          {isEditing ? "Update your information" : "View your profile details"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setIsEditing(!isEditing)}
        className={`flex items-center justify-center w-10 h-10 rounded-lg
                    transition-all duration-200
                    ${isEditing 
                      ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" 
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
      >
        {isEditing ? "✓" : <MdModeEditOutline className="h-4 w-4" />}
      </button>

    </div>

    {/* FORM */}
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">

      {/* USERNAME */}
      <div className="space-y-2">
        <label className="text-xs text-white/50 font-medium">Username</label>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={!isEditing}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/40
                     focus:outline-none focus:border-indigo-400 focus:bg-white/10
                     transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* FULL NAME */}
      <div className="space-y-2">
        <label className="text-xs text-white/50 font-medium">Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isEditing}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/40
                     focus:outline-none focus:border-indigo-400 focus:bg-white/10
                     transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* BIO */}
      <div className="space-y-2 sm:col-span-2">
        <label className="text-xs text-white/50 font-medium">Bio</label>
        <textarea
          placeholder="Tell us about yourself"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={!isEditing}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/40 min-h-[100px]
                     focus:outline-none focus:border-indigo-400 focus:bg-white/10
                     transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* EMAIL */}
      <div className="space-y-2">
        <label className="text-xs text-white/50 font-medium">Email</label>
        <input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!isEditing}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/40
                     focus:outline-none focus:border-indigo-400 focus:bg-white/10
                     transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* PHONE */}
      <div className="space-y-2">
        <label className="text-xs text-white/50 font-medium">Phone</label>
        <input
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!isEditing}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/40
                     focus:outline-none focus:border-indigo-400 focus:bg-white/10
                     transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* ADDRESS */}
      <div className="space-y-2 sm:col-span-2">
        <label className="text-xs text-white/50 font-medium">Address</label>
        <input
          type="text"
          placeholder="Enter your address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={!isEditing}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-sm text-white placeholder-white/40
                     focus:outline-none focus:border-indigo-400 focus:bg-white/10
                     transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* ACTIONS */}
      {isEditing && (
        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-4">

          <button
            type="submit"
            className="flex-1 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600
                       text-white text-sm font-medium
                       transition-all duration-200
                       hover:shadow-lg hover:scale-[1.02]
                       active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white/70
                       hover:bg-white/10 hover:text-white
                       transition-all duration-200"
          >
            Cancel
          </button>

        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="sm:col-span-2 rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          Profile updated successfully 🎉
        </div>
      )}

    </form>
  </div>
);
}
