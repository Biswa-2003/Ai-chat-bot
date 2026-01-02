import { Handle, Position } from "reactflow";

export default function OutputNode({ data }) {
  return (
    <div style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}>
      <b>Output</b>
      <div style={{ fontSize: 12, marginTop: 6 }}>{data?.label || "Final response"}</div>

      <Handle type="target" position={Position.Left} />
    </div>
  );
}
