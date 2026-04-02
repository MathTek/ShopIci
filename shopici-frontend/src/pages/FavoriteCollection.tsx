import React from 'react';
import { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { getProductsInCollection, getProductById, getCollectionById } from "../services/supabaseClient";

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

    useEffect(() => {
        const fetchCollection = async () => {
            if (id) {
                const collectionData = await getCollectionById(id);
                setCollection(collectionData);
                const productsInCollection = await getProductsInCollection(id);
                console.log("Products in collection:", productsInCollection);

                const fetchedProducts = await Promise.all(
                    productsInCollection.map((item: any) => getProductById(item.product_id))
                );
                setProducts(fetchedProducts);
                console.log("Fetched products:", fetchedProducts);

            }
        };

        fetchCollection();
    }, [id]);


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
            </div>
            </div>
    );
}