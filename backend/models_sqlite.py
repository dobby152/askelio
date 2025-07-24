# SQLite Database models
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database_sqlite import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="processing")  # processing, completed, failed
    type = Column(String(100), nullable=False)  # MIME type
    size = Column(String(50), nullable=True)
    pages = Column(Integer, default=1)
    accuracy = Column(String(20), nullable=True)  # "95.5%"
    confidence = Column(Float, nullable=True)  # 0.955
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processing_time = Column(Float, nullable=True)
    extracted_text = Column(Text, nullable=True)
    provider_used = Column(String(100), nullable=True)
    data_source = Column(String(50), nullable=True)  # "gemini" or "basic"
    ares_enriched = Column(JSON, nullable=True)  # ARES enrichment metadata
    
    # Relationships
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(100), nullable=False)  # "vendor", "amount", "date", etc.
    field_value = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    data_type = Column(String(50), nullable=True)  # "string", "number", "date", etc.
    
    # Relationship
    document = relationship("Document", back_populates="extracted_fields")
