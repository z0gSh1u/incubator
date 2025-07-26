interface ElectronAPI {
  // Tab management
  createTab: (id: string, url: string) => Promise<boolean>;
  switchTab: (id: string) => Promise<boolean>;
  closeTab: (id: string) => Promise<boolean>;
  hideAllBrowserViews: () => Promise<boolean>;

  // Navigation
  navigateToUrl: (id: string, url: string) => Promise<boolean>;
  goBack: (id: string) => Promise<boolean>;
  goForward: (id: string) => Promise<boolean>;
  reload: (id: string) => Promise<boolean>;

  // Event listeners
  onNewTabCreated: (callback: (data: { url: string }) => void) => () => void;
  onTabTitleUpdated: (callback: (data: { id: string; title: string }) => void) => () => void;
  onTabLoading: (callback: (data: { id: string; isLoading: boolean }) => void) => () => void;
  onTabUrlUpdated: (callback: (data: { id: string; url: string }) => void) => () => void;
  onBrowserViewsHidden: (callback: () => void) => () => void;
}

interface HTMLWebViewElement extends HTMLElement {
  src: string;
  allowpopups: boolean;
  webpreferences: string;
  partition: string;

  // Add methods
  executeJavaScript(code: string): Promise<any>;

  // Add event listener methods
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface Window {
  electronAPI: ElectronAPI;
}

namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLWebViewElement> & {
        src?: string;
        allowpopups?: boolean;
        webpreferences?: string;
        partition?: string;
      },
      HTMLWebViewElement
    >;
  }
}
