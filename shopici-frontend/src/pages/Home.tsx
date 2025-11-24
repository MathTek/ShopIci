
const Home = () => {
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to ShopIci!</h1>
      <p className="text-lg mb-4">Your one-stop shop for everything you need.</p>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        onClick={() => {
          // Logique pour naviguer vers la page des produits ou une autre action
        }}
      >
        Start Shopping
      </button>
    </div>
  );
};

export default Home;
