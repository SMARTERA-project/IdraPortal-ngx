import { Component, Input } from '@angular/core';
import { NbButtonModule, NbCardModule, NbDialogRef } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  standalone: true,
  imports: [NbCardModule, NbButtonModule, TranslateModule],
  selector: 'ngx-showcase-dialog',
  templateUrl: 'showcase-dialog.component.html',
  styleUrls: ['showcase-dialog.component.scss'],
})
export class ShowcaseDialogComponent {

  @Input() title: string;
  @Input() body: string;

  constructor(protected ref: NbDialogRef<ShowcaseDialogComponent>) {}

  dismiss(val) {
    return this.ref.close(val);
  } 
}
