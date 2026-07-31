import json
from django.http import JsonResponse

def jsonify(data, status=200):
    if isinstance(status, tuple):
        status = status[0]
    return JsonResponse(data, status=status)

def get_json_data(request):
    if hasattr(request, 'data') and isinstance(request.data, dict):
        return request.data
    try:
        if hasattr(request, 'body') and request.body:
            return json.loads(request.body.decode('utf-8'))
    except Exception:
        pass
    return {}

def get_current_user(request):
    return getattr(request, 'current_user', {})
