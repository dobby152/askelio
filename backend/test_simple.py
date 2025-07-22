# Simple test to check if the basic imports work
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database_sqlite import get_db, init_db
from models_sqlite import Document, ExtractedField

# Initialize database
init_db()

app = FastAPI(title="Test API")

@app.get("/")
async def root():
    return {"message": "Test API works"}

@app.get("/documents")
async def get_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return {"count": len(documents), "documents": [{"id": d.id, "filename": d.filename} for d in documents]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
