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
  | 'roles';

export function useDataOperations(collectionName: Collection) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const fetchedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(fetchedItems);
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
    }
  };

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