import { Injectable } from '@angular/core';
import { NbOverlayContainerAdapter } from '@nebular/theme';

@Injectable()
export class SmartEraOverlayContainerAdapter extends NbOverlayContainerAdapter {
  override setContainer(container: HTMLElement): void {
    const target = this.getStableContainer();
    super.setContainer(target ?? container);
  }

  override clearContainer(): void {
    super.clearContainer();
    const target = this.getStableContainer();
    if (target) {
      super.setContainer(target);
    }
  }

  protected override checkContainer(): void {
    if (!this.container) {
      this.container = this.getStableContainer() ?? (this._document?.body as HTMLElement);
    }
  }

  private getStableContainer(): HTMLElement | null {
    if (!this._document) {
      return null;
    }
    return this._document.body as HTMLElement;
  }
}
