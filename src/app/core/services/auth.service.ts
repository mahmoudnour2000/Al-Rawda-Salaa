import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, map, Observable, of, switchMap } from 'rxjs';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase = inject(SupabaseService);
    private router = inject(Router);
    private _currentUser = new BehaviorSubject<User | null | undefined>(undefined);
    private _session = new BehaviorSubject<Session | null | undefined>(undefined);
    private _profileData = new BehaviorSubject<any | null | undefined>(undefined);

    get client() {
        return this.supabase.client;
    }

    get currentProfile$(): Observable<any | null | undefined> {
        return this._profileData.asObservable();
    }

    constructor() {
        this.supabase.client.auth.getSession().then(({ data: { session } }) => {
            this._session.next(session);
            const user = session?.user ?? null;
            this._currentUser.next(user);
            if (user) this.refreshProfile();
        });

        this.supabase.client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            console.log('Auth Event:', event);
            this._session.next(session);
            const user = session?.user ?? null;
            this._currentUser.next(user);

            if (user) {
                this.refreshProfile();
            } else {
                this._profileData.next(null);
                // Force redirect to auth on logout or session end
                if (event === 'SIGNED_OUT') {
                    this.router.navigate(['/auth']);
                }
            }
        });
    }

    async refreshProfile() {
        const profile = await this.getProfile();
        this._profileData.next(profile);
        return profile;
    }

    get currentUser$(): Observable<User | null | undefined> {
        return this._currentUser.asObservable();
    }

    get session$(): Observable<Session | null | undefined> {
        return this._session.asObservable();
    }

    async signIn(email: string, password?: string) {
        if (password) {
            return await this.supabase.client.auth.signInWithPassword({ email, password });
        }
        return await this.supabase.client.auth.signInWithOtp({ email });
    }

    async signUp(email: string, password: string, fullName: string) {
        return await this.supabase.client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
    }

    async signOut() {
        return await this.supabase.client.auth.signOut();
    }

    async getProfile() {
        try {
            const user = this._currentUser.value;
            if (!user) {
                console.log('AuthService: No user in session');
                return null;
            }

            console.log('AuthService: Fetching profile for ID:', user.id);
            const { data, error } = await this.supabase.client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('AuthService: Profile fetch error:', error);
                return null;
            }

            console.log('AuthService: Profile data received:', data);
            return data;
        } catch (err) {
            console.error('AuthService: Unexpected error in getProfile:', err);
            return null;
        }
    }
}
