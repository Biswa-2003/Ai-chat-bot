export default function LLMEngineNode({ data }) {
  return (
    <div style={{ padding: 10 }}>
      <div style={{ fontWeight: 700 }}>LLM Engine</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        GPT/Gemini + optional web search
      </div>
      <div style={{ marginTop: 6, fontSize: 12 }}>
        model: {data.model || "gpt"}
      </div>
    </div>
  );
}
