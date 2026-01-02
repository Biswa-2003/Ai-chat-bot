import google.generativeai as genai
import os
import requests
import json

# You should ideally set GOOGLE_API_KEY in environment variables
# For now, we will assume it is set or handle the error.

def generate_response(prompt: str, context: str = "", provider: str = "openrouter", model_id: str = None):
    openrouter_key = os.getenv("OPENROUTER_API_KEY")

    if provider == "mock":
         return "🤖 **Mock Response (GPT-4 Mode)**\n\nThis is a simulated response. Inputs:\n\n* **Prompt:** " + prompt + "\n* **Context:** " + str(len(context)) + " chars.\n\nWorkflow is connected! Switch to an OpenRouter model for real AI."

    # Force OpenRouter for everything else
    if not openrouter_key:
        return "Error: OPENROUTER_API_KEY not found. Please add it to your .env file."
    
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("APP_BASE_URL", "http://localhost:5173"), 
        "X-Title": "GenAI Stack"
    }

    # Intelligent Model Mapping
    # If the user selected a specific model_id, use it.
    # If they selected "gemini" (legacy), map it to a free OpenRouter Gemini model.
    target_model = model_id
    
    if not target_model or target_model == "openrouter":
        target_model = "openai/gpt-4o-mini" # Default high-quality cheap/free model
    elif target_model == "gemini-flash-latest" or target_model == "gemini":
        # Fallback to Llama 3.1 8B Free which is more reliable than Gemini Flash Exp locally
        target_model = "meta-llama/llama-3.1-8b-instruct:free" 

    full_prompt = f"System: You are a helpful AI assistant.\n\nContext:\n{context}\n\nQuestion: {prompt}"

    data = {
        "model": target_model, 
        "messages": [
            {"role": "user", "content": full_prompt}
        ]
    }
    
    try:
        print(f"Calling OpenRouter Model: {target_model}")
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        elif response.status_code == 404:
            return f"Error 404: Model '{target_model}' not found on OpenRouter. Please check the model name."
        else:
            return f"Error from OpenRouter ({response.status_code}): {response.text}"
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"Error communicating with OpenRouter: {str(e)}"


