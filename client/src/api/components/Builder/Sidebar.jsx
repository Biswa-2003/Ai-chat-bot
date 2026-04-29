import { PALETTE } from "./nodeTypes";

export default function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      style={{
        width: 200,
        padding: 10,
        borderRight: "1px solid #ddd",
        background: "#f9f9f9",
      }}
    >
      <h4>Nodes</h4>

      {PALETTE.map((item) => (
        <div
          key={item.type}
          onDragStart={(e) => onDragStart(e, item.type)}
          draggable
          style={{
            padding: "8px",
            marginBottom: "8px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "grab",
          }}
        >
          {item.label}
        </div>
      ))}
    </aside>
  );
}
