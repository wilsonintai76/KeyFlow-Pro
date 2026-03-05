import { Key, Assignee, Transaction } from './types';

export const INITIAL_KEYS: Key[] = [
  { id: 'K001', name: 'Main Lobby Entrance', type: 'Building', location: 'Security Desk', status: 'available' },
  { id: 'K002', name: 'Server Room A', type: 'High Security', location: 'IT Office', status: 'checked_out', currentAssigneeId: 'A001' },
  { id: 'K003', name: 'Company Van #2', type: 'Vehicle', location: 'Garage Key Box', status: 'overdue', currentAssigneeId: 'A002' },
  { id: 'K004', name: 'Executive Suite 4B', type: 'Office', location: 'Admin Office', status: 'available' },
  { id: 'K005', name: 'Warehouse Dock 4', type: 'Industrial', location: 'Warehouse Manager Office', status: 'available' },
  { id: 'K006', name: 'IT Lab 2', type: 'High Security', location: 'IT Office', status: 'checked_out', currentAssigneeId: 'A003' },
];

export const INITIAL_ASSIGNEES: Assignee[] = [
  { id: 'A001', name: 'John Doe', department: 'IT Operations', email: 'john.doe@company.com' },
  { id: 'A002', name: 'Sarah Miller', department: 'Logistics', email: 'sarah.m@company.com' },
  { id: 'A003', name: 'Mike Johnson', department: 'Development', email: 'mike.j@company.com' },
  { id: 'A004', name: 'Alice Wong', department: 'HR', email: 'alice.w@company.com' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'T001',
    keyId: 'K002',
    assigneeId: 'A001',
    checkoutDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    returnDate: null,
    status: 'active'
  },
  {
    id: 'T002',
    keyId: 'K003',
    assigneeId: 'A002',
    checkoutDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    returnDate: null,
    status: 'active'
  },
  {
    id: 'T003',
    keyId: 'K006',
    assigneeId: 'A003',
    checkoutDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    returnDate: null,
    status: 'active'
  }
];