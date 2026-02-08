import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Popey Academy'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        {/* Anchor Icon */}
        <svg
          width="150"
          height="150"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginBottom: 40 }}
        >
          <circle cx="12" cy="5" r="3" />
          <line x1="12" x2="12" y1="22" y2="8" />
          <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
        </svg>
        
        <div style={{ fontSize: 70, fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.05em' }}>
          Popey Academy
        </div>
        <div style={{ fontSize: 30, marginTop: 20, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          L'Expédition Business
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
