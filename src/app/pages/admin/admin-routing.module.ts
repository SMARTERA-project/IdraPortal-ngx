import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CataloguesListComponent } from './catalogues-list/catalogues-list.component';

import { AddCatalogueComponent } from './add-catalogue/add-catalogue.component';
import { RemoteCataloguesComponent } from './remote-catalogues/remote-catalogues.component';
import { DataletsManagementComponent } from './datalets-management/datalets-management.component';
import { AdminConfigurationsComponent } from './admin-configurations/admin-configurations.component';
import { AdminGuard } from '../auth/services/admin.guard';

const routes: Routes = [
{
    path: 'adminCatalogues',
    component: CataloguesListComponent,
    canActivate: [AdminGuard]
  },
{
    path: 'dataletsManagement',
    component: DataletsManagementComponent,
    canActivate: [AdminGuard]
  },
{
  path:'adminCatalogues/addCatalogue',
  component: AddCatalogueComponent,
  canActivate: [AdminGuard]
},
{
  path:'adminCatalogues/remoteCatalogues',
  component: RemoteCataloguesComponent,
  canActivate: [AdminGuard]
},
{
  path:'configuration',
  component: AdminConfigurationsComponent,
  canActivate: [AdminGuard]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }


