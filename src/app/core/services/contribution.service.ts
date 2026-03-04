import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Contribution {
    id: string;
    user_id: string;
    program_id: string;
    group_id: string;
    amount: number;
    contribution_date: string;
    status: 'approved' | 'pending' | 'rejected';
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContributionService {
    private supabase = inject(SupabaseService);
    private _contributions = new BehaviorSubject<Contribution[]>([]);

    get contributions$(): Observable<Contribution[]> {
        return this._contributions.asObservable();
    }

    get contributionsValue(): Contribution[] {
        return this._contributions.value;
    }

    constructor() {
        this.setupRealtimeSubscription();
    }

    private setupRealtimeSubscription() {
        this.supabase.client
            .channel('public:contributions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, () => {
                this.fetchUserContributions();
            })
            .subscribe();
    }

    async addContribution(amount: number, programId: string, groupId?: string) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const contribution = {
            user_id: user.id,
            program_id: programId,
            group_id: groupId || null,
            amount,
            contribution_date: new Date().toISOString().split('T')[0]
        };

        const { data, error } = await this.supabase.client
            .from('contributions')
            .insert(contribution)
            .select()
            .single();

        if (error) {
            console.error('Error adding contribution:', error);
            throw error;
        }
        await this.fetchUserContributions();
        return data;
    }

    async fetchUserContributions() {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await this.supabase.client
            .from('contributions')
            .select('*, programs(title)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user contributions:', error);
            throw error;
        }
        this._contributions.next(data || []);
    }

    async getUserContributions(userId: string) {
        const { data, error } = await this.supabase.client
            .from('contributions')
            .select('*, programs(title)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error getting user contributions:', error);
            throw error;
        }
        return data;
    }
}

