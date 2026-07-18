import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";

export function useLocalDraft<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        // Migration: check localStorage first
        const localSaved = localStorage.getItem(`dsr:${key}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved) as T;
          if (active) setValue(parsed);
          // Migrate to IDB and remove from localStorage to free up quota
          await set(`dsr:${key}`, parsed);
          localStorage.removeItem(`dsr:${key}`);
        } else {
          // If not in localStorage, load from IDB
          const saved = await get(`dsr:${key}`);
          if (active && saved !== undefined) {
            setValue(saved as T);
          }
        }
      } catch (err) {
        console.error("Failed to load draft:", err);
      } finally {
        if (active) setIsLoaded(true);
      }
    };
    load();
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (isLoaded) {
      set(`dsr:${key}`, value).catch(err => {
        console.error("Failed to save draft to IDB:", err);
      });
    }
  }, [key, value, isLoaded]);

  return [value, setValue] as const;
}
