from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import uvicorn
import os
import sys

# Ensure backend root is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import DB_PATH
from etl.etl_pipeline import ETLPipeline
from routes.api import router as api_router

app = FastAPI(
    title="Predictive Maintenance Data Warehouse & Mining System (DWM)",
    description="Industrial Star Schema Data Warehouse, ETL Pipeline, OLAP Cubes, and Machine Learning Mining Engine for AI4I 2020 Dataset",
    version="1.0.0"
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints under /api prefix
app.include_router(api_router, prefix="/api")

# Check for production frontend build
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

@app.on_event("startup")
def startup_event():
    """Verify data warehouse exists on startup. If not, automatically execute ETL."""
    if not DB_PATH.exists() or DB_PATH.stat().st_size == 0:
        print(f"[STARTUP] Warehouse database not found at {DB_PATH}. Running initial ETL pipeline...")
        pipeline = ETLPipeline()
        result = pipeline.run()
        print(f"[STARTUP] ETL Pipeline completed: {result['load']['total_records_loaded']} records loaded into Star Schema.")
    else:
        print(f"[STARTUP] Data Warehouse confirmed at {DB_PATH} ({DB_PATH.stat().st_size / 1024:.1f} KB).")

# If frontend build exists, serve static assets and SPA fallback
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Don't intercept API calls
        if full_path.startswith("api"):
            return {"error": "API route not found"}
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Frontend build not found"}
else:
    @app.get("/")
    def root_fallback():
        return {
            "project": "Predictive Maintenance Data Warehouse & Mining System",
            "dwm_concepts": [
                "Data Warehouse (Star Schema)",
                "ETL Pipeline (Extract, Clean, Transform, Load)",
                "OLAP Operations (Roll-Up, Drill-Down, Slice, Dice, Pivot)",
                "Data Mining (Classification, Clustering, Association Rules)",
                "Dimensional Modeling (1 Fact Table + 5 Dimension Tables)"
            ],
            "api_docs": "/docs",
            "status": "ONLINE",
            "note": "Frontend is available at port 3000 (Vite) or build with npm run build in frontend/."
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
