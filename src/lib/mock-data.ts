
import { Key, Assignee, Transaction } from './types';

export const INITIAL_KEYS: Key[] = [
  { id: 'K001', name: 'Main Lobby Entrance', type: 'Room', location: 'Security Desk', status: 'available' },
  { id: 'K002', name: 'Server Room A', type: 'Room', location: 'IT Office', status: 'checked_out', currentAssigneeId: 'A001' },
  { id: 'K003', name: 'Drilling Machine M1', type: 'Machine', location: 'Workshop Area B', status: 'overdue', currentAssigneeId: 'A002' },
  { id: 'K004', name: 'Lab Workshop A', type: 'Workshop', location: 'Admin Office', status: 'available' },
  { id: 'K005', name: 'CNC Machine 04', type: 'Machine', location: 'Workshop Area C', status: 'available' },
];

export const INITIAL_ASSIGNEES: Assignee[] = [
  { id: 'A001', name: 'John Doe', department: 'IT Operations', email: 'john.doe@company.com' },
  { id: 'A002', name: 'Sarah Miller', department: 'Workshop', email: 'sarah.m@company.com' },
  { id: 'A003', name: 'Wilson Poliku', department: 'Faculty', email: 'wilson@poliku.edu.my' },
];

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
