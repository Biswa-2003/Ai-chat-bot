export default function ConfigPanel({ selected, onChangeLabel }) {
  if (!selected) {
    return (
      <div style={{ width: 260, padding: 12, borderLeft: "1px solid #eee", background: "#fafafa" }}>
        <h4 style={{ marginTop: 0 }}>Config</h4>
        <div style={{ fontSize: 12, color: "#666" }}>Click a node to edit</div>
      </div>
    );
  }

  return (
    <div style={{ width: 260, padding: 12, borderLeft: "1px solid #eee", background: "#fafafa" }}>
      <h4 style={{ marginTop: 0 }}>Config</h4>
      <div style={{ fontSize: 12, marginBottom: 6 }}>Node: {selected.type}</div>

      <input
        value={selected.data?.label || ""}
        onChange={(e) => onChangeLabel(e.target.value)}
        placeholder="Label..."
        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
      />
    </div>
  );
}
