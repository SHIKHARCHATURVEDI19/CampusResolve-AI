import { db, DbIssue } from '../config/db.ts';
import { calculateDistanceMeters } from './geoService.ts';

const DEPT_WEIGHTS: Record<string, number> = {
  SECURITY: 5,
  IT: 4,
  MAINTENANCE: 3,
  HOUSEKEEPING: 2,
  ACADEMICS: 2,
};

export function calculatePriorityScore(
  severity: number,
  department: string,
  latitude: number,
  longitude: number,
  hoursOpen: number = 0,
  upvotesCount: number = 1,
  collegeId?: string
): number {
  const S = Math.min(Math.max(severity, 1), 5);

  // Calculate frequency: existing issues in 50m radius within the SAME college
  const allIssues = db.getIssues(collegeId);
  let nearbyCount = 0;
  for (const issue of allIssues) {
    if (calculateDistanceMeters(latitude, longitude, issue.latitude, issue.longitude) <= 50) {
      nearbyCount++;
    }
  }

  const F = Math.min(nearbyCount + (upvotesCount - 1), 10);
  const I = DEPT_WEIGHTS[department] || 2;
  const T = Math.log(hoursOpen + 1);

  const score = (S * 0.4) + (F * 0.3) + (I * 0.2) + (T * 0.1);
  return Number(score.toFixed(2));
}

/**
 * Worker Load Balancing Engine (College Scoped)
 * Finds the staff member in the given department inside the SAME college with the lowest count of active tickets ('ASSIGNED' | 'IN_PROGRESS')
 */
export function findBestAvailableWorker(department: string, collegeId: string) {
  const staff = db.getUsers(collegeId).filter(u => u.role === 'STAFF' && u.department === department);
  if (!staff.length) return null;

  const allIssues = db.getIssues(collegeId);
  const workerLoads = staff.map(worker => {
    const activeTickets = allIssues.filter(
      issue => issue.assigned_to === worker.id && (issue.status === 'ASSIGNED' || issue.status === 'IN_PROGRESS')
    ).length;
    return {
      worker,
      activeTickets
    };
  });

  workerLoads.sort((a, b) => {
    if (a.activeTickets !== b.activeTickets) {
      return a.activeTickets - b.activeTickets;
    }
    return Math.random() - 0.5;
  });

  return workerLoads[0];
}
