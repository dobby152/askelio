# Nejjednodušší možný FastAPI server pro testování
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Simple test server is running"}

@app.get("/test")
def test_endpoint():
    return {"status": "ok", "test": "passed"}

if __name__ == "__main__":
    print("Starting simple test server on port 8006...")
    uvicorn.run(app, host="127.0.0.1", port=8006, log_level="info")
