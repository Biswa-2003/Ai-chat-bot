import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, ArrowDown, Trash2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI assistant. I am ready to test your workflow.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [workflowData, setWorkflowData] = useState({ nodes: [], edges: [] });

    // Scroll handling
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Load workflow data on mount
    useEffect(() => {
        const storedData = localStorage.getItem('testWorkflow');
        if (storedData) {
            try {
                setWorkflowData(JSON.parse(storedData));
            } catch (e) {
                console.error("Failed to parse workflow data", e);
                setMessages([{ role: 'assistant', content: 'Error: Could not load workflow data.' }]);
            }
        } else {
            setMessages([{ role: 'assistant', content: 'Error: No workflow data found. Please go back to the builder and click "Test Chat" again.' }]);
        }
    }, []);

    // Smart Scroll Logic
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        // Show scroll button if user is more than 150px from bottom (generous buffer)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        setShouldAutoScroll(isNearBottom);
        setShowScrollButton(!isNearBottom);
    };

    const scrollToBottom = (behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Auto-scroll trigger
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (loading || lastMsg?.role === 'user' || shouldAutoScroll) {
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
        setShouldAutoScroll(true);

        try {
            const { nodes, edges } = workflowData;
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

            if (typeof botResponse === 'string' && (botResponse.includes('Error') || botResponse.startsWith('{'))) {
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
        <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center">
            {/* Main Window - Fixed Layout using Absolute Positioning for strict control */}
            <div className="relative w-full max-w-4xl h-full sm:h-[95vh] sm:rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">

                {/* 1. Header (Top Fixed) */}
                <div className="absolute top-0 left-0 right-0 h-16 border-b bg-white flex items-center justify-between px-6 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                            title="Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md text-white">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-800 text-lg leading-tight">Test Mode</h1>
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    Operational
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClearChat}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* 2. Messages Area (Middle Scrollable) 
                    - Top: 64px (Header height)
                    - Bottom: 80px (Approximate Input height, flex-grow allows it to fit perfectly)
                */}
                <div
                    className="absolute top-16 bottom-[100px] left-0 right-0 overflow-y-auto bg-slate-50"
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                >
                    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-white border border-gray-200'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <User size={16} className="text-indigo-600" />
                                        ) : (
                                            <Bot size={16} className="text-indigo-600" />
                                        )}
                                    </div>

                                    <div className={`py-3 px-4 text-[15px] leading-relaxed shadow-sm rounded-2xl ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : msg.isError
                                                ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex w-full justify-start">
                                <div className="flex gap-3 max-w-[80%] flex-row">
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                        <Bot size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="bg-white border border-gray-200 py-4 px-5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Floating Scroll Button */}
                    {showScrollButton && (
                        <button
                            onClick={() => scrollToBottom()}
                            className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-white text-indigo-600 border border-indigo-100 shadow-xl rounded-full p-2.5 hover:bg-indigo-50 hover:scale-105 transition-all z-30"
                        >
                            <ArrowDown size={20} />
                        </button>
                    )}
                </div>

                {/* 3. Footer (Bottom Fixed) */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 z-20 h-[100px]">
                    <div className="max-w-3xl mx-auto flex gap-2 items-end bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <textarea
                            className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-sm outline-none text-gray-800 placeholder-gray-400 font-medium resize-none max-h-32 min-h-[44px]"
                            placeholder="Type your message..."
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
                    <p className="text-center text-[10px] text-gray-400 mt-1">
                        Press Enter to send, Shift + Enter for new line
                    </p>
                </div>

            </div>
        </div>
    );
}
