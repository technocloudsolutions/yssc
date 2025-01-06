import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export type Collection = 
  | 'transactions' 
  | 'categories' 
  | 'accountTypes'
  | 'players'
  | 'staff'
  | 'users'
  | 'departments'
  | 'roles'
  | 'sponsorshipTypes';

export function useDataOperations(collectionName: Collection) {
  const [items, setItems] = useState<any[]>([]);

  const fetchItems = async () => {
    try {
      console.log(`Fetching ${collectionName}...`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      console.log(`Got ${querySnapshot.size} documents from ${collectionName}`);
      
      const fetchedItems = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Document data for ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log(`Processed ${collectionName} items:`, fetchedItems);
      setItems(fetchedItems);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      throw error;
    }
  };

  useEffect(() => {
    fetchItems();
  }, [collectionName]);

  const addItem = async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date().toISOString()
      });
      const newItem = { id: docRef.id, ...data };
      setItems(prev => [...prev, newItem]);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding ${collectionName}:`, error);
      throw error;
    }
  };

  const updateItem = async (id: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      ));
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
      throw error;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      
      setItems(prev => prev.filter(item => item.id !== id));
      
      console.log(`Deleted ${collectionName} item with ID:`, id);
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
      throw error;
    }
  };

  const formatAmount = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    refreshItems: fetchItems,
    formatAmount
  };
} 