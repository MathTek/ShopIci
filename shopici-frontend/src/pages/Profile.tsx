import ProfileForm from "../components/ProfileForm";
import { useState, useRef, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { MdModeEditOutline } from "react-icons/md";

const Profile = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const inputFile = useRef<HTMLInputElement | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadExistingAvatar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", session.user.id)
        .single();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
        console.log("✅ Avatar existant chargé:", data.avatar_url);
      }
    } catch (err) {
      console.log("Pas d'avatar existant trouvé");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(data.session?.user ? true : false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(session?.user ? true : false);
    });

    loadExistingAvatar();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', "Veuillez sélectionner un fichier image valide (JPG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', "Le fichier est trop volumineux. Taille maximale autorisée : 5MB");
      return;
    }

    setIsUploading(true);
    showNotification('info', "📤 Upload de votre avatar en cours...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showNotification('error', "Vous devez être connecté pour changer votre avatar");
        return;
      }

      const fileName = `${session.user.id}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        showNotification('error', `Erreur lors de l'upload: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const newAvatarUrl = publicUrlData.publicUrl;
      
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error("Erreur sauvegarde profil:", updateError);
        showNotification('error', `Erreur lors de la sauvegarde: ${updateError.message}`);
        return;
      }
      
      setAvatarUrl(newAvatarUrl);
      console.log("✅ Avatar sauvegardé:", newAvatarUrl);
      showNotification('success', "🎉 Avatar mis à jour avec succès!");

    } catch (err: any) {
      console.error("Erreur:", err);
      showNotification('error', `Erreur inattendue: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onButtonClick = () => {
    inputFile.current?.click();
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="loading loading-spinner loading-md sm:loading-lg mb-4"></div>
          <p className="text-sm sm:text-lg">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center w-full max-w-xs sm:max-w-md mx-auto p-4 sm:p-8">
          <div className="mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-warning mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h1 className="text-xl sm:text-3xl font-bold mb-2">Accès Restreint</h1>
            <p className="text-sm sm:text-lg text-base-content/70 mb-6">
              Vous devez être connecté pour accéder à votre profil.
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/login'}
              className="btn btn-primary w-full text-sm sm:text-base"
            >
              Se connecter
            </button>
            <button 
              onClick={() => window.location.href = '/signup'}
              className="btn btn-outline w-full text-sm sm:text-base"
            >
              Créer un compte
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="btn btn-ghost w-full text-sm sm:text-base"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-56 sm:h-56 lg:w-80 lg:h-80 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <header className="text-center mb-8 sm:mb-10 lg:mb-12 animate-fade-in flex flex-col items-center">
          <div className="relative mb-4 sm:mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full ring-2 ring-gray-200 ring-offset-2 ring-offset-white overflow-hidden">
              <img
                alt="Avatar utilisateur"
                src={
                  avatarUrl || 
                  "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                }
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 
                    "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";
                }}
              />
            </div>

            <input
              style={{ display: "none" }}
              ref={inputFile}
              onChange={handleFileUpload}
              type="file"
              accept="image/*"
            />

            <button
              type="button"
              onClick={onButtonClick}
              disabled={isUploading}
              aria-label="Modifier l'avatar"
              className={`absolute -right-1 -bottom-1 sm:-right-2 sm:-bottom-2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 flex items-center justify-center ${
                isUploading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-primary text-white hover:bg-primary-focus"
              }`}
            >
              {isUploading ? (
                <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none" 
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8v8z" 
                  />
                </svg>
              ) : (
                <MdModeEditOutline className="text-white w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-2 px-4">My Profile</h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white px-4">Manage your account information</p>
        </header>

        {notification && (
          <div className="mx-3 sm:mx-4 lg:max-w-lg lg:mx-auto mb-4 sm:mb-6 animate-fade-in">
            <div className={`alert ${
              notification.type === 'success' ? 'alert-success' : 
              notification.type === 'error' ? 'alert-error' : 
              'alert-info'
            } shadow-lg`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium text-sm sm:text-base">{notification.message}</span>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="btn btn-ghost btn-xs sm:btn-sm ml-auto"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="flex items-center justify-center animate-slide-up px-2 sm:px-4">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl">
            <ProfileForm />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
