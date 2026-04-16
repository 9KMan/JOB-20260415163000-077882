'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToLeads,
  createLead,
  updateLead as updateLeadFirebase,
  deleteLead as deleteLeadFirebase,
  getLead,
} from '@/lib/firebase';
import type { Lead } from '@/types';

export function useLeads(userId: string | undefined) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | 'all'>('all');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToLeads(
      userId,
      {
        onNext: (leadsData) => {
          setLeads(leadsData as Lead[]);
          setFilteredLeads(leadsData as Lead[]);
          setLoading(false);
        },
        onError: (err) => {
          setError(err.message);
          setLoading(false);
        },
      },
      statusFilter !== 'all' ? { status: statusFilter } : undefined
    );

    return unsubscribe;
  }, [userId, statusFilter]);

  useEffect(() => {
    let filtered = leads;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(lower) ||
          lead.email.toLowerCase().includes(lower) ||
          lead.company.toLowerCase().includes(lower)
      );
    }

    setFilteredLeads(filtered);
  }, [leads, searchQuery]);

  const addLead = useCallback(
    async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        await createLead(userId, leadData);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const editLead = useCallback(
    async (leadId: string, leadData: Partial<Lead>) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        await updateLeadFirebase(leadId, userId, leadData);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const removeLead = useCallback(
    async (leadId: string) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        await deleteLeadFirebase(leadId, userId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const getLeadById = useCallback(
    async (leadId: string) => {
      if (!userId) return null;
      try {
        return await getLead(leadId, userId);
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [userId]
  );

  return {
    leads: filteredLeads,
    allLeads: leads,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    addLead,
    editLead,
    removeLead,
    getLeadById,
    refreshLeads: () => {},
  };
}
