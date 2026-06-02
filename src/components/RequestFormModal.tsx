/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Device, RequestForm } from '../types';
import { X, Sparkles, AlertCircle, Calendar, Send, Compass, User, Briefcase, Mail } from 'lucide-react';
import { DEPARTMENTS, WORK_ROLES } from '../data';

interface RequestFormModalProps {
  device: Device;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  applicantEmail: string;
}

export default function RequestFormModal({ device, onClose, onSubmit, applicantEmail }: RequestFormModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState(WORK_ROLES[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [email, setEmail] = useState(applicantEmail);
  const [crudeReason, setCrudeReason] = useState('');
  const [justification, setJustification] = useState('');
  const [expectedDate, setExpectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 3); // 3 days from now
    return today.toISOString().split('T')[0];
  });
  const [usageDuration, setUsageDuration] = useState('Permanen');

  const [aiGenerating, setAiGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const durations = ['Permanen', '12 Bulan', '6 Bulan', '3 Bulan', 'Project-Based (Spesifik)'];

  // Call Gemini API to write a professional justification
  const handleAiAssist = async () => {
    if (!crudeReason.trim()) {
      setErrorMessage('Silakan tulis alasan singkat / draf kasar Anda terlebih dahulu agar AI dapat memproses.');
      return;
    }
    setErrorMessage('');
    setAiGenerating(true);

    try {
      const response = await fetch('/api/ai/assist-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          department,
          deviceName: device.name,
          crudeReason
        })
      });

      if (!response.ok) {
        throw new Error('Respons jaringan gagal');
      }

      const data = await response.json();
      setJustification(data.justification);
    } catch (err) {
      console.error('Error assisting form:', err);
      // Fallback
      setJustification(`Menimbang peranan saya sebagai ${role} di departemen ${department}, pengajuan ${device.name} ini penting untuk menunjang kebutuhan profesional saya. Draf alasan: "${crudeReason}"`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama pemohon wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Alamat email perusahaan tidak valid.');
      return;
    }
    const finalReason = justification || crudeReason;
    if (!finalReason.trim()) {
      setErrorMessage('Alasan pengajuan wajib diisi atau buat dengan asisten AI.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        applicantName: name,
        applicantRole: role,
        department,
        email,
        deviceId: device.id,
        deviceName: device.name,
        deviceImage: device.image,
        reason: finalReason,
        expectedDate,
        usageDuration
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirimkan pengajuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Formulir Pengajuan Inventaris</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ajukan perangkat {device.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-800 hover:text-slate-605 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-[#0f172a]">
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-xs flex items-center gap-2 border border-red-100 dark:border-red-900/40 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Selected Device Card */}
          <div className="bg-blue-50/50 dark:bg-blue-955/10 p-4 rounded-xl flex items-center gap-4 border border-blue-150 dark:border-blue-900/40 text-left">
            <img referrerPolicy="no-referrer" src={device.image} alt={device.name} className="w-16 h-16 object-cover rounded-lg border border-white dark:border-slate-800 shadow-xs shrink-0 bg-slate-50 dark:bg-slate-900" />
            <div>
              <span className="text-[10px] uppercase tracking-wide font-extrabold bg-blue-100 dark:bg-blue-955/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">Pilihan Anda</span>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1">{device.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1 mt-0.5">{device.specification}</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5 text-left bg-white dark:bg-[#0f172a]">
            {/* Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nama Penerima / Pemohon
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama lengkap Anda..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Perusahaan
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>
            </div>

            {/* Department and Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" /> Departemen / Divisi
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-200 text-left font-medium"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-white dark:bg-[#0f172a] text-slate-805 dark:text-slate-200">{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Peran / Jabatan
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-200 text-left font-medium"
                >
                  {WORK_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-white dark:bg-[#0f172a] text-slate-805 dark:text-slate-200">{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expected Date & Usage Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ekspektasi Tanggal Pemakaian
                </label>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-305">Durasi Pemakaian</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {durations.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setUsageDuration(dur)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition ${
                        usageDuration === dur
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reason drafts & Justification using AI */}
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Alasan & Justifikasi Pengajuan
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ketik alasan singkat Anda di bawah, lalu klik tombol AI untuk membubuhkan deskripsi justifikasi yang formal dan terstruktur.
                </p>
              </div>

              {/* Crude write-up */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Draft Alasan Sederhana (Input kasar)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Laptop lama lemot saat dipakai render Figma / butuh monitor kedua agar tidak silang tab terus..."
                  value={crudeReason}
                  onChange={(e) => setCrudeReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-205 leading-relaxed font-medium"
                />
              </div>

              {/* Action AI Generate */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={aiGenerating || !crudeReason.trim()}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    crudeReason.trim()
                      ? 'bg-blue-50 dark:bg-blue-955/35 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/40 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
                  {aiGenerating ? 'Menyempurnakan via AI...' : 'Sempurnakan Form (AI)'}
                </button>
              </div>

              {/* Final Justification */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-305">Justifikasi Profesional Akhir (Dikirim ke Admin)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Justifikasi Anda akan digenerate secara formal di sini. Anda juga bisa menulis atau mengedit teks ini secara manual."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-205 font-medium"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-semibold hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            disabled={isSubmitting || aiGenerating}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:bg-blue-450 dark:disabled:bg-blue-800/80 text-xs font-semibold px-6 py-2 rounded-lg cursor-pointer transition"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  );
}
