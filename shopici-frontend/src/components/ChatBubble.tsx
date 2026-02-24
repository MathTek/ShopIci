const ChatBubble = ({ message, sender, time, avatar, side = "start", footer = "Delivered" }) => {
    const isMe = side === "end";
    const bubbleColor = isMe ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900";
    const bubbleTail = isMe ? "after:right-0 after:border-blue-500" : "after:left-0 after:border-gray-200";
    return (
        <div className={`flex items-end mb-4 ${isMe ? "justify-end" : "justify-start"}`}>
            <div className={`relative max-w-xs px-4 py-2 rounded-2xl shadow-md ${bubbleColor} ${bubbleTail} after:absolute after:top-1/2 after:w-0 after:h-0 after:border-8 after:border-t-transparent after:border-b-transparent after:border-l-transparent after:border-r-transparent ${isMe ? "after:-right-4 after:border-l-8 after:border-l-blue-500" : "after:-left-4 after:border-r-8 after:border-r-gray-200"}`}>
                <div className="font-semibold text-sm mb-1">{sender}</div>
                <div className="text-base break-words">{message}</div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs opacity-70">{time}</span>
                    <span className="text-xs opacity-50">{footer}</span>
                </div>
            </div>

        </div>
    );
};

export default ChatBubble;
