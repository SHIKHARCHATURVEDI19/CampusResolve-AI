-- Sample seed data for initial testing
INSERT INTO users (id, name, email, password_hash, role, department) VALUES
('11111111-1111-1111-1111-111111111111', 'Aarav Sharma', 'aarav@campus.edu', 'hashed_pw', 'STUDENT', NULL),
('22222222-2222-2222-2222-222222222222', 'Priya Patel (Elec)', 'priya@campus.edu', 'hashed_pw', 'STAFF', 'MAINTENANCE'),
('33333333-3333-3333-3333-333333333333', 'Rohan Verma (Plumbing)', 'rohan@campus.edu', 'hashed_pw', 'STAFF', 'MAINTENANCE'),
('44444444-4444-4444-4444-444444444444', 'Vikram Singh (Network)', 'vikram@campus.edu', 'hashed_pw', 'STAFF', 'IT'),
('55555555-5555-5555-5555-555555555555', 'Anita Desai (Sanitation)', 'anita@campus.edu', 'hashed_pw', 'STAFF', 'HOUSEKEEPING'),
('66666666-6666-6666-6666-666666666666', 'Inspector Rajesh', 'rajesh@campus.edu', 'hashed_pw', 'STAFF', 'SECURITY'),
('77777777-7777-7777-7777-777777777777', 'Dr. Meenakshi Iyer', 'meenakshi@campus.edu', 'hashed_pw', 'ADMIN', 'ACADEMICS');
