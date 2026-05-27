import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbButtonModule, NbCardModule, NbDialogRef, NbIconModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule, NbCardModule, NbButtonModule, NbIconModule, TranslateModule],
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
})
export class ErrorModalComponent {
  @Input() message = '';
  @Input() code = '';
  @Input() correlationId?: string;
  @Input() retry?: () => void;

  constructor(protected ref: NbDialogRef<ErrorModalComponent>) {}

  onRetry(): void {
    const fn = this.retry;
    this.ref.close();
    if (fn) fn();
  }

  onClose(): void {
    this.ref.close();
  }
}
