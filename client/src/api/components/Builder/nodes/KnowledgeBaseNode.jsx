import { Handle, Position } from "reactflow";

export default function KnowledgeBaseNode({ data }) {
  return (
    <div style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}>
      <b>Knowledge Base</b>
      <div style={{ fontSize: 12, marginTop: 6 }}>{data?.label || "Select KB..."}</div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
