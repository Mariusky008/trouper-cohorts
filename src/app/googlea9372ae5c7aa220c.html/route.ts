import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('google-site-verification: googlea9372ae5c7aa220c.html', {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
