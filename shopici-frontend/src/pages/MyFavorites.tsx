import React from 'react';
import { useEffect, useState } from "react";
import { getFavoritesByUserId, getUserId, getProductById, createNewCollection, 
    getCollectionsByUserId, getProductsInCollection, addProductToCollection, 
    removeProductFromCollection, deleteCollection } from "../services/supabaseClient";
import DraggableProduct from '../components/DraggableProduct';
import DroppableCollection from '../components/DroppableCollection';

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
  const [draggedProductId, setDraggedProductId] = useState<number | null>(null);
  const [dropTargetCollectionId, setDropTargetCollectionId] = useState<number | null>(null);
  const [collectionProductCounts, setCollectionProductCounts] = useState<{ [key: number]: number }>({});


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
            const fetchedCollections = await getCollectionsByUserId(userId);
            setCollections(fetchedCollections);
            
            const counts: { [key: number]: number } = {};
            for (const collection of fetchedCollections) {
                const productsInColl = await getProductsInCollection(collection.id);
                counts[collection.id] = productsInColl.length;
            }
            setCollectionProductCounts(counts);
        }
    };

    fetchFavorites();
}, []);

    const handleProductAddToCollection = async (productIds: number[]) => {
        console.log("Adding products to collection:", productIds);
        for (const productId of productIds) {
            const collectionId = await createNewCollection(userId, collectionName, productId);
            if (collectionId) {
                setCollections(prev => [...prev, {
                    id: collectionId,
                    owner_id: userId || '',
                    collection_name: collectionName
                }]);
                
                setCollectionProductCounts(prev => ({
                    ...prev,
                    [collectionId]: 1
                }));
                
                setProducts(prev => prev.filter(p => p.id !== productId));
            }
        }
        setSelectedProducts([]);
        setCollectionName("");
        setIsNameSet(false);
        setCollectionModalOpen(false);
    }

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, productId: number) => {
        setDraggedProductId(productId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setDraggedProductId(null);
        setDropTargetCollectionId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setDropTargetCollectionId(null);
    };

    const handleDragOverCollection = (e: React.DragEvent<HTMLDivElement>, collectionId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTargetCollectionId(collectionId);
    };

    const handleDropOnCollection = async (e: React.DragEvent<HTMLDivElement>, collectionId: number) => {
        e.preventDefault();
        setDropTargetCollectionId(null);

        if (draggedProductId && userId) {
            try {
                const success = await addProductToCollection(userId, draggedProductId, collectionId);
                if (success) {
                    setProducts(prev => prev.filter(p => p.id !== draggedProductId));
                    
                    setCollectionProductCounts(prev => ({
                        ...prev,
                        [collectionId]: (prev[collectionId] || 0) + 1
                    }));

                    console.log(`Product ${draggedProductId} added to collection ${collectionId}`);
                }
            } catch (error) {
                console.error('Error adding product to collection:', error);
            }
        }
        setDraggedProductId(null);
    };

    const handleDeleteCollection = async (collectionId: number) => {
        const success = await deleteCollection(collectionId);
        if (success) {
            setCollections(prev => prev.filter(c => c.id !== collectionId));
        }
    };

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
                                onDragOver={(e) => handleDragOverCollection(e, collection.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDropOnCollection(e, collection.id)}
                            >
                                <DroppableCollection
                                    collection={collection}
                                    isDropTarget={dropTargetCollectionId === collection.id}
                                    productCount={collectionProductCounts[collection.id] || 0}
                                    onClick={() => window.location.href = `/collections/${collection.id}`}
                                    onDelete={handleDeleteCollection}
                                />
                            </div>
                        ))}
                        {products.map((fav, index) => (
                            <DraggableProduct
                                key={fav.id}
                                product={fav}
                                isDragging={draggedProductId === fav.id}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onClick={() => window.location.href = `/products/${fav.id}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyFavorites;