import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import ProductCreationForm  from "../components/ProductCreationForm";

const MyProducts = () => {
    const [products, setProducts] = useState<Array<any>>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
    
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);

    const handleCreateProduct = () => {
        setShowCreateForm(true);
    };

    const handleCloseForm = () => {
        setShowCreateForm(false);
    };

    const handleProductCreated = (newProduct: any) => {
        setProducts(prevProducts => [...prevProducts, newProduct]);
        setShowCreateForm(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-1/2 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
                    <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
                </div>
                <div className="relative z-10">
                    <div className="loading loading-spinner loading-lg text-cyan-300"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            {/* Animated Background Elements - même style que Home */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
                <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 py-8">
                {/* Header avec titre et bouton de création */}
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl relative">
                                My Products
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-cyan-200/5 to-blue-300/5 blur-2xl -z-10"></div>
                            </h1>
                            <p className="text-xl text-white/90 leading-relaxed font-light">
                                Manage your products and add new <span className="font-semibold text-cyan-300">listings</span>
                            </p>
                        </div>
                        
                        <button
                            onClick={handleCreateProduct}
                            className="btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add product
                        </button>
                    </div>

                   
                    <div className="px-4 sm:px-6 lg:px-8">
                        {products.length === 0 ? (
                  
                        <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full mx-4 text-center">
                        
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                        <span className="text-xs">✨</span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-4">
                                    You have no products for the moment
                                </h3>
                                
                                <p className="text-white/70 mb-6 leading-relaxed">
                                    Start building your store by creating your first product. 
                                    It's <span className="text-cyan-300 font-semibold">quick and easy</span>!
                                </p>

                                <button
                                    onClick={handleCreateProduct}
                                    className="btn-gradient text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-full flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Your First Product
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Grille des produits - Format carré compact */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:bg-white/15 aspect-square flex flex-col"
                                    onClick={() => navigate(`/product/${product.id}`)}
                                >
                                    {/* Image du produit - format carré */}
                                    <div className="relative overflow-hidden h-2/3">
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        
                                        {/* Badge de statut */}
                                        <div className="absolute top-2 right-2">
                                            <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                                        </div>

                                        {/* Boutons d'action en overlay bien visibles */}
                                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {/* Bouton d'édition */}
                                            <button 
                                                className="p-2 hover:bg-cyan-500/50 rounded-lg text-white hover:text-cyan-300 backdrop-blur-md bg-black/50 shadow-lg border border-white/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log("Edit product:", product.id);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            
                                            {/* Bouton de suppression */}
                                            <button 
                                                className="p-2 hover:bg-red-500/50 hover:text-red-300 rounded-lg text-white backdrop-blur-md bg-black/50 shadow-lg border border-white/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log("Delete product:", product.id);
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contenu en bas - plus d'espace */}
                                    <div className="p-3 h-1/3 flex flex-col justify-center bg-gradient-to-t from-black/20 to-transparent">
                                        <h2 className="text-sm font-semibold text-white mb-2 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                                            {product.name}
                                        </h2>
                                        
                                        <div className="flex items-center justify-center">
                                            <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                                ${product.price.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

            
                    {products.length > 0 && (
                        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
                                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">{products.length}</div>
                                <div className="text-white/70 font-medium">Total Products</div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
                                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent mb-2">
                                    {products.filter(p => p.status === 'active').length}
                                </div>
                                <div className="text-white/70 font-medium">Active Listings</div>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
                                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                                    ${products.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
                                </div>
                                <div className="text-white/70 font-medium">Total Value</div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Modal Popup pour la création de produit */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto">
                        {/* Bouton de fermeture */}
                        <button
                            onClick={handleCloseForm}
                            className="absolute top-4 right-4 z-10 btn btn-ghost btn-sm btn-circle bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500/20 hover:text-red-300"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Contenu du formulaire */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
                            <h2 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                                Create New Product
                            </h2>
                            <ProductCreationForm 
                                onProductCreated={handleProductCreated}
                                onCancel={handleCloseForm}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProducts;