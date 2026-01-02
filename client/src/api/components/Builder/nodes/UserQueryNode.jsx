import { Handle, Position } from "reactflow";

export default function UserQueryNode({ data }) {
  return (
    <div style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}>
      <b>User Query</b>
      <div style={{ fontSize: 12, marginTop: 6 }}>{data?.label || "Ask user..."}</div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
