# backend/services/webhooks.py
import os
import threading
import requests

# Zero-dependency helper to parse .env file manually
def load_env():
    # .env is located in the backend/ directory (parent of services/)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        parts = line.split("=", 1)
                        key = parts[0].strip()
                        val = parts[1].strip()
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        os.environ[key] = val
            print(f"[Webhook Config] Loaded .env file at {env_path}. N8N_WEBHOOK_URL: {os.environ.get('N8N_WEBHOOK_URL')}")
        except Exception as e:
            print(f"[Webhook Config] Error reading .env file: {e}")
    else:
        print(f"[Webhook Config] Warning: .env file NOT found at {env_path}")

# Load environment configuration
load_env()

N8N_WEBHOOK_URL = os.environ.get("N8N_WEBHOOK_URL", "")

def _post_webhook_worker(event_type: str, payload: dict):
    if payload.get("severity") != "critical":
        # Only dispatch critical events to the cloud n8n webhook
        return
    load_env()
    webhook_url = os.environ.get("N8N_WEBHOOK_URL", "")
    if not webhook_url or webhook_url.startswith("http://localhost:5678"):
        # Skip sending if it's default placeholder to avoid network timeout errors in logs
        return
    print(f"n8n webhook dispatch -> Event: '{event_type}', Payload: {payload}")
    try:
        json_body = {
            "event": event_type,
            "data": payload,
            **payload
        }
        response = requests.post(
            webhook_url,
            json=json_body,
            headers={"Content-Type": "application/json"},
            timeout=3.0
        )
        if response.status_code in (200, 201, 202):
            print(f"Successfully triggered n8n webhook: {event_type} (status {response.status_code})")
        else:
            print(f"n8n webhook warning: server returned status {response.status_code}")
    except Exception as e:
        print(f"Failed to post to n8n webhook: {e}")

def trigger_n8n_webhook(event_type: str, payload: dict):
    """Trigger the n8n webhook asynchronously in a separate thread to prevent blocking the main request loop."""
    # Run in background thread
    t = threading.Thread(target=_post_webhook_worker, args=(event_type, payload))
    t.daemon = True
    t.start()
