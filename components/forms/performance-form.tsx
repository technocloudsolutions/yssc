'use client';

interface PerformanceFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function PerformanceForm({ onSubmit, initialData }: PerformanceFormProps) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      onSubmit(data);
    }}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Player Name</label>
          <input
            type="text"
            name="playerName"
            defaultValue={initialData?.playerName}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Position</label>
          <select
            name="position"
            defaultValue={initialData?.position}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            required
          >
            <option value="Forward">Forward</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Defender">Defender</option>
            <option value="Goalkeeper">Goalkeeper</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Games Played</label>
          <input
            type="number"
            name="gamesPlayed"
            defaultValue={initialData?.gamesPlayed}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            required
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Goals</label>
          <input
            type="number"
            name="goals"
            defaultValue={initialData?.goals}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            required
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Assists</label>
          <input
            type="number"
            name="assists"
            defaultValue={initialData?.assists}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            required
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rating (1-10)</label>
          <input
            type="number"
            name="rating"
            defaultValue={initialData?.rating}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            required
            min="1"
            max="10"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Form</label>
          <select
            name="form"
            defaultValue={initialData?.form}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            required
          >
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            {initialData ? 'Update' : 'Add'} Performance Record
          </button>
        </div>
      </div>
    </form>
  );
} 