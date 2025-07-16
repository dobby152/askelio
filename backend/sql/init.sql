-- Database initialization script
-- This script will be run when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE document_status AS ENUM ('processing', 'completed', 'failed', 'needs_review', 'exported');
CREATE TYPE transaction_type AS ENUM ('top_up', 'usage', 'refund', 'correction');

-- Note: Tables will be created automatically by SQLAlchemy
-- This script is mainly for extensions and initial data
