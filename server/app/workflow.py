from app.schemas import Node, Edge
from app.rag import query_kb
from app.llm import generate_response

async def run_workflow_logic(nodes, edges):
    # 1. Build Adjacency Map
    adj = {node.id: [] for node in nodes}
    node_map = {node.id: node for node in nodes}
    for edge in edges:
        if edge.source in adj:
            adj[edge.source].append(edge.target)

    # 2. Find Start Node (User Query)
    start_node = next((n for n in nodes if n.type == 'userQuery'), None)
    if not start_node:
        return {"error": "No User Query node found."}

    # 3. Execution Data Context
    # We pass this data object along the chain
    execution_data = {
        "query": "", 
        "context": "",
        "history": [],
        "logs": []
    }

    # 4. Traverse
    # Simple BFS/Linear traversal for this strict workflow
    queue = [start_node.id]
    visited = set()
    
    final_output = ""

    while queue:
        curr_id = queue.pop(0)
        if curr_id in visited:
            continue
        visited.add(curr_id)
        
        curr_node = node_map[curr_id]
        node_type = curr_node.type
        execution_data["logs"].append(f"Executing {node_type} ({curr_id})")

        # NODE LOGIC
        if node_type == 'userQuery':
            # Extract query from node data
            if curr_node.data.query:
                execution_data["query"] = curr_node.data.query
                execution_data["logs"].append(f"User Query: {curr_node.data.query}") 

        elif node_type == 'knowledgeBase':
            # Retrieve from RAG
            query = execution_data.get("query", "")
            if query:
                docs = query_kb(query)
                execution_data["context"] = "\n".join(docs)
                execution_data["logs"].append(f"Retrieved {len(docs)} docs")

        elif node_type == 'llmEngine':
            # Call LLM
            query = execution_data.get("query", "")
            context = execution_data.get("context", "")
            # Determine provider based on model selection
            config = curr_node.data.config or {}
            model = config.get("model", "openrouter")
            
            if model == "gpt-4":
                provider = "mock"
            elif model == "gemini-flash-latest":
                provider = "gemini"
            else:
                # Default legacy or 'openrouter' values to OpenRouter
                provider = "openrouter"
            
            response_text = generate_response(query, context, provider, model_id=model)
            execution_data["llm_response"] = response_text
            final_output = response_text

        elif node_type == 'output':
            # Just holding the final value
            pass

        # Add neighbors
        for neighbor in adj[curr_id]:
            queue.append(neighbor)

    return {
        "status": "success",
        "final_response": final_output,
        "logs": execution_data["logs"]
    }
