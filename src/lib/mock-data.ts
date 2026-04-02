
import { Key, Assignee, Transaction, Complaint } from './types';

export const MOCK_USER = {
  uid: 'wilson-admin-123',
  displayName: 'Wilson Poliku',
  email: 'wilson@poliku.edu.my',
  photoURL: 'https://picsum.photos/seed/wilson/200/200',
  role: 'admin',
  phoneNumber: '+60 12-345 6789'
};

export const INITIAL_KEYS: any[] = [
  { 
    id: 'K001', 
    keyIdentifier: 'Main Lobby Entrance', 
    description: 'Room', 
    location: 'Security Desk', 
    currentStatus: 'available', 
    pegIndex: 0 
  },
  { 
    id: 'K002', 
    keyIdentifier: 'Server Room A', 
    description: 'Room', 
    location: 'IT Office', 
    currentStatus: 'checked_out', 
    lastAssignedToUserId: 'A001', 
    lastCheckoutTimestamp: new Date(Date.now() - 3600000).toISOString(), 
    pegIndex: 1 
  },
  { 
    id: 'K003', 
    keyIdentifier: 'Drilling Machine M1', 
    description: 'Machine', 
    location: 'Workshop Area B', 
    currentStatus: 'overdue', 
    lastAssignedToUserId: 'A002', 
    lastCheckoutTimestamp: new Date(Date.now() - 86400000).toISOString(), 
    pegIndex: 2 
  },
  { 
    id: 'K004', 
    keyIdentifier: 'Lab Workshop A', 
    description: 'Workshop', 
    location: 'Admin Office', 
    currentStatus: 'available', 
    pegIndex: 3 
  },
  { 
    id: 'K005', 
    keyIdentifier: 'CNC Machine 04', 
    description: 'Machine', 
    location: 'Workshop Area C', 
    currentStatus: 'available', 
    pegIndex: 4 
  },
];

export const INITIAL_ASSIGNEES: any[] = [
  { id: 'A001', fullName: 'Sarah Miller', department: 'IT Operations', email: 'sarah.m@company.com', phoneNumber: '+60 17-555 1234' },
  { id: 'A002', fullName: 'John Doe', department: 'Workshop', email: 'john.doe@company.com', phoneNumber: '+60 11-222 3333' },
  { id: 'wilson-admin-123', fullName: 'Wilson Poliku', department: 'Faculty', email: 'wilson@poliku.edu.my', phoneNumber: '+60 12-345 6789' },
];

export const MOCK_COMPLAINTS: Complaint[] = [
  { id: 'C1', userId: 'A001', userName: 'Sarah Miller', userEmail: 'sarah.m@company.com', description: 'Slot #2 microswitch is sticky.', status: 'pending', timestamp: new Date().toISOString() }
];

export const MOCK_LOGS = [
  { id: 'L1', type: 'HARDWARE', message: 'Cabinet unlocked remotely', userId: 'wilson-admin-123', userName: 'Wilson Poliku', timestamp: new Date().toISOString() },
  { id: 'L2', type: 'INVENTORY', message: 'Key K002 checked out', userId: 'A001', userName: 'Sarah Miller', timestamp: new Date(Date.now() - 3600000).toISOString() }
];
