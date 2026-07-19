import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { get, set } from "idb-keyval";

export function useLocalDraft<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const initialValueRef = useRef(initialValue);
  const editedWhileLoadingRef = useRef(false);
  const loadedKeyRef = useRef<string | null>(null);

  const updateValue = useCallback((nextValue: SetStateAction<T>) => {
    editedWhileLoadingRef.current = true;
    setValue(nextValue);
  }, []);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    let active = true;
    editedWhileLoadingRef.current = false;
    loadedKeyRef.current = null;

    const load = async () => {
      // Defer the reset so a key change cannot save the previous key's value.
      await Promise.resolve();
      if (!active) return;
      setIsLoaded(false);
      setValue(initialValueRef.current);

      try {
        // Migration: check localStorage first
        const localSaved = localStorage.getItem(`dsr:${key}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved) as T;
          if (active && !editedWhileLoadingRef.current) setValue(parsed);
          // Migrate to IDB and remove from localStorage to free up quota
          await set(`dsr:${key}`, parsed);
          localStorage.removeItem(`dsr:${key}`);
        } else {
          // If not in localStorage, load from IDB
          const saved = await get(`dsr:${key}`);
          if (
            active &&
            !editedWhileLoadingRef.current &&
            saved !== undefined
          ) {
            setValue(saved as T);
          }
        }
      } catch (err) {
        console.error("Failed to load draft:", err);
      } finally {
        if (active) {
          loadedKeyRef.current = key;
          setIsLoaded(true);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (isLoaded && loadedKeyRef.current === key) {
      set(`dsr:${key}`, value).catch(err => {
        console.error("Failed to save draft to IDB:", err);
      });
    }
  }, [key, value, isLoaded]);

  return [value, updateValue] as const;
}
