import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbDialogRef, NbInputModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [NbCardModule, TranslateModule, FormsModule, CommonModule, NbButtonModule, NbInputModule],
  selector: 'ngx-prefix-dialog',
  templateUrl: 'prefix-dialog.component.html',
  styleUrls: ['prefix-dialog.component.scss'],
})
export class PrefixDialogComponent {

  @Input() title: string;
	prefix: string = '';
	namespace: string = '';
  action: string = '';

  constructor(protected ref: NbDialogRef<PrefixDialogComponent>) {}

  dismiss(prefix, namespace) {
    return this.ref.close({prefix, namespace});
  } 
}
