import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { from, map, of, switchMap, shareReplay, BehaviorSubject, startWith } from 'rxjs';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

registerLocaleData(localeAr);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Debug Info - Only remove after fixing -->
    <div style="display:none">User: {{ (user$ | async) | json }}, Profile: {{ (profile$ | async) | json }}</div>

    <!-- Top Navbar -->
    <ng-container *ngIf="user$ | async as user">
      <nav *ngIf="(profile$ | async)?.status === 'approved'" class="glass main-nav">
        
        <div class="nav-branding">
          <h1 class="gold-text brand-title" routerLink="/">
            الروضة الزينبية
          </h1>
          
          <div class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">لوحة التحكم</a>
            <ng-container *ngIf="(profile$ | async)?.role === 'admin'">
              <a routerLink="/groups" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">الأعضاء</a>
              <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">الإدارة</a>
              <a routerLink="/admin/requests" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" style="position: relative;">
                <ng-container *ngIf="pendingRequestsCount$ | async as count">
                  <span *ngIf="count > 0" class="badge-notify">
                    {{ count }}
                  </span>
                </ng-container>
                الأعضاء الجدد
              </a>
            </ng-container>
          </div>
        </div>

        <div class="nav-user-info">
          <!-- Profile Info with robust fallback -->
          <div class="user-details">
            <ng-container *ngIf="profile$ | async as profile; else guestInfo">
              <div class="user-name">{{ profile.full_name || user.email?.split('@')?.[0] }}</div>
              <div class="user-role">{{ profile.role === 'admin' ? 'محب إداري' : 'محب نشط' }}</div>
            </ng-container>
            <ng-template #guestInfo>
              <div class="user-name">{{ user.email?.split('@')?.[0] }}</div>
              <div class="user-role" style="color: rgba(255,255,255,0.3);">جاري التحميل...</div>
            </ng-template>
          </div>
          
          <button (click)="logout()" class="btn-secondary logout-btn">
            خروج
          </button>
        </div>
      </nav>
    </ng-container>

    <!-- Notification Toasts -->
    <div style="position: fixed; top: 1.5rem; left: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 1rem;">
      <div *ngFor="let n of (notifications$ | async)" 
           [class]="'glass notification ' + n.type" 
           style="padding: 1.2rem 2rem; min-width: 300px; display: flex; justify-content: space-between; align-items: center; border-right: 4px solid var(--primary-gold); animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);">
        <span style="font-weight: 500;">{{ n.message }}</span>
        <button (click)="removeNotification(n.id)" style="background:none; border:none; color:var(--primary-gold); cursor:pointer; font-size: 1.5rem;">&times;</button>
      </div>
    </div>

    <main [style.padding-top]="(user$ | async) ? '0' : '2rem'">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-nav {
        margin: 1.5rem;
        padding: 1.2rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 2rem;
    }
    .nav-branding {
        display: flex;
        align-items: center;
        gap: 3rem;
    }
    .brand-title {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 800;
        cursor: pointer;
        filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.3));
    }
    .nav-links {
        display: flex;
        gap: 2rem;
    }
    .nav-user-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }
    .user-details {
        text-align: left;
        line-height: 1;
    }
    .user-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-white);
    }
    .user-role {
        font-size: 0.75rem;
        color: var(--primary-gold);
        margin-top: 2px;
    }
    .logout-btn {
        padding: 0.5rem 1.2rem;
        font-size: 0.9rem;
        border-color: rgba(255,255,255,0.2);
        color: #ff5f5f;
    }

    @media (max-width: 900px) {
        .main-nav {
            margin: 1rem;
            padding: 1rem;
            flex-direction: column;
            gap: 1.5rem;
            border-radius: 1.5rem;
        }
        .nav-branding {
            flex-direction: column;
            gap: 1rem;
        }
        .nav-links {
            gap: 1.2rem;
        }
        .nav-user-info {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 1rem;
        }
    }

    .nav-link {
        color: rgba(255,255,255,0.7);
        text-decoration: none;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        position: relative;
    }
    .nav-link:hover, .nav-link.active {
        color: var(--primary-gold);
        text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
    }
    .nav-link.active::after {
        content: '';
        position: absolute;
        bottom: -6px;
        right: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(to left, var(--primary-gold), var(--secondary-gold));
        box-shadow: 0 0 15px var(--primary-gold);
        border-radius: 4px;
        animation: glowPulse 2s ease-in-out infinite;
    }
    
    .badge-notify {
        position: absolute;
        top: -8px;
        left: -35px; /* Increased spacing further from text */
        background: linear-gradient(135deg, #d4af37, #f1c40f);
        color: #0a2b25;
        font-size: 0.65rem; /* Smaller font */
        padding: 4px;
        font-weight: 900;
        box-shadow: 0 0 12px rgba(212, 175, 55, 0.5);
        border: 1px solid rgba(255,255,255,0.4);
        min-width: 18px; /* Smaller size */
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        /* Islamic Scalloped Circle (Shamsa variant) */
        clip-path: polygon(
            50% 0%, 60% 5%, 70% 2%, 78% 10%, 88% 12%, 92% 22%, 100% 30%, 98% 40%, 100% 50%, 98% 60%, 100% 70%, 92% 78%, 88% 88%, 78% 90%, 70% 98%, 60% 95%, 50% 100%, 40% 95%, 30% 98%, 22% 90%, 12% 88%, 8% 78%, 0% 70%, 2% 60%, 0% 50%, 2% 40%, 0% 30%, 8% 22%, 12% 12%, 22% 10%, 30% 2%, 40% 5%
        );
        z-index: 10;
        animation: starGlow 2.5s ease-in-out infinite;
    }

    @keyframes starGlow {
      0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(212, 175, 55, 0.4); }
      50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(212, 175, 55, 0.8); }
    }
    
    @keyframes glowPulse {
      0%, 100% { opacity: 0.8; box-shadow: 0 0 5px var(--primary-gold); }
      50% { opacity: 1; box-shadow: 0 0 15px var(--primary-gold); }
    }
    
    @keyframes slideIn {
      from { transform: translateX(-120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class AppComponent {
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  user$ = this.auth.currentUser$;
  profile$ = this.auth.currentProfile$;
  notifications$ = this.notify.notifications$;

  private refreshRequests$ = new BehaviorSubject<void>(undefined);

  pendingRequestsCount$ = this.refreshRequests$.pipe(
    switchMap(() => this.auth.currentProfile$),
    switchMap(profile => {
      if (profile?.role !== 'admin') return of(0);
      return from(this.auth.client
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')).pipe(
          map(res => res.count || 0)
        );
    }),
    shareReplay(1)
  );

  constructor() {
    // Setup real-time listener for profile changes (new signups or status updates)
    this.auth.client
      .channel('profile-count-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => this.refreshRequests$.next())
      .subscribe();
  }

  logout() { this.auth.signOut(); }
  removeNotification(id: number) { this.notify.remove(id); }
}
