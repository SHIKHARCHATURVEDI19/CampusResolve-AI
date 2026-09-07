import { Request, Response } from 'express';
import { db, DbIssue, DbUser } from '../config/db.ts';
import { getEmbedding, classifyIssue } from '../services/aiService.ts';
import { calculateDistanceMeters, cosineSimilarity } from '../services/geoService.ts';
import { calculatePriorityScore, findBestAvailableWorker } from '../services/routingEngine.ts';
import { sendVerificationEmail, verifyOTP } from '../services/emailService.ts';

// POST /api/auth/send-otp - Dispatch OTP to user's personal email
export async function handleSendOTP(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const result = await sendVerificationEmail(email.trim());
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to dispatch verification email.' });
  }
}

// POST /api/auth/verify-otp - Verify code & log in or register student
export async function handleVerifyOTP(req: Request, res: Response) {
  try {
    const { email, otp, collegeId, role = 'STUDENT', name } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
    }

    const verification = verifyOTP(email.trim(), otp.trim());
    if (!verification.valid) {
      return res.status(400).json({ error: verification.error });
    }

    // OTP is valid! Find or register user
    let user = db.getUserByEmail(email.trim());
    if (!user) {
      const derivedName = name?.trim() || email.split('@')[0].replace('.', ' ').toUpperCase();
      user = {
        id: 'u_' + Math.random().toString(36).substring(2, 9),
        college_id: collegeId || 'col_engineering',
        name: derivedName,
        email: email.trim().toLowerCase(),
        password_hash: 'verified_via_email_otp',
        role: role as any,
        enrollment_or_emp_id: 'ST-' + Math.floor(1000 + Math.random() * 9000)
      };
      db.addUser(user);
    }

    return res.json({
      message: 'Email successfully verified!',
      user
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to verify OTP.' });
  }
}

// GET /api/colleges
export async function getColleges(req: Request, res: Response) {
  return res.json(db.getColleges());
}

// POST /api/auth/login
export async function loginUser(req: Request, res: Response) {
  const { email, password, role, collegeId, userId } = req.body;

  if (email) {
    const existing = db.getUserByEmail(email.trim());
    if (existing) {
      return res.json(existing);
    }
    if (role === 'STUDENT' && collegeId) {
      const nameFromEmail = email.split('@')[0].replace('.', ' ').toUpperCase();
      const newStudent: DbUser = {
        id: 'u_' + Math.random().toString(36).substring(2, 9),
        college_id: collegeId,
        name: nameFromEmail,
        email: email.trim().toLowerCase(),
        password_hash: password || '123',
        role: 'STUDENT',
        enrollment_or_emp_id: 'ST-' + Math.floor(1000 + Math.random() * 9000)
      };
      db.addUser(newStudent);
      return res.json(newStudent);
    }
    return res.status(404).json({ error: 'User not found with this email' });
  }

  if (userId) {
    const user = db.getUser(userId);
    if (user) return res.json(user);
  }

  if (role === 'SUPER_ADMIN') {
    const superAdmin = db.getUsers().find(u => u.role === 'SUPER_ADMIN');
    if (superAdmin) return res.json(superAdmin);
  }

  const all = db.getUsers(collegeId);
  const matched = all.find(u => u.role === role);

  if (!matched) {
    return res.status(404).json({ error: 'No user found for selected role and college' });
  }

  return res.json(matched);
}

// GET /api/users
export async function getAllUsers(req: Request, res: Response) {
  try {
    const collegeId = req.query.collegeId as string | undefined;
    return res.json(db.getUsers(collegeId));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/staff
export async function registerStaff(req: Request, res: Response) {
  try {
    const { name, email, phone, collegeId, department, designation, availableHours, employeeId } = req.body;

    if (!name || !email || !collegeId || !department) {
      return res.status(400).json({ error: 'Name, email, college and department are required.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'A staff or user account with this email already exists.' });
    }

    const newStaff: DbUser = {
      id: 'stf_' + Math.random().toString(36).substring(2, 9),
      college_id: collegeId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: '123',
      role: 'STAFF',
      department,
      enrollment_or_emp_id: employeeId || 'EMP-' + Math.floor(100 + Math.random() * 900)
    };

    (newStaff as any).phone = phone || '+91 98765 43210';
    (newStaff as any).designation = designation || `${department} Officer`;
    (newStaff as any).available_hours = availableHours || '09:00 AM - 06:00 PM';

    db.addUser(newStaff);
    return res.status(201).json(newStaff);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// PATCH /api/users/:id/role
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { role, collegeId, department } = req.body;

    const user = db.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates: Partial<DbUser> = {};
    if (role) updates.role = role;
    if (collegeId !== undefined) updates.college_id = collegeId;
    if (department !== undefined) updates.department = department;

    const updated = db.updateUser(id, updates);
    return res.json({ message: 'User role successfully updated', user: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/issues
export async function processIncomingIssue(req: Request, res: Response) {
  try {
    const { title, description, latitude, longitude, locationName, imageUrl, reporterId, collegeId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const effectiveCollegeId = collegeId || 'col_engineering';
    const lat = Number(latitude) || 28.4744;
    const lng = Number(longitude) || 77.5040;
    const effectiveReporterId = reporterId || 'u_std_eng_1';

    const [embedding, nlpResult] = await Promise.all([
      getEmbedding(`${title}: ${description}`),
      classifyIssue(title, description)
    ]);

    const { department, severity } = nlpResult;

    const collegeIssues = db.getIssues(effectiveCollegeId);
    const now = Date.now();
    let duplicateMatch: DbIssue | null = null;
    let highestSim = 0;

    for (const issue of collegeIssues) {
      const hoursAgo = (now - new Date(issue.created_at).getTime()) / (1000 * 3600);
      if (hoursAgo <= 48 && (issue.status === 'REPORTED' || issue.status === 'ASSIGNED' || issue.status === 'IN_PROGRESS')) {
        const dist = calculateDistanceMeters(lat, lng, issue.latitude, issue.longitude);
        if (dist <= 100) {
          const sim = cosineSimilarity(embedding, issue.embedding);
          if (sim > 0.85 && sim > highestSim) {
            highestSim = sim;
            duplicateMatch = issue;
          }
        }
      }
    }

    if (duplicateMatch) {
      const newUpvotes = duplicateMatch.upvotes + 1;
      const newPriority = Number((duplicateMatch.priority_score + 1.5).toFixed(2));
      const updated = db.updateIssue(duplicateMatch.id, {
        upvotes: newUpvotes,
        priority_score: newPriority
      });

      db.addTimeline({
        issue_id: duplicateMatch.id,
        status: duplicateMatch.status,
        notes: `Additional report received (${title}). Upvotes bumped to ${newUpvotes}, priority elevated by +1.5.`
      });

      return res.status(200).json({
        message: "Duplicate detected within 100m radius of your campus. Merged into existing incident.",
        isDuplicate: true,
        similarity: highestSim,
        parentId: duplicateMatch.id,
        issue: updated
      });
    }

    const workerResult = findBestAvailableWorker(department, effectiveCollegeId);
    const assignedWorkerId = workerResult ? workerResult.worker.id : null;
    const initialStatus = assignedWorkerId ? 'ASSIGNED' : 'REPORTED';
    const priorityScore = calculatePriorityScore(severity, department, lat, lng, 0, 1, effectiveCollegeId);

    const newIssueId = 'iss_' + Math.random().toString(36).substring(2, 10);
    const newIssue: DbIssue = {
      id: newIssueId,
      college_id: effectiveCollegeId,
      reporter_id: effectiveReporterId,
      assigned_to: assignedWorkerId,
      title,
      description,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60',
      department,
      status: initialStatus,
      priority_score: priorityScore,
      severity,
      embedding,
      latitude: lat,
      longitude: lng,
      location_name: locationName || 'Campus Building',
      upvotes: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.addIssue(newIssue);

    const reporterUser = db.getUser(effectiveReporterId);
    const reporterDisplayName = reporterUser?.name || 'Student';

    db.addTimeline({
      issue_id: newIssueId,
      status: 'REPORTED',
      notes: `Grievance lodged by ${reporterDisplayName} (${reporterUser?.email || 'N/A'}). AI classified as ${department} with Severity ${severity}/5.`
    });

    if (assignedWorkerId && workerResult) {
      db.addTimeline({
        issue_id: newIssueId,
        status: 'ASSIGNED',
        notes: `Smart dispatcher assigned ticket to ${workerResult.worker.name} (Current active load: ${workerResult.activeTickets} tickets).`
      });
    }

    return res.status(201).json({
      ...newIssue,
      reporter: reporterUser
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to process issue' });
  }
}

// GET /api/issues
export async function getIssues(req: Request, res: Response) {
  try {
    const collegeId = req.query.collegeId as string | undefined;
    const issues = db.getIssues(collegeId);
    const users = db.getUsers();

    const now = Date.now();
    const populated = issues.map(iss => {
      const hoursOpen = (now - new Date(iss.created_at).getTime()) / (1000 * 3600);
      const dynamicScore = calculatePriorityScore(iss.severity, iss.department, iss.latitude, iss.longitude, hoursOpen, iss.upvotes, iss.college_id);
      iss.priority_score = dynamicScore;

      const reporter = users.find(u => u.id === iss.reporter_id) || null;
      const assignedWorker = users.find(u => u.id === iss.assigned_to) || null;
      const timeline = db.getTimeline(iss.id);
      return {
        ...iss,
        reporter,
        assigned_worker: assignedWorker,
        timeline
      };
    });

    populated.sort((a, b) => b.priority_score - a.priority_score);
    return res.json(populated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/issues/hotspots
export async function getHotspots(req: Request, res: Response) {
  try {
    const collegeId = req.query.collegeId as string | undefined;
    const issues = db.getIssues(collegeId);
    const hotspots = issues.map(i => ({
      id: i.id,
      college_id: i.college_id,
      title: i.title,
      department: i.department,
      priority_score: i.priority_score,
      status: i.status,
      lat: i.latitude,
      lng: i.longitude,
      location_name: i.location_name,
      upvotes: i.upvotes
    }));
    return res.json(hotspots);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// PATCH /api/issues/:id/status
export async function updateIssueStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes, changedBy, assignedTo } = req.body;

    const existing = db.getIssue(id);
    if (!existing) return res.status(404).json({ error: 'Issue not found' });

    const updates: Partial<DbIssue> = {};
    if (status) updates.status = status;
    if (assignedTo !== undefined) updates.assigned_to = assignedTo;

    const updated = db.updateIssue(id, updates);

    let defaultNote = `Status transitioned to ${status}`;
    if (assignedTo) {
      const assignedUser = db.getUser(assignedTo);
      defaultNote = `Admin delegated ticket to ${assignedUser?.name || 'staff member'}.`;
    }

    db.addTimeline({
      issue_id: id,
      status: status || existing.status,
      notes: notes || defaultNote,
      changed_by: changedBy
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/issues/:id/upvote
export async function upvoteIssue(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = db.getIssue(id);
    if (!existing) return res.status(404).json({ error: 'Issue not found' });

    const newUpvotes = existing.upvotes + 1;
    const newScore = Number((existing.priority_score + 0.3).toFixed(2));
    const updated = db.updateIssue(id, { upvotes: newUpvotes, priority_score: newScore });

    db.addTimeline({
      issue_id: id,
      status: existing.status,
      notes: `Student community upvote received. Total upvotes: ${newUpvotes}.`
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/workers
export async function getWorkers(req: Request, res: Response) {
  try {
    const collegeId = req.query.collegeId as string | undefined;
    const allUsers = db.getUsers(collegeId);
    const staff = allUsers.filter(u => u.role === 'STAFF');
    const allIssues = db.getIssues(collegeId);

    const workersWithLoad = staff.map(w => {
      const activeTickets = allIssues.filter(
        i => i.assigned_to === w.id && (i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS')
      ).length;
      return {
        ...w,
        active_tickets: activeTickets
      };
    });

    return res.json(workersWithLoad);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
