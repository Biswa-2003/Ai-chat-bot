import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [stacks, setStacks] = useState([
        { id: '1', name: 'Chat With AI', description: 'Chat with a smart AI' },
        { id: '2', name: 'Content Writer', description: 'Helps you write content' },
        { id: '3', name: 'Content Summarizer', description: 'Helps you summarize content' },
    ]);
    const [newStackName, setNewStackName] = useState('');
    const [newStackDesc, setNewStackDesc] = useState('');

    const handleCreate = () => {
        if (!newStackName) return;
        const newId = Date.now().toString();
        const newStack = { id: newId, name: newStackName, description: newStackDesc };
        setStacks([...stacks, newStack]);
        setShowModal(false);
        navigate(`/stack/${newId}`);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        AI
                    </div>
                    <span className="text-xl font-bold text-gray-800 tracking-tight">GenAI Stack</span>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    New Stack
                </button>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Stacks</h1>
                <p className="text-gray-500">Manage and deploy your AI workflows from here.</p>
            </div>

            <div className="stack-grid">
                {stacks.map((stack) => (
                    <div key={stack.id} className="stack-card group" onClick={() => navigate(`/stack/${stack.id}`)}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Active</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">{stack.name}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{stack.description}</p>
                        </div>
                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                            <span className="text-sm font-medium text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Open Builder <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold mb-2 text-gray-800">Create New Stack</h2>
                        <p className="text-sm text-gray-500 mb-6">Start building your generative AI apps with our essential tools.</p>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label>Name</label>
                                <input
                                    className="input-field"
                                    value={newStackName}
                                    onChange={(e) => setNewStackName(e.target.value)}
                                    placeholder="e.g. Chat With PDF"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label>Description</label>
                                <textarea
                                    className="input-field resize-none"
                                    value={newStackDesc}
                                    onChange={(e) => setNewStackDesc(e.target.value)}
                                    placeholder="Describe your stack..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate}>Create Stack</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
