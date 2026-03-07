'use client';
import { createContext, useContext, useState } from 'react';

const CompareContext = createContext();

export function CompareProvider({ children }) {
  const [items, setItems] = useState([]);

  function addItem(food) {
    if (items.length >= 3) return;
    if (items.find(f => f.id === food.id)) return;
    setItems([...items, food]);
  }

  function removeItem(id) {
    setItems(items.filter(f => f.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  return (
    <CompareContext.Provider value={{ items, addItem, removeItem, clearAll }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
