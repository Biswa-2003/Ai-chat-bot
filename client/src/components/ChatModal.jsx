import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, ArrowDown, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function ChatModal({ onClose, nodes, edges, setNodes }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Scroll handling
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Smart Scroll Logic
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        // Check if user is near bottom (within 100px)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShouldAutoScroll(isNearBottom);
        setShowScrollButton(!isNearBottom);
    };

    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Auto-scroll logic
    useEffect(() => {
        if (loading || messages[messages.length - 1]?.role === 'user' || shouldAutoScroll) {
            scrollToBottom();
        }
    }, [messages, loading]);

    const handleClearChat = () => {
        setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);
        setShouldAutoScroll(true);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setShouldAutoScroll(true); // Always scroll down on send

        try {
            // Update UserQuery Node
            const userQueryNode = nodes.find(n => n.type === 'userQuery');
            let currentNodes = nodes;
            if (userQueryNode) {
                currentNodes = nodes.map(n =>
                    n.id === userQueryNode.id
                        ? { ...n, data: { ...n.data, query: input } }
                        : n
                );
            }

            const payload = { nodes: currentNodes, edges };
            const response = await axios.post('http://localhost:8000/workflow/run', payload);
            let botResponse = response.data.final_response || "Workflow completed.";
            let isError = false;

            // Simple error heuristic
            if (typeof botResponse === 'string' && (botResponse.includes('Error') || botResponse.startsWith('{'))) {
                // Try to parse if it looks like JSON error
                if (botResponse.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(botResponse);
                        if (parsed.error) botResponse = parsed.error.message || "Unknown Error";
                    } catch (e) { }
                }
                if (botResponse.toLowerCase().includes('error')) isError = true;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: botResponse, isError }]);

        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message;
            setMessages(prev => [...prev, { role: 'assistant', content: "System Error: " + errorMsg, isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Modal Overlay - Fixed full screen, darkens background
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

            {/* Modal Content - Fixed dimensions, centered, flex column */}
            <div
                className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    height: '85vh',
                    maxHeight: '800px'
                }}
            >

                {/* 1. Header - Fixed Height */}
                <div className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0 z-10 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md text-white">
                            <Bot size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">AI Assistant</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleClearChat}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Clear Chat"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. Messages Area - Flex Grow, Scrollable */}
                <div
                    className="flex-1 overflow-y-auto bg-gray-50 p-6 scroll-smooth relative w-full"
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                >
                    <div className="flex flex-col gap-6">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${msg.role === 'user' ? 'bg-gray-200' : 'bg-indigo-100'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <User size={16} className="text-gray-600" />
                                        ) : (
                                            <Bot size={16} className="text-indigo-600" />
                                        )}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`py-3 px-4 text-[15px] leading-relaxed shadow-sm rounded-2xl ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : msg.isError
                                                ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex w-full justify-start">
                                <div className="flex gap-3 max-w-[85%] flex-row">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                        <Bot size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="bg-white border border-gray-100 py-4 px-5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>

                    {/* Scroll to Bottom Button (Overlay) */}
                    {showScrollButton && (
                        <button
                            onClick={() => scrollToBottom()}
                            className="fixed bottom-[130px] left-1/2 -translate-x-1/2 bg-white text-indigo-600 border border-indigo-100 shadow-xl rounded-full p-2 hover:bg-indigo-50 hover:scale-110 transition-all z-20"
                        >
                            <ArrowDown size={20} />
                        </button>
                    )}
                </div>

                {/* 3. Input Area - Fixed Base */}
                <div className="bg-white border-t p-4 flex-shrink-0 z-10 w-full">
                    <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <textarea
                            className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-sm outline-none text-gray-800 placeholder-gray-400 font-medium resize-none max-h-32 min-h-[44px]"
                            placeholder="Message user..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className={`p-2.5 rounded-lg transition shadow-sm mb-0.5 ${loading || !input.trim()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                }`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
