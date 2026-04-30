import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { attachScheduledPromosToProducts } from "../services/promoCodes";

interface CatalogProduct {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    price?: number;
    displayPrice?: number;
    originalPrice?: number;
    hasScheduledPromo?: boolean;
    promoBadge?: string | null;
    scheduledPromo?: unknown;
    image_urls?: string;
    image_url?: string;
    category?: string;
    created_at: string;
    user_id?: string;
    specifications?: string[] | string;
    key_characteristics?: string[];
    status?: string;
}

const Products = () => {
    const [products, setProducts] = useState<CatalogProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState<string>('newest');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [comparisonIds, setComparisonIds] = useState<string[]>([]);
    const [compareError, setCompareError] = useState<string | null>(null);
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
                const productsWithPromotions = await attachScheduledPromosToProducts(productsData || []);
                setProducts(productsWithPromotions);
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

    const getProductPrice = (product: CatalogProduct) => product.displayPrice ?? product.price ?? 0;

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all'
            || product.category === selectedCategory
            || (selectedCategory === 'promotion' && Boolean(product.hasScheduledPromo));
        const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        

        const productPrice = getProductPrice(product);
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
                return getProductPrice(a) - getProductPrice(b);
            case 'price-high':
                return getProductPrice(b) - getProductPrice(a);
            default:
                return 0;
        }
    });

    const categories = ['all', 'electronics', 'fashion', 'home', 'promotion'];
    const getCategoryDisplayName = (category: string) => {
        const names: { [key: string]: string } = {
            'all': 'All Categories',
            'electronics': 'Electronics',
            'fashion': 'Fashion',
            'home': 'Home',
            'promotion': 'Promotion'
        };
        return names[category] || category;
    };

    const sendToNavigate = (product: any) => {
        if (product.user_id === currentUser?.id) {
            navigate(`/my-products`);
        } else {
            navigate(`/products/${product.id}`);
        }
    };

    const isNewProduct = (createdAt: string) => {
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffInDays < 3;
    };

    const comparisonProducts = products.filter((product) => comparisonIds.includes(product.id));

    const toggleComparison = (productId: string) => {
        setCompareError(null);
        setComparisonIds((prev) => {
            if (prev.includes(productId)) {
                return prev.filter((id) => id !== productId);
            }

            if (prev.length >= 3) {
                setCompareError('You can compare up to 3 products.');
                return prev;
            }

            return [...prev, productId];
        });
    };

    const getKeySpecsLabel = (product: CatalogProduct) => {
        if (Array.isArray(product.specifications) && product.specifications.length > 0) {
            return product.specifications.slice(0, 3).join(' • ');
        }

        if (typeof product.specifications === 'string' && product.specifications.trim()) {
            return product.specifications;
        }

        if (product.key_characteristics && Array.isArray(product.key_characteristics)) {
            return product.key_characteristics.slice(0, 3).join(' • ');
        }

        if (product.description) {
            return product.description.length > 90
                ? `${product.description.slice(0, 90)}...`
                : product.description;
        }

        return 'No specifications provided';
    };

    const comparisonPriceValues = comparisonProducts.map((product) => `${getProductPrice(product).toFixed(2)} €`);
    const comparisonSpecsValues = comparisonProducts.map((product) => getKeySpecsLabel(product));
    const MAX_COMPARE_SLOTS = 3;
    const comparisonSlots = Array.from({ length: MAX_COMPARE_SLOTS }, (_, index) => comparisonProducts[index] || null);

    const hasDifferences = (values: string[]) => {
        if (values.length <= 1) return false;
        const normalized = values.map((value) => value.trim().toLowerCase());
        return new Set(normalized).size > 1;
    };

    const hasPriceDifferences = hasDifferences(comparisonPriceValues);
    const hasSpecsDifferences = hasDifferences(comparisonSpecsValues);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
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
                                <div className="max-w-xl text-left space-y-4">

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
                                    Products{" "}
                                    <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Catalog
                                    </span>
                                </h1>

                                <p className="text-base sm:text-lg text-white/60 leading-relaxed">
                                    Discover amazing products from our{" "}
                                    <span className="text-white font-medium">
                                    community
                                    </span>
                                </p>

                                </div>
                            </div>

              
                            <div className="w-full lg:w-auto">
                                <div className="relative group">

                                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 blur-md transition duration-300" />

                                    <div className="relative flex items-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-focus-within:border-indigo-400 group-focus-within:bg-white/10">

                                   

                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full lg:w-80 
                                                px-3 py-3 pl-16
                                                bg-transparent outline-none
                                                text-sm text-white placeholder-white/40"
                                    />

                                    <div className="hidden sm:flex items-center gap-1 mr-3 px-2 py-1 rounded-md border border-white/10 text-[11px] text-white/30">
                                        ⌘K
                                    </div>

                                    </div>
                                </div>
                                </div>
                        </div>

          
                        <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
               
                            <div className="flex flex-wrap gap-2 sm:gap-3">

                            {categories.map(category => {
                                const isActive = selectedCategory === category;

                                return (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`
                                    px-4 sm:px-5 py-2 rounded-full
                                    text-sm font-medium
                                    transition-all duration-200
                                    relative
                                    ${isActive
                                        ? "text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                        : "text-white/60 hover:text-white border border-white/10 hover:bg-white/5"
                                    }
                                    cursor-pointer
                                    `}
                                >
                                    {getCategoryDisplayName(category)}
                                </button>
                                );
                            })}

                            </div>

                     
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10 bg-white/5">

                            <span className="text-sm text-white/50 font-medium whitespace-nowrap">
                                Price
                            </span>

                            <div className="flex items-center gap-2">

                                <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                className="w-20 px-2 py-2 rounded-lg 
                                            bg-transparent border border-white/10
                                            text-sm text-white placeholder-white/40
                                            focus:outline-none focus:border-indigo-400
                                            transition"
                                />

                                <span className="text-white/30">—</span>

                                <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                className="w-20 px-3 py-2 rounded-lg 
                                            bg-transparent border border-white/10
                                            text-sm text-white placeholder-white/40
                                            focus:outline-none focus:border-indigo-400
                                            transition"
                                />

                            </div>

                            <span className="text-sm text-white/40">€</span>

                            </div>

                        
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5">

                            <span className="text-sm text-white/50 font-medium whitespace-nowrap">
                                Sort by
                            </span>

                            <div className="relative">
                                <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-transparent border border-white/10 
                                            text-sm text-white px-4 pr-12 py-2 rounded-lg
                                            focus:outline-none focus:border-indigo-400
                                            transition cursor-pointer"
                                >
                                <option value="newest" className="bg-gray-900">Newest</option>
                                <option value="oldest" className="bg-gray-900">Oldest</option>
                                <option value="price-low" className="bg-gray-900">Price ↑</option>
                                <option value="price-high" className="bg-gray-900">Price ↓</option>
                                </select>

                                <div className="pointer-events-none absolute inset-y-0 flex left-16 items-center text-white/40">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                                </div>
                            </div>

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
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                            <p className="text-sm text-white/75">
                                Select products to compare (<span className="font-semibold text-cyan-300">{comparisonIds.length}/3</span>)
                            </p>
                            {comparisonIds.length > 0 && (
                                <button
                                    onClick={() => {
                                        setComparisonIds([]);
                                        setCompareError(null);
                                    }}
                                    className="text-sm px-3 py-1.5 rounded-lg border border-white/20 text-white/80 hover:bg-white/10"
                                >
                                    Reset selection
                                </button>
                            )}
                        </div>

                        {comparisonProducts.length > 0 && (
                            <div className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Compare Products</h2>
                                        <p className="text-xs sm:text-sm text-white/60 mt-1">Sticky headers help you scan differences quickly.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setComparisonIds([]);
                                            setCompareError(null);
                                        }}
                                        className="px-3 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10"
                                    >
                                        Clear comparison
                                    </button>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-white/10">
                                    <div className="min-w-[940px] p-3 space-y-3">
                                        <div
                                            className="grid gap-3 items-stretch sticky top-0 z-20 bg-[#0f172a] pb-1"
                                            style={{ gridTemplateColumns: '220px repeat(3, minmax(220px, 1fr))' }}
                                        >
                                            <div className="rounded-xl border border-white/10 bg-[#111c34] px-4 py-3 flex items-center">
                                                <p className="text-left text-xs uppercase tracking-wide text-white/60">Product</p>
                                            </div>

                                            {comparisonSlots.map((product, index) => (
                                                <div key={product?.id || `empty-slot-${index}`} className="h-full">
                                                    {product ? (
                                                        <div className="rounded-xl border border-white/15 bg-white/5 p-3 h-full min-h-[370px] flex flex-col">
                                                            <img
                                                                src={product.image_urls || '/placeholder-image.jpg'}
                                                                alt={product.title || product.name || 'Product'}
                                                                className="w-full h-28 object-cover rounded-lg"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                                                }}
                                                            />

                                                            <div className="mt-3 min-h-[44px]">
                                                                <h3 className="text-sm font-semibold text-white line-clamp-2 break-words leading-tight">
                                                                    {product.title || product.name || 'Product'}
                                                                </h3>
                                                            </div>

                                                                <div className="mt-2 space-y-1">
                                                                    {product.hasScheduledPromo ? (
                                                                        <>
                                                                            <p className="text-xs text-red-300 line-through">
                                                                                {(product.price || 0).toFixed(2)} €
                                                                            </p>
                                                                            <p className="text-sm font-semibold text-cyan-300">
                                                                                {getProductPrice(product).toFixed(2)} €
                                                                            </p>
                                                                            {product.promoBadge && (
                                                                                <p className="text-[11px] text-emerald-300">{product.promoBadge}</p>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-sm font-semibold text-cyan-300">
                                                                            {getProductPrice(product).toFixed(2)} €
                                                                        </p>
                                                                    )}
                                                                </div>

                                                            <p className="mt-2 min-h-[40px] text-xs text-white/60 line-clamp-2 break-words">
                                                                {getKeySpecsLabel(product)}
                                                            </p>

                                                            <div className="mt-auto flex flex-col gap-2 pt-3">
                                                                <button
                                                                    onClick={() => addItem({ id: product.id, title: product.title || product.name || 'Product', price: getProductPrice(product), image_urls: product.image_urls || product.image_url })}
                                                                    className="w-full px-3 py-2 rounded-md bg-gradient-to-r from-indigo-400 to-purple-400 text-white text-xs font-semibold hover:bg-cyan-400 transition"
                                                                >
                                                                    Add to cart
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/products/${product.id}`)}
                                                                    className="w-full px-3 py-2 rounded-md border border-white/20 text-white/90 text-xs font-semibold hover:bg-white/10 transition"
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleComparison(product.id)}
                                                                    className="w-full px-3 py-2 rounded-md border border-red-400/50 bg-red-500/10 text-red-200 text-xs font-semibold hover:bg-red-500/20 transition"
                                                                >
                                                                    Remove from comparison
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 h-full min-h-[370px] flex items-center justify-center">
                                                            <p className="text-sm text-white/45 text-center">Select a product to compare</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="grid gap-3 items-stretch"
                                            style={{ gridTemplateColumns: '220px repeat(3, minmax(220px, 1fr))' }}
                                        >
                                            <div className="rounded-xl border border-white/10 bg-[#111c34] px-4 py-4 text-sm font-medium text-white/80 flex items-center">
                                                Price
                                            </div>
                                            {comparisonSlots.map((product, index) => (
                                                <div
                                                    key={`price-${product?.id || index}`}
                                                    className={`rounded-xl border border-white/10 px-4 py-4 text-sm text-left ${product && hasPriceDifferences ? 'text-cyan-300 font-semibold bg-cyan-500/10' : 'text-white/90 bg-white/5'}`}
                                                >
                                                    {product ? `${getProductPrice(product).toFixed(2)} €` : '—'}
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className="grid gap-3 items-stretch"
                                            style={{ gridTemplateColumns: '220px repeat(3, minmax(220px, 1fr))' }}
                                        >
                                            <div className="rounded-xl border border-white/10 bg-[#111c34] px-4 py-4 text-sm font-medium text-white/80 flex items-center">
                                                Key specifications
                                            </div>
                                            {comparisonSlots.map((product, index) => (
                                                <div
                                                    key={`specs-${product?.id || index}`}
                                                    className={`rounded-xl border border-white/10 px-4 py-4 text-sm text-left leading-relaxed break-words ${product && hasSpecsDifferences ? 'text-violet-200 font-semibold bg-violet-500/10' : 'text-white/85 bg-white/5'}`}
                                                >
                                                    <p className="line-clamp-3">{product ? getKeySpecsLabel(product) : '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {(hasPriceDifferences || hasSpecsDifferences) && (
                                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                                        Highlighted cells indicate differences across selected products.
                                    </div>
                                )}
                            </div>
                        )}

                        {compareError && (
                            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 text-sm">
                                {compareError}
                            </div>
                        )}

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
                                        onClick={() => sendToNavigate(product)}
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
                                            
                        
                                            {isNewProduct(product.created_at) && (
                                                <div className="absolute top-3 left-3 group/badge">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-xl blur-lg opacity-75 group-hover/badge:opacity-100 transition-opacity duration-300 scale-110"></div>
                                                        <div className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-black shadow-2xl backdrop-blur-sm border border-cyan-300/50 flex items-center gap-2 group-hover/badge:scale-110 transition-transform duration-300 whitespace-nowrap">
                                                            <span className="text-base">NEW</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {product.hasScheduledPromo && product.promoBadge && (
                                                <div className="absolute top-4 left-4 mt-16 max-w-[calc(100%-3rem)] group/promo">
                                                    <div className="rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-1.5 text-s font-bold text-white shadow-xl shadow-emerald-500/40 backdrop-blur-sm border border-emerald-300/60 flex items-center gap-1.5 group-hover/promo:shadow-emerald-500/60 group-hover/promo:from-emerald-300 group-hover/promo:to-teal-300 transition-all duration-200">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                                        {product.promoBadge}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="absolute top-2 right-2">
                                                <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                                            </div>

                                            <div className="absolute bottom-2 left-2 z-10 max-w-[calc(100%-1rem)]">
                                                {(() => {
                                                    const isSelected = comparisonIds.includes(product.id);
                                                    const limitReached = comparisonIds.length >= MAX_COMPARE_SLOTS;
                                                    const disabled = !isSelected && limitReached;

                                                    return (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (disabled) {
                                                            setCompareError('You can compare up to 3 products. Remove one to add another.');
                                                            return;
                                                        }
                                                        toggleComparison(product.id);
                                                    }}
                                                    disabled={disabled}
                                                    className={`inline-flex max-w-full items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] sm:text-xs font-semibold border transition shadow-md backdrop-blur-md whitespace-nowrap ${isSelected
                                                        ? 'bg-emerald-500/95 text-black border-emerald-300'
                                                        : disabled
                                                            ? 'bg-slate-800/70 text-white/40 border-white/15 cursor-not-allowed'
                                                            : 'bg-indigo-500/90 text-white border-indigo-300 hover:bg-indigo-400'
                                                        }`}
                                                    aria-label={isSelected ? 'In comparison' : 'Add to compare'}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10M7 17h10" />
                                                    </svg>
                                                    {isSelected ? 'In Comparison' : disabled ? 'Limit Reached' : 'Add to Compare'}
                                                </button>
                                                    );
                                                })()}
                                            </div>

                                    
                                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); addItem({ id: product.id, title: product.title || product.name || 'Product', price: getProductPrice(product), image_urls: product.image_urls || product.image_url }); }}
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
                                            
                                            {product.hasScheduledPromo ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-sm text-red-400 line-through">
                                                        ${product.price?.toFixed(2) || '0.00'}
                                                    </span>
                                                    <span className="text-base font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                                                        ${getProductPrice(product).toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (

                                                <div className="flex items-center justify-center">
                                                <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                                    ${getProductPrice(product).toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            )}
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
                                        ${Math.min(...filteredProducts.map(p => getProductPrice(p))).toFixed(2)}
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