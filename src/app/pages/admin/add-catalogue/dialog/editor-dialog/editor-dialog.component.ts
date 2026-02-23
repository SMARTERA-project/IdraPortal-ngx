import { Component, Input } from '@angular/core';
import { NbButtonModule, NbCardModule, NbDialogRef } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';
import { CodeEditorComponent, CodeModel } from '@ngstack/code-editor';

@Component({
  standalone: true,
  imports: [NbCardModule, TranslateModule, CodeEditorComponent, NbButtonModule],
  selector: 'ngx-editor-dialog',
  templateUrl: 'editor-dialog.component.html',
  styleUrls: ['editor-dialog.component.scss'],
})
export class EditorDialogComponent {
  
   model: CodeModel = {
      language: 'json',
      uri: 'main.json',
      value: ``,
    };
    
  options = {
    contextmenu: true,
    minimap: {
      enabled: true,
    },
  };

  constructor(protected ref: NbDialogRef<EditorDialogComponent>) {}

  dismiss(mode: boolean) {
    if (mode) 
      this.ref.close(this.model.value);
    else
      return this.ref.close(false);
  } 
}
