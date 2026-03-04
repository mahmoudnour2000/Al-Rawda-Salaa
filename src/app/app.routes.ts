import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthComponent } from './features/auth/auth.component';
import { AdminComponent } from './features/admin/admin.component';
import { MemberRequestsComponent } from './features/admin/member-requests.component';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';
import { MembersComponent } from './features/groups/groups.component';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'auth', component: AuthComponent, canActivate: [guestGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
    { path: 'admin/requests', component: MemberRequestsComponent, canActivate: [authGuard, adminGuard] },
    { path: 'groups', component: MembersComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: 'dashboard' }
];
