import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, insertNewFavorite, deleteFavorite, 
    getFavoritesByUserId, getUserId, addAppreciation,
     getAppreciationsByProductId, getUserNameById, deleteAppreciation
    , calculateAverageRating } from "../services/supabaseClient";
import { useCart } from "../contexts/CartContext";
import { fetchScheduledPromosForProducts, getScheduledPromoPricing } from "../services/promoCodes";


interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
    category?: string;
    image_urls?: string;
    created_at: string;
    user_id: string;
    displayPrice?: number;
    promoBadge?: string | null;
    hasScheduledPromo?: boolean;
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
    const [openShareModal, setOpenShareModal] = useState(false);

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
                const promoMap = await fetchScheduledPromosForProducts([data.id]);
                const pricing = getScheduledPromoPricing(Number(data.price || 0), promoMap[data.id] || []);

                setProduct({
                    ...data,
                    displayPrice: pricing.displayPrice,
                    promoBadge: pricing.badgeText,
                    hasScheduledPromo: pricing.hasScheduledPromo,
                });

                setAppreciations(await getAppreciationsByProductId(productId!));


                const favorites = await getFavoritesByUserId(await getUserId());

                const currentUserId = await getUserId();

                setUserId((currentUserId ?? "") as string);


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
                    const newAppreciation: Appreciation = {
                        id: String(payload.new.id),
                        product_id: String(payload.new.product_id),
                        user_id: String(payload.new.user_id),
                        note: Number(payload.new.note),
                        comment: payload.new.comment ? String(payload.new.comment) : undefined,
                        created_at: String(payload.new.created_at),
                    };

                    setAppreciations(prev => [...prev, newAppreciation]);
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
            if (typeof me === 'string' && usernamesMap[me]) {
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

    if (openShareModal) {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        const shareText = `Check out this amazing product: ${product?.title}`;
        
        const shareLinks = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}&media=${encodeURIComponent(product?.image_urls || '')}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        };

        const handleCopyLink = () => {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-gradient-to-br from-[#0f172a] to-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

                    <button
                        onClick={() => setOpenShareModal(false)}
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Share This Product</h2>
                        <p className="text-white/60 text-sm">Share on your favorite platform</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <a
                            href={shareLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 transition-all group"
                            title="Share on Facebook"
                        >
                            <svg className="w-6 h-6 text-white/70 group-hover:text-[#1877F2] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a
                            href={shareLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/50 transition-all group"
                            title="Share on Twitter"
                        >
                            <svg className="w-6 h-6 text-white/70 group-hover:text-[#1DA1F2] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 002.856-3.45 10.009 10.009 0 01-2.8.856 4.994 4.994 0 002.165-2.723c-.95.563-2.005.974-3.127 1.195a4.992 4.992 0 00-8.506 4.547A14.148 14.148 0 011.671 3.149a4.993 4.993 0 001.546 6.657 4.973 4.973 0 01-2.26-.556v.06a4.993 4.993 0 003.997 4.888 4.996 4.996 0 01-2.252.085 4.994 4.994 0 004.644 3.461 10.01 10.01 0 01-6.177 2.129c-.399 0-.779-.023-1.17-.067a14.047 14.047 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                        </a>

                        <a
                            href={shareLinks.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 transition-all group"
                            title="Share on WhatsApp"
                        >
                            <svg className="w-6 h-6 text-white/70 group-hover:text-[#25D366] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371 0-.57 0-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.967 1.523 9.9 9.9 0 00-3.428 4.05 9.869 9.869 0 00.88 12.385 9.887 9.887 0 007.156 3.045h.005c2.407 0 4.663-.7 6.626-2.035 1.827-1.191 3.348-2.858 4.403-4.764a9.88 9.88 0 00.857-4.55 9.87 9.87 0 00-2.932-7.045A9.865 9.865 0 0011.052 6.98zM19.073 3.617c2.905 0 5.637 1.134 7.697 3.2A10.86 10.86 0 0130 15.073c0 3.013-.786 5.982-2.27 8.56a10.845 10.845 0 01-6.206 4.407 10.874 10.874 0 01-8.52-1.89 10.847 10.847 0 01-3.157-7.523 10.85 10.85 0 012.77-7.697A10.854 10.854 0 0119.073 3.617m0-2c-6.638 0-12 5.373-12 12 0 2.36.689 4.576 1.876 6.438A11.996 11.996 0 0019.073 32c6.627 0 12-5.373 12-12 0-2.36-.689-4.574-1.876-6.437A11.996 11.996 0 0019.073 1.617z"/>
                            </svg>
                        </a>

                        <a
                            href={shareLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/50 transition-all group"
                            title="Share on LinkedIn"
                        >
                            <svg className="w-6 h-6 text-white/70 group-hover:text-[#0A66C2] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.81 0-9.728h3.554v1.375c.429-.66 1.191-1.599 2.898-1.599 2.117 0 3.704 1.385 3.704 4.363v5.589zM5.337 8.855c-1.144 0-1.915-.761-1.915-1.712 0-.951.77-1.71 1.957-1.71 1.187 0 1.914.759 1.938 1.71 0 .951-.751 1.712-1.98 1.712zm1.946 11.597H3.392V9.142h3.891v11.31zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                            </svg>
                        </a>

                        <a
                            href={shareLinks.pinterest}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-[#E60023]/20 hover:border-[#E60023]/50 transition-all group"
                            title="Share on Pinterest"
                        >
                            <svg className="w-6 h-6 text-white/70 group-hover:text-[#E60023] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.937-.2-2.378.042-3.41.22-.937 1.409-5.98 1.409-5.98s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.767 1.518 1.686 0 1.026-.653 2.56-.99 3.984-.281 1.19.597 2.163 1.771 2.163 2.135 0 3.775-2.253 3.775-5.503 0-2.879-2.068-4.882-5.029-4.882-3.42 0-5.412 2.562-5.412 5.211 0 1.032.39 2.138.878 2.738.096.129.11.243.083.371l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        </a>

                        <a
                            href={shareLinks.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-[#0088cc]/20 hover:border-[#0088cc]/50 transition-all group"
                            title="Share on Telegram"
                        >
                            <svg className="w-6 h-6 text-white/70 group-hover:text-[#0088cc] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.328-.373-.115l-6.869 4.332-2.96-.924c-.643-.204-.657-.643.136-.953l11.566-4.458c.538-.197 1.006.128.832 1.126z"/>
                            </svg>
                        </a>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <p className="text-xs text-white/50 mb-3 text-center">Or copy the link</p>
                        <button
                            onClick={handleCopyLink}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
                        >
                            <svg className="w-4 h-4 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                        </button>
                    </div>
                </div>
            </div>
        )
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

                            <button onClick={() => setOpenShareModal(true)} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => addItem({ id: product.id, title: product.title, price: product.displayPrice ?? product.price, image_urls: product.image_urls })}
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
                            {product.hasScheduledPromo ? (
                                <div className="space-y-4">
                                    {product.promoBadge && (
                                        <div className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-4 py-2.5 backdrop-blur-sm shadow-lg shadow-emerald-600/20">
                                            <svg className="w-4 h-4 text-emerald-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M13 6a1 1 0 11-2 0 1 1 0 012 0zM13 12a1 1 0 11-2 0 1 1 0 012 0zM13 18a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                            <span className="text-sm font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">{product.promoBadge}</span>
                                        </div>
                                    )}
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl text-red-400 line-through">
                                        ${product.price?.toFixed(2) || '0.00'}
                                    </span>
                                    <span className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                                        ${(product.displayPrice ?? product.price).toFixed(2)}
                                    </span>
                                </div>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <div className="flex items-baseline gap-4">
                                        <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                            {(product.displayPrice ?? product.price)?.toLocaleString()} $
                                        </span>

                                    </div>

                                </div>
                            )}
                        </div>


                        <div className="flex mt-2 gap-4 items-center">
                            <div className="rating flex gap-1 !brightness-100 !contrast-100">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <input
                                        key={star}
                                        type="radio"
                                        name="rating"
                                        value={star}
                                        className={`mask mask-star-2 cursor-pointer transition-all w-7 h-7 !brightness-100 !contrast-100 ${(averageRating || 0) >= star ? '!bg-yellow-300' : 'bg-slate-600'}`}
                                        aria-label={`${star} star`}
                                        readOnly
                                        checked={averageRating === star}
                                    />
                                ))}
                            </div>
                            <span className="text-white font-medium">
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