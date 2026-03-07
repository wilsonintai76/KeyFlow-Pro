
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
