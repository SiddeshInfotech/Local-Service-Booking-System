from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from route.customer import customer_bp
from route.provider import provider_bp
from route.admin import admin_bp

app = Flask(__name__)

# Config
app.config["SECRET_KEY"] = os.getenv("JWT_SECRET", "super_secure_local_service_jwt_secret_key_123!")

# Enable CORS
CORS(app)

# Register Blueprints without prefixes as the routes inside already contain full prefixes
app.register_blueprint(customer_bp)
app.register_blueprint(provider_bp)
app.register_blueprint(admin_bp)

@app.route("/")
def home():
    return {
        "success": True,
        "message": "Local Service Booking Backend V3 Running",
        "version": "3.0"
    }

@app.route("/health")
def health():
    return {
        "status": "OK"
    }, 200

# Centralized Error Handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"status": False, "message": "Bad Request. Please check your request syntax or payload."}), 400

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"status": False, "message": "Unauthorized. Authentication token is missing or invalid."}), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({"status": False, "message": "Forbidden. You do not have permission to access this resource."}), 403

@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": False, "message": "Resource not found."}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"status": False, "message": "HTTP method not allowed for this endpoint."}), 405

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({"status": False, "message": "Internal server error. Please try again later."}), 500

if __name__ == "__main__":
    app.run(debug=True)