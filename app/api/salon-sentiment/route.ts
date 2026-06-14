import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const salonId = searchParams.get('salonId');

        if (!salonId) {
            return NextResponse.json({ error: "Salon ID is required" }, { status: 400 });
        }

        const snapshot = await adminDb.collection('reviews').where('salonId', '==', salonId).get();
        
        let positiveCount = 0;
        let negativeCount = 0;

        snapshot.forEach(doc => {
            const sentiment = doc.data().sentiment;
            if (sentiment === 'Positive') positiveCount++;
            if (sentiment === 'Negative') negativeCount++;
        });

        return NextResponse.json({ 
            positive: positiveCount, 
            negative: negativeCount, 
            total: positiveCount + negativeCount 
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Failed to fetch sentiment stats" }, { status: 500 });
    }
}