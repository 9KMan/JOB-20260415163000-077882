'use client';

import { useState } from 'react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import type { AIAgentResponse } from '@/types';

interface AIAssistantPanelProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ leadId, leadName, onClose }) => {
  const { loading, error, analyzeLead, scoreLead, composeEmail } = useAIAssistant();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [currentResult, setCurrentResult] = useState<AIAgentResponse | null>(null);

  const handleAction = async (action: 'analyze' | 'score' | 'compose') => {
    let result: AIAgentResponse | null = null;

    switch (action) {
      case 'analyze':
        result = await analyzeLead(leadId);
        break;
      case 'score':
        result = await scoreLead(leadId);
        break;
      case 'compose':
        result = await composeEmail(leadId);
        break;
    }

    if (result) {
      setCurrentResult(result);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `Action: ${result.action}\n\nResult: ${result.result}`,
        },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">AI Assistant - {leadName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => handleAction('analyze')}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Analyze Lead'}
          </button>
          <button
            onClick={() => handleAction('score')}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Score Lead'}
          </button>
          <button
            onClick={() => handleAction('compose')}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Compose Email'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center">
              Select an action above to get AI-powered insights for this lead.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.role === 'ai' ? 'bg-blue-50 text-blue-900' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{msg.role === 'ai' ? 'AI' : 'You'}</div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {currentResult && currentResult.action === 'compose' && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium mb-2">Generated Email:</h3>
            <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
              {currentResult.result}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(currentResult.result)}
              className="mt-2 px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantPanel;
