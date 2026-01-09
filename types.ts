export type Screen = 'dashboard' | 'schedule' | 'jobDetails' | 'invoice' | 'customers' | 'settings' | 'customerProfile' | 'crews';

export interface Job {
  id: string;
  clientName: string;
  address: string;
  time: string;
  serviceType: string;
  crew: string;
  status: 'upcoming' | 'in-progress' | 'completed' | 'conflict';
  completionStatus?: string;
  notes?: string;
  thumbnail?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  invoiceNumber?: string;
}

export interface Crew {
  id: string;
  name: string;
  leader: string;
  members: string[];
  status: 'on-job' | 'transit' | 'available' | 'off';
  currentJobId?: string;
  currentJobName?: string;
  lastSeen: string;
  avatar: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email: string;
  address: string;
  lastClean: string;
  lastService?: string;
  type: 'RESI' | 'COMM';
  avatar: string;
  status?: 'OVERDUE' | 'NORMAL' | 'LEAD' | 'INACTIVE';
  flags?: ('pets' | 'lock')[];
  notes?: string[];
  totalSpend?: number;
  jobCount?: number;
  tags?: string[];
  source?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  type: 'call' | 'email' | 'note' | 'service';
  content: string;
  author: string;
}