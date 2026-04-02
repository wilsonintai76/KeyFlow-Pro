
export type KeyStatus = 'available' | 'checked_out' | 'overdue';

export interface Key {
  id: string;
  name: string;
  type: string;
  location: string;
  status: KeyStatus;
  currentAssigneeId?: string;
  lastCheckoutTimestamp?: string;
  pegIndex?: number;
  lastServiceDate?: string;
}

export interface Assignee {
  id: string;
  name: string;
  department: string;
  email: string;
  phoneNumber?: string;
}

export interface Transaction {
  id: string;
  keyId: string;
  assigneeId: string;
  checkoutDate: string;
  returnDate: string | null;
  status: 'active' | 'completed';
}

export type DashboardStats = {
  totalKeys: number;
  available: number;
  checkedOut: number;
  overdue: number;
};

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  description: string;
  status: 'pending' | 'resolved';
  timestamp: string;
}

export type UserRole = 'admin' | 'staff' | 'student' | 'guest';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string | null;
  registrationNumber?: string | null;
  studentClass?: string | null;
  staffId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CabinetStatus {
  doorOpen: boolean;
  locked: boolean;
  lastActivity: string;
  lastUser?: string;
  lastUserName?: string;
}

export interface CabinetCommand {
  unlockRequested: boolean;
  requestedBy: string;
  requestedByName: string;
  timestamp: string;
}
