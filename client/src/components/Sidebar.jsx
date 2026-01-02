import React from 'react';
import { MessageSquare, Database, Bot, Terminal } from 'lucide-react';

export default function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        Components
      </div>
      <div className="sidebar-content">
        <div className="description mb-4 text-sm text-gray-400">
          Drag these nodes to the canvas to build your workflow.
        </div>
        
        <div className="dndnode" onDragStart={(event) => onDragStart(event, 'userQuery')} draggable>
          <MessageSquare size={16} />
          User Query
        </div>
        
        <div className="dndnode" onDragStart={(event) => onDragStart(event, 'knowledgeBase')} draggable>
          <Database size={16} />
          Knowledge Base
        </div>
        
        <div className="dndnode" onDragStart={(event) => onDragStart(event, 'llmEngine')} draggable>
          <Bot size={16} />
          LLM Engine
        </div>
        
        <div className="dndnode" onDragStart={(event) => onDragStart(event, 'output')} draggable>
          <Terminal size={16} />
          Output
        </div>
      </div>
    </aside>
  );
}
