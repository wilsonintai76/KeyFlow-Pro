
import { Key, Assignee, Transaction } from './types';

export const INITIAL_KEYS: Key[] = [
  { id: 'K001', name: 'Main Lobby Entrance', keyIdentifier: 'K001', description: 'Main gate access', location: 'Security Desk', status: 'available' },
  { id: 'K002', name: 'Server Room A', keyIdentifier: 'K002', description: 'Critical infrastructure', location: 'IT Office', status: 'checked_out', currentAssigneeId: 'A001' },
  { id: 'K003', name: 'Drilling Machine M1', keyIdentifier: 'K003', description: 'Industrial equipment', location: 'Workshop Area B', status: 'overdue', currentAssigneeId: 'A002' },
  { id: 'K004', name: 'Lab Workshop A', keyIdentifier: 'K004', description: 'Student lab access', location: 'Admin Office', status: 'available' },
  { id: 'K005', name: 'CNC Machine 04', keyIdentifier: 'K005', description: 'Precision milling', location: 'Workshop Area C', status: 'available' },
];

export const INITIAL_ASSIGNEES: Assignee[] = [
  { id: 'A001', fullName: 'John Doe', department: 'IT Operations', email: 'john.doe@company.com' },
  { id: 'A002', fullName: 'Sarah Miller', department: 'Workshop', email: 'sarah.m@company.com' },
  { id: 'A003', fullName: 'Wilson Poliku', department: 'Faculty', email: 'wilson@poliku.edu.my' },
];

export const MOCK_USER = {
  uid: 'A003',
  email: 'wilson@poliku.edu.my',
  user_metadata: {
    full_name: 'Wilson Poliku'
  }
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'T001',
    keyId: 'K002',
    assigneeId: 'A001',
    checkoutDate: "2024-03-01T08:00:00.000Z",
    returnDate: null,
    status: 'active'
  },
];
