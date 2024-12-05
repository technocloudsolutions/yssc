import { collection, doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description: string;
  date: string;
  transferToAccount?: string;
  transferFromAccount?: string;
}

export interface TransactionFormData {
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description: string;
  transferToAccount?: string;
}

export async function handleTransaction(
  selectedAccountId: string,
  data: TransactionFormData,
  onSuccess: () => void,
  onError: (error: string) => void
) {
  try {
    if (data.type === 'transfer') {
      if (!data.transferToAccount) {
        onError('Please select an account to transfer to');
        return;
      }

      // Handle transfer between accounts using a transaction
      await runTransaction(db, async (transaction) => {
        const fromAccountRef = doc(collection(db, 'accountTypes'), selectedAccountId);
        const toAccountRef = doc(collection(db, 'accountTypes'), data.transferToAccount);
        
        const fromAccountDoc = await transaction.get(fromAccountRef);
        const toAccountDoc = await transaction.get(toAccountRef);
        
        if (!fromAccountDoc.exists() || !toAccountDoc.exists()) {
          throw new Error('One of the accounts does not exist');
        }

        const fromAccountData = fromAccountDoc.data();
        const toAccountData = toAccountDoc.data();

        // Verify sufficient balance
        if ((fromAccountData.balance || 0) < data.amount) {
          throw new Error('Insufficient balance for transfer');
        }

        // Create transaction records
        const timestamp = new Date().toISOString();
        const transferId = Date.now().toString();

        const fromTransaction = {
          id: `${transferId}-from`,
          amount: data.amount,
          type: 'debit',
          description: `Transfer to ${toAccountData.name}: ${data.description}`,
          date: timestamp,
          transferToAccount: data.transferToAccount
        };

        const toTransaction = {
          id: `${transferId}-to`,
          amount: data.amount,
          type: 'credit',
          description: `Transfer from ${fromAccountData.name}: ${data.description}`,
          date: timestamp,
          transferFromAccount: selectedAccountId
        };

        // Update both accounts
        transaction.update(fromAccountRef, {
          balance: (fromAccountData.balance || 0) - data.amount,
          transactions: [...(fromAccountData.transactions || []), fromTransaction]
        });

        transaction.update(toAccountRef, {
          balance: (toAccountData.balance || 0) + data.amount,
          transactions: [...(toAccountData.transactions || []), toTransaction]
        });
      });

      onSuccess();
    } else {
      // Handle regular credit/debit transaction
      const accountRef = doc(collection(db, 'accountTypes'), selectedAccountId);
      const accountDoc = await getDoc(accountRef);
      const currentData = accountDoc.data();
      
      if (!currentData) {
        throw new Error('Account not found');
      }

      const currentBalance = currentData.balance || 0;
      const transactionAmount = data.type === 'credit' ? data.amount : -data.amount;
      const newBalance = currentBalance + transactionAmount;

      if (newBalance < 0) {
        throw new Error('Transaction would result in negative balance');
      }

      const transaction = {
        id: Date.now().toString(),
        amount: data.amount,
        type: data.type,
        description: data.description,
        date: new Date().toISOString()
      };

      await updateDoc(accountRef, {
        balance: newBalance,
        transactions: [...(currentData.transactions || []), transaction]
      });

      onSuccess();
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    onError(error instanceof Error ? error.message : 'There was an error processing your transaction.');
  }
} 