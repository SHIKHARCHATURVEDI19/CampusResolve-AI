-- =========================================================================
-- MULTI-COLLEGE / MULTI-TENANT CAMPUS ARCHITECTURE WITH ROLE-BASED ACCESS
-- =========================================================================

-- Enable PostGIS & Vector extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Colleges Table (Tenants)
CREATE TABLE colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'COE-MAIN', 'MED-CAMPUS', 'MGMT-NORTH'
    address TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Custom Types
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'COLLEGE_ADMIN', 'STAFF', 'STUDENT');
CREATE TYPE department_type AS ENUM ('MAINTENANCE', 'IT', 'HOUSEKEEPING', 'SECURITY', 'ACADEMICS');
CREATE TYPE issue_status AS ENUM ('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED');

-- 3. Users Table (Tenant-scoped by college_id)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE, -- NULL for global SUPER_ADMIN
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'STUDENT',
    department department_type, -- Assigned department for staff
    enrollment_or_emp_id VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Issues Table (Scoped strictly to college_id)
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id), -- Worker belonging to the SAME college
    parent_issue_id UUID REFERENCES issues(id), -- Intra-college deduplication
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    department department_type NOT NULL,
    status issue_status DEFAULT 'REPORTED',
    priority_score FLOAT DEFAULT 0.0,
    severity INT DEFAULT 1,
    embedding VECTOR(1536), -- Vector embedding for semantic match
    location GEOMETRY(Point, 4326),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    location_name VARCHAR(100),
    upvotes INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Issue Timeline
CREATE TABLE issue_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    status issue_status NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for rapid tenant-isolated queries & geospatial searches
CREATE INDEX idx_users_college_role ON users(college_id, role);
CREATE INDEX idx_issues_college_dept ON issues(college_id, department, status);
CREATE INDEX idx_issues_assigned ON issues(assigned_to, status);
CREATE INDEX idx_issues_location ON issues USING GIST(location);

-- =========================================================================
-- SAMPLE MULTI-COLLEGE SEED DATA
-- =========================================================================
INSERT INTO colleges (id, name, code, latitude, longitude, address) VALUES
('c1111111-1111-1111-1111-111111111111', 'Apex Institute of Technology & Engineering', 'AIT-ENG', 28.4744, 77.5040, 'Knowledge Park III, Greater Noida'),
('c2222222-2222-2222-2222-222222222222', 'Apex Medical College & Research Hospital', 'AMC-MED', 28.5355, 77.3910, 'Health City Campus, Sector 62');

-- Seed Users for College 1 (Engineering)
INSERT INTO users (id, college_id, name, email, password_hash, role, department, enrollment_or_emp_id) VALUES
('u101', 'c1111111-1111-1111-1111-111111111111', 'Rahul Verma', 'rahul.eng@apex.edu', 'hash', 'STUDENT', NULL, 'EN2024-0041'),
('u102', 'c1111111-1111-1111-1111-111111111111', 'Prof. S. K. Gupta', 'dean.eng@apex.edu', 'hash', 'COLLEGE_ADMIN', 'ACADEMICS', 'EMP-ADM-01'),
('u103', 'c1111111-1111-1111-1111-111111111111', 'Priya Patel (Elec)', 'priya.eng@apex.edu', 'hash', 'STAFF', 'MAINTENANCE', 'EMP-ENG-M1'),
('u104', 'c1111111-1111-1111-1111-111111111111', 'Vikram Singh (IT)', 'vikram.eng@apex.edu', 'hash', 'STAFF', 'IT', 'EMP-ENG-IT1');

-- Seed Users for College 2 (Medical)
INSERT INTO users (id, college_id, name, email, password_hash, role, department, enrollment_or_emp_id) VALUES
('u201', 'c2222222-2222-2222-2222-222222222222', 'Dr. Simran Kaur', 'simran.med@apex.edu', 'hash', 'STUDENT', NULL, 'MD2024-012'),
('u202', 'c2222222-2222-2222-2222-222222222222', 'Dr. Alok Nath', 'dean.med@apex.edu', 'hash', 'COLLEGE_ADMIN', 'ACADEMICS', 'EMP-MED-ADM1'),
('u203', 'c2222222-2222-2222-2222-222222222222', 'Ramesh Yadav (Sanitation)', 'ramesh.med@apex.edu', 'hash', 'STAFF', 'HOUSEKEEPING', 'EMP-MED-H1'),
('u204', 'c2222222-2222-2222-2222-222222222222', 'Inspector Satish (Hospital Security)', 'satish.med@apex.edu', 'hash', 'STAFF', 'SECURITY', 'EMP-MED-S1');
