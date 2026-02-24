import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBubble  from '../components/ChatBubble';
import { supabase, getProductById, getConversationById, getUserNameById } from "../services/supabaseClient";



const Conversation: React.FC = () => {
    const {id: conversationId} = useParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const navigate = useNavigate();
    const [newMessage, setNewMessage] = useState<string>("");
    const [product, setProduct] = useState<any>(null);
    const [conversation, setConversation] = useState<any>(null);

    useEffect(() => {
        const getUserId = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            const userId = session.user.id;
            setUserId(userId);
        };
        getUserId();

        if (!userId || !conversationId) return;
        const fetchMessages = async () => {
            const { data: messagesData, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            if (error) {
                console.error("Error fetching messages:", error);
                return;
            }
            const enrichedMessages = await Promise.all(
                messagesData.map(async (msg) => {
                    const user = await getUserNameById(msg.sender_id);
                    return { ...msg, sender: user?.username || msg.sender_id };
                })
            );
            setMessages(enrichedMessages);
        };
        fetchMessages();

        const fetchConversation = async () => {
            const conversationData = await getConversationById(conversationId);
            if (!conversationData) {
                console.error("Conversation not found");
                return;
            }
            setConversation(conversationData);
        };
        fetchConversation();
    }, [conversationId, userId, navigate]);

    useEffect(() => {
        if (!userId || !conversationId) return;
        const channel = supabase
            .channel(`messages-${conversationId}`)
            .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            },
            async (payload) => {
                const user = await getUserNameById(payload.new.sender_id);
                setMessages((prev) => [...prev, { ...payload.new, sender: user?.username || payload.new.sender_id }]);
            }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, userId]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!conversation || !conversation.product_id) return;
            const productData = await getProductById(conversation.product_id);
            if (!productData) {
                console.error("Product not found");
                return;
            }
            setProduct(productData);
        };

        const fetchConversationOpene = async () => {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('conversation_id', conversationId);
        };
        fetchConversationOpene();

        fetchProduct();
    }, [conversation]);

        const sendMessage = async (content: string) => {
            if (!userId) return;

            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: userId,
                    content,
                });

            if (error) {
                console.error("Error sending message:", error);
                return;
            }
        };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[80vh]">
                <div className="w-full max-w-2xl flex flex-col gap-6">
                    {product && (
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6 mb-2">
                            <img
                                src={product.image_urls}
                                alt={product.title}
                                className="w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-2xl border-2 border-cyan-400 shadow-lg"
                            />
                            <div className="flex-1 min-w-0 flex flex-col gap-2 items-center sm:items-start">
                                <h2 className="text-2xl font-bold text-white truncate w-full text-center sm:text-left">{product.title}</h2>
                                <div className="text-cyan-300 text-xl font-semibold">{product.price} €</div>
                                <a
                                    href={`/products/${product.id}`}
                                    className="mt-3 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md transition-all text-base"
                                >
                                    View Product
                                </a>
                            </div>
                        </div>
                    )}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg flex flex-col gap-4">
                        <div className="flex-1 overflow-y-auto max-h-[60vh] mb-4">
                            {userId && messages.map((msg) => (
                                <ChatBubble
                                    key={msg.id}
                                    message={msg.content}
                                    sender={msg.sender}
                                    time={new Date(msg.created_at).toLocaleTimeString()}
                                    avatar={msg.avatar}
                                    side={msg.sender_id === userId ? "end" : "start"}
                                    footer={msg.status}
                                />
                            ))}
                        </div>
                        <form
                            className="flex items-center gap-3 bg-gray-800/80 rounded-xl px-4 py-3 shadow-lg border border-gray-700 focus-within:border-cyan-400 transition-all"
                            onSubmit={e => {
                                e.preventDefault();
                                if (newMessage.trim()) {
                                    sendMessage(newMessage);
                                    setNewMessage("");
                                }
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-base shadow-sm border border-gray-700"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-lg shadow-md transition-all flex items-center gap-2"
                                disabled={!newMessage.trim()}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default Conversation;