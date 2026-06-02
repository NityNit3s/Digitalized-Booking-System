/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Device, RequestForm } from '../types';
import {
  Clock, CheckCircle, XCircle, Plus, Eye, Check, X,
  Archive, FileText, Settings, Shield, PlusCircle, Layout, Package, Star, ArrowUpRight
} from 'lucide-react';
import { DEPARTMENTS } from '../data';

interface AdminDashboardProps {
  requests: RequestForm[];
  devices: Device[];
  onUpdateStatus: (id: string, status: any, adminNotes: string) => Promise<void>;
  onAddDevice: (device: any) => Promise<void>;
}

export default function AdminDashboard({ requests, devices, onUpdateStatus, onAddDevice }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'add-device'>('requests');
  
  // Update request state
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [adminNotesText, setAdminNotesText] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // New device form state
  const [newDevName, setNewDevName] = useState('');
  const [newDevCategory, setNewDevCategory] = useState<'Laptop/PC' | 'Monitor' | 'Aksesoris' | 'Gadget'>('Laptop/PC');
  const [newDevSpecs, setNewDevSpecs] = useState('');
  const [newDevStock, setNewDevStock] = useState(5);
  const [newDevUsage, setNewDevUsage] = useState('');
  const [newDevImage, setNewDevImage] = useState('https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600');

  // Stats calculation
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === 'Pending').length;
  const approvedRequests = requests.filter((r) => r.status === 'Disetujui' || r.status === 'Diserahkan').length;
  const outRequests = requests.filter((r) => r.status === 'Diserahkan').length;

  const handleStatusClick = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      await onUpdateStatus(id, status as any, adminNotesText);
      setEditingReqId(null);
      setAdminNotesText('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName || !newDevSpecs || !newDevUsage) {
      alert('Semua bidang wajib diisi.');
      return;
    }

    try {
      await onAddDevice({
        name: newDevName,
        category: newDevCategory,
        specification: newDevSpecs,
        stock: Number(newDevStock),
        usageDescription: newDevUsage,
        image: newDevImage
      });

      // Reset
      setNewDevName('');
      setNewDevSpecs('');
      setNewDevUsage('');
      setNewDevStock(5);
      setActiveTab('requests');
      alert('Perangkat baru berhasil ditambahkan ke katalog!');
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending Review</span>;
      case 'Disetujui':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Disetujui</span>;
      case 'Ditolak':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Ditolak</span>;
      case 'Diserahkan':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Diserahkan (Aktif)</span>;
      case 'Dikembalikan':
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">Dikembalikan</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Admin header stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Evaluasi</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalRequests}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 rounded-lg border border-transparent dark:border-blue-900/10">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Butuh Evaluasi</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{pendingRequests}</h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 rounded-lg border border-transparent dark:border-amber-900/10">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Disetujui</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{approvedRequests}</h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-transparent dark:border-emerald-900/10">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sedang Dipakai</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{outRequests}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 rounded-lg border border-transparent dark:border-blue-900/10">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 cursor-pointer transition relative ${
            activeTab === 'requests'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Layout className="w-4 h-4" />
          Daftar Pengajuan Karyawan
          {pendingRequests > 0 && (
            <span className="bg-amber-105 dark:bg-amber-955/50 text-amber-800 dark:text-amber-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block">
              {pendingRequests}
            </span>
          )}
          {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>}
        </button>

        <button
          onClick={() => setActiveTab('add-device')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 cursor-pointer transition relative ${
            activeTab === 'add-device'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Perangkat Baru
          {activeTab === 'add-device' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full"></div>}
        </button>
      </div>

      {/* Tab 1: Queue of Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Antrian Kelola</h3>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-805 p-12 text-center rounded-xl shadow-xs">
              <p className="text-slate-500 dark:text-slate-400 text-[13px]">Belum ada pengajuan perangkat dari karyawan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Applicant Profile */}
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-xs flex flex-col items-center">
                        <span className="uppercase text-[8px] text-slate-400 dark:text-slate-500 font-extrabold">REQ</span>
                        <span className="text-slate-800 dark:text-slate-200">{req.id.split('-')[1]?.substring(6) || 'INC'}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-base">{req.applicantName}</span>
                          <span className="text-xs font-semibold text-slate-400 select-none">•</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-semibold uppercase">{req.applicantRole}</span>
                          <span className="text-[10px] bg-blue-50 dark:bg-blue-955/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-semibold uppercase">{req.department}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{req.email}</p>
                        
                        <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                          <span className="text-slate-500 dark:text-slate-400">Memohon:</span> 
                          <span className="text-blue-600 dark:text-blue-400 font-bold">{req.deviceName}</span>
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px] px-1.5 py-0.5 rounded ml-2">Durasi: {req.usageDuration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Created Time */}
                    <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0">
                      {getStatusBadge(req.status)}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-1">
                        Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Justification text */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-150 dark:border-slate-800 mt-4">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Justifikasi Bisnis:</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{req.reason}"
                    </p>
                  </div>

                  {/* Notes & Admin Decision Panel */}
                  <div className="mt-4 pt-4 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      {editingReqId === req.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Tulis catatan persetujuan / alasan tolak..."
                            value={adminNotesText}
                            onChange={(e) => setAdminNotesText(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-lg flex-1 focus:outline-none focus:border-blue-600 text-slate-700 dark:text-slate-205 font-medium"
                          />
                          <button
                            onClick={() => setEditingReqId(null)}
                            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {req.adminNotes ? (
                            <p>
                              <span className="font-bold text-slate-600 dark:text-slate-300">Catatan Admin:</span> {req.adminNotes}
                            </p>
                          ) : (
                            <p className="italic text-slate-400 dark:text-slate-500">Tidak ada catatan admin.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons based on state */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {editingReqId === req.id ? (
                        <>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleStatusClick(req.id, 'Disetujui')}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Setujui
                          </button>
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleStatusClick(req.id, 'Ditolak')}
                            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </>
                      ) : (
                        <>
                          {req.status === 'Pending' && (
                            <button
                              onClick={() => {
                                setEditingReqId(req.id);
                                setAdminNotesText(req.adminNotes || '');
                              }}
                              className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition"
                            >
                              Evaluasi Pengajuan
                            </button>
                          )}

                          {req.status === 'Disetujui' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'Diserahkan', 'Serah terima perangkat selesai oleh IT.')}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-xs"
                            >
                              Serah Terima Perangkat
                            </button>
                          )}

                          {req.status === 'Diserahkan' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'Dikembalikan', 'Perangkat telah dikembalikan ke tim IT.')}
                              className="bg-slate-100 dark:bg-slate-805 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition flex items-center gap-1.5"
                            >
                              Proses Pengembalian
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Add Inventory Perangkat */}
      {activeTab === 'add-device' && (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <Package className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Registrasi Perangkat Inventaris Baru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daftarkan perangkat baru ke dalam katalog sistem IT.</p>
            </div>
          </div>

          <form onSubmit={handleCreateDeviceSubmit} className="space-y-5">
            {/* Name and category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Perangkat</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dell Latitude 5440"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-205 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategori</label>
                <select
                  value={newDevCategory}
                  onChange={(e) => setNewDevCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-705 dark:text-slate-205 font-semibold text-left"
                >
                  <option value="Laptop/PC" className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200">Laptop / PC</option>
                  <option value="Monitor" className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200">Monitor Eksternal</option>
                  <option value="Aksesoris" className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200">Aksesoris & Perangkat Input</option>
                  <option value="Gadget" className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200">Gadget & Tablet</option>
                </select>
              </div>
            </div>

            {/* Specs and stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-305">Spesifikasi Detail Teknik</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Intel Core i5-13th Gen, 16GB RAM, 512GB SSD, Windows 11 Pro."
                  value={newDevSpecs}
                  onChange={(e) => setNewDevSpecs(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-205 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-305">Kuantitas Stok Awal</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={newDevStock}
                  onChange={(e) => setNewDevStock(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-200 font-bold"
                />
              </div>
            </div>

            {/* Ideal Usage Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-305">Deskripsi Alur Kerja / Penggunaan Ideal</label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Sesuai untuk staff administrasi harian, tim customer service, atau pengerjaan dokumen ringan yang tidak membutuhkan rendering grafis."
                value={newDevUsage}
                onChange={(e) => setNewDevUsage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-205 leading-relaxed font-medium"
              />
            </div>

            {/* Photo illustration placeholder URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-305">URL Gambar Ilustrasi Perangkat</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={newDevImage}
                onChange={(e) => setNewDevImage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-205 font-mono text-[11px]"
              />
            </div>

            {/* Form Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg cursor-pointer transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4" /> Simpan Ke Sistem
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
