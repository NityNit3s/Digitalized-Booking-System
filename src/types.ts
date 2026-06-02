/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Device {
  id: string;
  name: string;
  category: 'Laptop/PC' | 'Monitor' | 'Aksesoris' | 'Gadget';
  specification: string;
  stock: number;
  image: string;
  status: 'Tersedia' | 'Habis';
  rating: number;
  usageDescription: string;
}

export interface RequestForm {
  id: string;
  applicantName: string;
  applicantRole: string;
  department: string;
  email: string;
  deviceId: string;
  deviceName: string;
  deviceImage?: string;
  reason: string;
  expectedDate: string;
  usageDuration: string; // e.g. "Permanen", "6 Bulan", "12 Bulan"
  status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Diproses' | 'Diserahkan' | 'Dikembalikan';
  createdAt: string;
  adminNotes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface UserSession {
  name: string;
  role: string;
  department: string;
  email: string;
  isAdmin: boolean;
}
