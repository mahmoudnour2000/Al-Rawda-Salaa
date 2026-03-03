import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from, Observable, of, map, BehaviorSubject, switchMap, tap } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="members-container container" style="direction: rtl; padding-top: 2rem; padding-bottom: 2rem;">
      <div class="header-section" style="text-align: center; margin-bottom: 3rem;">
        <h2 class="gold-text" style="font-size: 2.2rem; margin: 0;">إدارة خدّام الروضة</h2>
        <p class="subtitle" style="color: rgba(255,255,255,0.5); font-size: 1.1rem; margin-top: 0.5rem;">التحكم في صلاحيات وأدوار أعضاء النظام</p>
      </div>

      <div class="luxury-table-container glass table-responsive">
        <table class="luxury-table">
          <thead>
            <tr>
              <th>المحب</th>
              <th>مرات المشاركة</th>
              <th>إجمالي المساهمات</th>
              <th>الرتبة الحالية</th>
              <th>إجراءات التحكم</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of members$ | async" class="table-row">
              <td class="name-cell">
                <div style="font-weight: 700; color: var(--text-white);">{{ user.full_name || 'محب مجهول' }}</div>
                <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); font-family: monospace;">{{ user.id }}</div>
              </td>
              <td style="text-align: center;">{{ user.total_contributions || 0 }}</td>
              <td class="amount-cell gold-text">{{ user.total_amount || 0 | number }}</td>
              <td>
                <span class="role-badge" [class.admin-badge]="user.role === 'admin'">
                  {{ user.role === 'admin' ? 'إداري (Admin)' : 'محب (User)' }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="btn-group">
                  <button (click)="toggleRole(user)" 
                          class="btn-icon" 
                          [title]="user.role === 'admin' ? 'تخفيض لمستخدم' : 'ترقية لآدمن'"
                          [style.color]="user.role === 'admin' ? '#ff5f5f' : '#10b981'">
                    {{ user.role === 'admin' ? '🛡️' : '👑' }}
                  </button>
                  <button (click)="confirmDelete(user)" 
                          class="btn-icon" 
                          title="حذف نهائي" 
                          style="color: #ff5f5f;">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="(members$ | async)?.length === 0">
              <td colspan="5" style="text-align: center; padding: 3rem; color: rgba(255,255,255,0.3);">لا توجد بيانات متاحة حالياً</td>
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
    @media (max-width: 768px) {
      .members-container {
        padding-top: 1.5rem !important;
      }
      .luxury-table th, .luxury-table td {
        padding: 1rem 0.8rem;
        font-size: 0.9rem;
      }
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
    }
    .role-badge {
      padding: 0.4rem 0.8rem;
      border-radius: 2rem;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.6);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .admin-badge {
      background: rgba(212, 175, 55, 0.15);
      color: var(--primary-gold);
      border-color: var(--primary-gold);
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
    }
    .amount-cell {
      font-weight: 800;
      font-size: 1.1rem;
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
      background: none;
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.8rem;
      transition: all 0.2s;
    }
    .btn-icon:hover {
      transform: scale(1.15);
      background: rgba(255,255,255,0.05);
      border-color: currentColor;
    }
  `]
})
export class MembersComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private refresh$ = new BehaviorSubject<void>(undefined);
  members$: Observable<any[]> = this.refresh$.pipe(
    switchMap(() => from(this.supabase.client
      .from('member_management')
      .select('*')
      .order('created_at', { ascending: false }))),
    map((res: any) => {
      if (res.error) {
        console.error('Error loading members:', res.error);
        return [];
      }
      return res.data || [];
    }),
    tap(() => this.cdr.detectChanges())
  );

  ngOnInit() { }

  async toggleRole(user: any) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = user.role === 'admin' ?
      `هل أنت متأكد من سحب صلاحيات الإدارة من ${user.full_name || 'هذا المحب'}؟` :
      `هل أنت متأكد من ترقية ${user.full_name || 'هذا المحب'} ليكون إدارياً؟`;

    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;
      await this.auth.refreshProfile(); // Vital for navbar/access updates
      this.refresh$.next();
      this.cdr.detectChanges();
    } catch (err: any) {
      alert('خطأ في تحديث الصلاحية: ' + err.message);
    }
  }

  async confirmDelete(user: any) {
    const confirmMsg = `⚠️ تحذير نهائي: هل أنت متأكد تماماً من حذف المحب "${user.full_name || 'مجهول'}"؟
سيتم حذف حسابه نهائياً من النظام ولن يتمكن من الدخول مرة أخرى.`;

    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await this.supabase.client
        .rpc('delete_user', { target_user_id: user.id });

      if (error) throw error;

      this.refresh$.next();
      this.cdr.detectChanges();
      alert('تم حذف المحب نهائياً من النظام.');
    } catch (err: any) {
      alert('خطأ في عملية الحذف: ' + err.message);
    }
  }
}
