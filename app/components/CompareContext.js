'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();

export function CompareProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gk_compare_items');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('gk_compare_items', JSON.stringify(items));
  }, [items, loaded]);

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
