import dotenv from 'dotenv';
dotenv.config();

export interface DbCollege {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface DbUser {
  id: string;
  college_id?: string; // null for SUPER_ADMIN
  name: string;
  email: string;
  password_hash: string;
  role: 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'STAFF' | 'STUDENT';
  department?: 'MAINTENANCE' | 'IT' | 'HOUSEKEEPING' | 'SECURITY' | 'ACADEMICS' | null;
  enrollment_or_emp_id?: string;
}

export interface DbIssue {
  id: string;
  college_id: string;
  reporter_id: string;
  assigned_to?: string | null;
  parent_issue_id?: string | null;
  title: string;
  description: string;
  image_url?: string | null;
  department: 'MAINTENANCE' | 'IT' | 'HOUSEKEEPING' | 'SECURITY' | 'ACADEMICS';
  status: 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';
  priority_score: number;
  severity: number;
  embedding: number[];
  latitude: number;
  longitude: number;
  location_name: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface DbTimeline {
  id: string;
  issue_id: string;
  status: 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';
  notes?: string;
  changed_by?: string;
  timestamp: string;
}

class DatabaseManager {
  private colleges: DbCollege[] = [
    {
      id: 'col_engineering',
      name: 'Apex Institute of Technology & Engineering',
      code: 'AIT-ENG',
      latitude: 28.4744,
      longitude: 77.5040,
      address: 'Knowledge Park III, Greater Noida'
    },
    {
      id: 'col_medical',
      name: 'Apex Medical College & Super-Specialty Hospital',
      code: 'AMC-MED',
      latitude: 28.5355,
      longitude: 77.3910,
      address: 'Health City Campus, Sector 62'
    }
  ];

  private users: DbUser[] = [
    // 0. Super Admin (Global Chancellor / University Trustee)
    { 
      id: 'u_super_admin', 
      name: 'Dr. Vikramaditya Sen (Chancellor)', 
      email: 'chancellor@apex.edu', 
      password_hash: '123', 
      role: 'SUPER_ADMIN',
      enrollment_or_emp_id: 'SUPER-001'
    },

    // 1. Engineering College Users
    // Students
    { id: 'u_std_eng_1', college_id: 'col_engineering', name: 'Aarav Sharma', email: 'aarav.sharma@apex.edu', password_hash: '123', role: 'STUDENT', enrollment_or_emp_id: 'ENG-2024-041' },
    { id: 'u_std_eng_2', college_id: 'col_engineering', name: 'Sneha Roy', email: 'sneha.roy@apex.edu', password_hash: '123', role: 'STUDENT', enrollment_or_emp_id: 'ENG-2024-088' },
    { id: 'u_std_eng_3', college_id: 'col_engineering', name: 'Kabir Mehta', email: 'kabir.mehta@apex.edu', password_hash: '123', role: 'STUDENT', enrollment_or_emp_id: 'ENG-2023-019' },
    { id: 'u_std_eng_4', college_id: 'col_engineering', name: 'Ananya Gupta', email: 'ananya.gupta@apex.edu', password_hash: '123', role: 'STUDENT', enrollment_or_emp_id: 'ENG-2025-102' },
    
    // College Admins
    { id: 'u_adm_eng', college_id: 'col_engineering', name: 'Dr. S. K. Gupta (Dean Engg)', email: 'dean.eng@apex.edu', password_hash: '123', role: 'COLLEGE_ADMIN', department: 'ACADEMICS', enrollment_or_emp_id: 'EMP-ADM-01' },
    
    // Staff
    { id: 'u_stf_eng_elec', college_id: 'col_engineering', name: 'Priya Patel (Elec Tech)', email: 'priya.eng@apex.edu', password_hash: '123', role: 'STAFF', department: 'MAINTENANCE', enrollment_or_emp_id: 'EMP-ENG-M1' },
    { id: 'u_stf_eng_plumb', college_id: 'col_engineering', name: 'Rohan Verma (Plumbing Tech)', email: 'rohan.eng@apex.edu', password_hash: '123', role: 'STAFF', department: 'MAINTENANCE', enrollment_or_emp_id: 'EMP-ENG-M2' },
    { id: 'u_stf_eng_it', college_id: 'col_engineering', name: 'Vikram Singh (Network Admin)', email: 'vikram.eng@apex.edu', password_hash: '123', role: 'STAFF', department: 'IT', enrollment_or_emp_id: 'EMP-ENG-IT1' },

    // 2. Medical College Users
    // Students
    { id: 'u_std_med_1', college_id: 'col_medical', name: 'Dr. Simran Kaur (Intern)', email: 'simran.kaur@apex.edu', password_hash: '123', role: 'STUDENT', enrollment_or_emp_id: 'MED-2024-012' },
    { id: 'u_std_med_2', college_id: 'col_medical', name: 'Rohan Joshi (MBBS 3rd Yr)', email: 'rohan.joshi@apex.edu', password_hash: '123', role: 'STUDENT', enrollment_or_emp_id: 'MED-2023-045' },
    { id: 'u_std_med_3', college_id: 'col_medical', name: 'Tanvi Shah (Resident)', email: 'tanvi.shah@apex.edu', password_hash: '123', role: 'STUDENT', enrollment_or_emp_id: 'MED-2022-008' },
    
    // College Admins
    { id: 'u_adm_med', college_id: 'col_medical', name: 'Dr. Alok Nath (Medical Supdt)', email: 'dean.med@apex.edu', password_hash: '123', role: 'COLLEGE_ADMIN', department: 'ACADEMICS', enrollment_or_emp_id: 'EMP-MED-ADM1' },
    
    // Staff
    { id: 'u_stf_med_san', college_id: 'col_medical', name: 'Anita Desai (Sanitation Lead)', email: 'anita.med@apex.edu', password_hash: '123', role: 'STAFF', department: 'HOUSEKEEPING', enrollment_or_emp_id: 'EMP-MED-H1' },
    { id: 'u_stf_med_sec', college_id: 'col_medical', name: 'Inspector Satish (Hospital Security)', email: 'satish.med@apex.edu', password_hash: '123', role: 'STAFF', department: 'SECURITY', enrollment_or_emp_id: 'EMP-MED-S1' }
  ];

