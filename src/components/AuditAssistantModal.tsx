import React, { useState, useEffect, useRef } from 'react';
import { HealthFacility, Language } from '../types';
import { translations } from '../locales/translations';
import { askAuditAssistant } from '../services/aiService';
import { Bot, Send, X, Sparkles, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';

interface AuditAssistantModalProps {
  facilities: HealthFacility[];
  language: Language;
  onClose: () => void;
}

export const AuditAssistantModal: React.FC<AuditAssistantModalProps> = ({
  facilities,
  language,
  onClose,
}) => {
  const t = translations[language];
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    facilities[1]?.id || facilities[0]?.id || ''
  );
  const [conversation, setConversation] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; actions?: string[]; isError?: boolean; isLiveAI?: boolean }>
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize initial message when language changes
  useEffect(() => {
    setConversation([
      {
        role: 'assistant',
        text: t.assistantGreeting,
        actions: [t.q1, t.q2, t.q3],
      },
    ]);
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation, loading]);

  const activeFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

  const handleSubmit = async (userQuery: string) => {
    const trimmed = userQuery.trim();
    if (!trimmed || loading) return;

    setConversation((prev) => [...prev, { role: 'user', text: trimmed }]);
    setQuery('');
    setLoading(true);

    try {
      const result = await askAuditAssistant(
        trimmed,
        activeFacility,
        language
      );
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.answer,
          actions: result.suggestedActions,
          isError: result.isError,
          isLiveAI: result.isLiveAI,
        },
      ]);
    } catch (e: any) {
      console.error(e);
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Service Notice: ${e.message || 'Unable to communicate with the Clinical AI service.'}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col h-[580px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{t.actionAIAssistant}</h3>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-1.5 py-0.5 rounded">
                  Gemini 3.8 Flash
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {t.assistantSub}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Facility Context Toolbar */}
        <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{t.colLocation}:</span>
          </div>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-teal-700 focus:outline-none max-w-[260px] truncate"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3 rounded-lg leading-relaxed shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-teal-700 text-white font-medium'
                    : msg.isError
                    ? 'bg-rose-50 text-rose-900 border border-rose-200'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                {msg.isError ? (
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Configuration Notice</span>
                  </div>
                ) : msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 text-[10px] text-teal-800 font-semibold mb-1">
                    <CheckCircle2 className="w-3 h-3 text-teal-700 shrink-0" />
                    <span>Gemini 3.8 Flash Clinical AI</span>
                  </div>
                )}
                <div className="whitespace-pre-line text-xs">{msg.text}</div>
              </div>

              {/* Action buttons if assistant */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[88%]">
                  {msg.actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={() => handleSubmit(act)}
                      disabled={loading}
                      className="text-[11px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 text-left transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 text-teal-700 shrink-0" />
                      <span>{act}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-slate-50 border border-slate-200 rounded-md w-fit">
              <Bot className="w-4 h-4 text-teal-700 animate-pulse" />
              <span>{t.analyzingProtocols}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(query);
          }}
          className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.assistantPlaceholder}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 disabled:opacity-50 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
