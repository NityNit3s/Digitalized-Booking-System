/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Device } from '../types';
import { DEPARTMENTS, WORK_ROLES } from '../data';
import {
  Sparkles, Send, Bot, MessageCirclePlus, HelpCircle,
  Briefcase, Compass, Search, Keyboard, Star, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

interface AiAssistantProps {
  devices: Device[];
  onHighlightRecommendations: (recommendedIds: string[]) => void;
  onSelectRecommendedDevice: (device: Device) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAssistant({ devices, onHighlightRecommendations, onSelectRecommendedDevice }: AiAssistantProps) {
  const [activeMode, setActiveMode] = useState<'recommender' | 'chat'>('recommender');
  
  // Recommender States
  const [role, setRole] = useState(WORK_ROLES[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [needs, setNeeds] = useState('');
  const [recommendationResults, setRecommendationResults] = useState<Array<{ deviceId: string; reason: string }>>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recError, setRecError] = useState('');

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya adalah Asisten AI Inventaris IT Kantor. Anda bisa menanyakan kebijakan pengajuan perangkat, membandingkan spesifikasi komputer, atau meminta rekomendasi aksesoris penunjang di sini.'
    }
  ]);
  const [isChatting, setIsChatting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatting]);

  // Request Recommendation
  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecommending(true);
    setRecError('');
    setRecommendationResults([]);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          department,
          needs
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mendapatkan usulan rekomendasi dari AI.');
      }

      const data = await response.json();
      const results = data.recommendations || [];
      setRecommendationResults(results);

      // Highlight in parent catalog view
      const ids = results.map((r: any) => r.deviceId);
      onHighlightRecommendations(ids);

    } catch (err: any) {
      setRecError(err.message || 'Kesalahan koneksi asisten AI.');
    } finally {
      setIsRecommending(false);
    }
  };

  // Submit Chat message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    
    const updatedMessages = [...messages, { role: 'user', content: userMsg } as Message];
    setMessages(updatedMessages);
    setIsChatting(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages,
          deviceCatalog: devices
        })
      });

      if (!response.ok) {
        throw new Error('Gagal memanggil asisten chat AI.');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Terjadi kegagalan komunikasi dengan asisten AI. Silakan periksa kunci API Anda di Settings -> Secrets.'
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  // Help suggestions
  const suggestedQueries = [
    'Laptop apa yang cocok untuk tim Desain Grafis?',
    'Bagaimana aturan penambahan monitor eksternal?',
    'Berapa lama estimasi persetujuan pinjaman?',
    'Lihat spek Lenovo ThinkPad X1.'
  ];

  const handleApplyQuery = (query: string) => {
    setChatInput(query);
    setActiveMode('chat');
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white p-5 relative shrink-0">
        <div className="absolute right-4 top-4 opacity-5">
          <Bot className="w-16 h-16 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-blue-450">Pusat Bantuan AI</span>
        </div>
        <h3 className="text-base font-bold mt-2 text-white">IT Smart Assistant</h3>
        <p className="text-xs text-slate-400 mt-1">Cari usulan perangkat kantor yang paling presisi.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 text-left">
        <button
          type="button"
          onClick={() => setActiveMode('recommender')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition ${
            activeMode === 'recommender'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-950/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Rekomendasi Pintar (AI)
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('chat')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 cursor-pointer transition ${
            activeMode === 'chat'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-950/10'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Konsultasi IT (Bot)
        </button>
      </div>

      {/* Mode Body Content */}
      <div className="flex-1 overflow-y-auto p-5 text-left">
        {/* RECOMMENDER MODE */}
        {activeMode === 'recommender' && (
          <div className="space-y-5">
            <form onSubmit={handleGetRecommendations} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Jabatan / Role Kerja
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  {WORK_ROLES.map((r) => (
                    <option key={r} value={r} className="dark:bg-slate-900">{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Departemen
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="dark:bg-slate-900">{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Kebutuhan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Butuh laptop berspesifikasi GPU tinggi untuk merender visual unreal engine..."
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-700 dark:text-slate-200 leading-relaxed font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isRecommending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer transition shadow-xs"
              >
                <Sparkles className={`w-4 h-4 ${isRecommending ? 'animate-spin' : ''}`} />
                {isRecommending ? 'Menganalisa Katalog...' : 'Hubungkan Asisten AI'}
              </button>
            </form>

            {recError && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-lg text-xs border border-red-150 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{recError}</span>
              </div>
            )}

            {/* Recommendation Outputs */}
            {recommendationResults.length > 0 && (
              <div className="space-y-3.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 block">Hasil usulan AI ({recommendationResults.length})</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">highlight aktif</span>
                </div>
                
                {recommendationResults.map((result, idx) => {
                  const matchedDevice = devices.find((d) => d.id === result.deviceId);
                  if (!matchedDevice) return null;
 
                  return (
                    <div
                      key={idx}
                      className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/35 p-4 rounded-lg space-y-2 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">{matchedDevice.name}</h4>
                          <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block mt-0.5">{matchedDevice.category}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectRecommendedDevice(matchedDevice)}
                          className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Pilih
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-650 dark:text-slate-300 leading-relaxed italic">
                        "{result.reason}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CHAT CHATBOT MODE */}
        {activeMode === 'chat' && (
          <div className="space-y-4 flex flex-col h-full justify-between">
            {/* Chats stream */}
            <div className="space-y-4 min-h-[220px]">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-left ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role !== 'user' && (
                    <div className="w-7 h-7 bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 border border-blue-105 dark:border-blue-900/40">
                      <Bot className="w-4 h-4 text-blue-650 dark:text-blue-405" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-slate-900 dark:bg-blue-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-slate-50 dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 border border-slate-150 dark:border-slate-800 rounded-tl-none font-medium shadow-2xs'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex gap-3 text-left justify-start">
                  <div className="w-7 h-7 bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-450 rounded-full flex items-center justify-center shrink-0 border border-blue-105 dark:border-blue-900/30 animate-bounce">
                    <Bot className="w-4 h-4 text-blue-650 dark:text-blue-450" />
                  </div>
                  <div className="bg-slate-50 dark:bg-[#1e293b] text-slate-400 dark:text-slate-450 p-3 rounded-lg border border-slate-155 dark:border-slate-800 text-xs italic">
                    AI sedang merespon percakapan...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Tags (Shorten to space) */}
            {messages.length < 3 && (
              <div className="pt-2">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Saran pertanyaan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedQueries.map((query, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyQuery(query)}
                      className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-450 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 transition cursor-pointer text-left"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating message input footer */}
      {activeMode === 'chat' && (
        <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Tanyakan hal teknis atau kebijakan kantor..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatting}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-600 dark:focus:border-blue-550 text-slate-750 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatting}
            className={`p-2 rounded-lg shrink-0 cursor-pointer transition ${
              chatInput.trim() && !isChatting
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
