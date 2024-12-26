'use client';

import { createContext, useContext } from "react";
import { DateRange } from "react-day-picker";

interface ReportContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  filters: {
    status: string;
    sortBy: string;
    order: string;
  };
  setFilters: (filters: any) => void;
  handleExport?: () => void;
  setExportHandler: (handler: () => void) => void;
  resetFilters: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function useReportContext() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReportContext must be used within a ReportContextProvider');
  }
  return context;
}

export { ReportContext }; 