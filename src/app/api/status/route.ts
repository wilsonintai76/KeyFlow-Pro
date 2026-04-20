import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, update } from 'firebase/database';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase for Server-Side (API Routes)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export async function PUT(request: Request) {
  try {
    const status = await request.json();
    
    // Security Check: Optional but recommended
    // In a real scenario, you'd check a secret header from the ESP32
    // const apiKey = request.headers.get('x-api-key');
    // if (apiKey !== process.env.CABINET_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Update the Realtime Database
    const cabinetRef = ref(db, 'live/cabinet');
    await update(cabinetRef, {
      ...status,
      lastSync: new Date().toISOString(),
      connectionType: 'BRIDGE'
    });

    console.log('[API] Cabinet status bridged successfully.');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[API] Bridge Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fallback for POST if needed
export async function POST(request: Request) {
  return PUT(request);
}
