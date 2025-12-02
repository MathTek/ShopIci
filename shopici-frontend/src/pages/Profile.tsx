import ProfileForm from "../components/ProfileForm";

const Profile = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-5xl font-bold text-gradient mb-4">My Profile</h1>
          <p className="text-xl text-base-content/70">Manage your account information</p>
        </header>

        {/* Main Content */}
        <main className="flex items-center justify-center animate-slide-up">
          <ProfileForm />
        </main>
      </div>
    </div>
  );
};

export default Profile;
