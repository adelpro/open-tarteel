declare global {
  interface Window {
    wb: {
      messageSkipWaiting(): void;
      register(): void;
      addEventListener(name: string, callback: () => unknown): void;
    };
  }
}

// Ensure that the wb property is properly typed
window.wb = window.wb || {
  messageSkipWaiting: () => {},
  register: () => {},
  addEventListener: (name: string, callback: () => unknown) => {},
};

export {};
