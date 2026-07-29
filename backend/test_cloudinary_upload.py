import os
import sys
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)
load_dotenv()

cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

print("==================================================")
print("CLOUDINARY INTEGRATION TEST")
print("==================================================")
print(f"Cloud Name : {cloud_name}")
print(f"API Key    : {api_key}")
print(f"API Secret : {'*' * len(api_secret) if api_secret else 'NOT SET'}")
print("--------------------------------------------------")

if not cloud_name or not api_key or not api_secret:
    print("[ERROR] Cloudinary credentials missing in .env file.")
    sys.exit(1)

try:
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )

    # Valid Base64 Data URI image
    sample_image_data_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQD0B1iAG3V6wMAA8mAYLvh8oHAAAAAElFTkSuQmCC"

    print("[INFO] Uploading test Provider ID Proof to Cloudinary folder 'provider-id-proofs'...")

    result = cloudinary.uploader.upload(
        sample_image_data_uri,
        folder="provider-id-proofs",
        public_id="test_provider_id_proof",
        overwrite=True
    )

    print("\n[SUCCESS] Cloudinary upload verified successfully!")
    print(f"Folder     : provider-id-proofs")
    print(f"Public ID  : {result.get('public_id')}")
    print(f"Secure URL : {result.get('secure_url')}")
    print("==================================================")

except Exception as e:
    print(f"\n[ERROR] Cloudinary upload failed: {str(e)}")
    sys.exit(1)
