import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

const PIN_KEY = "mydocs_pin_v1";
const PIN_ENABLED_KEY = "mydocs_pin_enabled_v1";

const get = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
};
const set = async (key: string, value: string) => {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};
const remove = async (key: string) => {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

interface PinContextValue {
  isPinEnabled: boolean;
  isUnlocked: boolean;
  isReady: boolean;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
}

const PinContext = createContext<PinContextValue | null>(null);

export function PinProvider({ children }: { children: ReactNode }) {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await get(PIN_ENABLED_KEY);
        const isEnabled = enabled === "true";
        setIsPinEnabled(isEnabled);
        setIsUnlocked(!isEnabled);
      } catch {}
      setIsReady(true);
    })();
  }, []);

  const setPin = async (pin: string) => {
    await set(PIN_KEY, pin);
    await set(PIN_ENABLED_KEY, "true");
    setIsPinEnabled(true);
    setIsUnlocked(true);
  };

  const removePin = async () => {
    await remove(PIN_KEY);
    await set(PIN_ENABLED_KEY, "false");
    setIsPinEnabled(false);
    setIsUnlocked(true);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const stored = await get(PIN_KEY);
    return stored === pin;
  };

  const unlock = () => setIsUnlocked(true);
  const lock = () => setIsUnlocked(false);

  return (
    <PinContext.Provider
      value={{
        isPinEnabled,
        isUnlocked,
        isReady,
        setPin,
        removePin,
        verifyPin,
        unlock,
        lock,
      }}
    >
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error("usePin must be used within PinProvider");
  return ctx;
}
