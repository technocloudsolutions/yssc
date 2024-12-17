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
        transactionId: transactionData.id || '',
        receivedFrom: transactionData.receivedFrom || '',
        remarks: `${transactionData.receivedFromType || ''} ${transactionData.category || ''}`.trim()
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
              {...register('amount', {
                required: 'Amount is required',
                validate: {
                  validAmount: (value) => {
                    // Convert to number and check if it's valid
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) return 'Please enter a valid amount';
                    
                    // Check if it matches the pattern for up to 2 decimal places
                    if (!/^\d+(\.\d{0,2})?$/.test(value.toString())) {
                      const floor = Math.floor(numValue);
                      const ceil = Math.ceil(numValue);
                      return `Please enter a valid value. The two nearest valid values are ${floor} and ${ceil}.`;
                    }
                    
                    return true;
                  }
                }
              })}
              type="number"
              step="0.01"
              placeholder="Enter amount"
              onChange={(e) => {
                // Format the input to maximum 2 decimal places
                const value = e.target.value;
                if (value.includes('.') && value.split('.')[1].length > 2) {
                  e.target.value = Number(value).toFixed(2);
                }
              }}
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
        <div className="print-container bg-white h-screen flex items-center justify-center p-4">
          {/* Receipt container with fixed A4 proportions */}
          <div className="w-[500px] h-[900px] bg-white p-4 shadow-md print:w-[595px] print:h-[842px] print:p-8 mx-auto overflow-auto">
            {/* Club Header */}
            <div className="text-center mb-4">
              <div className="mb-2">
                <img src="/logo.png" alt="YSSC Logo" className="h-14 mx-auto" />
              </div>
              <h1 className="text-xl font-bold text-[#001F3F]">Young Silver Sports Club</h1>
              <p className="text-base font-semibold text-[#001F3F]/80">Official Receipt</p>
              <div className="text-sm text-gray-600 mt-1">
                <p>27, Vincent Lane, Wellawatte, Colombo 06</p>
                <p>Tel: +94 0 714 813 981</p>
                <p>Email: info@youngsilversportsclub.com</p>
              </div>
              <div className="border-b border-gray-300 mt-3"></div>
            </div>

            {/* Receipt Details */}
            <div className="mb-4">
              <div className="flex justify-between">
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
                <p className="text-base font-bold text-[#001F3F] mt-1">{formData.receivedFrom}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.remarks}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Amount:</p>
                <p className="text-lg font-bold text-[#001F3F] mt-1">
                  LKR {Number(formData.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 italic mt-1">
                  {numberToWords(formData.amount)} Rupees Only
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payment Method:</p>
                  <p className="text-base text-[#001F3F] mt-1">{formData.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction ID:</p>
                  <p className="text-base text-[#001F3F] mt-1">{formData.transactionId || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Purpose:</p>
                <p className="text-base text-[#001F3F] mt-1">{formData.purpose}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto" style={{ marginTop: '40px' }}>
              <p className="text-center text-sm text-gray-600">
                Thank you for your payment. Your support helps us maintain and improve our club facilities.
              </p>
              
              <div className="flex justify-center mt-6">
                <div className="text-center">
                  <div className="border-t border-[#001F3F] w-48">
                    <p className="text-sm text-[#001F3F] mt-2">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print/Edit Buttons */}
          <div className="fixed bottom-2 left-0 right-0 flex justify-center gap-4 print:hidden">
            <Button 
              onClick={handlePrint} 
              className="bg-[#001F3F] hover:bg-[#003366] text-white px-8 py-2"
            >
              Print Receipt
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(false)} 
              className="bg-white hover:bg-gray-100 border-2 border-[#001F3F] text-[#001F3F] px-8 py-2"
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