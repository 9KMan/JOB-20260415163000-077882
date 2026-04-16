'use client';

import { useState, useCallback } from 'react';
import type { AIAgentRequest, AIAgentResponse } from '@/types';

export function useAIAssistant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeLead = useCallback(async (leadId: string): Promise<AIAgentResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, action: 'analyze' } as AIAgentRequest),
      });

      if (!response.ok) throw new Error('AI request failed');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const scoreLead = useCallback(async (leadId: string): Promise<AIAgentResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, action: 'score' } as AIAgentRequest),
      });

      if (!response.ok) throw new Error('AI request failed');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const composeEmail = useCallback(async (leadId: string): Promise<AIAgentResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, action: 'compose' } as AIAgentRequest),
      });

      if (!response.ok) throw new Error('AI request failed');
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    analyzeLead,
    scoreLead,
    composeEmail,
  };
}
