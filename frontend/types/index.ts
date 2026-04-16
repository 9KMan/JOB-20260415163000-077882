export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
  score: number;
  notes: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export type LeadStatus = Lead['status'];

export interface AIAgentRequest {
  leadId: string;
  action: 'analyze' | 'score' | 'compose';
}

export interface AIAgentResponse {
  action: string;
  result: string;
  leadId: string;
}
