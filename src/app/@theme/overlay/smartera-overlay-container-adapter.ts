import { Injectable } from '@angular/core';
import { NbOverlayContainerAdapter } from '@nebular/theme';

@Injectable()
export class SmartEraOverlayContainerAdapter extends NbOverlayContainerAdapter {
  private lastKnownLayoutContainer: HTMLElement | null = null;

  override setContainer(container: HTMLElement): void {
    this.lastKnownLayoutContainer = container;
    super.setContainer(container);
  }

  override clearContainer(): void {
    super.clearContainer();
    const activeLayout = this.resolveActiveLayoutContainer();
    if (activeLayout) {
      this.lastKnownLayoutContainer = activeLayout;
      super.setContainer(activeLayout);
    }
  }

  protected override checkContainer(): void {
    if (!this.container) {
      const activeLayout = this.resolveActiveLayoutContainer();
      this.container = activeLayout ?? this.lastKnownLayoutContainer ?? (this._document?.body as HTMLElement);
    }
  }

  private resolveActiveLayoutContainer(): HTMLElement | null {
    if (!this._document) {
      return null;
    }
    const pagesLayout = this._document.querySelector('ngx-pages nb-layout') as HTMLElement | null;
    if (pagesLayout) {
      return pagesLayout;
    }
    return this._document.querySelector('nb-layout') as HTMLElement | null;
  }
}
