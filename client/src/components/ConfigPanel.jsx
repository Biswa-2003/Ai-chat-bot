import React from 'react';

export default function ConfigPanel({ selectedNode, setNodes }) {
    const label = selectedNode?.data.label || '';
    const config = selectedNode?.data.config || {};

    const onLabelChange = (event) => {
        const nextLabel = event.target.value;
        setNodes((nds) =>
            nds.map((node) =>
                node.id === selectedNode.id
                    ? { ...node, data: { ...node.data, label: nextLabel } }
                    : node
            )
        );
    };

    const onConfigChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setNodes((nds) =>
            nds.map((node) =>
                node.id === selectedNode.id
                    ? { ...node, data: { ...node.data, config: newConfig } }
                    : node
            )
        );
    };

    if (!selectedNode) {
        return (
            <aside className="config-panel p-4">
                <div className="text-gray-400">Select a node to configure</div>
            </aside>
        );
    }

    return (
        <aside className="config-panel">
            <div className="sidebar-header">
                Configuration
            </div>
            <div className="sidebar-content">
                <label>Label</label>
                <input value={label} onChange={onLabelChange} />

                <div className="h-px bg-slate-700 my-4" />

                {selectedNode.type === 'userQuery' && (
                    <p className="text-xs text-gray-400">Entry point for user questions.</p>
                )}

                {selectedNode.type === 'knowledgeBase' && (
                    <>
                        <label>Upload Document (PDF)</label>
                        <input type="file" accept=".pdf" onChange={() => alert("Upload logic to be implemented")} />
                        <p className="text-xs text-gray-400 mt-2">Documents will be chunked and embedded.</p>
                    </>
                )}

                {selectedNode.type === 'llmEngine' && (
                    <>
                        <label>Model Provider</label>
                        <select
                            value={config.provider || 'openai'}
                            onChange={(e) => onConfigChange('provider', e.target.value)}
                        >
                            <option value="openai">OpenAI GPT-4</option>
                            <option value="gemini">Google Gemini</option>
                        </select>

                        <label>System Prompt</label>
                        <textarea
                            rows={4}
                            value={config.prompt || ''}
                            onChange={(e) => onConfigChange('prompt', e.target.value)}
                            placeholder="You are a helpful assistant..."
                        />
                    </>
                )}
            </div>
        </aside>
    );
}
