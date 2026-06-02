/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_DEVICES } from './src/data';
import { Device, RequestForm } from './src/types';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Read Firebase config safely with fs to prevent any typescript JSON resolution issues at runtime
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

// Initialize Firebase App and Firestore Database instance
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Migrate and synchronize devices catalog to Firestore on startup
async function bootstrapDatabase() {
  try {
    const devicesCol = collection(db, 'devices');
    const snapshot = await getDocs(devicesCol);
    console.log('Synchronizing devices catalog with INITIAL_DEVICES...');
    for (const dev of INITIAL_DEVICES) {
      await setDoc(doc(db, 'devices', dev.id), dev, { merge: true });
    }
    console.log('Synchronization of devices completed successfully!');
  } catch (err) {
    console.error('Error bootstrapping database in Firestore:', err);
  }
}

// Read database helper
async function readDevices(): Promise<Device[]> {
  try {
    const colRef = collection(db, 'devices');
    const snapshot = await getDocs(colRef);
    const devices: Device[] = [];
    snapshot.forEach((snap) => {
      devices.push(snap.data() as Device);
    });
    if (devices.length === 0) {
      return INITIAL_DEVICES;
    }
    return devices;
  } catch (err) {
    console.error('Error reading devices DB from Firestore, falling back:', err);
    return INITIAL_DEVICES;
  }
}

async function writeDevice(device: Device) {
  const docRef = doc(db, 'devices', device.id);
  await setDoc(docRef, device);
}

async function readRequests(): Promise<RequestForm[]> {
  try {
    const colRef = collection(db, 'requests');
    const snapshot = await getDocs(colRef);
    const reqs: RequestForm[] = [];
    snapshot.forEach((snap) => {
      reqs.push(snap.data() as RequestForm);
    });
    return reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error reading requests DB from Firestore:', err);
    return [];
  }
}

async function writeRequest(request: RequestForm) {
  const docRef = doc(db, 'requests', request.id);
  await setDoc(docRef, request);
}

// Lazy Gemini Client
let _geminiClient: any = null;
function getGeminiClient() {
  if (!_geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. Falling back to local smart analyzer.');
      return null;
    }
    _geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return _geminiClient;
}

