import { Component, Input } from '@angular/core';
import { NbButtonModule, NbCardModule, NbDialogRef } from '@nebular/theme';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [NbCardModule, NbButtonModule, CommonModule],
  selector: 'ngx-prefix-dialog',
  templateUrl: 'datalet-dialog.component.html',
  styleUrls: ['datalet-dialog.component.scss'],
})
export class DataletDialogComponent {

    @Input()
    title: string;
    datalet: string = '';
    safeDatalet: SafeHtml = '';

    constructor(
      protected ref: NbDialogRef<DataletDialogComponent>,
      private sanitizer: DomSanitizer
    ) {}

    dismiss() {
        return this.ref.close();
    }

    ngOnInit() {
      // Datalet HTML comes from the admin-configured DEEP platform (DATALET_URL).
      // It contains <iframe> embeds — trust is placed in the DEEP service.
      this.safeDatalet = this.sanitizer.bypassSecurityTrustHtml(this.datalet);
    }
}
