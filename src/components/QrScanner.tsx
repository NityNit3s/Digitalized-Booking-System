/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Device } from '../types';
import { 
  X, Camera, Upload, Sparkles, AlertCircle, CheckCircle2, 
  HelpCircle, Laptop, Monitor, MousePointer, Smartphone, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QrScannerProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onClose: () => void;
}

export default function QrScanner({ devices, onSelectDevice, onClose }: QrScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'simulate'>('camera');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedDevice, setMatchedDevice] = useState<Device | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Html5Qrcode instance
  useEffect(() => {
    // Generate unique ID in DOM
    const targetElementId = 'qr-reader-container';
    
    // Safety check
    const el = document.getElementById(targetElementId);
    if (el) {
      scannerRef.current = new Html5Qrcode(targetElementId);
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .then(() => console.log('Camera execution stopped'))
          .catch(err => console.error('Failed to stop scanner on unmount', err));
      }
    };
  }, []);

  // Sync camera state with active tab
  useEffect(() => {
    const startScanner = async () => {
      if (!scannerRef.current) return;

      if (activeTab === 'camera') {
        try {
          setCameraError(null);
          setScanning(true);
          
          await scannerRef.current.start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: (width, height) => {
                const boxSize = Math.min(width, height) * 0.75;
                return { width: boxSize, height: boxSize };
              }
            },
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            () => {
              // Ignore frequent frame-by-frame errors
            }
          );
        } catch (err: any) {
          setScanning(false);
          setCameraError(
            err?.message || 
            'Kamera tidak dapat diakses. Pastikan Anda memberikan izin kamera, atau coba gunakan tab "Unggah Gambar" / "Simulasi Cepat".'
          );
          console.error('Camera scanner start error:', err);
        }
      } else {
        if (scannerRef.current.isScanning) {
          try {
            await scannerRef.current.stop();
          } catch (err) {
            console.error('Failed to stop camera when shifting tabs', err);
          }
          setScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error('Cleanup stop error', err));
      }
    };
  }, [activeTab]);

  const handleScanSuccess = (text: string) => {
    setScannedResult(text);
    
    // Parse the result with regex to find device IDs like dev-1, dev-2 etc.
    const match = text.match(/(dev-\d+)/i);
    if (match) {
      const parsedId = match[1].toLowerCase();
      const device = devices.find(d => d.id.toLowerCase() === parsedId);
      
      if (device) {
        setMatchedDevice(device);
        setValidationSuccess(true);
        setUploadError(null);
        setCameraError(null);
        
        // Stop the camera scanning since we found a valid match
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(e => console.error('Stop error on success', e));
          setScanning(false);
        }
      } else {
        setMatchedDevice(null);
        setValidationSuccess(false);
        setUploadError(`QR Code berisi kode "${text}", namun device ID tersebut tidak terdaftar di sistem.`);
      }
    } else {
      setMatchedDevice(null);
      setValidationSuccess(false);
      setUploadError(`QR Code terdeteksi ("${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"), namun tidak mengandung format tag inventaris (dev-X).`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;

    setUploadError(null);
    setValidationSuccess(false);

    // Use current or a new scanner instance to scan a static file
    if (scannerRef.current) {
      scannerRef.current.scanFile(file, true)
        .then(decodedText => {
          handleScanSuccess(decodedText);
        })
        .catch(err => {
          console.error('File QR scanning error:', err);
          setUploadError('Tidak dapat mendeteksi QR Code dari gambar ini. Pastikan gambar cukup terang dan ikon QR terlihat jelas.');
        });
    }
  };

  const triggerSelectAndOpenForm = () => {
    if (matchedDevice) {
      onSelectDevice(matchedDevice);
      onClose();
    }
  };

  const resetScannerState = () => {
    setScannedResult(null);
    setMatchedDevice(null);
    setValidationSuccess(false);
    setUploadError(null);
    
    // Restart camera if we are on the camera tab
    if (activeTab === 'camera' && scannerRef.current && !scannerRef.current.isScanning) {
      setScanning(true);
      scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (width, height) => {
            const boxSize = Math.min(width, height) * 0.75;
            return { width: boxSize, height: boxSize };
          }
        },
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      ).catch(err => {
        setScanning(false);
        setCameraError('Gagal merestart kamera.');
        console.error(err);
      });
    }
  };

  // Helper icons mapper
  const getDeviceIcon = (category: string) => {
    switch(category) {
      case 'Laptop/PC': return <Laptop className="w-4 h-4 text-slate-500" />;
      case 'Monitor': return <Monitor className="w-4 h-4 text-slate-500" />;
      case 'Aksesoris': return <MousePointer className="w-4 h-4 text-slate-500" />;
      case 'Gadget': return <Smartphone className="w-4 h-4 text-slate-500" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">QR Code Scanner Inventaris</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pindai kode QR untuk melihat instan & mengajukan perangkat</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Mode Switcher tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 shrink-0 text-left">
          <button
            type="button"
            onClick={() => { setActiveTab('camera'); setUploadError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 cursor-pointer transition flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#0f172a]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Kamera Langsung
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setUploadError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 cursor-pointer transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#0f172a]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Unggah Gambar
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('simulate'); setUploadError(null); }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 cursor-pointer transition flex items-center justify-center gap-1.5 ${
              activeTab === 'simulate'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#0f172a]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulasi Cepat
          </button>
        </div>

        {/* Core Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          <AnimatePresence mode="wait">
            {!validationSuccess ? (
              <motion.div
                key="scanning-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* 1. Camera live feed mode */}
                {activeTab === 'camera' && (
                  <div className="space-y-3">
                    <div className="relative aspect-square max-w-sm mx-auto bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-850 flex flex-col justify-center items-center text-center shadow-inner">
                      {/* Scanner viewfinder overlay */}
                      {scanning && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                          {/* Pulsing indicator framing box */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse">
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500"></div>
                            {/* Scanning dynamic laser line */}
                            <div className="absolute left-0 right-0 h-0.5 bg-blue-500/80 animate-[bounce_3s_infinite] shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
                          </div>
                          
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-[10px] text-white/70 bg-slate-950/70 py-1 px-2.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-xs">
                              Arahkan ke Tag QR Perangkat
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actual camera video target */}
                      <div id="qr-reader-container" className="w-full h-full object-cover" />

                      {/* Not started or camera error */}
                      {!scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-350 z-20">
                          <AlertCircle className="w-10 h-10 text-slate-500 mb-2" />
                          <h4 className="text-xs font-bold text-white">Kamera Memuat / Gagal</h4>
                          <p className="text-[10px] text-slate-400 max-w-[240px] mt-1 leading-normal">
                            Pastikan Anda mengizinkan akses ke kamera Anda.
                          </p>
                          {cameraError && (
                            <div className="p-3 bg-red-950/20 text-red-400 border border-red-900/50 mt-3 rounded-lg text-[10px] leading-relaxed max-w-[280px]">
                              {cameraError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-slate-500 text-center">
                      Tips: Pegang perangkat Anda dengan stabil dan bersihkan lensa jika visual buram.
                    </p>
                  </div>
                )}

                {/* 2. Upload file mode */}
                {activeTab === 'upload' && (
                  <div className="space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5"
                    >
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-full border border-slate-200 dark:border-slate-800">
                        <Upload className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Pilih Berkas QR Code</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[280px]">
                          Klik di sini untuk mengunggah gambar tag QR dari galeri atau berkas Anda.
                        </p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden" 
                      />
                    </div>

                    {uploadError && (
                      <div className="p-3.5 bg-red-50 text-red-700 border border-red-150 rounded-lg flex items-start gap-2 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Quick Simulations tags */}
                {activeTab === 'simulate' && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-150 leading-relaxed dark:border-slate-800">
                      Kami menyediakan daftar simulator klik instan ini agar Anda tetap dapat menguji fungsionalitas visual scanner dan formulir otomatis tanpa memerlukan kamera fisik.
                    </p>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {devices.map((device, idx) => (
                        <button
                          key={device.id}
                          onClick={() => handleScanSuccess(device.id)}
                          className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/5 p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-955/40 border border-blue-100 dark:border-blue-900 px-1.5 py-0.5 rounded">
                              {device.id}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[200px]">{device.name}</span>
                          </div>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5 shrink-0">
                            Simulasi QR &rarr;
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            ) : (
              /* Success / Validation State showing Matched Device Specs */
              <motion.div
                key="scanned-success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 text-left"
              >
                <div className="bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-full">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wide">QR Code Terbaca!</h3>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">Sistem berhasil memvalidasi tag model: <strong className="font-extrabold">{scannedResult}</strong></p>
                  </div>
                </div>

                {matchedDevice && (
                  <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    {/* Device Header */}
                    <div className="aspect-[16/9] w-full bg-slate-100 dark:bg-slate-900 relative">
                      <img 
                        referrerPolicy="no-referrer"
                        src={matchedDevice.image} 
                        alt={matchedDevice.name} 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider shadow-sm flex items-center gap-1.5">
                        {getDeviceIcon(matchedDevice.category)}
                        {matchedDevice.category}
                      </span>

                      {/* Stock indicator badge */}
                      <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 ${
                        matchedDevice.stock > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {matchedDevice.stock > 0 ? 'Stok Tersedia' : 'Stok Habis'}
                      </span>
                    </div>

                    {/* Specifications detail block */}
                    <div className="p-4 space-y-3 font-sans text-left">
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">{matchedDevice.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ID Katalog: <span className="font-mono">{matchedDevice.id}</span></p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Spesifikasi Detail</span>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded border border-slate-150 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                          {matchedDevice.specification}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col md:flex-row gap-2">
                        <button
                          type="button"
                          onClick={resetScannerState}
                          className="flex-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold text-[11px] py-2 rounded-lg cursor-pointer transition text-center"
                        >
                          Pindai Ulang
                        </button>
                        
                        <button
                          type="button"
                          disabled={matchedDevice.stock <= 0}
                          onClick={triggerSelectAndOpenForm}
                          className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 font-bold text-[11px] py-2 rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {matchedDevice.stock <= 0 ? 'Perangkat Habis' : 'Lanjutkan Formulir'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer info/controls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 animate-ping shrink-0" />
            <span>Secure Web Scan Engine</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
