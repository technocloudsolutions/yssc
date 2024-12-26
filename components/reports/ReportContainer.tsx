'use client';

import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { useReportContext } from "@/contexts/ReportContext";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ReportMetric {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  render?: (item: any) => React.ReactNode;
}

interface ReportContainerProps {
  title: string;
  description: string;
  metrics: ReportMetric[];
  barChartData?: ChartData;
  pieChartData?: ChartData;
  lineChartData?: ChartData;
  tableColumns: TableColumn[];
  tableData: any[];
  filters?: React.ReactNode;
}

export function ReportContainer({
  title,
  description,
  metrics,
  barChartData,
  pieChartData,
  lineChartData,
  tableColumns,
  tableData,
  filters,
}: ReportContainerProps) {
  const { toast } = useToast();
  const { dateRange, setExportHandler } = useReportContext();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Filter data based on date range
  const filteredData = tableData.filter(item => {
    if (!item.date) return true; // If no date field, include the item
    const itemDate = new Date(item.date);
    return (!dateRange.from || itemDate >= dateRange.from) &&
           (!dateRange.to || itemDate <= dateRange.to);
  });

  // Create export handler function
  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = filteredData.map(item => {
        const row: any = {};
        tableColumns.forEach(col => {
          if (col.render) {
            row[col.label] = col.render(item);
          } else {
            row[col.label] = item[col.key];
          }
        });
        return row;
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title);

      // Generate filename with date range
      const fromDate = format(dateRange.from || new Date(), 'yyyy-MM-dd');
      const toDate = format(dateRange.to || new Date(), 'yyyy-MM-dd');
      const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.xlsx`;

      // Export file
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Register export handler
  useEffect(() => {
    setExportHandler(() => handleExport);
    return () => setExportHandler(() => {});
  }, [setExportHandler]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold">{metric.value}</h3>
              {metric.change !== undefined && (
                <div
                  className={`text-sm flex items-center ${
                    metric.trend === 'up'
                      ? 'text-green-600'
                      : metric.trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {metric.change}%
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="bar" className="w-full">
        <TabsList>
          {barChartData && <TabsTrigger value="bar">Bar Chart</TabsTrigger>}
          {pieChartData && <TabsTrigger value="pie">Pie Chart</TabsTrigger>}
          {lineChartData && <TabsTrigger value="line">Trend Line</TabsTrigger>}
          <TabsTrigger value="table">Detailed Table</TabsTrigger>
        </TabsList>

        {barChartData && (
          <TabsContent value="bar">
            <Card className="p-4">
              <Bar data={barChartData} options={chartOptions} />
            </Card>
          </TabsContent>
        )}

        {pieChartData && (
          <TabsContent value="pie">
            <Card className="p-4">
              <Pie data={pieChartData} options={chartOptions} />
            </Card>
          </TabsContent>
        )}

        {lineChartData && (
          <TabsContent value="line">
            <Card className="p-4">
              <Line data={lineChartData} options={chartOptions} />
            </Card>
          </TabsContent>
        )}

        <TabsContent value="table">
          <Card className="p-4">
            {filters}
            <DataTable
              columns={tableColumns}
              data={filteredData}
              renderCustomCell={(column, item) => {
                if (column.render) {
                  return column.render(item);
                }
                return item[column.key];
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 