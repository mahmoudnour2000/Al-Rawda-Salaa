import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppNotification {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private _notifications = new BehaviorSubject<AppNotification[]>([]);
    private _idCounter = 0;

    get notifications$(): Observable<AppNotification[]> {
        return this._notifications.asObservable();
    }

    show(message: string, type: AppNotification['type'] = 'info', duration: number = 5000) {
        const id = ++this._idCounter;
        const notification: AppNotification = { id, message, type, duration };

        this._notifications.next([...this._notifications.value, notification]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    remove(id: number) {
        this._notifications.next(this._notifications.value.filter(n => n.id !== id));
    }

    // Smart logic for streaks etc.
    checkIntegrity(stats: any) {
        if (stats.current_streak > 0 && stats.current_streak % 7 === 0) {
            this.show(`✨ Amazing! You've maintained a ${stats.current_streak} day streak!`, 'success');
        }

        const lastDate = stats.last_contribution_date ? new Date(stats.last_contribution_date) : null;
        if (lastDate) {
            const today = new Date();
            if (today.getDate() !== lastDate.getDate()) {
                this.show("⚠️ Your Streak is breathing heavily... Save it now!", 'warning');
            }
        }
    }
}
