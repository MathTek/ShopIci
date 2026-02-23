import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBubble  from '../components/ChatBubble';


const Conversation: React.FC = () => {
    const {id: conversationId} = useParams();
    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="container mx-auto px-4 py-12">
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-lg">
                    <ChatBubble
                        message="You were the Chosen One!"
                        sender="Obi-Wan Kenobi"
                        time="12:45"
                        avatar="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                        side="start"
                        footer="Delivered"
                    />

                    <ChatBubble
                        message="I hate you!"
                        sender="Anakin Skywalker"
                        time="12:46"
                        avatar="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                        side="end"
                        footer="Seen"
                    />

                </div>
            </div>
        </div>
    );
}

export default Conversation;