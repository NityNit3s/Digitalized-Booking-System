/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Device, RequestForm, UserSession } from './types';
import DeviceCatalog from './components/DeviceCatalog';
import RequestFormModal from './components/RequestFormModal';
import AdminDashboard from './components/AdminDashboard';
import AiAssistant from './components/AiAssistant';
import {
  Laptop, ShieldAlert, Sparkles, User, Settings, ClipboardList, Info,
  AlertCircle, ChevronRight, CheckCircle2, History, Moon, Sun, ArrowRight, BookOpen, RefreshCw, Layers
} from 'lucide-react';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [requests, setRequests] = useState<RequestForm[]>([]);
  
  // App views
  const [appMode, setAppMode] = useState<'applicant' | 'admin'>('applicant');
  const [applicantTab, setApplicantTab] = useState<'catalog' | 'history'>('catalog');

  // Dark Mode State with local storage sync
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Active user identity
  const [user, setUser] = useState<UserSession>({
    name: 'Andhika Pratama',
    role: 'UI/UX Designer',
    department: 'Design & Creative',
    email: 'andhika.pratama@company.com',
    isAdmin: false
  });

  // Modal selector for requests
  const [selectedDeviceForRequest, setSelectedDeviceForRequest] = useState<Device | null>(null);

  // Recommendations ids from AI
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Fetch initial database items from API
  const fetchData = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const [resDevices, resRequests] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/requests')
      ]);

      if (!resDevices.ok || !resRequests.ok) {
        throw new Error('Gagal menghubungkan ke database server api.');
      }

      const devicesData = await resDevices.json();
      const requestsData = await resRequests.json();

      setDevices(devicesData);
      setRequests(requestsData);
    } catch (err: any) {
      console.error(err);
      setErrorText('Gagal mengunduh katalog perangkat. Silakan muat ulang atau periksa status server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit request form callback
  const handleRequestSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan sistem.');
      }

      const newRequest = await response.json();
      
      // Update local state
      setRequests((prev) => [newRequest, ...prev]);
      
      setSuccessToast(`Pengajuan perangkat "${formData.deviceName}" berhasil dikirim! Silakan cek menu riwayat pengajuan.`);
      setTimeout(() => setSuccessToast(''), 6000);

      // Refresh catalog stocks
      fetchData();
    } catch (err: any) {
      throw new Error(err.message || 'Gagal menyimpan pengajuan.');
    }
  };

  // Admin: Update Status Callback
  const handleUpdateStatus = async (id: string, status: any, adminNotes: string) => {
    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNotes })
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui status pengajuan.');
      }

      const updatedRequest = await response.json();

      // Update locally
      setRequests((prev) => prev.map((r) => (r.id === id ? updatedRequest : r)));

      setSuccessToast('Evaluasi status berhasil diperbarui.');
      setTimeout(() => setSuccessToast(''), 4000);

      // Refresh data to reflect stock shifts
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal mengeksekusi aksi.');
    }
  };

  // Admin: Create Device Callback
  const handleAddDevice = async (devicePayload: any) => {
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(devicePayload)
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan pendaftaran inventaris.');
      }

      const { device } = await response.json();

      // Update local list
      setDevices((prev) => [...prev, device]);
      
      setSuccessToast(`Berhasil menambahkan "${devicePayload.name}" ke dalam katalog!`);
      setTimeout(() => setSuccessToast(''), 4000);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal mendefinisikan perangkat baru.');
    }
  };

  // Filter requests corresponding only to current mock user's email
  const userRequests = requests.filter((r) => r.email.toLowerCase() === user.email.toLowerCase());

  // Function to get active layout status step
  const getStatusStepClass = (reqStatus: string, expectedStep: string) => {
    const states = ['Pending', 'Disetujui', 'Diserahkan', 'Dikembalikan'];
    const currentIdx = states.indexOf(reqStatus);
    const targetIdx = states.indexOf(expectedStep);

    if (reqStatus === 'Ditolak' && expectedStep !== 'Pending') {
      return 'bg-slate-100 text-slate-300 border-slate-200';
    }

    if (currentIdx >= targetIdx) {
      return 'bg-blue-600 text-white border-blue-600';
    }
    return 'bg-slate-50 text-slate-400 border-slate-200';
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 font-sans overflow-hidden antialiased text-left selection:bg-blue-500 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 hidden lg:flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-sm">K</div>
            <span className="text-xl font-semibold tracking-tight text-white font-sans">Katalog.Pro</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 tracking-wider">Utama</div>
          <button
            onClick={() => {
              setAppMode('applicant');
              setApplicantTab('catalog');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              appMode === 'applicant' && applicantTab === 'catalog'
                ? 'bg-blue-600 text-white font-bold shadow-md'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Laptop className="w-5 h-5 stroke-[1.75]" />
            Katalog Perangkat
          </button>
          
          <button
            onClick={() => {
              setAppMode('applicant');
              setApplicantTab('history');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              appMode === 'applicant' && applicantTab === 'history'
                ? 'bg-blue-600 text-white font-bold shadow-md'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 stroke-[1.75]" />
              <span>Formulir Peminjaman</span>
            </div>
            {userRequests.length > 0 && (
              <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {userRequests.length}
              </span>
            )}
          </button>

          <div className="px-3 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Administrasi</div>
          <button
            onClick={() => {
              setAppMode('admin');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              appMode === 'admin'
                ? 'bg-blue-600 text-white font-bold shadow-md'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Settings className="w-5 h-5 stroke-[1.75]" />
            Dashboard Review (Admin)
          </button>

          <div className="px-3 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">Tampilan</div>
          <div className="mx-3 my-1 p-2 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-blue-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs text-slate-400 font-semibold">Mode Gelap</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle mode tampilan"
              className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-slate-700"
              style={{ backgroundColor: isDarkMode ? '#3b82f6' : '#475569' }}
            >
              <span
                className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out font-sans"
                style={{ transform: isDarkMode ? 'translateX(20px)' : 'translateX(0px)' }}
              />
            </button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
              <span className="text-xs font-semibold text-white">AD</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#f8fafc] dark:bg-[#0b0f19]">
        {/* Header bar */}
        <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between shrink-0 z-10 shadow-3xs">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shrink-0">K</div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Katalog & Formulir IT</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sistem Pengadaan Aktif</span>
            </div>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 bg-white dark:bg-slate-950 text-slate-605 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition shadow-3xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Synchronize</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Toast and Alert Notification banners */}
          {successToast && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-sm duration-300 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{successToast}</p>
            </div>
          )}

          {errorText && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 shadow-sm duration-300 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{errorText}</p>
            </div>
          )}

          {/* Responsive header bar for small/medium screen sizes */}
          <div className="lg:hidden bg-white dark:bg-[#0f172a] p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto shadow-4xs">
            <button
              onClick={() => {
                setAppMode('applicant');
                setApplicantTab('catalog');
              }}
              className={`flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition ${
                appMode === 'applicant' && applicantTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Katalog
            </button>
            <button
              onClick={() => {
                setAppMode('applicant');
                setApplicantTab('history');
              }}
              className={`flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition relative ${
                appMode === 'applicant' && applicantTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Riwayat
              {userRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  {userRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setAppMode('admin')}
              className={`flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition ${
                appMode === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Supervisor Admin
            </button>
          </div>

          {/* Overview Section card */}
          <div className="bg-white dark:bg-[#0f172a] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                <Layers className="w-4 h-4" />
                RINGKASAN KATALOG & FORMULIR
              </p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2 tracking-tight">
                {appMode === 'applicant'
                  ? applicantTab === 'catalog'
                    ? 'Eksplorasi Katalog Perangkat'
                    : 'Monitoring Riwayat Pengajuan Anda'
                  : 'Dasbor IT Supervisor (Administrator Mode)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed font-sans">
                {appMode === 'applicant'
                  ? 'Pilih perangkat utama atau portabel dari katalog hardware kantor kami untuk mengoptimalkan kinerja produktivitas harian Anda.'
                  : 'Tindak lanjuti pengajuan laptop/monitor karyawan, monitor status stok inventaris fisik dan beri evaluasi formal.'}
              </p>
            </div>
            
            <div className="shrink-0 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 align-middle">
              Tingkat Akses: <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{appMode === 'applicant' ? 'Karyawan / Staff' : 'IT Admin System'}</span>
            </div>
          </div>

          {/* CORE AREA */}
          {loading && devices.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((v) => (
                <div key={v} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4 animate-pulse shadow-sm">
                  <div className="h-36 bg-slate-100 dark:bg-slate-900 rounded-lg w-full"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Main functional workspace (Left 3 cols on large screen) */}
              <div className="lg:col-span-3 space-y-6">
                {appMode === 'applicant' ? (
                  applicantTab === 'catalog' ? (
                    <DeviceCatalog
                      devices={devices}
                      onSelectDevice={(device) => setSelectedDeviceForRequest(device)}
                      recommendedIds={recommendedIds}
                    />
                  ) : (
                    /* Applicant History list view */
                    <div className="space-y-6 text-left">
                      <div className="bg-white dark:bg-[#0f172a] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm uppercase tracking-widest mb-1">Riwayat Pengajuan Instansi Kita ({userRequests.length})</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Sistem memantau siklus hidup peminjaman perangkat laptop, monitor, dan kelengkapan IT Anda di bawah ini.
                        </p>
                      </div>

                      {userRequests.length === 0 ? (
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-16 text-center rounded-xl shadow-sm">
                          <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada pengajuan aktif</h4>
                          <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed dark:text-slate-400">
                            Anda belum memiliki riwayat pengajuan barang. Buka tab katalog perangkat untuk memulai pengajuan inventaris pertama Anda.
                          </p>
                          <button
                            onClick={() => setApplicantTab('catalog')}
                            className="bg-blue-600 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer mt-4 hover:bg-blue-700 transition shadow-xs"
                          >
                            Buka Katalog Perangkat
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userRequests.map((req) => (
                            <div key={req.id} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 text-left">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                  {req.deviceImage && (
                                    <img referrerPolicy="no-referrer" src={req.deviceImage} alt={req.deviceName} className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900" />
                                  )}
                                  <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{req.deviceName}</h4>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase">TANGGAL PINJAM: {req.expectedDate} • DURASI: {req.usageDuration}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                                  {req.status === 'Pending' && <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-205 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900 uppercase tracking-wider text-[10px]">Menunggu Review</span>}
                                  {req.status === 'Disetujui' && <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-955/20 dark:text-blue-405 dark:border-blue-900 uppercase tracking-wider text-[10px]">Telah Disetujui</span>}
                                  {req.status === 'Ditolak' && <span className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-955/20 dark:text-rose-405 dark:border-rose-900 uppercase tracking-wider text-[10px]">Pengajuan Ditolak</span>}
                                  {req.status === 'Diserahkan' && <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900 uppercase tracking-wider text-[10px]">Aktif Dipakai</span>}
                                  {req.status === 'Dikembalikan' && <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 uppercase tracking-wider text-[10px]">Sudah Dikembalikan</span>}
                                </div>
                              </div>

                              {/* Timeline indicator tracker */}
                              <div className="grid grid-cols-4 gap-2 pt-2">
                                {['Pending', 'Disetujui', 'Diserahkan', 'Dikembalikan'].map((step) => (
                                  <div key={step} className="space-y-1">
                                    <div className={`h-1 rounded-full border transition ${
                                      getStatusStepClass(req.status, step)
                                    }`}></div>
                                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block whitespace-nowrap uppercase tracking-wider">{step === 'Diserahkan' ? 'Aktif' : step}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Reason note area */}
                              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800 mt-2">
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Surat Justifikasi</span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                  "{req.reason}"
                                </p>
                                {req.adminNotes && (
                                  <div className="text-xs text-blue-700 dark:text-blue-400 font-semibold mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5 leading-relaxed">
                                    <span className="font-bold text-[10px] uppercase bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900 shrink-0">IT Feedback</span>
                                    <span>{req.adminNotes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <AdminDashboard
                    requests={requests}
                    devices={devices}
                    onUpdateStatus={handleUpdateStatus}
                    onAddDevice={handleAddDevice}
                  />
                )}
              </div>

              {/* Sidebar AI Companion (1 Col) */}
              <div className="lg:col-span-1">
                <AiAssistant
                  devices={devices}
                  onHighlightRecommendations={(ids) => setRecommendedIds(ids)}
                  onSelectRecommendedDevice={(recDev) => setSelectedDeviceForRequest(recDev)}
                />
              </div>

            </div>
          )}
        </div>

        {/* Bottom copyright footer */}
        <footer className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 py-6 px-6 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400 shrink-0 transition">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Katalog Perangkat Pro & Dashboard IT. All Rights Reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="text-blue-600 dark:text-blue-400 font-bold">Dual Firebase Enterprise Backend</span>
              <span className="text-slate-300 dark:text-slate-800">|</span>
              <span className="text-slate-500 dark:text-slate-400">LLM Engine: Gemini 3.5 Flash Active</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Request Modal popup overlay */}
      {selectedDeviceForRequest && (
        <RequestFormModal
          device={selectedDeviceForRequest}
          onClose={() => setSelectedDeviceForRequest(null)}
          onSubmit={handleRequestSubmit}
          applicantEmail={user.email}
        />
      )}
    </div>
  );
}
