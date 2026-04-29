import UserQueryNode from "./nodes/UserQueryNode";
import KnowledgeBaseNode from "./nodes/KnowledgeBaseNode";
import LLMEngineNode from "./nodes/LLMEngineNode";
import OutputNode from "./nodes/OutputNode";

/**
 * React Flow node renderer map
 */
const nodeTypes = {
  userQuery: UserQueryNode,
  knowledgeBase: KnowledgeBaseNode,
  llmEngine: LLMEngineNode,
  output: OutputNode,
};

/**
 * Sidebar palette (what you drag)
 */
export const PALETTE = [
  { type: "userQuery", label: "User Query" },
  { type: "knowledgeBase", label: "Knowledge Base" },
  { type: "llmEngine", label: "LLM Engine" },
  { type: "output", label: "Output" },
];

export default nodeTypes;
