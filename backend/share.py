import os
import mimetypes
from fastapi import Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

# Import the main app instance
try:
    # Use relative import if running as module
    from .main import app
except ImportError:
    # Fallback for direct execution
    from main import app

# Define paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Navigate up one level to find 'build'
BUILD_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "build"))

print(f"Server starting in Share Mode...")
print(f"Looking for React build at: {BUILD_DIR}")

if not os.path.exists(BUILD_DIR):
    print("WARNING: Build folder not found! Please run 'npm run build' first.")
    
    @app.get("/")
    def no_build():
        return HTMLResponse("<h1>Build folder not found</h1><p>Please run 'npm run build' first.</p>")
else:
    # 1. Mount static assets
    # React build puts assets in 'static' folder
    static_folder = os.path.join(BUILD_DIR, "static")
    if os.path.exists(static_folder):
        app.mount("/static", StaticFiles(directory=static_folder), name="static")

    # 2. Add explicit mime type for JS files if needed (sometimes Windows registry is weird)
    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("text/css", ".css")

    # 3. Override the root path "/"
    # We need to remove the existing '/' route from main.py if it exists
    # app.routes is a property, so we must modify app.router.routes list in-place
    new_routes = [r for r in app.router.routes if getattr(r, "path", "") != "/"]
    app.router.routes = new_routes
    
    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))

    # 4. Catch-all for SPA routing
    # This must be defined LAST to not intercept API calls
    # Since we are modifying the existing app, API routes are already registered
    
    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        # Prevent path traversal
        if ".." in full_path:
            return FileResponse(os.path.join(BUILD_DIR, "index.html"))

        # Check if file exists in build directory (e.g., manifest.json, favicon.ico)
        file_path = os.path.join(BUILD_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # If API route (starts with api, or auth, etc), let it 404 naturally?
        # No, if we return index.html for api routes, valid 404s become 200 OK HTML.
        # We should try to distinguish.
        # Harit Swaraj API routes: /auth, /dashboard, /biomass, etc.
        # If the path starts with a known API prefix, we should 404 (or pass).
        api_prefixes = ["auth", "dashboard", "biomass", "harvest", "transport", "manufacturing", "distribution", "audit", "blockchain", "docs", "openapi.json", "uploads"]
        
        for prefix in api_prefixes:
            if full_path.startswith(prefix):
                 return HTMLResponse("Not Found", status_code=404)

        # Otherwise, return index.html for client-side routing
        return FileResponse(os.path.join(BUILD_DIR, "index.html"))

print("Frontend integration active.")
