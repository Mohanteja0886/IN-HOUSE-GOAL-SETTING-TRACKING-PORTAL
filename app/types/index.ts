export type Role = 'Employee' | 'Manager' | 'Admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  title: string;
  managerId?: string;
}

export type UoM = 'numeric' | 'percentage' | 'timeline' | 'binary' | 'zero-based';

export type GoalStatus = 
  | 'Pending Review' 
  | 'Returned' 
  | 'Submitted' 
  | 'Locked' 
  | 'On Track' 
  | 'Behind' 
  | 'Completed' 
  | 'Scheduled';

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  thrustArea: string;
  description: string;
  uom: UoM;
  target: string;
  weightage: number;
  status: GoalStatus;
  comments: Comment[];
  lastUpdated: string;
  achievements?: {
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
  };
  isShared?: boolean;
  sharedFrom?: string;
}
