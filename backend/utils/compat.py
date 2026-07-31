import json
import re
from django.http import JsonResponse
from django.utils.text import get_valid_filename

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

def secure_filename(filename):
    """
    Sanitizes a filename to prevent path traversal vulnerabilities.
    Django/Python native replacement for werkzeug.utils.secure_filename.
    """
    if not filename:
        return ""
    filename = get_valid_filename(filename)
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    return filename
