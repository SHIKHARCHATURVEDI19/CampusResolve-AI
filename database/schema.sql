-- Enable PostGIS for geospatial analytics
CREATE EXTENSION IF NOT EXISTS postgis;
-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE issue_status AS ENUM ('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED');
CREATE TYPE user_role AS ENUM ('STUDENT', 'STAFF', 'ADMIN');
CREATE TYPE department_type AS ENUM ('MAINTENANCE', 'IT', 'HOUSEKEEPING', 'SECURITY', 'ACADEMICS');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'STUDENT',
    department department_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id), -- Worker load balancing
    parent_issue_id UUID REFERENCES issues(id), -- Deduplication clustering
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    department department_type,
    status issue_status DEFAULT 'REPORTED',
    priority_score FLOAT DEFAULT 0.0,
    severity INT DEFAULT 1,
    embedding VECTOR(1536), -- For semantic deduplication (pgvector)
    location GEOMETRY(Point, 4326),
    latitude FLOAT,
    longitude FLOAT,
    location_name VARCHAR(100),
    upvotes INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE issue_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    status issue_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for rapid spatial, vector, and load-balancing queries
CREATE INDEX idx_issues_assigned_status ON issues(assigned_to, status);
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_issues_embedding ON issues USING hnsw (embedding vector_cosine_ops);
