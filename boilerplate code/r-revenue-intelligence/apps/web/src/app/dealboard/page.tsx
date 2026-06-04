'use client';

import '@/modules/m04-deal-intelligence/dealboards_rep/index.css';
import '@/modules/m04-deal-intelligence/deaboard_manager/index.css';
import dynamic from 'next/dynamic';

// Dynamically import to avoid hydration issues
const DealBoardsApp = dynamic(
  () => import('@/modules/m04-deal-intelligence/dealboards_rep/main'),
  { ssr: false }
);

export default function DealBoardPage() {
  return (
    <div suppressHydrationWarning>
      <DealBoardsApp />
    </div>
  );
}
