import { create } from 'zustand';
import type { LogEntry } from '../types/device';

interface LogState {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  clear: () => void;
}

export const useLogStore = create<LogState>((set, get) => ({
  logs: [],
  addLog: (entry) =>
    set(() => {
      const trimmed = [...get().logs.slice(-499), entry];
      return { logs: trimmed };
    }),
  clear: () => set({ logs: [] })
}));
