from flask import Flask
from flask_cors import CORS
from route.customer import customer_bp
from route.provider import provider_bp
from route.admin import admin_bp

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = "local_service_secret_key"

app.register_blueprint(customer_bp)
app.register_blueprint(provider_bp)
app.register_blueprint(admin_bp)

@app.route("/")
def home():
    return "Backend Running Successfully"

if __name__ == "__main__":
    app.run(debug=True)