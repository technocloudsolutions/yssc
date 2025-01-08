'use client';

import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
}

export function DatePicker({ selected, onChange, className }: DatePickerProps) {
  const handleSelect = (date: Date | undefined) => {
    if (date === undefined) {
      onChange(null);
    } else {
      onChange(date);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected || undefined}
          onSelect={handleSelect}
          initialFocus
          required={false}
        />
      </PopoverContent>
    </Popover>
  );
} 