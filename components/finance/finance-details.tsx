import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatLKR } from "@/lib/utils";
import { FileText, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Category {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Inactive';
}

interface FinanceDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
}

export function FinanceDetails({ isOpen, onClose, record }: FinanceDetailsProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const fetchedCategories = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            type: data.type || '',
            status: data.status || 'Inactive'
          } as Category;
        });
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  if (!record) return null;

  const categoryName = categories.find(c => c.id === record?.category)?.name || record?.category;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-sm text-muted-foreground">Date</label>
              <p>{new Date(record?.date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="font-medium text-sm text-muted-foreground">Account Type</label>
              <p>{record?.accountType}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-sm text-muted-foreground">Category</label>
              <p>{categoryName}</p>
            </div>
            <div>
              <label className="font-medium text-sm text-muted-foreground">Type</label>
              <p className={record?.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                {record?.type}
              </p>
            </div>
          </div>
          
          <div>
            <label className="font-medium text-sm text-muted-foreground">Amount</label>
            <p className={`text-lg font-semibold ${
              record?.type === 'Income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {record?.amount ? formatLKR(Number(record.amount)) : 'LKR 0.00'}
            </p>
          </div>
          
          <div>
            <label className="font-medium text-sm text-muted-foreground">Description</label>
            <p className="whitespace-pre-wrap">{record?.description}</p>
          </div>
          
          {record?.type === 'Income' && record?.receivedFrom && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-sm text-muted-foreground">Received From</label>
                <p>{record?.receivedFrom}</p>
              </div>
              <div>
                <label className="font-medium text-sm text-muted-foreground">Received From Type</label>
                <p>{record?.receivedFromType}</p>
              </div>
            </div>
          )}
          
          {record?.type === 'Expense' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-sm text-muted-foreground">Payee</label>
                <p>{record?.payee || '-'}</p>
              </div>
              <div>
                <label className="font-medium text-sm text-muted-foreground">Payee Type</label>
                <p>{record?.payeeType || '-'}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="font-medium text-sm text-muted-foreground">Status</label>
            <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              record?.status === 'Completed' 
                ? 'bg-green-100 text-green-800'
                : record?.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {record?.status}
            </p>
          </div>
          
          {record?.attachments && record.attachments.length > 0 && (
            <div>
              <label className="font-medium text-sm text-muted-foreground">Attachments</label>
              <div className="mt-2 space-y-2">
                {record.attachments.map((url: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                      Attachment {index + 1}
                      <Link2 className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 