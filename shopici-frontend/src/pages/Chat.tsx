import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBubble  from '../components/ChatBubble';
import { supabase, getUserId, getUserNameById, getProductById, deleteConversationById } from "../services/supabaseClient";


const  Chat = () => {

    const [conversation, setConversation] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [userNames, setUserNames] = useState<{ [key: string]: any }>({});
    const [products, setProducts] = useState<{ [key: string]: any }>({});

    const handleDeleteConversation = async (conversationId: string) => {
        await deleteConversationById(conversationId);

        setConversation((prev) => prev.filter((conv) => conv.id !== conversationId));
    };

    useEffect(() => {

        const fetchUserId = async () => {
            const id = await getUserId();
            setUserId(id);
        }

        fetchUserId();
    }, []);


    useEffect(() => {
        if (!userId) return; 
        

        const fetchConversation = async () => {
            const { data: conversationData, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching conversation:", error);
                return;
            }

            setConversation(conversationData);

            const idsToFetch = Array.from(new Set(conversationData.map(msg => (msg.seller_id === userId ? msg.buyer_id : msg.seller_id))));
            const names: { [key: string]: any } = {};
            await Promise.all(idsToFetch.map(async (id) => {
                if (!id) return;
                const userName = await getUserNameById(id);
                names[id] = userName;
            }));
            setUserNames(names);

            const productIds = Array.from(new Set(conversationData.map(msg => msg.product_id)));
            const products: { [key: string]: any } = {};
            await Promise.all(productIds.map(async (id) => {
                if (!id) return;
                const product = await getProductById(id);
                products[id] = product;
            }));
            setProducts(products);
        };

        fetchConversation();
    }, [userId]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="relative z-10 py-8">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-2xl relative">
                                My Chat
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-cyan-200/5 to-blue-300/5 blur-2xl -z-10"></div>
                            </h1>
                            <p className="text-xl text-white/90 leading-relaxed font-light">
                                View your chat <span className="font-semibold text-cyan-300">messages</span>
                            </p>
                        </div>
                    </div>

                    <div className="px-4 sm:px-6 lg:px-8">
                            {conversation.length === 0 ? (
                    
                            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full mx-4 text-center">
                            
                                    <div className="relative mb-6">
                                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                            <span className="text-xs">✨</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        You have no conversations for the moment
                                    </h3>
                                    
                                    <p className="text-white/70 mb-6 leading-relaxed">
                                        Go to the store and contact some sellers to start chatting with them. <br />
                                        It's <span className="text-cyan-300 font-semibold">quick and easy</span>!
                                    </p>

                                    <div className="flex justify-center">
                                        <a href="/products" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition duration-300">
                                            Browse Products
                                        </a>

                                    </div>
                                </div>
                            </div>
                        ) : (

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-stretch">
                                {conversation.map((msg) => {
                                    const otherUserId = msg.seller_id === userId ? msg.buyer_id : msg.seller_id;
                                    const product = products[msg.product_id];
                                    const userName = userNames[otherUserId];
                                    const avatarUrl = userName?.avatarUrl || "https://img.daisyui.com/images/profile/demo/kenobee@192.webp";
                                    return (
                                      <div className="relative group w-full" key={msg.id}>
                                        <div className="flex items-center w-full gap-5 bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-cyan-900/60 border border-white/10 rounded-xl p-6 shadow hover:shadow-xl hover:border-cyan-400 transition-all duration-200 cursor-pointer overflow-hidden min-h-[90px]">
                                          <a
                                            key={msg.id}
                                            href={`/conversations/${msg.id}`}
                                            className="flex items-center gap-5 flex-1 min-w-0"
                                          >
                                            <div className="relative flex-shrink-0">
                                              <img
                                                src={product?.image_urls}
                                                alt={userName?.username || 'Unknown User'}
                                                className="w-14 h-14 rounded-lg border border-cyan-400 shadow-sm group-hover:border-purple-400 transition-all object-cover bg-white"
                                              />
                                              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg font-semibold text-white group-hover:text-cyan-300 truncate">
                                                  {userName?.username || 'Unknown User'}
                                                </span>
                                                <span className="px-2 py-0.5 text-xs rounded bg-cyan-500/80 text-white font-medium group-hover:bg-purple-500/80">
                                                  {msg.seller_id === userId ? 'Buyer' : 'Seller'}
                                                </span>
                                              </div>
                                              <div className="text-white/80 text-base truncate">
                                                {product ? `Product: ${product.title}` : 'No product info'}
                                              </div>
                                            </div>
                                            <div className="ml-auto">
                                              <svg className="w-6 h-6 text-cyan-400 group-hover:text-purple-400 transition-all" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                              </svg>
                                            </div>
                                          </a>
                                          <button
                                            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/80 shadow border border-white/20 transition-all duration-200 group/delete ml-2 focus:outline-none focus:ring-2 focus:ring-red-400 hover:scale-110 hover:shadow-lg"
                                            onClick={() => handleDeleteConversation(msg.id)}
                                            title="Delete conversation"
                                            tabIndex={0}
                                            style={{ pointerEvents: 'auto' }}
                                          >
                                            <svg className="w-5 h-5 text-red-500 group-hover/delete:text-white transition-all" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                })}
                            </div>

                        )}
                    </div>
                </div>
        </div>
    </div>
        
    );
}

export default Chat;