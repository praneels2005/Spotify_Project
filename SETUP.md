# Setup Instructions for Spotify Playlist Generator

This guide will help you set up and run the project from the root directory.

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- Spotify Developer Account (for CLIENT_ID and CLIENT_SECRET)
- Google Gemini API Key

## Step-by-Step Setup

### 1. Navigate to Project Root

```bash
cd /Users/praneelpothukanuri/Desktop/Spotify_Project
```

### 2. Set Up Python Backend

#### 2.1 Create and Activate Virtual Environment

```bash
# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

#### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 2.3 Create Environment Variables File

Create a `.env` file in the root directory with the following variables:

```bash
# Create .env file
touch .env
```

Add the following to your `.env` file:

```env
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://127.0.0.1:5000/callback
GENAI_API_KEY=your_google_gemini_api_key
FLASK_SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///spotify_app.db
```

**Note**: Replace the placeholder values with your actual credentials:
- Get Spotify credentials from: https://developer.spotify.com/dashboard
- Get Gemini API key from: https://makersuite.google.com/app/apikey
- Generate a secure `FLASK_SECRET_KEY` (you can use: `python3 -c "import secrets; print(secrets.token_hex(32))"`)

### 3. Set Up React Frontend

#### 3.1 Navigate to Frontend Directory

```bash
cd UI_Front/jam-genie
```

#### 3.2 Install Node.js Dependencies

```bash
npm install
```

#### 3.3 Return to Root Directory

```bash
cd ../..
```

### 4. Run the Application

You need to run both the backend and frontend servers. Open **two separate terminal windows/tabs**.

#### Terminal 1: Start Flask Backend

```bash
# From root directory
cd /Users/praneelpothukanuri/Desktop/Spotify_Project

# Activate virtual environment (if not already activated)
source venv/bin/activate

# Run Flask server
python3 main2.py
```

The backend will run on `http://localhost:5000`

#### Terminal 2: Start React Frontend

```bash
# From root directory
cd /Users/praneelpothukanuri/Desktop/Spotify_Project/UI_Front/jam-genie

# Start development server
npm run dev
```

The frontend will run on `http://localhost:8080`

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

## Quick Setup Script (All-in-One)

If you prefer to run everything from the root directory, here's a summary of all commands:

```bash
# From root directory: /Users/praneelpothukanuri/Desktop/Spotify_Project

# 1. Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Create .env file (manually edit with your credentials)
touch .env
# Edit .env with your credentials

# 3. Set up frontend
cd UI_Front/jam-genie
npm install
cd ../..

# 4. Run backend (in one terminal)
source venv/bin/activate
python3 main2.py

# 5. Run frontend (in another terminal)
cd UI_Front/jam-genie
npm run dev
```

## Troubleshooting

### Backend Issues

- **Port 5000 already in use**: Change the port in `main2.py` line 514 or kill the process using port 5000
- **Missing dependencies**: Run `pip install -r requirements.txt` again
- **Environment variables not loading**: Ensure `.env` file is in the root directory

### Frontend Issues

- **Port 8080 already in use**: Vite will automatically try the next available port
- **Module not found**: Run `npm install` again in `UI_Front/jam-genie`
- **CORS errors**: Ensure backend is running on port 5000 and frontend on port 8080

### Database Issues

- The SQLite database will be created automatically when you first run the backend
- Database file location: `spotify_app.db` in the root directory

## Project Structure

```
Spotify_Project/
├── main2.py              # Flask backend server
├── database.py           # Database models and operations
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (create this)
├── flask_session/        # Flask session storage
├── UI_Front/
│   └── jam-genie/       # React frontend
│       ├── package.json
│       └── src/
└── venv/                # Python virtual environment
```

## Notes

- The Flask backend uses port **5000**
- The React frontend uses port **8080**
- CORS is configured to allow requests from `http://localhost:8080` to `http://localhost:5000`
- Flask sessions are stored in the `flask_session/` directory
- The database uses SQLite by default (can be changed via `DATABASE_URL` in `.env`)

