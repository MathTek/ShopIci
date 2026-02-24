import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "../services/supabaseClient";
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
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductDetails();
    }, [productId]);

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

            // if (error) {
            //     console.error("Error checking existing conversation:", error);
            //     return;
            // }

            if (existingConversation) {
                navigate(`/conversations/${existingConversation.id}`);
            } else {
                console.log("No existing conversation found. Creating a new one...");
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
                                console.log("Starting conversation with message:", selectedMessage);
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
        <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-cyan-500/30">
            
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-600/15 rounded-full blur-[120px]" />
            </div>

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
                                    Published on {new Date(product.created_at).toLocaleDateString()}
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

                 
                        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-md mt-8">
                            <h3 className="text-white font-semibold mb-4 text-lg">Product description</h3>
                            <div className="max-h-40 overflow-y-auto pr-2">
                                <p className="text-slate-400 leading-relaxed italic">
                                    "{product.description || "No description provided for this item."}"
                                </p>
                            </div>
                        </div>

                  
                        <div className="space-y-6 mt-8">
                            <div className="flex justify-center">
                                <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-bold rounded-2xl shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-1 active:scale-[0.98]"
                                    onClick={() => {checkconversation(product)}}
                                >
                                    Contact the seller
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white">
                                        {product.user_id.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Verified seller</p>
                                        <p className="text-slate-500 text-xs">Rating: ⭐️⭐️⭐️⭐️⭐️ (4.9/5)</p>
                                    </div>
                                </div>
                                <button className="text-xs text-cyan-400 hover:underline">View profile</button>
                            </div>
                        </div>

  
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