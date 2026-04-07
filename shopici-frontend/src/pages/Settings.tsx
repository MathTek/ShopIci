import { Link } from 'react-router-dom';

const Settings = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white/10 border border-white/20 backdrop-blur-md rounded-3xl p-8 sm:p-10">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">Settings</h1>
        <p className="text-white/80 leading-relaxed mb-5">
          Account customization is managed from your profile page.
        </p>
        <Link
          to="/profile"
          className="inline-block px-5 py-3 rounded-xl bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
        >
          Go to Profile
        </Link>
      </div>
    </div>
  );
};

export default Settings;