async function startServer() {
  // Bootstrap Firestore devices database on startup
  await bootstrapDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API API ROUTES ---

  // Get device inventory
  app.get('/api/devices', async (req, res) => {
    try {
      const devices = await readDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to read devices catalog.' });
    }
  });

  // Add/Update device (admin)
  app.post('/api/devices', async (req, res) => {
    try {
      const device: Device = req.body;
      if (!device.name || !device.category || !device.specification) {
        res.status(400).json({ error: 'Data perangkat tidak lengkap.' });
        return;
      }

      let targetId = device.id;
      let finalDevice: Device;

      if (targetId) {
        // Update device
        const docRef = doc(db, 'devices', targetId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          finalDevice = {
            ...snap.data() as Device,
            ...device,
            status: device.stock > 0 ? 'Tersedia' : 'Habis'
          };
        } else {
          finalDevice = {
            ...device,
            rating: device.rating || 5.0,
            status: device.stock > 0 ? 'Tersedia' : 'Habis'
          };
        }
      } else {
        // Create device
        targetId = `dev-${Date.now()}`;
        finalDevice = {
          ...device,
          id: targetId,
          rating: device.rating || 5.0,
          status: device.stock > 0 ? 'Tersedia' : 'Habis'
        };
      }

      await writeDevice(finalDevice);
      res.json({ message: 'Perangkat berhasil disimpan', device: finalDevice });
    } catch (error) {
      console.error('Save device error:', error);
      res.status(500).json({ error: 'Gagal menyimpan perangkat.' });
    }
  });

  // Get all request forms
  app.get('/api/requests', async (req, res) => {
    try {
      const requests = await readRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to read requests.' });
    }
  });

  // Submit device request
  app.post('/api/requests', async (req, res) => {
    try {
      const form: Omit<RequestForm, 'id' | 'createdAt' | 'status'> = req.body;
      if (!form.applicantName || !form.email || !form.deviceId || !form.deviceName) {
        res.status(400).json({ error: 'Data pengajuan tidak lengkap.' });
        return;
      }

      const devDocRef = doc(db, 'devices', form.deviceId);
      const devSnap = await getDoc(devDocRef);

      if (devSnap.exists()) {
        const device = devSnap.data() as Device;
        if (device.stock <= 0) {
          res.status(400).json({ error: 'Perangkat sedang habis stock saat ini.' });
          return;
        }
      }

      const newRequest: RequestForm = {
        ...form,
        id: `req-${Date.now()}`,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      await writeRequest(newRequest);
      res.status(201).json(newRequest);
    } catch (error) {
      console.error('Submit request error:', error);
      res.status(500).json({ error: 'Gagal mengajukan formulir.' });
    }
  });

  // Update request status (admin approval)
  app.put('/api/requests/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status) {
        res.status(400).json({ error: 'Status harus disediakan.' });
        return;
      }

      const reqDocRef = doc(db, 'requests', id);
      const reqSnap = await getDoc(reqDocRef);

      if (!reqSnap.exists()) {
        res.status(404).json({ error: 'Data pengajuan tidak ditemukan.' });
        return;
      }

      const requestData = reqSnap.data() as RequestForm;
      const oldStatus = requestData.status;

      const updatedRequest: RequestForm = {
        ...requestData,
        status,
        adminNotes: adminNotes ?? requestData.adminNotes
      };

      await setDoc(reqDocRef, updatedRequest);

      // Handle stock allocation when status becomes "Diserahkan" or "Disetujui" in Firestore
      if (status === 'Disetujui' && oldStatus !== 'Disetujui' && oldStatus !== 'Diserahkan') {
        const devDocRef = doc(db, 'devices', requestData.deviceId);
        const devSnap = await getDoc(devDocRef);
        if (devSnap.exists()) {
          const devData = devSnap.data() as Device;
          if (devData.stock > 0) {
            const newStock = devData.stock - 1;
            await updateDoc(devDocRef, {
              stock: newStock,
              status: newStock === 0 ? 'Habis' : 'Tersedia'
            });
          }
        }
      } else if (status === 'Dikembalikan' && oldStatus !== 'Dikembalikan') {
        const devDocRef = doc(db, 'devices', requestData.deviceId);
        const devSnap = await getDoc(devDocRef);
        if (devSnap.exists()) {
          const devData = devSnap.data() as Device;
          const newStock = devData.stock + 1;
          await updateDoc(devDocRef, {
            stock: newStock,
            status: 'Tersedia'
          });
        }
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error('Update request error:', error);
      res.status(500).json({ error: 'Gagal memperbarui status pengajuan.' });
    }
  });

  // AI Endpoint 1: Smart Hardware Recommendation
  app.post('/api/ai/recommend', async (req, res) => {
    const { role, department, needs } = req.body;
    if (!role || !department) {
      res.status(400).json({ error: 'Role dan Departemen diperlukan.' });
      return;
    }

    const ai = getGeminiClient();
    const devices = await readDevices();

    if (!ai) {
      // Fallback local matching
      const filtered = devices.filter((d) => {
        const s = (d.name + d.usageDescription + d.specification).toLowerCase();
        const r = role.toLowerCase();
        const n = (needs || '').toLowerCase();
        return s.includes(r) || s.includes(n) || (r.includes('design') && d.category === 'Laptop/PC');
      });

      const recommendations = (filtered.length ? filtered : devices.slice(0, 2)).map((d) => ({
        deviceId: d.id,
        reason: `Berdasarkan peranan Anda sebagai ${role} di divisi ${department}, ${d.name} menawarkan performa optimal yang sangat menduduki ekspektasi harian tugas Anda.`
      }));

      res.json({ recommendations });
      return;
    }

    try {
      const simplifiedCatalog = devices.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        specs: d.specification,
        forUsage: d.usageDescription
      }));

      const prompt = `Anda adalah Asisten IT Perusahaan yang ahli. Berikan rekomendasi perangkat dari katalog berikut yang paling sesuai dengan kebutuhan karyawan ini:
Karyawan:
- Peran Pekerjaan (Role): ${role}
- Departemen: ${department}
- Deskripsi Kebutuhan Tambahan: "${needs || 'Tidak ada spesifik'}"

Daftar Katalog Perangkat:
${JSON.stringify(simplifiedCatalog, null, 2)}

Format balasan Anda harus berupa JSON yang valid dengan skema berikut:
{
  "recommendations": [
    {
      "deviceId": "ID Perangkat dari katalog",
      "reason": "Alasan singkat (maksimal 2 kalimat) dalam Bahasa Indonesia mengapa perangkat ini sangat cocok untuk peran dan kebutuhan spesifik karyawan tersebut."
    }
  ]
}
Berikan 1 hingga maksimal 3 rekomendasi perangkat terbaik. Pastikan mengembalikan JSON murni tanpa penanda markdown \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    deviceId: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ['deviceId', 'reason']
                }
              }
            },
            required: ['recommendations']
          }
        }
      });

      const rawJson = response.text || '{}';
      res.json(JSON.parse(rawJson));
    } catch (error: any) {
      console.error('Gemini Recommendation Error:', error);
      res.status(500).json({ error: 'Gagal memproses rekomendasi AI.' });
    }
  });

  // AI Endpoint 2: Smart Justification Autofill
  app.post('/api/ai/assist-form', async (req, res) => {
    const { role, department, deviceName, crudeReason } = req.body;
    if (!role || !deviceName) {
      res.status(400).json({ error: 'Detail peran dan nama perangkat diperlukan.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Local fallback
      res.json({
        justification: `Pengajuan perangkat ${deviceName} diajukan untuk menunjang aktivitas saya selaku ${role} di departemen ${department}. Perangkat ini krusial untuk memastikan kelancaran alur kerja harian, meningkatkan produktivitas, serta menjaga efisiensi ketersediaan ekosistem operasional tim.`
      });
      return;
    }

    try {
      const prompt = `Anda adalah asisten penulisan justification pengadaan perangkat kantor. 
