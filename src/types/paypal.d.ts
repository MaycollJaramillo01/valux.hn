export type PaypalButtons = {
  render: (el: HTMLElement) => Promise<void>;
  close?: () => Promise<void>;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => PaypalButtons;
    };
  }
}

export {};
