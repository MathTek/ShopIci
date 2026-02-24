import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBubble from '../components/ChatBubble';
import { supabase, getProductById, getConversationById, getUserNameById } from "../services/supabaseClient";


const Conversation: React.FC = () => {
    const {id: conversationId} = useParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const navigate = useNavigate();
    const [newMessage, setNewMessage] = useState<string>("");
    const [product, setProduct] = useState<any>(null);
    const [conversation, setConversation] = useState<any>(null);
    const [senderName, setSenderName] = useState<string>("");

    useEffect(() => {
        const getUserId = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUserId(session.user.id);
        };
        getUserId();
    }, [navigate]);


    useEffect(() => {
        if (!userId || !conversationId) return;
        const fetchMessages = async () => {
            const { data: messagesData, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            if (error) {
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
            if (!conversationData) return;
            setConversation(conversationData);
            const otherUserId = conversationData.buyer_id ? conversationData.seller_id != userId ? conversationData.seller_id : conversationData.buyer_id : null;
            if (otherUserId) {
                const userData = await getUserNameById(otherUserId);
                setSenderName(userData?.username || "");
            }
        };
        fetchConversation();
    }, [conversationId, userId]);

    useEffect(() => {
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
    }, [conversationId]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!conversation || !conversation.product_id) return;
            const productData = await getProductById(conversation.product_id);
            if (!productData) {
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

        };

    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-pink-400/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 flex justify-center items-center min-h-screen px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col gap-4">

          <div className="flex items-center gap-3 px-2">
            <button className="text-white/50 text-xl bg-transparent border-none cursor-pointer" onClick={() => navigate("/chat")}>←</button>
            <h1 className="text-white font-serif text-lg font-semibold tracking-wide">Conversation</h1>
            <div className="ml-auto w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
            <span className="text-white/40 text-xs">Online</span>
          </div>

          {product && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex gap-5 items-center shadow-lg">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-[-4px] bg-gradient-to-br from-cyan-400 to-indigo-400 rounded-xl blur-md opacity-50"></div>
                <img
                  src={product.image_urls}
                  alt={product.title}
                  className="w-22 h-22 object-cover rounded-xl relative z-10 border-2 border-white/20"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Product</p>
                <h2 className="text-white text-base font-bold font-serif mb-2 truncate">{product.title}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-cyan-400 text-xl font-extrabold font-serif">{product.price} €</span>
                  <a
                    href={`/products/${product.id}`}
                    className="px-4 py-1 bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-semibold rounded-md text-sm no-underline shadow-md"
                  >
                    View Listing →
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-bold text-white text-lg shadow-md">
                {senderName ? senderName.charAt(0).toUpperCase() : "?"}
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{senderName || "Unknown"}</p>
                <p className="text-green-400 text-xs mt-1">● Online</p>
              </div>
            </div>

            <div className="px-6 py-6 max-h-[400px] overflow-y-auto flex flex-col">
              <div className="text-center mb-5">
                <span className="bg-white/10 text-white/40 text-xs px-4 py-1 rounded-full tracking-wider">Today</span>
              </div>

              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg.content}
                  sender={msg.sender}
                  time={new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  avatar={msg.avatar}
                  side={msg.sender_id === userId ? "end" : "start"}
                  footer={msg.status}
                />
              ))}
            </div>

            <div className="px-5 py-4 border-t border-white/10 bg-black/20">
              <form
                className="flex gap-3 items-center"
                onSubmit={e => {
                  e.preventDefault();
                  if (newMessage.trim()) {
                    sendMessage(newMessage);
                    setNewMessage("");
                  }
                }}
              >
                <button type="button" className="bg-transparent border-none cursor-pointer text-xl opacity-50 flex-shrink-0">☺</button>

                <input
                  type="text"
                  placeholder="Write your message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none font-inherit"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`w-12 h-12 rounded-xl border-none flex items-center justify-center flex-shrink-0 transition-all duration-200 ${newMessage.trim() ? 'bg-gradient-to-br from-cyan-400 to-blue-500 cursor-pointer shadow-lg' : 'bg-white/10 cursor-not-allowed'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-white/20 text-xs tracking-wider">
            Your messages are end-to-end encrypted 🔒
          </p>
        </div>
      </div>
    </div>
    );
}


export default Conversation;