import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { NbAuthComponent, NbLoginComponent, NbLogoutComponent } from '../@theme/components/auth/public_api';

const routes: Routes = [{
  path: '',

  component: PagesComponent,
  children: [
    {
      path: 'home',
      loadComponent: () => import('./home/home.component')
        .then(m => m.HomeComponent),
    },
    {
      path: 'sparql',
      loadComponent: () => import('./sparql/sparql.component')
      .then(m => m.SparqlComponent),
    },
    {
      path: 'catalogues',
      loadComponent: () => import('./catalogues/catalogues.component')
      .then(m => m.CataloguesComponent),
    },
    {
      path: 'datasets',
      loadChildren: () => import('./data-catalogue/data-catalogue.module')
        .then(m => m.DataCatalogueModule),
    },
     {
      path: 'administration',
      loadChildren: () => import('./admin/admin-module.module')
        .then(m => m.AdminModule),
    },
    {
      path: 'mqa',
      loadComponent: () => import('./mqa/mqa.component')
      .then(m => m.MqaComponent),
    },
    {
      path: 'statistics',
      loadComponent: () => import('./statistics/statistics.component')
      .then(m => m.StatisticsComponent),
    },
        {
          path: 'auth',
          component: NbAuthComponent,
          children: [
            {
              path: 'login',
              component: NbLoginComponent,
            },
            {
              path: 'logout',
              component: NbLogoutComponent,
            }
          ]},
    { 
      path: '',
      redirectTo: 'home',
      pathMatch: 'full',
    },
    {
      path: '**',
      component: NotFoundComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
