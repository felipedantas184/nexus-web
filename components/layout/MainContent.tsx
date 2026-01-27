// components/layout/MainContent.tsx
'use client';

interface MainContentProps {
  open: boolean;
  children: React.ReactNode;
}

export default function MainContent({ open, children }: MainContentProps) {
  return (
    <main className={`
      min-h-screen transition-all duration-300 ease-in-out
      ${open ? 'lg:ml-72' : 'lg:ml-0'}
    `}>
      {children}
    </main>
  );
}