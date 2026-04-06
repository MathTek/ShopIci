import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, insertNewFavorite, deleteFavorite, 
    getFavoritesByUserId, getUserId, addAppreciation,
     getAppreciationsByProductId, getUserNameById, deleteAppreciation
    , calculateAverageRating } from "../services/supabaseClient";
import { useCart } from "../contexts/CartContext";


interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
    category?: string;
    image_urls?: string;
    created_at: string;
    user_id: string;
}

interface Appreciation {
    id: string;
    product_id: string;
    user_id: string;
    note: number;
    comment?: string;
    created_at: string;
}

const ProductDetails: React.FC = () => {
    const { id: productId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [conversationPopupOpen, setConversationPopupOpen] = useState(false);
    const [isSend, setIsSend] = useState(false);
    const [userId, setUserId] = useState<string>("");
    const [sellerId, setSellerId] = useState<string>("");
    const [sellerName, setSellerName] = useState<any>("");
    const [alreadyAppreciated, setAlreadyAppreciated] = useState(false);
    const [isMyComment, setIsMyComment] = useState(false);
    const [averageRating, setAverageRating] = useState<number | null>(null);

    const predefinedMessages = [
        "Bonjour, ce produit est-il toujours disponible ?",
        "Je suis intéressé par votre annonce.",
        "Pouvez-vous me donner plus de détails ?",
        "Est-ce possible d'avoir une remise ?",
        "Quel est l'état du produit ?"
    ];
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [sendLoading, setSendLoading] = useState(false);
    const { addItem } = useCart();
    const [hoverRating, setHoverRating] = useState(0);
    const [note, setNote] = useState<number>(0);
    const [comment, setComment] = useState<string>("");
    const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
    const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
    const [isMyProduct, setIsMyProduct] = useState(false);


    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();
                if (error) throw error;
                setProduct(data);

                setAppreciations(await getAppreciationsByProductId(productId!));


                const favorites = await getFavoritesByUserId(await getUserId());

                const userId = await getUserId();

                setUserId(userId);


                if (favorites.some(fav => fav.product_id === productId)) {
                    setIsFavorite(true);

                }
                if (data.user_id === await getUserId()) {
                    setIsMyProduct(true);           
                } 
                
                const sellerName = await getUserNameById(data.user_id);
                setSellerName(sellerName);

                const avgRating = await calculateAverageRating(productId);
                setAverageRating(avgRating);

            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductDetails();
    }, [productId]);

    useEffect(() => {
        if (!productId) return;

        const channel = supabase
            .channel(`product-appreciation-${productId}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'product_appreciation',
                    filter: `product_id=eq.${productId}`
                },
                (payload) => {
                    setAppreciations(prev => [...prev, payload.new]);
                }
            )
            .subscribe(() => {
          
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [productId]);

    useEffect(() => {
        const loadUsernames = async () => {
            if (appreciations.length === 0) return;

            const missingUserIds = Array.from(
                new Set(
                    appreciations
                        .map(appreciation => appreciation.user_id)
                        .filter(userId => !usernames[userId])
                )
            );

            if (missingUserIds.length === 0) return;

            const usersData = await Promise.all(
                missingUserIds.map(userId => getUserNameById(userId))
            );

            const usernamesMap: { [key: string]: string } = {};
            missingUserIds.forEach((userId, index) => {
                const userData = usersData[index];
                usernamesMap[userId] = userData?.username || 'Anonymous';
            });

            const me = await getUserId();
            if (usernamesMap[me]) {
                setAlreadyAppreciated(true);
            }
            setUsernames(prev => ({ ...prev, ...usernamesMap }));
        };

        loadUsernames();
    }, [appreciations, usernames]);

    const handleShare = async () => {
        const shareData = {
            title: product?.title,
            text: product?.description,
            url: window.location.href,
        };
        try {
            if (navigator.share) await navigator.share(shareData);
            else navigator.clipboard.writeText(window.location.href);
        } catch (err) { console.error(err); }
    };

    const checkconversation = async (product: Product) => {
        try {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            
            const userId = session.user.id;
            const sellerId = product.user_id;

            setUserId(userId);
            setSellerId(sellerId);

            const { data: existingConversation, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('buyer_id', userId)
                .eq('seller_id', sellerId)
                .eq('product_id', productId)
                .single();

         

            if (existingConversation) {
                navigate(`/conversations/${existingConversation.id}`);
            } else {
               
                setConversationPopupOpen(true);
            }

        } catch (error) {
            console.error("Error checking conversation:", error);
        }
    };


    const sendMessage = async (selectedMessage: string) => {
        try {
            const { data: newConversation, error } = await supabase
                .from('conversations')
                .insert({
                    buyer_id: userId,
                    seller_id: sellerId,
                    product_id: productId,
                })
                .select()
                .single();
                
            if (error) {
                console.error("Error creating conversation:", error);
                return;
            }

            const {data: message, error: messageError} = await supabase
                .from('messages')
                .insert({
                    conversation_id: newConversation.id,
                    sender_id: userId,
                    content: selectedMessage || "Hello, I'm interested in your product!",
                })
                .select()
                .single();
                
            if (messageError) {
                console.error("Error sending initial message:", messageError);
                return;
            }

            navigate(`/conversations/${newConversation.id}`);
        } catch (error) {
            console.error("Error starting conversation:", error);
        }
    };

    const handleFavoriteToggle = async () => {
        setIsFavorite(!isFavorite);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const userId = session.user.id;
            

            if (!isFavorite) {
                await insertNewFavorite(userId, productId!);
            } else {
                await deleteFavorite(userId, productId!);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }

        return;
    };

    const handleAddAppreciation = async (ratingValue: number, commentValue: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const userId = session.user.id;

            await addAppreciation(productId!, userId, ratingValue, commentValue);
            setNote(0);
            setComment("");
            setHoverRating(0);
        } catch (error) {
            console.error("Error adding appreciation:", error);
        }
    };

    const handleDeleteAppreciation = async (appreciationId: string) => {
        const success = await deleteAppreciation(appreciationId);
        if (success) {
            setAppreciations((prev) => prev.filter((app) => app.id !== appreciationId));
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <span className="relative flex h-12 w-12">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-12 w-12 bg-cyan-500"></span>
            </span>
        </div>
    );

    if (!product) return <div className="text-white text-center mt-20">Product not found.</div>;

    if (conversationPopupOpen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-slate-900 rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6 text-center">Choose a message to start the conversation</h2>
                    <div className="space-y-4">
                        {predefinedMessages.map((msg, idx) => (
                            <button
                                key={idx}
                                className={`w-full py-3 px-4 font-semibold rounded-xl transition-all shadow-md mb-2 ${selectedMessage === msg ? 'bg-cyan-400 text-[#0f172a]' : 'bg-cyan-500 hover:bg-cyan-400 text-[#0f172a]'}`}
                                onClick={() => setSelectedMessage(msg)}
                            >
                                {msg}
                            </button>
                        ))}
                    </div>
                    {selectedMessage && (
                        <button
                            className="mt-6 w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-bold rounded-xl transition-all shadow-md"
                            disabled={sendLoading}
                            onClick={async () => {
                                setSendLoading(true);
                              
                                setConversationPopupOpen(false);
                                setSendLoading(false);
                                setIsSend(true);
                                sendMessage(selectedMessage);
                            }}
                        >
                            Envoyer
                        </button>
                    )}
                    <button
                        className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
                        onClick={() => setConversationPopupOpen(false)}
                    >
                        Annuler
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-12">
       
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-8 text-slate-400 hover:text-white transition-colors group"
                >
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to shop
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    
          
                    <div className="space-y-8 max-w-md mx-auto lg:mx-0">
                        <div className="relative group rounded-3xl overflow-hidden bg-slate-800/50 border border-white/10 p-2 backdrop-blur-sm">
                            <div className="aspect-[3/2] rounded-2xl overflow-hidden relative">
                                {imageLoading && (
                                    <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center" />
                                )}
                                <img
                                    src={product.image_urls || '/placeholder.jpg'}
                                    alt={product.title}
                                    onLoad={() => setImageLoading(false)}
                                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                />
                     
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            
                           
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                <span className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                                    🟢 In Stock
                                </span>
                            </div>
                        </div>

                      
                        <div className="flex gap-4 mt-6 justify-center lg:justify-start">
                           
                            <button onClick={handleShare} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => addItem({ id: product.id, title: product.title, price: product.price, image_urls: product.image_urls })}
                                className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-bold shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all"
                            >
                                Add to cart
                            </button>
                            <button
                                onClick={handleFavoriteToggle}
                                className={`p-4 rounded-2xl border border-white/10 transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                            >
                                {isFavorite ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                )}
                                <span className="text-slate-400 text-sm">
                                </span>
                            </button>
                        </div>
                    </div>

             
                    <div className="flex flex-col space-y-10">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-cyan-400 font-medium text-sm tracking-widest uppercase">
                                    {product.category || 'General'}
                                </span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                <span className="text-slate-500 text-sm">
                                    Published on {new Date(product.created_at).toLocaleDateString()} by {isMyProduct ? "You" : sellerName.username || "Unknown Seller"}
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
                                {product.title}
                            </h1>
                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                    {product.price?.toLocaleString()} €
                                </span>
                               
                            </div>
                        </div>


                        <div className="flex mt-2 gap-4 items-center">
                            <div className="rating flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <input
                                        key={star}
                                        type="radio"
                                        name="rating"
                                        value={star}
                                        className={`mask mask-star-2 cursor-pointer transition-all ${averageRating >= star ? 'bg-orange-400' : 'bg-gray-400'}`}
                                        aria-label={`${star} star`}
                                        readOnly
                                        checked={averageRating === star}
                                    />
                                ))}
                            </div>
                            <span className="text-slate-400 text-sm">
                                {averageRating ? averageRating.toFixed(1) : 'No ratings yet'}
                            </span>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-md mt-8">
                            <h3 className="text-white font-semibold mb-4 text-lg">Product description</h3>
                            <div className="max-h-40 overflow-y-auto pr-2">
                                <p className="text-slate-400 leading-relaxed italic">
                                    "{product.description || "No description provided for this item."}"
                                </p>
                            </div>
                        </div>

                        {!isMyProduct && !alreadyAppreciated && (<div className="flex justify-center mt-8">
                            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm w-full max-w-2xl">
                                <div className='flex flex-col gap-4'>
                                    <input
                                        type="text"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Leave a comment and a rating (1-5)"
                                        aria-label="Leave a comment and a rating (1-5)"
                                        className="w-full p-4 rounded-xl bg-slate-800/50 border border-white/20 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    <div className="rating flex gap-1 justify-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <input
                                                key={star}
                                                type="radio"
                                                name="rating-2"
                                                value={star}
                                                className={`mask mask-star-2 cursor-pointer transition-all ${hoverRating >= star || note >= star ? 'bg-orange-400' : 'bg-gray-400'}`}
                                                aria-label={`${star} star`}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                checked={note === star}
                                                onChange={(e) => setNote(parseInt(e.target.value))}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-bold rounded-xl w-full"
                                    onClick={() => handleAddAppreciation(note, comment)}
                                    disabled={note < 1 || note > 5 || comment.trim() === ""}
                                    aria-disabled={note < 1 || note > 5 || comment.trim() === ""}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>)}

                        <div className="flex justify-center mt-8">
                            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm w-full max-w-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-white font-semibold text-xl">Reviews</h3>
                                    {appreciations.length > 0 && (
                                    <span className="text-xs text-slate-400 bg-white/10 rounded-full px-3 py-1">
                                        {appreciations.length} review{appreciations.length > 1 ? "s" : ""}
                                    </span>
                                    )}
                                </div>

                                <div className="space-y-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                    {appreciations.length === 0 ? (
                                    <p className="text-slate-400 text-sm text-center py-8">No reviews yet</p>
                                    ) : (
                                    appreciations.map((appreciation) => {
                                        const colors = ['from-purple-500 to-blue-500', 'from-cyan-500 to-blue-500', 'from-pink-500 to-red-500'];
                                        const colorIndex = String(appreciation.id)?.charCodeAt(0) % 3 || 0;
                                        const username = usernames[appreciation.user_id] || 'Anonymous';
                                        const userInitial = username?.charAt(0).toUpperCase() || 'U';
                                        const date = new Date(appreciation.created_at).toDateString();


                                        return (
                                        <div
                                            key={appreciation.id}
                                            className="bg-slate-800/60 border border-white/10 rounded-lg p-4 hover:bg-slate-800/80 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                    {userInitial}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium text-sm truncate">{username}</p>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, index) => (
                                                    <svg
                                                        key={index}
                                                        className={`w-4 h-4 ${index < appreciation.note ? 'text-orange-400' : 'text-slate-600'}`}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M10 15l-5.878 3.09L5.64 12.545.763 9.455l6.06-.545L10 3l2.177 5.91 6.06.545-4.877 3.09 1.518 4.545L10 15z" />
                                                    </svg>
                                                    ))}
                                                </div>
                                                {appreciation.user_id === userId && (
                                                    <div className="flex justify-end">
                                                        <button className="text-sm text-red-500 hover:underline" onClick={() => handleDeleteAppreciation(appreciation.id)}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="flex justify-center">
                                                    <p className="text-slate-300 text-sm leading-relaxed text-center">
                                                        {date}
                                                    </p>
                                                </div>
                                            </div>
                                            {appreciation.comment && (
                                                <p className="text-slate-300 text-sm leading-relaxed text-center">
                                                {appreciation.comment}
                                                </p>
                                            )}
                                        </div>
                                        );
                                    })
                                    )}
                                </div>
                            </div>
                        </div>

                  
                        {!isMyProduct && (<div className="space-y-6 mt-8">
                            <div className="flex justify-center">
                                <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-bold rounded-2xl shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1 active:scale-[0.98]"
                                    onClick={() => {checkconversation(product)}}
                                >
                                    Contact the seller
                                </button>
                            </div>
                            
                        </div>)}

  
                        <div className="grid grid-cols-2 gap-6 mt-8">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <span className="text-xs text-slate-300">Secure payment</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <span className="text-xs text-slate-300">24/7 support</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;