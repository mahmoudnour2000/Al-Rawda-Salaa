import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeatmapComponent } from '../../shared/components/heatmap.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { Observable, BehaviorSubject, combineLatest, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { ContributionService } from '../../core/services/contribution.service';
import { ProgramService } from '../../core/services/program.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FormsModule, HeatmapComponent, BadgeComponent],
  template: `
  <div class="dashboard-container container" style="direction: rtl; padding-top: 1rem; padding-bottom: 2rem;">
    <!-- Top Profile Section -->
    <div class="profile-header islamic-arch">
      <div class="profile-grid">
        <!-- Left: Larger 3D Spiritual Image -->
        <div class="image-column">
          <div class="spiritual-frame-container">
            <div class="islamic-gold-frame 3d-effect">
              <img src="/assets/images/spiritual_leader.jpg" alt="Spiritual Leader" class="spiritual-img">
            </div>
          </div>
        </div>

        <!-- Right: Welcoming Content -->
        <div class="content-column">
          <div class="welcome-text">
            <ng-container *ngIf="profile$ | async as profile; else guestWelcome">
              <h2 class="title-with-glow">مرحباً <span class="gold-gradient-text">سيدي {{ profile.full_name || (user$ | async)?.email?.split('@')?.[0] }}</span></h2>
            </ng-container>
            <ng-template #guestWelcome>
              <h2 class="title-with-glow">مرحباً <span class="gold-gradient-text">سيدي {{ (user$ | async)?.email?.split('@')?.[0] || 'طه' }}</span></h2>
            </ng-template>
            <div class="spiritual-motto">
              <span class="motto-icon">✨</span>
              <p>تقبّل الله منك صالح الأعمال وبارك في همتك</p>
              <span class="motto-icon">✨</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Program Navigator -->
    <div class="program-selector-container">
      <label class="selector-label gold-text">اختر البرنامج الروحاني</label>
      <div class="luxury-select-wrapper">
        <select 
          class="luxury-select"
          [ngModel]="selectedProgram$ | async"
          (ngModelChange)="onProgramChange($event)">
          <option *ngFor="let p of (programs$ | async)" [ngValue]="p">
            {{ p.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Main Counter Section -->
    <div class="main-counter-section" *ngIf="selectedProgram$ | async as selectedProgram">
      <div class="main-circle">
        <!-- Ornamental Inner Ring -->
        <div class="inner-ornament"></div>
        <div class="current-count gold-text">{{ selectedProgram.current_count | number }}</div>
        <div class="count-label">إجمالي ما تم جمعه في "{{ selectedProgram.title }}"</div>
        <div class="target-indicator"> / {{ selectedProgram.target_count | number }}</div>
      </div>

      <!-- Bento Stats Grid -->
      <div class="stats-grid" style="margin-top: 3rem;">
        <!-- Program Achievement Card -->
        <div class="glass stat-card islamic-arch" style="border-top: 4px solid var(--accent-emerald);">
          <div class="progress-info">
            <span>المتبقي للاكتمال: </span>
            <span class="gold-gradient-text">{{ (selectedProgram.target_count - selectedProgram.current_count) | number }} صلاة</span>
          </div>
          <div class="progress-bar-container" style="height: 12px; background: rgba(0,0,0,0.3); margin-top: 1rem;">
            <div class="progress-bar-fill" [style.width]="(selectedProgram.current_count / selectedProgram.target_count * 100) + '%'"></div>
          </div>
          <div class="card-label" style="margin-top: 0.5rem;">نسبة إنجاز الروضة: {{ (selectedProgram.current_count / selectedProgram.target_count * 100) | number: '1.0-1' }}%</div>
        </div>

        <!-- User Total Card -->
        <div class="glass stat-card islamic-arch" style="border-top: 4px solid var(--primary-gold);">
          <div class="card-label">صلواتك في "{{ selectedProgram.title }}"</div>
          <div class="card-value gold-text">{{ (userProgramTotal$ | async) | number }}</div>
        </div>
      </div>

      <div class="action-container">
        <button (click)="openForm()" class="btn-primary luxury-btn">
          إضافة ورد جديد لبرنامج {{ selectedProgram.title }}
        </button>
      </div>
    </div>

    <!-- Quick Form Modal -->
    <div *ngIf="showForm" class="modal-overlay" (click)="closeForm()">
      <div class="glass modal-card islamic-arch-top" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="closeForm()">&times;</button>
        
        <div class="modal-header">
          <h3 class="gold-text">إضافة ورد جديد لبرنامج</h3>
          <p class="subtitle">{{ (selectedProgram$ | async)?.title }}</p>
        </div>

        <div class="modal-body">
          <div class="input-wrapper">
            <label class="input-label gold-text">عدد الصلوات الكلي</label>
            <input type="number" [(ngModel)]="amount" placeholder="0" class="counter-input">
          </div>

          <button (click)="submit()" class="btn-primary submit-btn">
            تأكيد الإضافة المباركة
          </button>
          
          <button (click)="closeForm()" class="cancel-link">إلغاء الأمر</button>
        </div>
      </div>
    </div>

    <!-- Lower Content -->
    <div class="bottom-grid" style="margin-top: 2rem;">
      <div class="glass bottom-card heatmap-card">
        <h4 class="gold-text card-title">خريطة التفاعل (النشاط الروحي)</h4>
        <app-heatmap [data]="(contributions$ | async) || []"></app-heatmap>
      </div>

      <div class="glass bottom-card badges-card">
        <h4 class="gold-text card-title">الأوسمة الروحية</h4>
        <div class="badge-grid">
          <app-badge *ngFor="let ub of earnedBadges" [badge]="ub.badges"></app-badge>
        </div>
        <p *ngIf="earnedBadges.length === 0" class="no-data-msg">لا توجد أوسمة روحية مكتسبة بعد..</p>
      </div>
    </div>

    <!-- Achievement Celebration Modal -->
    <div class="celebration-overlay" *ngIf="celebratingBadge" (click)="closeCelebration()">
      <div class="celebration-card" (click)="$event.stopPropagation()">
        <div class="confetti-container"></div>
        <div class="badge-glow-ring"></div>
        
        <div class="celebration-content">
          <div class="achievement-icon">{{ celebratingBadge.badges.icon_url }}</div>
          <h2 class="gold-text">فتح مقام جديد! ✨</h2>
          <h3 class="badge-name">{{ celebratingBadge.badges.name }}</h3>
          <p class="badge-desc">{{ celebratingBadge.badges.description }}</p>
          
          <button (click)="closeCelebration()" class="btn-primary celebration-btn">
            تقبّل الله طاعتكم 🌙
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .bottom-grid {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      gap: 2rem;
      padding: 0;
      width: 100%;
    }
    .bottom-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 0; /* Crucial for grid/flex items to not overflow */
      width: 100%;
      box-sizing: border-box;
    }
@media (max-width: 480px) {
  .bottom-card {
    padding: 1rem 0.5rem;
    gap: 1rem;
  }
  .card-title {
    font-size: 1.1rem;
    padding: 0 0.5rem;
  }
}
    .card-title {
      margin: 0;
      text-align: right;
      font-size: 1.2rem;
    }
    .no-data-msg {
      text-align: right;
      margin: 1rem 0 0;
      font-size: 0.9rem;
      opacity: 0.5;
      color: var(--text-white);
    }
    .badge-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.8rem;
    }
    @media (max-width: 992px) {
      .bottom-grid {
        grid-template-columns: minmax(0, 1fr);
        gap: 1.5rem;
      }
    }
    @media (max-width: 480px) {
      .badge-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.7rem;
      }
      .stat-card {
        padding: 1rem;
      }
      .spiritual-frame-container {
        width: 140px;
        height: 140px;
      }
      .title-with-glow {
        font-size: 1.8rem;
      }
      .spiritual-motto {
        font-size: 0.95rem;
        gap: 0.4rem;
      }
      .profile-header {
        padding: 1.2rem 1rem !important;
        margin-bottom: 1.5rem !important;
      }
    }
    .dashboard-container {
      margin-top: 1rem;
      text-align: center;
    }
    .profile-header {
      background: rgba(10, 43, 37, 0.6);
      padding: 3rem 2rem;
      border: 1px solid var(--glass-border);
      margin-bottom: 3rem;
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      align-items: center;
      gap: 3rem;
      direction: ltr;
    }
    .image-column {
      display: flex;
      justify-content: center;
      perspective: 1200px;
    }
    .content-column {
      text-align: right;
      direction: rtl;
    }
    .spiritual-frame-container {
      position: relative;
      width: 240px;
      height: 240px;
      filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.4));
      animation: spiritualFloat 6s ease-in-out infinite;
      transform-style: preserve-3d;
    }
    .islamic-gold-frame {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--primary-gold) 0%, var(--secondary-gold) 50%, var(--primary-gold) 100%);
      padding: 10px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      animation: spiritualGlow 4s ease-in-out infinite;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 0 25px rgba(212, 175, 55, 0.6);
      transform: rotateY(-20deg) rotateX(10deg);
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .islamic-gold-frame::before {
      content: '';
      position: absolute;
      inset: -15px;
      border: 2px solid var(--primary-gold);
      border-radius: 50%;
      opacity: 0.3;
      animation: rotate 20s linear infinite;
    }
    .islamic-gold-frame:hover {
      transform: rotateY(0deg) rotateX(0deg) scale(1.08);
      box-shadow: 0 30px 60px rgba(212, 175, 55, 0.4);
    }
    .spiritual-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      border: 5px solid rgba(255, 255, 255, 0.3);
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
    }
    .title-with-glow {
      font-size: 2.8rem;
      font-weight: 900;
      margin-bottom: 1rem;
      text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
    }
    .gold-gradient-text {
      background: linear-gradient(135deg, var(--secondary-gold), var(--primary-gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .spiritual-motto {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.2rem;
    }
    @keyframes spiritualFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    @keyframes spiritualGlow {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 10px rgba(212, 175, 55, 0.2)); }
      50% { filter: brightness(1.2) drop-shadow(0 0 30px rgba(212, 175, 55, 0.5)); }
    }
    @media (max-width: 992px) {
      .profile-grid {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 2rem;
      }
      .content-column { text-align: center; }
      .spiritual-motto { justify-content: center; }
      .spiritual-frame-container { width: 200px; height: 200px; margin: 0 auto; }
    }
    .main-circle {
      margin: 3rem auto;
      width: 340px;
      height: 340px;
      border: 4px double var(--primary-gold);
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1), transparent),
        rgba(10, 43, 37, 0.6);
      backdrop-filter: blur(25px);
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7),
        inset 0 0 50px rgba(212, 175, 55, 0.15);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      transform: perspective(1000px) rotateX(8deg);
      animation: float 6s ease-in-out infinite;
      transition: all 0.5s ease;
      z-index: 5;
    }
    @media (max-width: 480px) {
      .main-circle {
        width: 280px;
        height: 280px;
        margin: 2rem auto;
      }
      .current-count {
        font-size: 2.8rem;
      }
      .target-indicator {
        font-size: 1.1rem;
      }
    }
    .inner-ornament {
      position: absolute;
      inset: 20px;
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 50%;
      background-image: var(--islamic-pattern);
      background-size: 60px;
      opacity: 0.3;
      pointer-events: none;
      z-index: -1;
    }
    .main-circle::after {
      content: '';
      position: absolute;
      inset: -20px;
      border-radius: 50%;
      border: 2px dashed var(--primary-gold);
      opacity: 0.4;
      animation: rotate 30s linear infinite;
      pointer-events: none;
    }
    .main-circle:hover {
      transform: perspective(1000px) rotateX(0deg) scale(1.05);
      border-color: var(--primary-gold);
      box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.2);
    }
    .current-count {
      font-size: 3.5rem;
      font-weight: 900;
      line-height: 1;
      margin-top: 0.5rem;
      text-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
    }
    .count-label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      margin: 0.8rem 0;
      font-weight: 500;
    }
    .target-indicator {
      font-size: 1.4rem;
      color: var(--text-white);
      opacity: 0.9;
      font-weight: 700;
      background: rgba(212, 175, 55, 0.1);
      padding: 0.2rem 1rem;
      border-radius: 2rem;
      border: 1px solid rgba(212, 175, 55, 0.2);
    }
    @keyframes float {
      0%, 100% { transform: perspective(1000px) rotateX(5deg) translateY(0); }
      50% { transform: perspective(1000px) rotateX(5deg) translateY(-15px); }
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
    .stat-card {
      padding: 1.5rem;
      text-align: center;
      transition: all 0.4s ease;
    }
    .stat-card:hover { transform: translateY(-5px) scale(1.02); }
    .card-label { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; }
    .card-value { font-size: 1.8rem; font-weight: 700; }
    .luxury-btn {
      width: 100%;
      max-width: 350px;
      padding: 1.2rem;
      font-size: 1.2rem;
      border-radius: 3rem;
    }
    .program-selector-container {
      max-width: 600px;
      margin: 0 auto 3.5rem auto;
      text-align: center;
    }
    .selector-label {
      display: block;
      margin-bottom: 1.2rem;
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--secondary-gold);
      letter-spacing: 2px;
    }
    .luxury-select-wrapper {
      position: relative;
      background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.1), transparent);
      padding: 3px;
      border-radius: 4rem;
    }
    .luxury-select {
      appearance: none;
      width: 100%;
      padding: 1.4rem 2.5rem;
      background: rgba(4, 26, 22, 0.95);
      border: 1.5px solid var(--primary-gold);
      border-radius: 4rem;
      color: white;
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
      transition: all 0.4s;
      text-align: center;
    }
    .luxury-select option {
      background-color: var(--deep-emerald);
      color: white;
    }
    .luxury-select:focus {
      outline: none;
      border-color: var(--secondary-gold);
      box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
    }
    .progress-bar-container {
      width: 100%;
      height: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-gold), var(--secondary-gold));
      transition: width 0.5s ease-out;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(4, 26, 22, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: modalFadeIn 0.3s ease;
    }
    .modal-card {
      width: 95%;
      max-width: 450px;
      padding: 3.5rem 2rem 2.5rem;
      position: relative;
      border: 1.5px solid var(--primary-gold);
      box-shadow: 0 0 60px rgba(212, 175, 55, 0.25);
      text-align: center;
      animation: modalSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .islamic-arch-top { border-radius: 4.5rem 4.5rem 1.5rem 1.5rem; }
    .close-btn {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      background: none;
      border: none;
      color: rgba(255,255,255,0.4);
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
      transition: color 0.3s;
    }
    .close-btn:hover { color: #ff5f5f; }
    .ornament-icon { 
      font-size: 2.8rem; 
      margin-bottom: 1rem; 
      filter: drop-shadow(0 0 10px var(--primary-gold));
    }
    .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 800; }
    .modal-header .subtitle { color: rgba(255,255,255,0.5); font-size: 0.95rem; margin-top: 0.5rem; }
    .input-wrapper { margin: 2rem 0; position: relative; }
    .counter-input {
      width: 100%;
      background: rgba(255,255,255,0.03) !important;
      border: 2px solid rgba(212, 175, 55, 0.3) !important;
      border-radius: 1rem !important;
      padding: 1.5rem !important;
      font-size: 2.2rem !important;
      font-weight: 800 !important;
      color: var(--primary-gold) !important;
      text-align: center !important;
      transition: all 0.3s;
      box-sizing: border-box;
    }
    .counter-input:focus {
      outline: none;
      border-color: var(--primary-gold) !important;
      box-shadow: 0 0 25px rgba(212, 175, 55, 0.2) !important;
      background: rgba(255,255,255,0.06) !important;
    }
    .input-label {
      display: block;
      margin-bottom: 0.8rem;
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--secondary-gold);
    }
    .submit-btn {
      width: 100%;
      padding: 1.2rem;
      font-size: 1.2rem;
      border-radius: 3rem;
      font-weight: 800;
      box-shadow: 0 10px 25px rgba(212, 175, 55, 0.4);
    }
    .cancel-link {
      display: block;
      width: 100%;
      margin-top: 1.5rem;
      background: none;
      border: none;
      color: rgba(255,255,255,0.4);
      font-size: 0.95rem;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.3s;
    }
    .cancel-link:hover { color: var(--text-white); }
    @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalSlideUp { from { opacity: 0; transform: translateY(60px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }

    /* Celebration Styles */
    .celebration-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 26, 22, 0.9);
      backdrop-filter: blur(20px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.5s ease;
    }
    .celebration-card {
      position: relative;
      width: 90%;
      max-width: 500px;
      padding: 4rem 2rem;
      text-align: center;
      background: rgba(10, 43, 37, 0.8);
      border: 2px solid var(--primary-gold);
      border-radius: 3rem;
      box-shadow: 0 0 100px rgba(212, 175, 55, 0.3);
      overflow: hidden;
      animation: celebrationPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .achievement-icon {
      font-size: 6rem;
      margin-bottom: 1.5rem;
      filter: drop-shadow(0 0 20px var(--primary-gold));
      animation: iconFloat 3s ease-in-out infinite;
    }
    .badge-name { font-size: 2.2rem; margin: 1rem 0; color: var(--text-white); }
    .badge-desc { font-size: 1.1rem; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 2.5rem; }
    .celebration-btn { width: 100%; font-size: 1.3rem; padding: 1.2rem; }
    
    .badge-glow-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      height: 300px;
      border: 2px dashed var(--primary-gold);
      border-radius: 50%;
      opacity: 0.2;
      animation: rotate 10s linear infinite;
      z-index: -1;
    }

    @keyframes celebrationPop {
      0% { transform: scale(0.5) translateY(100px); opacity: 0; }
      100% { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes iconFloat {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-20px) scale(1.1); }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class DashboardComponent implements OnInit {
  private programService = inject(ProgramService);
  private contributionService = inject(ContributionService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  user$ = this.auth.currentUser$;
  profile$ = this.auth.currentProfile$;
  programs$ = this.programService.programs$.pipe(
    tap(ps => {
      if (ps.length > 0 && !this.selectedProgram$.value) {
        this.selectedProgram$.next(ps[0]);
      } else if (this.selectedProgram$.value) {
        // Sync selected program with updated data from list
        const updated = ps.find(p => p.id === this.selectedProgram$.value?.id);
        if (updated) this.selectedProgram$.next(updated);
      }
    })
  );
  contributions$ = this.contributionService.contributions$;

  selectedProgram$ = new BehaviorSubject<any | null>(null);

  userProgramTotal$: Observable<number> = combineLatest([
    this.contributions$,
    this.selectedProgram$
  ]).pipe(
    map(([cs, sp]) => {
      if (!sp) return 0;
      return cs
        .filter(c => c.program_id === sp.id)
        .reduce((sum, c) => sum + (c.amount || 0), 0);
    })
  );

  amount = 100;
  showForm = false;

  userStats = {
    current_streak: 0,
    longest_streak: 0,
    total_contributions: 0
  };

  earnedBadges: any[] = [];
  celebratingBadge: any = null;

  ngOnInit() {
    this.programService.fetchActivePrograms();
    this.contributionService.fetchUserContributions();
    this.loadBadges();
  }

  logout() {
    this.auth.signOut();
  }

  onProgramChange(p: any) {
    this.selectedProgram$.next(p);
  }

  openForm() { this.showForm = true; this.cdr.detectChanges(); }
  closeForm() { this.showForm = false; this.cdr.detectChanges(); }

  private async loadBadges() {
    try {
      const { data } = await this.auth.client
        .from('user_badges')
        .select('*, badges(*)')
        .order('awarded_at', { ascending: true });

      const newBadges = data || [];

      // Check for newly earned badges (if it's not the initial load)
      if (this.earnedBadges.length > 0 && newBadges.length > this.earnedBadges.length) {
        const newlyEarned = newBadges.filter(nb => !this.earnedBadges.some(ob => ob.id === nb.id));
        if (newlyEarned.length > 0) {
          this.celebratingBadge = newlyEarned[0];
        }
      }

      this.earnedBadges = newBadges;
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error loading badges:', e);
    }
  }

  closeCelebration() {
    this.celebratingBadge = null;
    this.cdr.detectChanges();
  }

  async submit() {
    const sp = this.selectedProgram$.value;
    if (this.amount <= 0 || !sp) return;

    try {
      await this.contributionService.addContribution(this.amount, sp.id);
      this.notify.show(`✨ تم بنجاح! إضافة ${this.amount} صلاة للبرنامج.`, 'success');
      this.amount = 100;
      this.showForm = false;

      // Force refresh data
      await this.auth.refreshProfile();
      await this.programService.fetchActivePrograms();
      this.contributionService.fetchUserContributions();
      await this.loadBadges(); // Refresh badges after contribution
      this.cdr.detectChanges();
    } catch (err: any) {
      this.notify.show(err.message, 'error');
    }
  }
}
