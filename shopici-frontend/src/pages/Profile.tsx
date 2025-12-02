import ProfileForm from "../components/ProfileForm";

const Profile = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Titre en haut */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold">My Profile</h1>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <ProfileForm />
      </main>
    </div>
  );
};

export default Profile;
