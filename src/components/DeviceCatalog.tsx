/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Device } from '../types';
import { Search, Laptop, Monitor, MousePointer, Smartphone, Star, CheckCircle, PackageX, Sparkles, Filter, QrCode } from 'lucide-react';
import QrScanner from './QrScanner';

interface DeviceCatalogProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  recommendedIds: string[];
}

export default function DeviceCatalog({ devices, onSelectDevice, recommendedIds }: DeviceCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showScanner, setShowScanner] = useState(false);

  const categories = [
    { id: 'Semua', name: 'Semua Kategori', icon: Filter },
    { id: 'Laptop/PC', name: 'Laptop & PC', icon: Laptop },
    { id: 'Monitor', name: 'Monitor', icon: Monitor },
    { id: 'Aksesoris', name: 'Aksesoris', icon: MousePointer },
    { id: 'Gadget', name: 'Gadget/Tablet', icon: Smartphone },
  ];

  const filteredDevices = devices.filter((device) => {
    const matchesCategory = selectedCategory === 'Semua' || device.category === selectedCategory;
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.specification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.usageDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-[#0f172a] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari perangkat, spesifikasi, atau rekomendasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-slate-700 dark:text-slate-105 transition font-sans text-sm"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              title="Pindai QR Code Perangkat"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/45 p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredDevices.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center shadow-sm">
          <PackageX className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Tidak ada perangkat ditemukan</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Ganti kata kunci pencarian Anda atau kustomisasi kategori filter untuk menemukan produk yang sesuai.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => {
            const isRecommended = recommendedIds.includes(device.id);
            const isOutOfStock = device.stock <= 0;

            return (
              <div
                key={device.id}
                className={`group relative bg-white dark:bg-[#0f172a] border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between ${
                  isRecommended
                    ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Image & Badge */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <img
                    referrerPolicy="no-referrer"
                    src={device.image}
                    alt={device.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  
                  {/* Category overlay */}
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded font-bold tracking-wide shadow-sm uppercase">
                    {device.category}
                  </span>

                  {/* Recommended Badge */}
                  {isRecommended && (
                    <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      Rekomendasi AI
                    </span>
                  )}

                  {/* Rating overlay */}
                  <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-slate-800 dark:text-slate-200 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm leading-none">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{device.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-850 dark:text-slate-100 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition tracking-tight">
                      {device.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed line-clamp-3">
                      {device.specification}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800/60 mt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                        <span className="font-semibold text-slate-600 dark:text-slate-300 not-italic block mb-1">Penggunaan Ideal:</span>
                        {device.usageDescription}
                      </p>
                    </div>
                  </div>

                  {/* Footer - Stock & Request Action */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {isOutOfStock ? 'Stok Habis' : `Stok: ${device.stock} Unit`}
                      </span>
                    </div>

                    <button
                      onClick={() => !isOutOfStock && onSelectDevice(device)}
                      disabled={isOutOfStock}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition ${
                        isOutOfStock
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      Ajukan Sekarang
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showScanner && (
        <QrScanner
          devices={devices}
          onSelectDevice={onSelectDevice}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
