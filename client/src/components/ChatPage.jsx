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
    }, [messages, loading, shouldAutoScroll]);

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
                    } catch {
                        botResponse = "Unknown Error";
                    }
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
        <div className="chat-page">
            <div className="chat-shell">
                <header className="chat-header">
                    <div className="chat-title-row">
                        <button
                            onClick={() => navigate(-1)}
                            className="chat-icon-button"
                            title="Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="chat-brand">
                            <div className="chat-avatar chat-avatar-bot">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h1>Test Mode</h1>
                                <span className="chat-status">
                                    <span></span>
                                    Operational
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClearChat}
                        className="chat-icon-button chat-danger-button"
                        title="Clear chat"
                    >
                        <Trash2 size={18} />
                    </button>
                </header>

                <div
                    className="chat-messages"
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                >
                    <div className="chat-message-list">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
                            >
                                <div className={`chat-avatar ${msg.role === 'user' ? 'chat-avatar-user' : 'chat-avatar-assistant'}`}>
                                    {msg.role === 'user' ? (
                                        <User size={16} />
                                    ) : (
                                        <Bot size={16} />
                                    )}
                                </div>

                                <div className="chat-message-content">
                                    <div className="chat-message-meta">
                                        {msg.role === 'user' ? 'You' : 'Assistant'}
                                    </div>
                                    <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : msg.isError ? 'chat-bubble-error' : 'chat-bubble-assistant'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="chat-message chat-message-assistant">
                                <div className="chat-avatar chat-avatar-assistant">
                                    <Bot size={16} />
                                </div>
                                <div className="chat-message-content">
                                    <div className="chat-message-meta">Assistant</div>
                                    <div className="chat-bubble chat-bubble-assistant chat-typing">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {showScrollButton && (
                        <button
                            onClick={() => scrollToBottom()}
                            className="chat-scroll-button"
                            title="Scroll to latest"
                        >
                            <ArrowDown size={20} />
                        </button>
                    )}
                </div>

                <footer className="chat-composer">
                    <div className="chat-composer-box">
                        <textarea
                            className="chat-input"
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
                            className="chat-send-button"
                            title="Send"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="chat-composer-hint">
                        Press Enter to send, Shift + Enter for new line
                    </p>
                </footer>
            </div>
        </div>
    );
}
