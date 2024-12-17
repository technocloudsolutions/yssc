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
  receivedFrom?: string;
  receivedFromType?: string;
}

export interface TransactionFormData {
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description: string;
  transferToAccount?: string;
  receivedFrom?: string;
  receivedFromType?: string;
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

        // Ensure balance is properly initialized and handle potential negative values
        const availableBalance = Math.max(fromAccountData.balance || 0, 0);  // Prevent negative balance
        const transferAmount = Math.abs(data.amount);  // Ensure positive transfer amount

        // Verify sufficient balance with detailed error message
        if (availableBalance < transferAmount) {
          throw new Error(`Insufficient balance for transfer. Available balance: ${availableBalance.toFixed(2)}, Transfer amount: ${transferAmount}`);
        }

        // Verify accounts are active
        if (fromAccountData.status !== 'Active' || toAccountData.status !== 'Active') {
          throw new Error('Both accounts must be active to perform a transfer');
        }

        // Create transaction records
        const timestamp = new Date().toISOString();
        const transferId = Date.now().toString();

        const fromTransaction = {
          id: `${transferId}-from`,
          amount: transferAmount,
          type: 'debit',
          description: `Transfer to ${toAccountData.name}: ${data.description}`,
          date: timestamp,
          transferToAccount: data.transferToAccount
        };

        const toTransaction = {
          id: `${transferId}-to`,
          amount: transferAmount,
          type: 'credit',
          description: `Transfer from ${fromAccountData.name}: ${data.description}`,
          date: timestamp,
          transferFromAccount: selectedAccountId
        };

        // Update both accounts with validated balances
        transaction.update(fromAccountRef, {
          balance: availableBalance - transferAmount,
          transactions: [...(fromAccountData.transactions || []), fromTransaction]
        });

        transaction.update(toAccountRef, {
          balance: (toAccountData.balance || 0) + transferAmount,
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
        date: new Date().toISOString(),
        receivedFrom: data.receivedFrom,
        receivedFromType: data.receivedFromType
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