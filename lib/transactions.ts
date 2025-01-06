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
  category?: string;
}

export interface TransactionFormData {
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description: string;
  transferToAccount?: string;
  receivedFrom?: string;
  receivedFromType?: string;
  category?: string;
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
      // Handle credit or debit
      const accountRef = doc(collection(db, 'accountTypes'), selectedAccountId);
      const accountDoc = await getDoc(accountRef);

      if (!accountDoc.exists()) {
        onError('Account does not exist');
        return;
      }

      const accountData = accountDoc.data();

      // Ensure account is active
      if (accountData.status !== 'Active') {
        onError('Account must be active to perform transactions');
        return;
      }

      // Ensure balance is properly initialized
      const currentBalance = accountData.balance || 0;
      const transactionAmount = Math.abs(data.amount);

      // For debit transactions, check if there's sufficient balance
      if (data.type === 'debit' && currentBalance < transactionAmount) {
        onError(`Insufficient balance. Available: ${currentBalance.toFixed(2)}, Required: ${transactionAmount}`);
        return;
      }

      // Create transaction record
      const transaction = {
        id: Date.now().toString(),
        amount: transactionAmount,
        type: data.type,
        description: data.description,
        date: new Date().toISOString(),
        receivedFrom: data.receivedFrom,
        receivedFromType: data.receivedFromType,
        category: data.category // Add category to transaction record
      };

      // Calculate new balance
      const newBalance = data.type === 'credit' 
        ? currentBalance + transactionAmount
        : currentBalance - transactionAmount;

      // Update account
      await updateDoc(accountRef, {
        balance: newBalance,
        transactions: [...(accountData.transactions || []), transaction]
      });

      onSuccess();
    }
  } catch (error) {
    console.error('Transaction error:', error);
    onError(error instanceof Error ? error.message : 'An error occurred');
  }
} 