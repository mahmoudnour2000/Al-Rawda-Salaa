import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    tier: 'bronze' | 'silver' | 'gold' | 'legendary';
}

@Injectable({
    providedIn: 'root'
})
export class BadgeService {
    private supabase = inject(SupabaseService);

    async getUserBadges(userId: string) {
        const { data, error } = await this.supabase.client
            .from('user_badges')
            .select('*, badges(*)')
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    }

    async getAllBadges() {
        const { data, error } = await this.supabase.client
            .from('badges')
            .select('*')
            .order('tier', { ascending: true });

        if (error) throw error;
        return data;
    }
}
