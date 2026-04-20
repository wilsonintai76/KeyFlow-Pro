export type UserRole = 'guest' | 'student' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  registrationNumber?: string;
  studentClass?: string;
  staffId?: string;
  pin?: string; // 4-digit PIN for offline access
}


export type KeyStatus = 'available' | 'checked_out' | 'overdue';

export interface Key {
  id: string;
  name: string;
  type?: string;
  location: string;
  status: KeyStatus;
  currentAssigneeId?: string;
  lastCheckoutTimestamp?: string;
  pegIndex?: number;
  lastServiceDate?: string;
  // Fields used in seeding/admin that should be optional or aligned
  keyIdentifier?: string;
  description?: string;
  currentStatus?: KeyStatus;
}

export interface CabinetStatus {
  doorOpen: boolean;
  locked: boolean;
  lastUserName?: string;
}

export interface Assignee {
  id: string;
  fullName: string;
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
