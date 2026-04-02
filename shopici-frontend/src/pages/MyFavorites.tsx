import React from 'react';
import { useEffect, useState } from "react";
import { getFavoritesByUserId, getUserId, getProductById, createNewCollection, getCollectionsByUserId, getProductsInCollection } from "../services/supabaseClient";

 interface Product {
    id: number;
    title: string;
    description?: string;
    price: number;
    category?: string;
    image_urls?: string;
    favorite_collection_id?: number | null;
}

interface Collection {
    id: number;
    owner_id: string;
    collection_name: string;
}

const MyFavorites: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [isNameSet, setIsNameSet] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [userId, setUserId] = useState<string| null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);


useEffect(() => {
    const fetchFavorites = async () => {
        const userId = await getUserId();
        setUserId(userId);
        if (userId) {
            const userFavorites = await getFavoritesByUserId(userId);
            

            const favoritesNotInCollection = userFavorites.filter(fav => !fav.favorite_collection_id);

            const uniqueProductIds = Array.from(new Set(favoritesNotInCollection.map(fav => fav.product_id)));

            const productsData = await Promise.all(
                uniqueProductIds.map(id => getProductById(id))
            );
            
            setProducts(productsData);
            setCollections(await getCollectionsByUserId(userId));
        }
    };

    fetchFavorites();
}, []);

    const handleProductAddToCollection = (productIds: number[]) => {
        console.log("Adding products to collection:", productIds);
        productIds.forEach(async (productId) => {
            await createNewCollection(userId, collectionName, productId);
        });
        setSelectedProducts([]);
    }

    if (isNameSet) {
        const toggleProduct = (productId: number) => {
            setSelectedProducts(prev =>
                prev.includes(productId)
                    ? prev.filter(id => id !== productId)
                    : [...prev, productId]
            );
        }

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-2xl w-full mx-4 text-center max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-white mb-2">Add Products to Collection</h2>
                    <p className="text-lg text-cyan-300 font-semibold mb-6">{collectionName}</p>
                    <p className="text-white/80 mb-6">Select products to add to your new collection. ({selectedProducts.length} selected)</p>
                    
                    {products.length === 0 ? (
                        <p className="text-white/60 py-8">No products available.</p>
                    ) : (
                        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white/5 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 flex items-center gap-4 cursor-pointer"
                                    onClick={() => toggleProduct(product.id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => toggleProduct(product.id)}
                                        className="w-5 h-5 cursor-pointer accent-cyan-400"
                                    />
                                    <div className="flex-1 text-left">
                                        <h3 className="text-white font-semibold">{product.title || 'Unnamed Product'}</h3>
                                        {product.description && (
                                            <p className="text-white/60 text-sm line-clamp-1">{product.description}</p>
                                        )}
                                        {product.category && (
                                            <span className="inline-block text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded mt-1">
                                                {product.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                            ${product.price?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className='flex justify-center gap-4'>
                        <button
                            className="btn-gradient px-6 py-3 rounded-full text-lg hover:shadow-2xl transition-all duration-300"
                            onClick={() => {
                                setIsNameSet(false);
                                setCollectionModalOpen(false);
                                setCollectionName("");
                                handleProductAddToCollection(selectedProducts);
                            }}
                        >
                            Finish
                        </button>
                        <button
                            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full text-lg transition-all duration-300"
                            onClick={() => {
                                setIsNameSet(false);
                                setCollectionName("");
                                setSelectedProducts([]);
                            }}
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (collectionModalOpen) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full mx-4 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Create New Collection</h2>
                    <div className="relative mb-6">
                        <input 
                            className="bg-transparent border border-white/20  px-4 py-2 mb-4 w-full text-white" 
                            placeholder="Collection Name" 
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)} 
                        />
                    </div>
                    
                        <div className='flex justify-center gap-4'>
                            <button
                            className={`px-6 py-3 rounded-full text-lg hover:shadow-2xl transition-all duration-300 ${collectionName.trim() ? 'btn-gradient' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                            disabled={!collectionName.trim()}
                            onClick={() => {
                                setIsNameSet(true);
                            }}
                            >
                            Suivant
                        </button>

                        <button
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-lg hover:shadow-2xl transition-all duration-300"
                            onClick={() => {
                                setCollectionModalOpen(false);
                                setCollectionName("");
                            }}
                            >
                            Close
                        </button>
                    
                    </div>
                </div>
            </div>
        );
    }

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
                                <div className="max-w-xl text-left">

                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl relative">
                                        My Favorites
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-cyan-200/5 to-blue-300/5 blur-2xl -z-10"></div>
                                    </h1>
                                    <p className="text-xl text-white/90 leading-relaxed font-light">
                                        Here you can find all the products you've marked as <span className="font-semibold text-cyan-300">favorites</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                
            <div className="relative z-10 w-full flex justify-end px-4 sm:px-6 lg:px-8 mb-8">
                <button className="btn-gradient px-6 py-3 rounded-full text-lg hover:shadow-5xl transition-all duration-800" onClick={() => setCollectionModalOpen(true)}>
                    + Create New Collection
                </button>
            </div>


            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
                {products.length === 0 && collections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full mx-4 text-center">
                                    <div className="relative mb-6">
                                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                      
                                    </div>

                                    
                                    <h2 className="text-2xl font-bold text-white mb-4">No Favorites Yet</h2>
                                    <p className="text-white/80 mb-6">You haven't added any products to your favorites list. Start exploring and add some!</p>
                                    <a href="/products" className="btn-gradient px-6 py-3 rounded-full text-lg hover:shadow-2xl transition-all duration-300">
                                        Browse Products
                                    </a>
                                </div>
                            </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {collections.map((collection) => (
                            <div
                                key={collection.id}
                                onClick={() => window.location.href = `/collections/${collection.id}`}
                                className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:bg-white/15 aspect-square flex flex-col"
                            >
                                <div className="relative overflow-hidden h-full">
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                                        <h2 className="text-lg font-bold text-white text-center px-2">
                                            {collection.collection_name || 'Unnamed Collection'}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {products.map((fav, index) => (
                            <div
                                key={fav.id}
                                onClick={() => window.location.href = `/products/${fav.id}`}
                                className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:bg-white/15 aspect-square flex flex-col"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="relative overflow-hidden h-2/3">
                                    <img
                                        src={fav.image_urls || '/placeholder-image.jpg'}
                                        alt={fav.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute top-2 right-2">
                                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                                    </div>
                                </div>
                                <div className="p-3 h-1/3 flex flex-col justify-between bg-gradient-to-t from-black/20 to-transparent">
                                    <div>
                                        <h2 className="text-sm font-semibold text-white mb-1 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                                            {fav.title || 'Unnamed Product'}
                                        </h2>
                                        {fav.description && (
                                            <p className="text-xs text-white/70 mb-1 line-clamp-1">{fav.description}</p>
                                        )}
                                        {fav.category && (
                                            <span className="inline-block text-xs bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded text-center mb-1">
                                                {fav.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                            ${fav.price?.toFixed(2) || '0.00'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyFavorites;