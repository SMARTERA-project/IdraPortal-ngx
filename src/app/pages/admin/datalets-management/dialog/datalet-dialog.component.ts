import { Component, Input } from '@angular/core';
import { NbButtonModule, NbCardModule, NbDialogRef } from '@nebular/theme';
@Component({
  standalone: true,
  imports: [NbCardModule, NbButtonModule],
  selector: 'ngx-prefix-dialog',
  templateUrl: 'datalet-dialog.component.html',
  styleUrls: ['datalet-dialog.component.scss'],
})
export class DataletDialogComponent {

    @Input() 
    title: string;
    datalet: string = '';

    constructor(protected ref: NbDialogRef<DataletDialogComponent>) {}

    dismiss() {
        return this.ref.close();
    } 
    
    ngOnInit(){
      document.getElementById('bodyDatalet').innerHTML = this.datalet;
    }
}
