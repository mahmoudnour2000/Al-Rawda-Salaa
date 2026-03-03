import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Program {
    id: string;
    title: string;
    description: string;
    target_count: number;
    current_count: number;
    start_date: string;
    end_date: string;
    status: 'active' | 'completed' | 'archived';
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProgramService {
    private supabase = inject(SupabaseService);
    private _programs = new BehaviorSubject<Program[]>([]);

    get programs$(): Observable<Program[]> {
        return this._programs.asObservable();
    }

    constructor() {
        this.setupRealtimeSubscription();
    }

    private setupRealtimeSubscription() {
        this.supabase.client
            .channel('public:programs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, () => {
                this.fetchActivePrograms();
            })
            .subscribe();
    }

    async fetchActivePrograms() {
        const { data, error } = await this.supabase.client
            .from('programs')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching active programs:', error);
            throw error;
        }
        this._programs.next(data ?? []);
        return data;
    }

    async fetchAllPrograms() {
        const { data, error } = await this.supabase.client
            .from('programs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all programs:', error);
            throw error;
        }
        return data;
    }

    async updateProgramStatus(id: string, status: 'active' | 'completed' | 'archived') {
        const { error } = await this.supabase.client
            .from('programs')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        await this.fetchActivePrograms();
    }

    async createProgram(program: Partial<Program>) {
        const { data, error } = await this.supabase.client
            .from('programs')
            .insert(program)
            .select()
            .single();

        if (error) {
            console.error('Error creating program:', error);
            throw error;
        }
        await this.fetchActivePrograms();
        return data;
    }
}
