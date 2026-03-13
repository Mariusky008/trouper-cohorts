import { NextResponse } from 'next/server';
import { generateMatches } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleMatching(request);
}

export async function POST(request: Request) {
  return handleMatching(request);
}

async function handleMatching(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  
  let targetDate = new Date();
  
  if (dateParam) {
    // If date is provided (YYYY-MM-DD), use it
    targetDate = new Date(dateParam);
  } else {
    // Default: Generate for TOMORROW
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const result = await generateMatches(targetDate);

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
