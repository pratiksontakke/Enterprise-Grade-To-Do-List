from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router

app = FastAPI(
    title="Aura Task API",
    description="API for parsing natural language into tasks.",
    version="1.0.0",
)

# Set up CORS (Cross-Origin Resource Sharing)
# For local development, we allow all origins.
# In production, this should be restricted to the frontend's domain.
origins = [
    "http://localhost:8080", 
    "https://enterprise-grade-to-do-list.onrender.com",  
    "https://auratasks.netlify.app"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the main API router
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Health Check"])
def read_root():
    """A simple health check endpoint."""
    return {"status": "ok", "message": "Welcome to Aura Task API"} 