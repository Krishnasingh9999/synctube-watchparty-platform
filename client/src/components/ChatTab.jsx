import { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Smile } from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍', '🎉', '🍿'];

export default function ChatTab() {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { chatMessages, typingUsers, sendChatMessage, sendEmojiReaction, sendTypingStatus } = useRoomStore();
  const { user: currentUser } = useAuthStore();

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Handle typing triggers
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    sendChatMessage(text.trim());
    setText('');
    
    // Clear typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    sendTypingStatus(false);
  };

  // Compile typing notification text
  const getTypingText = () => {
    const activeNames = Object.values(typingUsers);
    if (activeNames.length === 0) return '';
    if (activeNames.length === 1) return `${activeNames[0]} is typing...`;
    if (activeNames.length === 2) return `${activeNames[0]} and ${activeNames[1]} are typing...`;
    return 'Several people are typing...';
  };

  return (
    <div className="flex h-[calc(100vh-290px)] min-h-[400px] flex-col bg-zinc-950/40 rounded-xl overflow-hidden">
      {/* Emoji Reactions Panel */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800/40 p-2 bg-zinc-900/10 justify-around">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendEmojiReaction(emoji)}
            className="rounded-lg p-1.5 text-xl transition-all duration-150 hover:scale-125 hover:bg-zinc-800/60 active:scale-95"
            title="React"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
            No messages yet. Send an invite link and start chatting!
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isSelf = msg.sender?.toString() === currentUser?.id?.toString() || msg.senderName === currentUser?.name;
            const isSystem = msg.isSystem;

            if (isSystem) {
              return (
                <div key={msg._id} className="flex justify-center">
                  <span className="rounded-full bg-zinc-900/60 px-3.5 py-1 text-xs text-zinc-500 border border-zinc-800/30">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg._id}
                className={`flex gap-2.5 max-w-[85%] ${
                  isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* User avatar */}
                <img
                  src={msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderName}`}
                  alt=""
                  className="h-8 w-8 rounded-lg bg-zinc-800/50 p-0.5 object-cover"
                />
                <div>
                  {/* Message Meta */}
                  <div
                    className={`flex items-baseline gap-1.5 mb-1 ${
                      isSelf ? 'justify-end' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-zinc-300">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-xl px-3.5 py-2 text-sm shadow-md ${
                      isSelf
                        ? 'bg-red-600/90 text-white rounded-tr-none'
                        : 'bg-zinc-800/80 text-zinc-100 rounded-tl-none border border-zinc-700/30'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicators */}
      <div className="px-4 py-1.5 h-6 text-[11px] text-zinc-400 font-medium">
        {getTypingText()}
      </div>

      {/* Input box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800/40 bg-zinc-900/10 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={handleInputChange}
          placeholder="Send a message..."
          className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-lg bg-red-600/95 hover:bg-red-600 p-2 text-white shadow-lg transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
