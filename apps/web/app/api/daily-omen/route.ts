import { NextRequest, NextResponse } from 'next/server';
import { getDailyOmen } from '@/app/actions/get-daily-omen';

export async function GET(req: NextRequest) {
    try {
        const forceNew = req.nextUrl.searchParams.get('force') === 'true';
        const omen = await getDailyOmen(new Date(), forceNew);
        return NextResponse.json(omen);
    } catch (error) {
        console.error('Error in daily-omen api:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
