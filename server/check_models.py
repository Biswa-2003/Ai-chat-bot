from dotenv import load_dotenv
import os
import requests
import json

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")

if not api_key:
    print("Error: OPENROUTER_API_KEY not found in environment.")
else:
    print(f"OpenRouter API Key found: {api_key[:10]}...")
    
    try:
        print("Testing OpenRouter connection and listing models...")
        response = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={
                "Authorization": f"Bearer {api_key}",
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            models = data.get("data", [])
            print(f"Successfully connected! Found {len(models)} models available.")
            print("\nHere are a few popular free/cheap models:")
            
            # Filter and show some relevant models
            relevant_models = [
                "google/gemini-2.0-flash-exp:free",
                "google/gemini-flash-1.5",
                "openai/gpt-3.5-turbo",
                "meta-llama/llama-3-8b-instruct:free"
            ]
            
            found = False
            for model in models:
                mid = model.get("id")
                if mid in relevant_models or "free" in mid:
                    print(f"- {mid}")
                    found = True
            
            if not found:
                print("(Showing first 5 models as no specific filtered ones were found)")
                for model in models[:5]:
                    print(f"- {model.get('id')}")
                    
        else:
            print(f"Error: Failed to fetch models. Status: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error connecting to OpenRouter: {e}")
