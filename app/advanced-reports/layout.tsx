'use client';

import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { ReportContext } from "@/contexts/ReportContext";

export default function AdvancedReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultDateRange: DateRange = {
    from: addDays(new Date(), -30),
    to: new Date(),
  };

  const defaultFilters = {
    status: 'all',
    sortBy: 'date',
    order: 'desc',
  };

  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const [filters, setFilters] = useState(defaultFilters);
  const [handleExport, setExportHandler] = useState<(() => void) | undefined>();

  const resetFilters = () => {
    setDateRange(defaultDateRange);
    setFilters(defaultFilters);
  };

  return (
    <ReportContext.Provider 
      value={{ 
        dateRange, 
        setDateRange, 
        filters, 
        setFilters,
        handleExport,
        setExportHandler,
        resetFilters
      }}
    >
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Advanced Reports</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={!handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <DatePickerWithRange 
                date={dateRange} 
                onDateChange={(newDate) => {
                  if (newDate) setDateRange(newDate);
                }} 
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="px-3 py-2 border rounded-md bg-background"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md bg-background"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="name">Sort by Name</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md bg-background"
                value={filters.order}
                onChange={(e) => setFilters({ ...filters, order: e.target.value })}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Filter className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>

        {children}
      </div>
    </ReportContext.Provider>
  );
} 