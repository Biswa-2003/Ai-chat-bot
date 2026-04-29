import React, { memo, useRef, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Upload, FileText, Bot, MessageSquare, Settings, Check } from 'lucide-react';
import axios from 'axios';

const NodeHeader = ({ icon, label, color = "text-gray-700" }) => {
    const HeaderIcon = icon;

    return (
        <div className="custom-node-header">
            <HeaderIcon size={16} className={color} />
            <span className="text-sm font-semibold text-gray-800">{label}</span>
            <Settings size={14} className="ml-auto text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
    );
};

// 1. User Query Node
export const UserQueryNode = memo(({ id, data, isConnectable }) => {
    const { setNodes } = useReactFlow();

    const updateQuery = (query) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, query } } : node
            )
        );
    };

    return (
        <div className="custom-node w-80 node-label-user">
            <NodeHeader icon={MessageSquare} label="User Query" color="text-indigo-600" />
            <div className="custom-node-body">
                <div className="text-xs text-gray-500 mb-1">Enter point for querys</div>
                <label className="text-xs font-medium text-gray-700">User Query</label>
                <textarea
                    className="input-field mb-0 resize-none"
                    rows={3}
                    placeholder="Write your query here..."
                    defaultValue={data.query || ''}
                    onChange={(evt) => updateQuery(evt.target.value)}
                />
            </div>
            <Handle type="source" position={Position.Right} id="query" isConnectable={isConnectable} className="!bg-indigo-500" />
        </div>
    );
});

// 2. Knowledge Base Node
export const KnowledgeBaseNode = memo(({ id, data, isConnectable }) => {
    const { setNodes } = useReactFlow();
    const fileInputRef = useRef(null);
    const [uploadStatus, setUploadStatus] = useState("idle");
    const [fileName, setFileName] = useState(data.fileName || "");

    const updateFileName = (nextFileName) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, fileName: nextFileName } } : node
            )
        );
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadStatus("uploading");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://localhost:8000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (response.data.ok) {
                setUploadStatus("success");
                setFileName(file.name);
                updateFileName(file.name);
            }
        } catch (error) {
            console.error("Upload failed", error);
            setUploadStatus("error");
            alert("Upload failed: " + error.message);
        }
    };

    return (
        <div className="custom-node w-80 node-label-kb">
            <Handle type="target" position={Position.Left} id="query" isConnectable={isConnectable} className="!bg-indigo-500" />
            <NodeHeader icon={FileText} label="Knowledge Base" color="text-green-600" />
            <div className="custom-node-body">
                <div className="text-xs text-gray-500 mb-1">Let LLM search info in your file</div>

                <label className="text-xs font-medium text-gray-700">File for Knowledge Base</label>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.txt,.md"
                    onChange={handleFileChange}
                />

                <div
                    onClick={handleUploadClick}
                    className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${uploadStatus === 'success' ? 'border-green-500 bg-green-50' : 'border-green-300 bg-green-50 hover:bg-green-100'
                        }`}
                >
                    {uploadStatus === 'uploading' ? (
                        <div className="text-xs text-gray-500">Uploading...</div>
                    ) : uploadStatus === 'success' ? (
                        <>
                            <Check size={20} className="text-green-600 mb-2" />
                            <span className="text-xs text-green-700 font-medium truncate w-full text-center">{fileName}</span>
                        </>
                    ) : (
                        <>
                            <Upload size={20} className="text-green-600 mb-2" />
                            <span className="text-xs text-green-700 font-medium">Upload File</span>
                        </>
                    )}
                </div>

                <label className="text-xs font-medium text-gray-700 mt-2">Embedding Model</label>
                <select className="input-field text-sm mb-0" defaultValue="text-embedding-3-large">
                    <option>text-embedding-3-large</option>
                    <option>bert-base-uncased</option>
                </select>
            </div>
            <Handle type="source" position={Position.Right} id="context" isConnectable={isConnectable} className="!bg-orange-400" />
        </div>
    );
});

// 3. LLM Node
export const LLMNode = memo(({ id, data, isConnectable }) => {
    const { setNodes } = useReactFlow();

    const updateConfig = (key, value) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, config: { ...(node.data.config || {}), [key]: value } } }
                    : node
            )
        );
    };

    return (
        <div className="custom-node w-80 node-label-llm">
            <Handle type="target" position={Position.Left} id="prompt" isConnectable={isConnectable} className="!bg-purple-500" />
            <Handle type="target" position={Position.Left} id="context" isConnectable={isConnectable} style={{ top: '70%' }} className="!bg-orange-400" />

            <NodeHeader icon={Bot} label="LLM (OpenAI/Gemini)" color="text-purple-600" />
            <div className="custom-node-body">
                <div className="text-xs text-gray-500 mb-1">Run a query with LLM</div>

                <label className="text-xs font-medium text-gray-700">Model</label>
                <select
                    className="input-field text-sm mb-2"
                    defaultValue={data.config?.model || 'meta-llama/llama-3.1-8b-instruct:free'}
                    onChange={(e) => updateConfig('model', e.target.value)}
                >
                    <option value="meta-llama/llama-3.1-8b-instruct:free">OpenRouter (Llama 3.1 8B Free) - Recommended</option>
                    <option value="openai/gpt-4o-mini">OpenRouter (GPT-4o Mini)</option>
                    <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
                    <option value="gpt-4">GPT-4 (Mock)</option>
                </select>

                <label className="text-xs font-medium text-gray-700">Prompt</label>
                <textarea
                    className="input-field mb-0 resize-none text-sm"
                    rows={4}
                    placeholder="You are a helpful assistant..."
                    defaultValue={data.config?.prompt || ''}
                    onChange={(evt) => updateConfig('prompt', evt.target.value)}
                />

                <div className="flex items-center justify-between mt-2">
                    <label className="text-xs font-medium text-gray-700 m-0">Temperature</label>
                    <span className="text-xs text-gray-500">0.75</span>
                </div>
                <input type="range" min="0" max="1" step="0.1" defaultValue="0.75" className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-1" />
            </div>
            <Handle type="source" position={Position.Right} id="response" isConnectable={isConnectable} className="!bg-blue-500" />
        </div>
    );
});

// 4. Output Node
export const OutputNode = memo(({ data, isConnectable }) => {
    return (
        <div className="custom-node w-80 node-label-output">
            <Handle type="target" position={Position.Left} id="input" isConnectable={isConnectable} className="!bg-blue-500" />
            <NodeHeader icon={FileText} label="Output" color="text-amber-500" />
            <div className="custom-node-body">
                <div className="text-xs text-gray-500 mb-1">Output of the result nodes as text</div>

                <label className="text-xs font-medium text-gray-700">Output Text</label>
                <div className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded min-h-[80px] text-gray-600">
                    {data.output ? data.output : <span className="italic text-gray-400">Output will be generated based on query...</span>}
                </div>
            </div>
        </div>
    );
});
