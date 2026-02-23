import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AdminRoutingModule } from './admin-routing.module';
import { CataloguesListComponent } from './catalogues-list/catalogues-list.component';
import { NbAccordionModule, NbActionsModule, NbCardModule, NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbListModule, NbSelectModule, NbSpinnerModule, NbTagModule, NbToastrModule, NbTooltipModule, NbTreeGridModule, NbToggleModule, NbButtonModule, NbUserModule, NbTableModule, NbCheckboxModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AddCatalogueComponent } from './add-catalogue/add-catalogue.component';
import { RemoteCataloguesComponent } from './remote-catalogues/remote-catalogues.component';
import { DataletsManagementComponent } from './datalets-management/datalets-management.component';
import { FormsModule } from '@angular/forms';
import { ShowcaseDialogComponent } from './catalogues-list/dialog/showcase-dialog/showcase-dialog.component';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  ToolboxComponent,
  CanvasRenderer,
]);
import { AdminConfigurationsComponent } from './admin-configurations/admin-configurations.component';
import { PrefixDialogComponent } from './admin-configurations/dialog/prefix-dialog/prefix-dialog.component';
import { RemoteCatalogueDialogComponent } from './admin-configurations/dialog/remoteCatalogue-dialog/remoteCatalogue-dialog.component';
import { DataletDialogComponent } from './datalets-management/dialog/datalet-dialog.component';
import { EditorDialogComponent } from './add-catalogue/dialog/editor-dialog/editor-dialog.component';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CataloguesListComponent, 
    AddCatalogueComponent, 
    RemoteCataloguesComponent, 
    DataletsManagementComponent, 
    ShowcaseDialogComponent, 
    AdminConfigurationsComponent, 
    PrefixDialogComponent, 
    RemoteCatalogueDialogComponent, 
    DataletDialogComponent, 
    EditorDialogComponent,
    TranslateModule,
    AdminRoutingModule,
    NbFormFieldModule,
    NbTagModule,
    NbIconModule,
    NbInputModule,
    NbSpinnerModule,
    NbListModule,
    NbCardModule,
    NbTooltipModule,
    NbToastrModule,
    NbAccordionModule,
    NbCheckboxModule,
    NbActionsModule,
    NbSelectModule,
    NbTreeGridModule,
    NbToggleModule,
    NbEvaIconsModule,
    NbButtonModule,
    FormsModule,
    NbUserModule,
    NgxEchartsModule.forRoot({ echarts }),
    NbTableModule,
  ]
})
export class AdminModule { }
