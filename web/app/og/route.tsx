import { ImageResponse } from 'next/og';

// Default share image (1200x630) for pages without their own photo. Generated once at build.
export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          background: 'linear-gradient(160deg, #095a32 0%, #0b6e3c 60%, #0f8a4b 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              background: 'white',
              color: '#0b6e3c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            DR
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>DammyRex Declutter</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 68, fontWeight: 800, lineHeight: 1.1, display: 'flex', flexDirection: 'column' }}>
          <span>Neatly used home items.</span>
          <span style={{ color: '#fcd34d' }}>Inspect before you pay.</span>
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: '#d1fadf' }}>
          Fridges · Freezers · Gas cookers · Fans · ACs · Beds · Chairs · Tables
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