Karyawan dengan rincian berikut mengajukan sebuah perangkat:
- Peran Pekerjaan: ${role}
- Departemen: ${department}
- Perangkat yang diajukan: ${deviceName}
- Alasan kasar dari karyawan: "${crudeReason || 'Untuk kelancaran kerja harian'}"

Tulis ulang alasan tersebut menjadi sebuah paragraf Justifikasi Bisnis yang formal, terstruktur, profesional, dan meyakinkan (dalam Bahasa Indonesia) agar disetujui oleh Direksi / Tim Finance. Maksimal 3-4 kalimat. Kembalikan secara langsung dalam balasan teks polos tanpa tanda kutip di awal dan di akhir.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      res.json({ justification: (response.text || '').trim() });
    } catch (error) {
      console.error('Gemini Form Assist Error:', error);
      res.status(500).json({ error: 'Gagal memproses asisten justifikasi AI.' });
    }
  });

  // AI Endpoint 3: Help Dialogue Chatbot / Policy Assistant
  app.post('/api/ai/chat', async (req, res) => {
    const { messages, deviceCatalog } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Format pesan percakapan tidak valid.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        text: 'Halo! Layanan Asisten AI sedang berada dalam mode offline lokal karena kunci API belum diset di portal Secrets. Berdasarkan aturan umum, karyawan berhak mengajukan 1 komputer utama, monitor tambahan jika berada di divisi Engineering/Design, serta aksesoris pelengkap seperti headphone atau mouse ergonomis.'
      });
      return;
    }

    try {
      const conversationParts = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Add system prompt context as first message or instruction
      const systemInstruction = `Anda adalah "Asisten Pintar IT Rumah Tangga" untuk perusahaan. Tugas Anda adalah membantu karyawan memilih perangkat dari katalog kami, menjelaskan kegunaan perangkat, dan menjabarkan kebijakan pengajuan inventaris kantor.
Panduan Kebijakan Perusahaan:
1. Setiap karyawan diperbolehkan memilih 1 perangkat utama (Laptop/PC).
2. Divisi Desain Kreatif dan Teknolog (Engineering) diperkenankan menambah Monitor Eksternal atau Gadget untuk testing (iPad/Tablet).
3. Aksesoris sekunder (Headphone, Mouse Ergonomis) dapat diajukan oleh divisi mana pun sesuai ketersediaan stok.
4. Semua pengajuan akan melalui review admin dan memakan waktu persetujuan kurang dari 24 jam kerja.

Jika pengguna menanyakan perangkat spesifik, rujuk katalog berikut:
${JSON.stringify(deviceCatalog || [], null, 2)}

Jawab dengan ramah, informatif, singkat, dan gunakan Bahasa Indonesia yang profesional.`;

      // Call Gemini Chat
      const lastMessage = conversationParts[conversationParts.length - 1]?.parts[0]?.text || '';
      const previousHistory = conversationParts.slice(0, conversationParts.length - 1);

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          ...previousHistory,
          { role: 'user', parts: [{ text: lastMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ text: (response.text || '').trim() });
    } catch (error) {
      console.error('Gemini Chat Error:', error);
      res.status(500).json({ error: 'Gagal mendapatkan respon dari Asisten AI.' });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
