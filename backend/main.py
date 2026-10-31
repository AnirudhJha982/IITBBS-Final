from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/api/v1/health")
@app.get("/health")
@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "minimal_backend"}
