import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { from, Observable, of, map, BehaviorSubject, switchMap } from 'rxjs';
import { ProgramService, Program } from '../../core/services/program.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container container" style="direction: rtl; padding-top: 2rem; padding-bottom: 2rem;">
      <h2 class="gold-text" style="font-size: 2.2rem; margin-bottom: 2rem; text-align: center;">مركز إدارة الروضة ✨</h2>
      
      <div class="luxury-grid">
        
        <!-- Add New User Card -->
        <div class="glass luxury-card">
          <div class="card-header">
            <h3 class="gold-text">إضافة خادم جديد</h3>
            <p class="subtitle">قم بإنشاء حساب يدوي لأحد المريدين</p>
          </div>
          <div class="form-body">
             <input [(ngModel)]="newUser.email" placeholder="البريد الإلكتروني" class="luxury-input">
             <input [(ngModel)]="newUser.password" type="password" placeholder="كلمة السر" class="luxury-input">
             <input [(ngModel)]="newUser.fullName" placeholder="الاسم الكامل" class="luxury-input">
             
             <button (click)="createUser()" class="btn-primary" [disabled]="!newUser.email || !newUser.password || loading" style="width: 100%;">
               {{ loading ? 'جاري الإنشاء...' : 'إنشاء الحساب' }}
             </button>
          </div>
        </div>

        <!-- Create Program Card -->
        <div class="glass luxury-card">
          <div class="card-header">
            <h3 class="gold-text">إطلاق برنامج جديد</h3>
            <p class="subtitle">حدد هدف صلوات جديد للجميع</p>
          </div>
          <div class="form-body">
            <input [(ngModel)]="newProgram.title" placeholder="عنوان البرنامج" class="luxury-input">
            <input type="number" [(ngModel)]="newProgram.target_count" placeholder="الهدف (مثلاً: 1,000,000)" class="luxury-input">
            <button (click)="createProgram()" class="btn-primary" [disabled]="!newProgram.title || !newProgram.target_count" style="width: 100%;">
              بدء البرنامج
            </button>
          </div>
        </div>

        <!-- Pending Reviews Card -->
        <div class="glass luxury-card">
          <div class="card-header">
            <h3 class="gold-text" style="color: #ff5f5f;">مراجعة التلاعب</h3>
            <p class="subtitle">طلبات بانتظار الموافقة اليدوية</p>
          </div>
          <div class="list-body">
            <div *ngIf="pendingContributions$ | async as pending" class="luxury-list">
              <div *ngFor="let item of pending" class="list-item pending">
                <div class="user">{{ item.profiles.full_name || 'خادم' }}</div>
                <div class="amount">{{ item.amount }}</div>
                <div class="actions">
                  <button (click)="updateStatus(item.id, 'approved')" class="btn-action approve">✔️</button>
                  <button (click)="updateStatus(item.id, 'rejected')" class="btn-action reject">✖️</button>
                </div>
              </div>
              <p *ngIf="pending.length === 0" class="empty-text">لا توجد طلبات مشبوهة</p>
            </div>
          </div>
        </div>

        <!-- Programs Management Card -->
        <div class="glass luxury-card full-width-card">
          <div class="card-header">
            <h3 class="gold-text">إدارة البرامج الحالية</h3>
            <p class="subtitle">اضغط على البرنامج لرؤية المشاركين</p>
          </div>
          <div class="list-body">
            <div class="luxury-list">
              <div *ngFor="let p of allPrograms" 
                   (click)="fetchParticipants(p)"
                   class="list-item clickable" 
                   [class.selected-program]="selectedProgramDetails?.id === p.id"
                   [style.border-right]="p.status === 'active' ? '4px solid var(--primary-gold)' : p.status === 'completed' ? '4px solid #10b981' : '4px solid rgba(255,255,255,0.1)'">
                <div class="group-info">
                  <div class="name">{{ p.title }}</div>
                  <div class="amount" style="font-size: 0.75rem;">
                    {{ p.current_count | number }} / {{ p.target_count | number }}
                  </div>
                  <div class="status-badge" [class.active-bg]="p.status === 'active'" [class.completed-bg]="p.status === 'completed'">
                    {{ p.status === 'active' ? 'نشط' : p.status === 'completed' ? 'مكتمل' : 'مؤرشف' }}
                  </div>
                </div>
                <div class="actions" (click)="$event.stopPropagation()">
                  <button *ngIf="p.status !== 'active'" (click)="updateProgramStatus(p.id, 'active')" class="btn-action approve" title="فتح">🔓</button>
                  <button *ngIf="p.status === 'active'" (click)="updateProgramStatus(p.id, 'completed')" class="btn-action reject" title="إغلاق">🔒</button>
                  <button *ngIf="p.status !== 'archived'" (click)="updateProgramStatus(p.id, 'archived')" class="btn-action reject" style="color: grey;" title="أرشفة">📂</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Participants Detail Modal -->
        <div class="modal-overlay" *ngIf="selectedProgramDetails" (click)="selectedProgramDetails = null">
          <div class="glass luxury-card modal-content" (click)="$event.stopPropagation()">
            <div class="card-header" style="flex-direction: row; justify-content: space-between; align-items: flex-start;">
              <div>
                <h3 class="gold-text">المشاركون في "{{ selectedProgramDetails.title }}"</h3>
                <p class="subtitle">إجمالي المشاركين: {{ participants.length }}</p>
              </div>
              <button (click)="selectedProgramDetails = null" class="btn-action reject" style="font-size: 1.5rem; padding: 0.2rem 0.8rem;">×</button>
            </div>
            
            <div class="list-body">
              <div *ngIf="loadingParticipants" class="empty-text">جاري تحميل بيانات المريدين...</div>
              
              <div class="table-responsive" style="max-height: 60vh; overflow-y: auto;">
                <table class="participants-table" *ngIf="!loadingParticipants && participants.length > 0">
                <thead>
                  <tr>
                    <th>المريد</th>
                    <th>إجمالي الصلوات</th>
                    <th>مرات المشاركة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of participants">
                    <td class="gold-text">{{ user.name }}</td>
                    <td>{{ user.total_amount | number }}</td>
                    <td>{{ user.count }} مرّة</td>
                  </tr>
                </tbody>
                </table>
              </div>
              
              <p *ngIf="!loadingParticipants && participants.length === 0" class="empty-text">لا يوجد مشاركون في هذا البرنامج بعد.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .luxury-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }
    @media (max-width: 768px) {
      .luxury-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      .luxury-card {
        padding: 1.2rem;
      }
    }
    .luxury-card {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .card-header h3 { margin: 0; font-size: 1.5rem; }
    .subtitle { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin: 0.3rem 0 0; }
    
    .form-body { display: flex; flex-direction: column; gap: 1rem; }
    
    .luxury-input {
      width: 100%;
      padding: 0.9rem;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(212,175,55,0.2);
      border-radius: 0.8rem;
      color: white;
      box-sizing: border-box;
    }
    .luxury-input:focus { outline: none; border-color: var(--primary-gold); }

    .luxury-list { display: flex; flex-direction: column; gap: 1rem; }
    .list-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.03);
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .group-info .name { font-weight: bold; font-size: 1.1rem; }
    .group-info .amount { font-size: 0.85rem; color: var(--primary-gold); }
    
    .list-item.pending { justify-content: space-between; }
    .actions { display: flex; gap: 0.5rem; }
    .btn-action {
      background: rgba(255,255,255,0.1);
      border: none;
      padding: 0.4rem;
      border-radius: 0.4rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action:hover { transform: scale(1.1); }
    .approve:hover { background: rgba(16, 185, 129, 0.2); }
    .reject:hover { background: rgba(255, 95, 95, 0.2); }
    
    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 0.4rem;
      font-size: 0.7rem;
      margin-top: 0.3rem;
      background: rgba(255,255,255,0.05);
    }
    .active-bg { background: rgba(212,175,55,0.2); color: var(--primary-gold); }
    .completed-bg { background: rgba(16, 185, 129, 0.2); color: #10b981; }

    .empty-text { text-align: center; color: rgba(255,255,255,0.3); font-style: italic; }

    .clickable { cursor: pointer; transition: background 0.2s; }
    .clickable:hover { background: rgba(212,175,55,0.05); }
    .selected-program { background: rgba(212,175,55,0.1) !important; border-color: var(--primary-gold) !important; }

    .participants-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    .participants-table th {
      text-align: right;
      padding: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
    }
    .participants-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    .full-width-card {
      grid-column: 1 / -1;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-content {
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
      animation: modalFadeIn 0.3s ease-out;
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminComponent implements OnInit {
  private programService = inject(ProgramService);
  private supabase = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);

  newProgram: Partial<Program> = {
    title: '',
    target_count: 0,
    status: 'active'
  };

  newUser = {
    email: '',
    password: '',
    fullName: ''
  };
  loading = false;

  private refresh$ = new BehaviorSubject<void>(undefined);

  pendingContributions$: Observable<any[]> = this.refresh$.pipe(
    switchMap(() => from(this.supabase.client
      .from('contributions')
      .select('*, profiles(id, full_name)')
      .eq('status', 'pending'))),
    map((res: any) => res.data || [])
  );

  allPrograms: any[] = [];
  programs$ = this.programService.programs$;

  selectedProgramDetails: any = null;
  participants: any[] = [];
  loadingParticipants = false;

  ngOnInit() {
    this.programService.fetchActivePrograms();
    this.refreshAdminData();
  }

  async refreshAdminData() {
    console.log('Admin: Refreshing data...');
    this.refresh$.next();

    const programs = await this.programService.fetchAllPrograms();
    this.allPrograms = programs || [];
    this.cdr.detectChanges();
  }

  async fetchParticipants(program: any) {
    this.selectedProgramDetails = program;
    this.loadingParticipants = true;
    this.participants = [];
    this.cdr.detectChanges();

    try {
      const { data, error } = await this.supabase.client
        .from('contributions')
        .select('amount, profiles(full_name)')
        .eq('program_id', program.id)
        .eq('status', 'approved');

      if (error) throw error;

      // Group by user
      const grouped = (data || []).reduce((acc: any, curr: any) => {
        const name = curr.profiles?.full_name || 'خادم مجهول';
        if (!acc[name]) {
          acc[name] = { name, total_amount: 0, count: 0 };
        }
        acc[name].total_amount += curr.amount;
        acc[name].count += 1;
        return acc;
      }, {});

      this.participants = Object.values(grouped).sort((a: any, b: any) => b.total_amount - a.total_amount);
    } catch (err: any) {
      alert('خطأ في جلب المشاركين: ' + err.message);
    } finally {
      this.loadingParticipants = false;
      this.cdr.detectChanges();
    }
  }

  async updateProgramStatus(id: string, status: any) {
    try {
      await this.programService.updateProgramStatus(id, status);
      await this.refreshAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async createUser() {
    if (!this.newUser.email || !this.newUser.password) return;
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const { data, error } = await this.supabase.client.rpc('create_new_user', {
        new_email: this.newUser.email,
        new_password: this.newUser.password,
        new_full_name: this.newUser.fullName
      });

      if (error) throw error;

      alert('تم إنشاء حساب الخادم بنجاح!');
      this.newUser = { email: '', password: '', fullName: '' };
    } catch (err: any) {
      alert('خطأ في الإنشاء: ' + err.message);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async createProgram() {
    if (!this.newProgram.title || !this.newProgram.target_count) return;
    try {
      await this.programService.createProgram(this.newProgram);
      this.newProgram = { title: '', target_count: 0, status: 'active' };
      alert('تم إطلاق البرنامج بنجاح!');
      await this.refreshAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async updateStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await this.supabase.client
        .from('contributions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await this.refreshAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  }
}
