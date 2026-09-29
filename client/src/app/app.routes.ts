import { Routes } from '@angular/router';
import { RouterComponent } from './components/local/router/router.component';
import { routeResolver } from './resolvers/route.resolver';

export const routes: Routes = [
  {
    path: '**',
    resolve: {
      page: routeResolver,
    },
    component: RouterComponent,
    runGuardsAndResolvers: 'always',
  },
];
