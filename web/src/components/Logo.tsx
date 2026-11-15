export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="logoGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2E75B6" />
          <stop offset="1" stopColor="#17A589" />
        </linearGradient>
      </defs>
      <path
        fill="url(#logoGrad)"
        d="M32 4C16.536 4 4 14.745 4 28c0 7.06 3.56 13.4 9.2 17.74-.36 4.02-1.78 7.84-4.02 11.06-.62.9.06 2.12 1.14 1.98 5.3-.68 9.86-2.7 13.34-5.62 2.66.55 5.46.84 8.34.84 15.464 0 28-10.745 28-24S47.464 4 32 4Z"
      />
      <path
        fill="#fff"
        d="M32 41.6c-.5 0-.98-.18-1.36-.5-5.02-4.34-9.04-7.84-9.04-12.42 0-3.5 2.7-6.18 6.06-6.18 1.96 0 3.84.94 5.04 2.42 1.2-1.48 3.08-2.42 5.04-2.42 3.36 0 6.06 2.68 6.06 6.18 0 4.58-4.02 8.08-9.04 12.42-.38.32-.86.5-1.36.5Z"
      />
    </svg>
  );
}
