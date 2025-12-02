import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { MdModeEditOutline } from "react-icons/md";

export default function ProfileForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
          .select("full_name, phone")
          .eq("id", user.id)
          .single();

        if (data) {
          setName(data.full_name || "");
          setPhone(data.phone || "");
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
    <div className="card w-96 bg-base-200 shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">Edit Profile</h2>
            <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="p-2 rounded-full transform hover:scale-110 transition-transform duration-200 "
                aria-label="Edit profile"
            >
                <MdModeEditOutline className="text-2xl" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Name</span>
                </label>
                <input
                    type="text"
                    placeholder="Your Name"
                    className="input input-bordered transform transition-transform duration-150 focus:scale-105"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing} 
                />
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Email</span>
                </label>
                <input
                    type="email"
                    placeholder="New Email"
                    className="input input-bordered transform transition-transform duration-150 focus:scale-105"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                />
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Phone Number</span>
                </label>
                <input
                    type="tel"
                    placeholder="Phone Number"
                    className="input input-bordered transform transition-transform duration-150 focus:scale-105"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                />
            </div>

            <button
                type="submit"
                className={`btn btn-primary mt-2 ${loading ? "loading" : ""} transform hover:scale-105 transition-transform duration-150`}
                disabled={loading || !isEditing}
            >
                {loading ? "Saving..." : "Save"}
            </button>

            {success && <p className="text-green-600 mt-2">Profile updated successfully!</p>}
        </form>
    </div>
);
}
