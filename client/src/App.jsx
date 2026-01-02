import React, { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap
} from 'reactflow';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import 'reactflow/dist/style.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ChatPage from './components/ChatPage'; // Import ChatPage
import { UserQueryNode, KnowledgeBaseNode, LLMNode, OutputNode } from './components/CustomNodes'; // Import Custom Nodes
import { Play, ArrowLeft, MessageSquare, Save, LogOut, User } from 'lucide-react'; // Import MessageSquare, Save, LogOut, User
import axios from 'axios';

// Set Base URL from Env (Docker support)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Add simple auth token interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add 401 Response Interceptor (To handle invalid/expired tokens after DB reset)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired
      localStorage.removeItem('token');
      // Redirect to login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

let id = 0;
const getId = () => `dndnode_${id++}`;

const initialNodes = [
  {
    id: '1',
    type: 'userQuery',
    data: { query: '', label: 'User Query' }, // Initial data with label
    position: { x: 100, y: 100 },
  },
];

const StackBuilder = () => {
  const { stackId } = useParams();
  const navigate = useNavigate(); // Hook for navigation
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  /* State for Logs */
  const [executionLogs, setExecutionLogs] = useState([]);

  // Register Custom Nodes
  const nodeTypes = useMemo(() => ({
    userQuery: UserQueryNode,
    knowledgeBase: KnowledgeBaseNode,
    llmEngine: LLMNode,
    output: OutputNode,
  }), []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Default data structure for new nodes
      let defaultData = { label: `${type}` }; // Ensure label exists
      if (type === 'llmEngine') defaultData = { ...defaultData, label: 'LLM Engine', config: { model: 'gemini-flash-latest', prompt: '' } };
      if (type === 'userQuery') defaultData = { ...defaultData, label: 'User Query', query: '' };
      if (type === 'knowledgeBase') defaultData = { ...defaultData, label: 'Knowledge Base' };
      if (type === 'output') defaultData = { ...defaultData, label: 'Output' };

      const newNode = {
        id: getId(),
        type,
        position,
        data: defaultData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  // Handle saving workflow
  const handleSaveWorkflow = async () => {
    const name = prompt("Enter workflow name:", "My AI Stack");
    if (!name) return;

    try {
      const payload = { nodes, edges };
      // Pass name as query param for simplicity or update backend to accept in body if needed, 
      // but my backend endpoint uses query param 'name' by default in the definition: 
      // def save_workflow(..., name: str = ...)
      await axios.post(`/workflow/save?name=${encodeURIComponent(name)}`, payload);
      alert("Workflow saved successfully!");
    } catch (error) {
      alert("Error saving workflow: " + error.message);
    }
  };

  // Handle Test Chat Navigation
  const handleTestChat = () => {
    // Save current state to local storage to pass to the chat page
    const workflowData = { nodes, edges };
    localStorage.setItem('testWorkflow', JSON.stringify(workflowData));
    navigate('/test-chat');
  };

  // Handle workflow run and update Output node with result
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setExecutionLogs([]); // Clear previous logs
    try {
      const payload = { nodes, edges };
      const response = await axios.post('/workflow/run', payload);

      // Set logs
      if (response.data.logs) {
        setExecutionLogs(response.data.logs);
      }

      // Show result in Output Node if it exists
      const outputNode = nodes.find(n => n.type === 'output');
      if (outputNode && response.data.final_response) {
        setNodes(nds => nds.map(n => {
          if (n.id === outputNode.id) {
            return { ...n, data: { ...n.data, output: response.data.final_response } };
          }
          return n;
        }));
      } else {
        alert("Workflow Completed: " + JSON.stringify(response.data));
      }

    } catch (error) {
      alert("Error running workflow: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app-container">
      <ReactFlowProvider>
        <Sidebar />

        <div className="main-area" ref={reactFlowWrapper}>
          <div className="absolute top-4 left-4 z-50">
            <a href="/" className="btn btn-secondary shadow-md hover:text-indigo-600 hover:border-indigo-200 transition-all">
              <ArrowLeft size={16} /> Back to Dashboard
            </a>
          </div>
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button className="btn btn-secondary border border-gray-300 bg-white" onClick={handleSaveWorkflow}>
              <Save size={16} />
              Save Stack
            </button>
            <button className="btn btn-secondary border border-gray-300 bg-white" onClick={handleTestChat}>
              <MessageSquare size={16} />
              Test Chat
            </button>
            <button className="btn btn-primary" onClick={handleRunWorkflow} disabled={isRunning}>
              <Play size={16} />
              {isRunning ? 'Running...' : 'Run Workflow'}
            </button>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes} // Register custom nodes
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
          >
            <Controls />
            <Background gap={16} color="#e2e8f0" />
            <MiniMap />
          </ReactFlow>

          {/* Execution Logs Panel */}
          {executionLogs.length > 0 && (
            <div className="absolute bottom-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Execution Steps</h3>
              <div className="space-y-1">
                {executionLogs.map((log, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || 'User');

  const handleLogin = (newToken, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername || 'User');
    setToken(newToken);
    setUsername(newUsername || 'User');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    window.location.replace('/');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      {/* Global Header/User Status - Show only on main routes if needed, or keeping it global */}
      <div className="absolute top-4 right-4 z-[60] flex items-center gap-4 pointer-events-none">
        {/* Only show User Badge if NOT on ChatPage (which has its own header) or handle visible logic properly. 
             For now, let's keep it but make it compatible. */}
      </div>

      {/* We need to move the user logout/profile button inside specific pages OR keep it absolute but check route.
          For simplicity, I will re-inject the Logout button just like before but maybe hide it on /test-chat if desired.
      */}
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-4">
        {window.location.pathname !== '/test-chat' && (
          <>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <User size={14} className="text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{username}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 shadow-md flex items-center gap-2 px-3 py-2 transition-all"
            >
              <LogOut size={16} />
              <span className="font-medium">Logout</span>
            </button>
          </>
        )}
      </div>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stack/:stackId" element={<StackBuilder />} />
        <Route path="/test-chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
