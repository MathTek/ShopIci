import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

const Products = () => {
    const [products, setProducts] = useState<Array<any>>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState<string>('newest');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const navigate = useNavigate();
    const { addItem } = useCart();

    const loadAllProducts = async () => {
        try {
            const { data: productsData, error } = await supabase
                .from('products')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching products:", error);
            } else {
                setProducts(productsData || []);
            }
        } catch (error) {
            console.error("Error during product loading:", error);
        }
    };

    const checkCurrentUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUser(session?.user || null);
        } catch (error) {
            console.error("Error checking user:", error);
        }
    };

    useEffect(() => {
        const initializePage = async () => {
            await checkCurrentUser();
            await loadAllProducts();
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        };
        
        initializePage();
    }, []);

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        

        const productPrice = product.price || 0;
        const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        const matchesPrice = productPrice >= minPrice && productPrice <= maxPrice;
        
        return matchesCategory && matchesSearch && matchesPrice;
    }).sort((a, b) => {
   
        switch (sortBy) {
            case 'newest':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'oldest':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'price-low':
                return (a.price || 0) - (b.price || 0);
            case 'price-high':
                return (b.price || 0) - (a.price || 0);
            default:
                return 0;
        }
    });

    const categories = ['all', 'electronics', 'fashion', 'home'];
    const getCategoryDisplayName = (category: string) => {
        const names: { [key: string]: string } = {
            'all': 'All Categories',
            'electronics': 'Electronics',
            'fashion': 'Fashion',
            'home': 'Home'
        };
        return names[category] || category;
    };

    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
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
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle"></div>
                <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="relative z-10 py-8">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="w-full lg:w-1/2 flex justify-start">
                                <div className="max-w-xl text-left">

                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl relative">
                                        Products Catalog
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-cyan-200/5 to-blue-300/5 blur-2xl -z-10"></div>
                                    </h1>
                                    <p className="text-xl text-white/90 leading-relaxed font-light">
                                        Discover amazing products from our <span className="font-semibold text-cyan-300">community</span>
                                    </p>
                                </div>
                            </div>

              
                            <div className="w-full lg:w-auto">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full lg:w-80 px-4 py-3 pl-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                                    />
                                </div>
                            </div>
                        </div>

          
                        <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
               
                            <div className="flex flex-wrap gap-3">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                                            selectedCategory === category
                                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                                                : 'bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/20'
                                        }`}
                                    >
                                        {getCategoryDisplayName(category)}
                                    </button>
                                ))}
                            </div>

                     
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
                                <span className="text-white/70 text-sm font-medium">Prix:</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                    className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                />
                                <span className="text-white/50">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                    className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                />
                                <span className="text-white/70 text-sm">€</span>
                            </div>

                        
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
                                <span className="text-white/70 text-sm font-medium">Trier par:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-lg text-white text-sm px-3 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                >
                                    <option value="newest" className="bg-gray-800">Plus récent</option>
                                    <option value="oldest" className="bg-gray-800">Plus ancien</option>
                                    <option value="price-low" className="bg-gray-800">Prix croissant</option>
                                    <option value="price-high" className="bg-gray-800">Prix décroissant</option>
                                </select>
                            </div>

                        
                            {(priceRange.min || priceRange.max || sortBy !== 'newest') && (
                                <button
                                    onClick={() => {
                                        setPriceRange({ min: '', max: '' });
                                        setSortBy('newest');
                                    }}
                                    className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm font-medium hover:bg-red-500/30 transition-all duration-300"
                                >
                                    Réinitialiser
                                </button>
                            )}
                        </div>
                    </div>



            
                    <div className="px-4 sm:px-6 lg:px-8">
                        {filteredProducts.length === 0 ? (
                   
                            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full mx-4 text-center">
                                    <div className="relative mb-6">
                                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                            <span className="text-xs">🔍</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        {searchTerm ? 'No products found' : 'No products available'}
                                    </h3>
                                    
                                    <p className="text-white/80 mb-6 leading-relaxed">
                                        {searchTerm 
                                            ? `No products match "${searchTerm}" in the selected category.`
                                            : 'Be the first to add products to our marketplace!'
                                        }
                                    </p>
                                    
                                    {searchTerm && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedCategory('all');
                                                setPriceRange({ min: '', max: '' });
                                                setSortBy('newest');
                                            }}
                                            className="btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                         
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/products/${product.id}`)}
                                        className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:bg-white/15 aspect-square flex flex-col"
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                         
                                        <div className="relative overflow-hidden h-2/3">
                                            <img
                                                src={product.image_urls || '/placeholder-image.jpg'}
                                                alt={product.title || product.name || 'Product'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            
                        
                                            <div className="absolute top-2 right-2">
                                                <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                                            </div>

                                    
                                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); addItem({ id: product.id, title: product.title || product.name || 'Product', price: product.price || 0, image_urls: product.image_urls || product.image_url }); }}
                                                    className="p-2 hover:bg-cyan-500/50 rounded-lg text-white hover:text-cyan-300 backdrop-blur-md bg-black/50 shadow-lg border border-white/20 cursor-pointer"
                                                    aria-label="Ajouter au panier"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4z" />
                                                    </svg>
                                                </button>
                                                <button className="p-2 hover:bg-slate-700/60 rounded-lg text-white hover:text-cyan-300 backdrop-blur-md bg-black/50 shadow-lg border border-white/20">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                             
                                        <div className="p-3 h-1/3 flex flex-col justify-between bg-gradient-to-t from-black/20 to-transparent">
                                            <div>
                                                <h2 className="text-sm font-semibold text-white mb-1 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                                                    {product.title || product.name || 'Unnamed Product'}
                                                </h2>
                                                
                                  
                                                {product.description && (
                                                    <p className="text-xs text-white/70 mb-1 line-clamp-1">
                                                        {product.description}
                                                    </p>
                                                )}
                                                
                                             
                                                {product.category && (
                                                    <span className="inline-block text-xs bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded text-center mb-1">
                                                        {product.category}
                                                    </span>
                                                )}
                                                
                                             
                                                {product.created_at && (
                                                    <span className="inline-block text-xs bg-white/10 text-white/70 px-1 py-0.5 rounded text-center mb-1 float-right whitespace-nowrap">
                                                        Added on {new Date(product.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center justify-center">
                                                <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                                    ${product.price?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                  
                        {filteredProducts.length > 0 && (
                            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
                                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                                        {filteredProducts.length}
                                    </div>
                                    <div className="text-white/70 font-medium">
                                        {selectedCategory === 'all' ? 'Total Products' : 'Products in Category'}
                                    </div>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
                                    <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent mb-2">
                                        {new Set(products.map(p => p.category)).size}
                                    </div>
                                    <div className="text-white/70 font-medium">Categories</div>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center shadow-lg">
                                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                                        ${Math.min(...filteredProducts.map(p => p.price || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-white/70 font-medium">Starting From</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;