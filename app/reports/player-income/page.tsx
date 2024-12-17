import { PlayerIncomeReport } from '@/components/reports/player-income-report';

export default function PlayerIncomePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Player Income Report</h1>
      <PlayerIncomeReport />
    </div>
  );
} 