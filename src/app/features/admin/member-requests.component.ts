import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from, Observable, BehaviorSubject, switchMap, map, shareReplay } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-member-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="requests-container container" style="direction: rtl; padding-top: 2rem; padding-bottom: 2rem;">
      <div class="header-section" style="text-align: center; margin-bottom: 3rem;">
        <h2 class="gold-text" style="font-size: 2.2rem; margin: 0;">طلبات الانضمام الجديدة</h2>
        <p class="subtitle" style="color: rgba(255,255,255,0.5); font-size: 1.1rem; margin-top: 0.5rem;">مراجعة وقبول المحبين الجدد في الروضة</p>
      </div>

      <div class="luxury-table-container glass table-responsive">
        <table class="luxury-table">
          <thead>
            <tr>
              <th>صاحب الطلب</th>
              <th>البريد الإلكتروني</th>
              <th>تاريخ الانضمام</th>
              <th>إجراءات التحكم</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let member of requests$ | async" class="table-row">
              <td class="name-cell">
                <div style="font-weight: 700; color: var(--text-white);">{{ member.full_name || 'محب مجهول' }}</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); font-family: monospace;">ID: {{ member.id.substring(0,8) }}...</div>
              </td>
              <td>{{ member.email || 'غير متوفر' }}</td>
              <td>{{ (member.created_at | date:'mediumDate':'':'ar') || 'غير متوفر' }}</td>
              <td class="actions-cell">
                <div class="btn-group">
                  <button (click)="updateStatus(member.id, 'approved')" 
                          class="btn-icon approve-btn" 
                          title="تم القبول">
                    ✔️
                  </button>
                  <button (click)="updateStatus(member.id, 'rejected')" 
                          class="btn-icon reject-btn" 
                          title="رفض الطلب">
                    ✖️
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="(requests$ | async)?.length === 0">
              <td colspan="4" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.3);">لا توجد طلبات انضمام جديدة حالياً</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .luxury-table-container {
      border-radius: 1.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .luxury-table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
    }
    .luxury-table th {
      background: rgba(10, 43, 37, 0.6);
      padding: 1.5rem 1.2rem;
      color: var(--primary-gold);
      font-weight: 700;
      font-size: 1rem;
      border-bottom: 2px solid rgba(212,175,55,0.1);
    }
    .table-row {
      transition: all 0.3s;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .table-row:hover {
      background: rgba(212,175,55,0.05);
    }
    .table-row td {
      padding: 1.2rem;
      vertical-align: middle;
      color: rgba(255,255,255,0.8);
    }
    .actions-cell {
      text-align: center;
    }
    .btn-group {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    .btn-icon {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.6rem;
      border-radius: 0.8rem;
      transition: all 0.2s;
    }
    .approve-btn:hover {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      color: #10b981;
      transform: scale(1.1);
    }
    .reject-btn:hover {
      background: rgba(255, 95, 95, 0.2);
      border-color: #ff5f5f;
      color: #ff5f5f;
      transform: scale(1.1);
    }
  `]
})
export class MemberRequestsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  private refresh$ = new BehaviorSubject<void>(undefined);
  requests$: Observable<any[]> = this.refresh$.pipe(
    switchMap(() => from(this.supabase.client
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }))),
    map((res: any) => res.data || []),
    shareReplay(1)
  );

  ngOnInit() { }

  async updateStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      alert(`تم ${status === 'approved' ? 'قبول' : 'رفض'} العضو بنجاح`);
      this.refresh$.next();
    } catch (err: any) {
      alert('خطأ في تحديث الحالة: ' + err.message);
    }
  }
}
