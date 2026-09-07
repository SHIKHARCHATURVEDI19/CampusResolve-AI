export type IssueStatus = 'REPORTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';
export type UserRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'STAFF' | 'STUDENT';
export type DepartmentType = 'MAINTENANCE' | 'IT' | 'HOUSEKEEPING' | 'SECURITY' | 'ACADEMICS';

export interface College {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface User {
  id: string;
  college_id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: DepartmentType | null;
  designation?: string;
  active_tickets?: number;
  enrollment_or_emp_id?: string;
  available_hours?: string;
}

export interface IssueTimelineEvent {
  id: string;
  issue_id: string;
  status: IssueStatus;
  notes?: string;
  changed_by?: string;
  timestamp: string;
}

export interface Issue {
  id: string;
  college_id: string;
  reporter_id: string;
  reporter?: User | null; // Reporter profile info (name, email, enrollment_id)
  assigned_to?: string | null;
  assigned_worker?: User | null;
  parent_issue_id?: string | null;
  title: string;
  description: string;
  image_url?: string | null;
  department: DepartmentType;
  status: IssueStatus;
  priority_score: number;
  severity: number;
  embedding?: number[];
  latitude: number;
  longitude: number;
  location_name: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
  timeline?: IssueTimelineEvent[];
}

export interface HotspotMapPoint {
  id: string;
  college_id: string;
  title: string;
  department: DepartmentType;
  priority_score: number;
  status: IssueStatus;
  lat: number;
  lng: number;
  location_name: string;
  upvotes: number;
}
