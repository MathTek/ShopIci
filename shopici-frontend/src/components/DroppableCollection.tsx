import React, { useState } from 'react';

interface Collection {
    id: number;
    owner_id: string;
    collection_name: string;
}

interface DroppableCollectionProps {
    collection: Collection;
    isDropTarget?: boolean;
    productCount?: number;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>, collectionId: number) => void;
    onClick?: () => void;
    onDelete?: (collectionId: number) => void;
}

const DroppableCollection: React.FC<DroppableCollectionProps> = ({
    collection,
    isDropTarget = false,
    productCount = 0,
    onDragOver,
    onDragLeave,
    onDrop,
    onClick,
    onDelete
}) => {
    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop?.(e, collection.id)}
            onClick={onClick}
            className={`group relative aspect-square rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 transform
                ${isDropTarget 
                    ? 'scale-105 shadow-2xl' 
                    : 'hover:scale-105 shadow-xl hover:shadow-2xl'
                }
            `}
        >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 transition-all duration-500 ${
                isDropTarget
                    ? 'bg-gradient-to-br from-cyan-500/60 via-blue-500/40 to-purple-500/30'
                    : 'bg-gradient-to-br from-slate-700/50 via-slate-800/40 to-slate-900/30 group-hover:from-cyan-600/40 group-hover:via-blue-600/30 group-hover:to-purple-600/20'
            }`}></div>

            {/* Animated glowing particles background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-0 left-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 group-hover:animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>

            {/* Neon border effect */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none">
                <div className={`absolute inset-0 rounded-3xl transition-all duration-500 ${
                    isDropTarget
                        ? 'border-2 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6),inset_0_0_30px_rgba(34,211,238,0.1)]'
                        : 'border-2 border-slate-600/60 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4),inset_0_0_20px_rgba(34,211,238,0.05)]'
                }`}></div>
            </div>

            {/* Overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 py-8 gap-4">
                {/* Icon with animation */}
                <div className={`p-4 rounded-2xl transition-all duration-500 transform ${
                    isDropTarget 
                        ? 'bg-cyan-500/50 scale-110 animate-bounce text-cyan-100' 
                        : 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20 text-cyan-300 group-hover:from-cyan-500/40 group-hover:to-blue-500/30 group-hover:scale-110'
                }`}>
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4m0 0v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7" />
                    </svg>
                </div>

                {/* Collection name with gradient text */}
                <h2 className="text-center text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 line-clamp-2 leading-tight drop-shadow-lg group-hover:from-cyan-200 group-hover:to-purple-200 transition-all duration-300">
                    {collection.collection_name || 'Unnamed Collection'}
                </h2>

                {/* Divider line */}
                <div className={`h-0.5 w-12 transition-all duration-500 ${
                    isDropTarget
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-400 w-16'
                        : 'bg-gradient-to-r from-cyan-500/40 to-purple-500/40 group-hover:from-cyan-400 group-hover:to-blue-400 group-hover:w-16'
                }`}></div>

                {/* Product count with enhanced styling */}
                <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${
                    isDropTarget ? 'scale-110' : ''
                }`}>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-500 ${
                        isDropTarget
                            ? 'bg-cyan-500/60 text-cyan-50 shadow-lg shadow-cyan-500/50'
                            : 'bg-gradient-to-r from-slate-700/60 to-slate-800/60 text-cyan-300 group-hover:from-cyan-500/40 group-hover:to-blue-500/30 group-hover:text-cyan-100'
                    }`}>
                        <span className="font-extrabold text-base">{productCount}</span>
                        <span className="text-xs ml-1 font-semibold">
                            {productCount === 1 ? 'item' : 'items'}
                        </span>
                    </div>
                </div>

                {/* Drop indicator with animation */}
                {isDropTarget && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center animate-pulse">
                        <div className="flex flex-col items-center gap-2">
                            <svg className="w-6 h-6 text-cyan-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span className="text-xs font-bold text-cyan-300 tracking-widest">DROP HERE</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Corner accent lights */}
            <div className="absolute top-0 left-0 w-1 h-1 bg-cyan-400 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-1 h-1 bg-blue-400 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 left-0 w-1 h-1 bg-purple-400 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 right-0 w-1 h-1 bg-cyan-400 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Delete button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(collection.id);
                }}
                className="absolute top-3 right-3 z-20 p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                title="Delete collection"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default DroppableCollection;