  private issues: DbIssue[] = [
    {
      id: 'iss_eng_1',
      college_id: 'col_engineering',
      reporter_id: 'u_std_eng_1',
      assigned_to: 'u_stf_eng_elec',
      title: 'Flickering lights and exposed wire in Library 2nd floor study hall',
      description: 'The overhead fluorescent tube is sparking slightly and buzzing loud in Engineering Library.',
      image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60',
      department: 'MAINTENANCE',
      status: 'IN_PROGRESS',
      priority_score: 7.8,
      severity: 4,
      embedding: [],
      latitude: 28.4744,
      longitude: 77.5040,
      location_name: 'Engineering Central Library, 2nd Floor',
      upvotes: 6,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'iss_eng_2',
      college_id: 'col_engineering',
      reporter_id: 'u_std_eng_2',
      assigned_to: 'u_stf_eng_it',
      title: 'Hostel Block B 3rd Floor WiFi router completely down',
      description: 'No internet access in Engineering Block B rooms 301 to 320. Submitting lab codes tonight.',
      image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=60',
      department: 'IT',
      status: 'ASSIGNED',
      priority_score: 5.4,
      severity: 3,
      embedding: [],
      latitude: 28.4755,
      longitude: 77.5028,
      location_name: 'Engineering Hostel Block B, 3rd Floor',
      upvotes: 14,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'iss_med_1',
      college_id: 'col_medical',
      reporter_id: 'u_std_med_1',
      assigned_to: 'u_stf_med_san',
      title: 'Hospital Ward 4 bio-waste bin overflowing and biohazard spill',
      description: 'Biohazard container in Ward 4 has reached capacity, needs immediate sterilization and clean up.',
      image_url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60',
      department: 'HOUSEKEEPING',
      status: 'REPORTED',
      priority_score: 8.9,
      severity: 5,
      embedding: [],
      latitude: 28.5355,
      longitude: 77.3910,
      location_name: 'Hospital Block Ward 4 Cleanroom',
      upvotes: 8,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  private timeline: DbTimeline[] = [
    {
      id: 't_1',
      issue_id: 'iss_eng_1',
      status: 'REPORTED',
      notes: 'Initial grievance lodged via Engineering student portal.',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 't_2',
      issue_id: 'iss_eng_1',
      status: 'ASSIGNED',
      notes: 'Auto-routed to Priya Patel (Engineering Electrical) based on lowest active workload.',
      timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString()
    },
    {
      id: 't_3',
      issue_id: 'iss_eng_1',
      status: 'IN_PROGRESS',
      notes: 'Technician on-site inspecting circuit breaker and rewiring ballast.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  getColleges() {
    return [...this.colleges];
  }

  getCollege(id: string) {
    return this.colleges.find(c => c.id === id) || null;
  }

  getUsers(collegeId?: string) {
    if (collegeId) {
      return this.users.filter(u => u.college_id === collegeId || u.role === 'SUPER_ADMIN');
    }
    return [...this.users];
  }

  getUser(id: string) {
    return this.users.find(u => u.id === id) || null;
  }

  getUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  addUser(user: DbUser) {
    this.users.push(user);
    return user;
  }

  updateUser(id: string, updates: Partial<DbUser>) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates };
    return this.users[idx];
  }

  getIssues(collegeId?: string) {
    if (collegeId) {
      return this.issues.filter(i => i.college_id === collegeId);
    }
    return [...this.issues];
  }

  getIssue(id: string) {
    return this.issues.find(i => i.id === id) || null;
  }

  addIssue(issue: DbIssue) {
    this.issues.unshift(issue);
    return issue;
  }

  updateIssue(id: string, updates: Partial<DbIssue>) {
    const idx = this.issues.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.issues[idx] = { ...this.issues[idx], ...updates, updated_at: new Date().toISOString() };
    return this.issues[idx];
  }

  getTimeline(issueId: string) {
    return this.timeline.filter(t => t.issue_id === issueId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addTimeline(event: Omit<DbTimeline, 'id'>) {
    const entry: DbTimeline = {
      ...event,
      id: 't_' + Math.random().toString(36).substring(2, 9)
    };
    this.timeline.push(entry);
    return entry;
  }
}

export const db = new DatabaseManager();
