import React, { useState } from 'react';

interface Product {
    id: number;
    title: string;
    description?: string;
    price: number;
    category?: string;
    image_urls?: string;
    favorite_collection_id?: number | null;
}

interface DraggableProductProps {
    product: Product;
    isDragging?: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, productId: number) => void;
    onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
    onClick?: () => void;
}

const DraggableProduct: React.FC<DraggableProductProps> = ({
    product,
    isDragging = false,
    onDragStart,
    onDragEnd,
    onClick
}) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart?.(e, product.id)}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className={`group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing hover:bg-white/15 aspect-square flex flex-col
                ${isDragging ? 'opacity-50 border-cyan-400 border-2 shadow-cyan-400/50' : 'border-white/20'}
            `}
        >
            <div className="relative overflow-hidden h-2/3">
                <img
                    src={product.image_urls || '/placeholder-image.jpg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.jpg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                </div>
                {/* Drag indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-sm">
                    <div className="text-white text-center">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span className="text-xs font-semibold">Drag to collection</span>
                    </div>
                </div>
            </div>
            <div className="p-3 h-1/3 flex flex-col justify-between bg-gradient-to-t from-black/20 to-transparent">
                <div>
                    <h2 className="text-sm font-semibold text-white mb-1 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                        {product.title || 'Unnamed Product'}
                    </h2>
                    {product.description && (
                        <p className="text-xs text-white/70 mb-1 line-clamp-1">{product.description}</p>
                    )}
                    {product.category && (
                        <span className="inline-block text-xs bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded text-center mb-1">
                            {product.category}
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
    );
};

export default DraggableProduct;
