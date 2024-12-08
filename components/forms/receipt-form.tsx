'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReceiptFormProps {
  onSubmit: (data: any) => void;
  transactionData?: any;
  initialData?: any;
}

export function ReceiptForm({ onSubmit, transactionData, initialData }: ReceiptFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: initialData || {}
  });

  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    receiptNo: '',
    date: new Date().toISOString().split('T')[0],
    receivedFrom: '',
    amount: '',
    paymentMethod: 'Cash',
    purpose: '',
    remarks: '',
    transactionId: ''
  });

  // Function to generate receipt number
  const generateReceiptNumber = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear().toString().slice(-2);
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const timestamp = today.getTime().toString().slice(-4);
      
      // Format: YSSC-YYMMDD-XXXX (where XXXX is from timestamp)
      const newReceiptNo = `YSSC-${year}${month}${day}-${timestamp}`;
      
      setValue('receiptNo', newReceiptNo);
      setFormData(prev => ({ ...prev, receiptNo: newReceiptNo }));

    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Use a fallback format if there's an error
      const fallbackNo = `YSSC-${Date.now()}`;
      setValue('receiptNo', fallbackNo);
      setFormData(prev => ({ ...prev, receiptNo: fallbackNo }));
    }
  };

  // Initialize form data
  useEffect(() => {
    generateReceiptNumber();

    if (transactionData) {
      const data = {
        date: transactionData.date || new Date().toISOString().split('T')[0],
        amount: transactionData.amount?.toString() || '',
        paymentMethod: transactionData.paymentMethod || 'Cash',
        purpose: transactionData.description || '',
        transactionId: transactionData.id || ''
      };

      Object.entries(data).forEach(([key, value]) => {
        setValue(key, value);
      });

      setFormData(prev => ({ ...prev, ...data }));
    }
  }, [transactionData, setValue]);

  const handleFormSubmit = (data: any) => {
    setFormData(data);
    setShowPreview(true);
  };

  const handlePrint = () => {
    onSubmit(formData);
    window.print();
  };

  return (
    <div>
      {!showPreview ? (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Receipt No</label>
              <Input
                {...register('receiptNo')}
                readOnly
                className="bg-gray-50 text-lg font-medium text-[#001F3F] cursor-not-allowed"
                style={{ letterSpacing: '1px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                {...register('date')}
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Received From</label>
            <Input
              {...register('receivedFrom', { required: 'Name is required' })}
              placeholder="Enter name"
            />
            {errors.receivedFrom && (
              <span className="text-red-500 text-sm">{errors.receivedFrom.message?.toString()}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount (LKR)</label>
            <Input
              {...register('amount', { required: 'Amount is required' })}
              type="number"
              placeholder="Enter amount"
            />
            {errors.amount && (
              <span className="text-red-500 text-sm">{errors.amount.message?.toString()}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              {...register('paymentMethod')}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Purpose</label>
            <Input
              {...register('purpose', { required: 'Purpose is required' })}
              placeholder="Enter payment purpose"
            />
            {errors.purpose && (
              <span className="text-red-500 text-sm">{errors.purpose.message?.toString()}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
            <Textarea
              {...register('remarks')}
              placeholder="Additional notes"
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" className="w-full">
            Preview Receipt
          </Button>
        </form>
      ) : (
        <div className="print-container bg-white">
          {/* Container with fixed width for screen view */}
          <div className="max-w-[600px] mx-auto bg-white p-8 shadow-lg rounded-lg">
            {/* Club Header */}
            <div className="text-center mb-6 pb-4">
              <div className="mb-3">
                <img src="/logo.png" alt="YSSC Logo" className="h-16 mx-auto" />
              </div>
              <h1 className="text-xl font-bold text-[#001F3F] mb-1">Young Silver Sports Club</h1>
              <p className="text-base font-semibold text-[#001F3F]/80 mb-1">Official Receipt</p>
              <div className="text-sm text-gray-600">
                <p>27, Vincent Lane, Wellawatte, Colombo 06</p>
                <p>Tel: +94 0 714 813 981</p>
                <p>Email: info@youngsilversportsclub.com</p>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="bg-gray-50 rounded p-4 mb-4 border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-600">Receipt No:</p>
                  <p className="text-base font-bold text-[#001F3F]">{formData.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Date:</p>
                  <p className="text-base font-bold text-[#001F3F]">
                    {new Date(formData.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Received with thanks from:</p>
                <p className="text-base font-bold text-[#001F3F]">{formData.receivedFrom}</p>
              </div>
              
              <div className="bg-[#001F3F]/5 p-3 rounded">
                <p className="text-sm text-gray-600">Amount:</p>
                <p className="text-lg font-bold text-[#001F3F]">
                  LKR {Number(formData.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 italic">
                  {numberToWords(formData.amount)} Rupees Only
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Method:</p>
                  <p className="text-base text-[#001F3F]">{formData.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction ID:</p>
                  <p className="text-base text-[#001F3F]">{formData.transactionId || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Purpose:</p>
                <p className="text-base text-[#001F3F]">{formData.purpose}</p>
              </div>

              {formData.remarks && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Remarks:</p>
                  <p className="text-sm text-gray-700">{formData.remarks}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8">
              <p className="text-center text-sm text-gray-600 mb-8">
                Thank you for your payment. Your support helps us maintain and improve our club facilities.
              </p>
              
              <div className="flex justify-center mt-8">
                <div className="text-center">
                  <div className="border-t border-[#001F3F] w-48 pt-2">
                    <p className="text-sm text-[#001F3F]">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print/Edit Buttons */}
          <div className="mt-4 flex gap-4 print:hidden max-w-[600px] mx-auto">
            <Button 
              onClick={handlePrint} 
              className="w-full bg-[#001F3F] hover:bg-[#003366] text-white"
            >
              Print Receipt
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(false)} 
              className="w-full bg-white hover:bg-gray-100 border-2 border-[#001F3F] text-[#001F3F]"
            >
              Edit Receipt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to convert numbers to words
function numberToWords(num: string | number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    
    let result = '';
    
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    
    if (n > 0) {
      result += ones[n] + ' ';
    }
    
    return result;
  };

  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n === 0) return 'Zero';

  let result = '';
  let billion = Math.floor(n / 1000000000);
  let million = Math.floor((n % 1000000000) / 1000000);
  let thousand = Math.floor((n % 1000000) / 1000);
  let remainder = Math.floor(n % 1000);

  if (billion) result += convertLessThanThousand(billion) + 'Billion ';
  if (million) result += convertLessThanThousand(million) + 'Million ';
  if (thousand) result += convertLessThanThousand(thousand) + 'Thousand ';
  if (remainder) result += convertLessThanThousand(remainder);

  return result.trim();
} 