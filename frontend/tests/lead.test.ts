import { describe, it, expect } from 'vitest';
import type { Lead, LeadStatus } from '../types';

describe('Lead Types', () => {
  it('should have valid status values', () => {
    const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted'];
    expect(statuses).toContain('new');
    expect(statuses).toContain('qualified');
  });

  it('should have required lead fields', () => {
    const lead: Lead = {
      id: 'lead_123',
      userId: 'user_456',
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      status: 'new',
      score: 75,
      notes: 'Test note',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(lead.id).toBe('lead_123');
    expect(lead.email).toBe('john@example.com');
    expect(lead.score).toBe(75);
  });
});
