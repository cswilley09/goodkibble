'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();

export function CompareProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount, refresh stale items
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gk_compare_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed);
        // Refresh any items missing key fields (ingredients, primary_protein)
        const stale = parsed.filter(f => !f.ingredients || !f.primary_protein);
        if (stale.length > 0) {
          Promise.all(parsed.map(f =>
            (!f.ingredients || !f.primary_protein)
              ? fetch(`/api/foods/${f.id}`).then(r => r.json()).then(fresh => (fresh && !fresh.error) ? fresh : f).catch(() => f)
              : Promise.resolve(f)
          )).then(refreshed => setItems(refreshed));
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('gk_compare_items', JSON.stringify(items));
  }, [items, loaded]);

  const [nudge, setNudge] = useState(0);

  function addItem(food, maxItems = 6) {
    setNudge(n => n + 1); // always nudge to trigger wiggle
    if (items.length >= maxItems) return;
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
    <CompareContext.Provider value={{ items, addItem, removeItem, clearAll, nudge }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
