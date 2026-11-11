import { ImageResponse } from 'next/og';

// Home-screen icon for iPhone/Android "Add to Home Screen".
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b6e3c',
          color: 'white',
          fontSize: 84,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        DR
      </div>
    ),
    size,
  );
}
