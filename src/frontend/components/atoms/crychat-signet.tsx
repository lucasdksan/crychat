export function CryChatSignet({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#8234e9" />
      <path
        d="M8.5 9.5C8.5 8.67157 9.17157 8 10 8H14C14.8284 8 15.5 8.67157 15.5 9.5V13C15.5 13.8284 14.8284 14.5 14 14.5H11.2L8.5 16.8V9.5Z"
        fill="#ffffff"
      />
    </svg>
  );
}