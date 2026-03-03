import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap, of, filter } from 'rxjs';

/**
 * Prevents access to protected routes (Dashboard, Admin) if not logged in.
 */
export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.currentUser$.pipe(
        filter(user => user !== undefined),
        take(1),
        map(user => {
            if (user) return true;
            return router.createUrlTree(['/auth']);
        })
    );
};

/**
 * Prevents logged-in users from going back to the Login/Auth page.
 */
export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.currentUser$.pipe(
        filter(user => user !== undefined),
        take(1),
        map(user => {
            if (!user) return true;
            return router.createUrlTree(['/dashboard']);
        })
    );
};

/**
 * Restricts access to Admin-only features.
 */
export const adminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.currentProfile$.pipe(
        filter(profile => profile !== undefined),
        take(1),
        map(profile => {
            if (profile && profile.role === 'admin') return true;
            return router.createUrlTree(['/dashboard']);
        })
    );
};
