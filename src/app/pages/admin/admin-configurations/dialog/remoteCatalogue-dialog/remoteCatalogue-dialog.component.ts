import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbDialogRef, NbInputModule, NbSelectModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [NbCardModule, TranslateModule, FormsModule, NbSelectModule, CommonModule, NbInputModule, NbButtonModule],
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'remoteCatalogue-dialog.component.html',
  styleUrls: ['remoteCatalogue-dialog.component.scss'],
})
export class RemoteCatalogueDialogComponent {

  @Input() title: string;
	catalogueName: string = '';
	catalogueURL: string = '';
  action: string = '';
  catalogueType: boolean = false;
	authMethod: string = '';
  username: string = '';
  password: string = '';
  clientID: string = '';
  clientSecret: string = '';
  portalURL: string = '';

  constructor(protected ref: NbDialogRef<RemoteCatalogueDialogComponent>) {}

  dismiss(catalogueName, catalogueURL, type, authMethod, username, password, clientID, clientSecret, portalURL) {
    return this.ref.close({catalogueName, catalogueURL, type, authMethod, username, password, clientID, clientSecret, portalURL});
  } 

  changedTypeHandler(event: any) {
    this.catalogueType = event;
  }

	changedAuthMethodHandler(event: any) {
		this.authMethod = event;
	}
}
