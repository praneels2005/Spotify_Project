from backend.app import create_app
import os

app = create_app()

if __name__ == "__main__":
    # Ensure session dir exists
    os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
    # Run
    app.run(host='0.0.0.0', port=5000, debug=True)
