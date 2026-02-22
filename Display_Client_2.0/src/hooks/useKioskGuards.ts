import { useEffect } from 'react';

const blockedKeys = new Set(['F5', 'F11', 'F12']);

export const useKioskGuards = () => {
  useEffect(() => {
    const preventContext = (event: MouseEvent) => event.preventDefault();
    const preventShortcuts = (event: KeyboardEvent) => {
      if (blockedKeys.has(event.key) || (event.ctrlKey && ['R', 'N', 'T'].includes(event.key.toUpperCase()))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', preventContext);
    window.addEventListener('keydown', preventShortcuts, true);

    return () => {
      document.removeEventListener('contextmenu', preventContext);
      window.removeEventListener('keydown', preventShortcuts, true);
    };
  }, []);
};
