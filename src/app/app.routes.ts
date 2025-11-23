import { Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Tasks } from './components/tasks/tasks';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'tasks',
        component: Tasks,
      },
    ],
  },
];
