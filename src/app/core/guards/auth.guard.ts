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
        switchMap(user => {
            if (!user) return of(router.createUrlTree(['/auth']));

            return auth.currentProfile$.pipe(
                filter(profile => profile !== undefined),
                take(1),
                map(profile => {
                    if (profile && profile.status === 'approved') return true;
                    // For pending/rejected, go back to auth page which will show the message
                    return router.createUrlTree(['/auth']);
                })
            );
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
        switchMap(user => {
            if (!user) return of(true);

            // If user is logged in, only redirect to dashboard if they are APPROVED
            return auth.currentProfile$.pipe(
                filter(profile => profile !== undefined),
                take(1),
                map(profile => {
                    if (profile && profile.status === 'approved') {
                        return router.createUrlTree(['/dashboard']);
                    }
                    return true; // Allow them to stay on /auth to see the pending message
                })
            );
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
