import { PlayerExpensesReport } from '@/components/reports/player-expenses-report';

export default function PlayerExpensesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Player Expenses Report</h1>
      <PlayerExpensesReport />
    </div>
  );
} 