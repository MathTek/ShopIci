import React from 'react';
import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { getProductsInCollection, getProductById, getCollectionById, removeProductFromCollection, getUserId } from "../services/supabaseClient";

interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    image_urls: string;
    category?: string;
}

interface Collection {
    id: number;
    collection_name: string;
    owner_id: string;
}

export default function Collection() {
    const { id } = useParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<{isOpen: boolean; productId: number | null}>({isOpen: false, productId: null});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCollection = async () => {
            if (id) {
                const collectionData = await getCollectionById(id);
                setCollection(collectionData);
                const productsInCollection = await getProductsInCollection(id);

                const fetchedProducts = await Promise.all(
                    productsInCollection.map((item: any) => getProductById(item.product_id))
                );
                setProducts(fetchedProducts);

            }
        };

        fetchCollection();
    }, [id]);

    const handleRemoveFromCollection = async (productId: number) => {
        const userId = await getUserId();
        if (userId && productId) {
            await removeProductFromCollection(userId, productId);
            setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));
        }
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
                                        Collection <span className="text-cyan-300">{collection?.collection_name}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-cyan-200/5 to-blue-300/5 blur-2xl -z-10"></div>
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-8 text-slate-400 hover:text-white transition-colors group"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to favorite
                </button>
                </div>
            </div>
            
            <div className="relative z-10 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {products.map((fav, index) => (
                            <div
                                key={fav.id}
                                onClick={() => window.location.href = `/products/${fav.id}`}
                                className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:bg-white/15 aspect-square flex flex-col"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2'>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowDeleteModal({isOpen: true, productId: fav.id});
                                        }}
                                        className="p-2 rounded-full bg-red-500/20 text-red-400  hover:text-red-300 transition-all duration-300"
                                        title="Remove from favorites"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
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
                        {showDeleteModal.isOpen && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setShowDeleteModal({isOpen: false, productId: null})}>
                                <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-center gap-4 mb-4">
                                        <h3 className="text-xl font-bold text-white">Remove from collection?</h3>
                                    </div>
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => setShowDeleteModal({isOpen: false, productId: null})}
                                            className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleRemoveFromCollection(showDeleteModal.productId!);
                                                setShowDeleteModal({isOpen: false, productId: null});
                                            }}
                                            className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>)}
                </div>
            </div>
            </div>
    );
}