// PWA Registration & Install Management Helper

export interface PWAState {
  isInstalled: boolean;
  canInstall: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
}

type PWAChangeListener = (state: PWAState) => void;

class PWAManager {
  private deferredPrompt: any = null;
  private listeners: Set<PWAChangeListener> = new Set();
  private registration: ServiceWorkerRegistration | null = null;
  private state: PWAState = {
    isInstalled: false,
    canInstall: false,
    isOffline: !navigator.onLine,
    updateAvailable: false,
  };

  constructor() {
    if (typeof window === 'undefined') return;

    // Detect if already installed / running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.state.isInstalled = isStandalone;

    // Listen to online/offline network changes
    window.addEventListener('online', () => this.updateOnlineStatus(false));
    window.addEventListener('offline', () => this.updateOnlineStatus(true));

    // Listen to beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent automatic browser mini-infobar on mobile
      e.preventDefault();
      this.deferredPrompt = e;
      this.state.canInstall = true;
      this.notify();
    });

    // Listen to appinstalled event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.state.canInstall = false;
      this.state.isInstalled = true;
      this.notify();
    });
  }

  public registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    window.addEventListener('load', () => {
      // Use relative path './sw.js' so it functions properly on GitHub Pages subpaths
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          this.registration = reg;

          // Check if there is already an update waiting
          if (reg.waiting) {
            this.state.updateAvailable = true;
            this.notify();
          }

          // Listen for new service worker installation
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available and ready
                this.state.updateAvailable = true;
                this.notify();
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      // Handle controllerchange (page refresh after skipWaiting)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.state.canInstall = false;
        this.notify();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Erro ao disparar prompt de instalação:', err);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  public applyUpdate(): void {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }

  private updateOnlineStatus(isOffline: boolean) {
    this.state.isOffline = isOffline;
    this.notify();
  }

  public subscribe(listener: PWAChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState(): PWAState {
    return { ...this.state };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }
}

export const pwaManager = new PWAManager();
