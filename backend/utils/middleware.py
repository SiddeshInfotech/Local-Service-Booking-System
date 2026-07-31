import json
from django.http import JsonResponse

class JSONResponseStandardizerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        content_type = response.headers.get('Content-Type', '') if hasattr(response, 'headers') else response.get('Content-Type', '')
        
        if isinstance(response, JsonResponse) or 'application/json' in content_type:
            try:
                if hasattr(response, 'data') and isinstance(response.data, dict):
                    data = response.data
                    modified = False
                    if "status" in data and isinstance(data["status"], bool) and "success" not in data:
                        data["success"] = data["status"]
                        modified = True
                    if "success" in data and isinstance(data["success"], bool) and "status" not in data:
                        data["status"] = data["success"]
                        modified = True
                    if modified:
                        response.data = data
                elif hasattr(response, 'content') and response.content:
                    data = json.loads(response.content.decode('utf-8'))
                    if isinstance(data, dict):
                        modified = False
                        if "status" in data and isinstance(data["status"], bool) and "success" not in data:
                            data["success"] = data["status"]
                            modified = True
                        if "success" in data and isinstance(data["success"], bool) and "status" not in data:
                            data["status"] = data["success"]
                            modified = True
                        if modified:
                            response.content = json.dumps(data).encode('utf-8')
            except Exception:
                pass
        return response
