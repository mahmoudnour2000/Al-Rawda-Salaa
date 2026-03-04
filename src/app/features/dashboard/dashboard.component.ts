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
    <!-- Main Banner Image -->
    <div class="main-banner-container">
      <img src="assets/images/dashboard-banner.png" alt="الروضة الزينبية" class="dashboard-banner">
    </div>

    <div class="profile-header islamic-arch overlap-banner">
      <div class="welcome-text-centered">
        <ng-container *ngIf="profile$ | async as profile; else guestWelcome">
          <h2 class="title-with-glow">مرحباً <span class="gold-gradient-text">سيدي {{ profile.full_name || (user$ | async)?.email?.split('@')?.[0] }}</span></h2>
        </ng-container>
        <ng-template #guestWelcome>
          <h2 class="title-with-glow">مرحباً <span class="gold-gradient-text">سيدي {{ (user$ | async)?.email?.split('@')?.[0] || 'طه' }}</span></h2>
        </ng-template>
        <div class="spiritual-motto-compact">
          <p>تقبّل الله منك صالح الأعمال وبارك في همتك</p>
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
          <ng-container *ngIf="!confirming; else confirmState">
            <div class="input-wrapper">
              <label class="input-label gold-text">عدد الصلوات الكلي</label>
              <input type="number" [(ngModel)]="amount" placeholder="0" class="counter-input">
            </div>

            <!-- Cooldown Warning -->
            <div *ngIf="cooldownDisplay" class="cooldown-warning">
              ⚠️ يرجى الانتظار: {{ cooldownDisplay }} متبقية
            </div>

            <button (click)="requestConfirm()" class="btn-primary submit-btn" [disabled]="!!cooldownDisplay">
              إضافة الورد المبارك
            </button>
          </ng-container>

          <ng-template #confirmState>
            <div class="confirmation-section">
              <div class="ornament-icon">📿</div>
              <h4 class="gold-text">هل أنت متأكد من هذا العدد؟</h4>
              <div class="confirm-amount">{{ amount | number }}</div>
              <p class="confirm-note">سيتم تسجيل هذا العدد في ميزان حسناتكم بإذن الله.</p>
              
              <div class="confirm-actions">
                <button (click)="submit()" class="btn-primary confirm-btn">نعم، متأكد</button>
                <button (click)="confirming = false" class="cancel-btn">تعديل العدد</button>
              </div>
            </div>
          </ng-template>
          
          <button *ngIf="!confirming" (click)="closeForm()" class="cancel-link">إلغاء الأمر</button>
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
    :host {
      display: block;
      width: 100%;
      overflow-x: hidden; /* Prevent horizontal scroll vibration */
      position: relative;
    }
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
        font-size: 1rem; /* Even smaller on mobile */
      }
      .profile-header.overlap-banner {
        margin-top: -1.2rem !important; /* Slightly more overlap for tighter gap (was -0.8rem) */
        padding: 0.8rem !important;
        width: 85% !important; /* Narrower than banner even on mobile */
      }
      .spiritual-motto-compact p {
        font-size: 0.8rem;
      }
    }
    .main-banner-container {
      width: 100%;
      text-align: center;
      margin-bottom: 0rem; /* Tighter spacing */
      margin-top: -1.5rem; /* Move up slightly more */
      display: flex;
      justify-content: center;
      position: relative;
      z-index: 30; /* Higher than profile header */
    }
    .dashboard-banner {
      width: 100%;
      max-width: 100%;
      max-height: 280px; /* Increased from 220px */
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 0 25px rgba(212, 175, 55, 0.4));
      border-radius: 1rem;
    }
    .dashboard-container {
      margin-top: 1rem;
      text-align: center;
    }
    .profile-header.overlap-banner {
      background: rgba(10, 43, 37, 0.7); /* Slightly more transparent */
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      padding: 1rem 1.5rem;
      border: 1px solid rgba(212, 175, 55, 0.3); /* Thin gold border */
      outline: 1px solid rgba(255, 255, 255, 0.1); /* Inner glass highlight */
      outline-offset: -1px;
      margin-bottom: 2rem;
      margin-top: -2.2rem; /* Reduced overlap for more gap (was -3.5rem) */
      position: relative;
      z-index: 10;
      border-radius: 1.5rem;
      box-shadow: 
        0 20px 40px rgba(0,0,0,0.6),
        0 0 20px rgba(212, 175, 55, 0.1); /* Subtle gold base glow */
      width: 70%;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      transition: all 0.4s ease;
    }
    .profile-header.overlap-banner:hover {
      background: rgba(10, 43, 37, 0.8);
      box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 30px rgba(212, 175, 55, 0.2);
    }
    .welcome-text-centered h2 {
      font-size: 1.6rem; /* Reduced from default */
      margin-bottom: 0.3rem;
    }
    .spiritual-motto-compact p { 
      margin: 0; 
      font-size: 0.95rem; /* Reduced from 1.1rem */
      opacity: 0.8;
    }
    .welcome-text-centered h2 {
      font-size: 1.6rem;
      margin-bottom: 0.3rem;
    }
    .title-with-glow {
      font-size: 2.8rem;
      font-weight: 900;
      margin-bottom: 1rem;
      text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
    }
    .gold-gradient-text {
      background: linear-gradient(
        90deg, 
        #d4af37 0%, 
        #f1c40f 25%, 
        #fff1b8 50%, 
        #f1c40f 75%, 
        #d4af37 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shine 4s linear infinite;
      display: inline-block;
    }
    @keyframes shine {
      to { background-position: 200% center; }
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
      transform: perspective(1000px) rotateX(5deg);
      animation: float 6s ease-in-out infinite;
      transition: transform 0.5s ease;
      will-change: transform; /* Hint to browser for optimization */
      backface-visibility: hidden;
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
    .main-circle::after, .inner-ornament {
      will-change: transform;
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
    
    .cooldown-warning {
      color: #ff5f5f;
      background: rgba(255, 95, 95, 0.1);
      padding: 0.8rem;
      border-radius: 0.8rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .confirmation-section {
      padding: 1rem 0;
    }
    .confirm-amount {
      font-size: 3rem;
      font-weight: 900;
      color: var(--primary-gold);
      margin: 1rem 0;
      text-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
    }
    .confirm-note {
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .confirm-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .confirm-btn {
      width: 100%;
      padding: 1.2rem;
      border-radius: 3rem;
    }
    .cancel-btn {
      background: none;
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 0.8rem;
      border-radius: 2rem;
      cursor: pointer;
      transition: all 0.3s;
    }
    .cancel-btn:hover {
      background: rgba(255,255,255,0.05);
      border-color: white;
    }

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
  confirming = false;
  cooldownDisplay = '';
  private cooldownInterval: any;

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

  openForm() {
    this.showForm = true;
    this.confirming = false;
    this.startCooldownCheck();
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.confirming = false;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cdr.detectChanges();
  }

  private startCooldownCheck() {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);

    this.updateCooldown();
    this.cooldownInterval = setInterval(() => {
      this.updateCooldown();
      if (!this.cooldownDisplay) {
        clearInterval(this.cooldownInterval);
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private updateCooldown() {
    this.updateCooldownText();
  }

  requestConfirm() {
    if (this.amount <= 0) return;
    this.confirming = true;
    this.cdr.detectChanges();
  }

  private async loadBadges() {
    try {
      const { data } = await this.auth.client
        .from('user_badges')
        .select('*, badges(*)')
        .order('awarded_at', { ascending: true });

      const fetchedBadges = data || [];

      // safety deduplication for UI
      const uniqueBadges: any[] = [];
      const seen = new Set();

      for (const ub of fetchedBadges) {
        const badgeName = ub.badges?.name || 'Unknown';
        if (!seen.has(badgeName)) {
          seen.add(badgeName);
          uniqueBadges.push(ub);
        }
      }

      // Check for newly earned badges (if it's not the initial load)
      if (this.earnedBadges.length > 0 && uniqueBadges.length > this.earnedBadges.length) {
        const newlyEarned = uniqueBadges.filter(nb => !this.earnedBadges.some(ob => ob.id === nb.id));
        if (newlyEarned.length > 0) {
          this.celebratingBadge = newlyEarned[0];
        }
      }

      this.earnedBadges = uniqueBadges;
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

    // Final check for cooldown before actual submission
    const isCooldown = this.checkCooldownStatus();
    if (isCooldown) {
      this.notify.show('يرجى الانتظار 3 دقائق بين الإضافات', 'error');
      return;
    }

    try {
      await this.contributionService.addContribution(this.amount, sp.id);
      this.notify.show(`✨ تم بنجاح! إضافة ${this.amount} صلاة للبرنامج.`, 'success');
      this.amount = 100;
      this.showForm = false;
      this.confirming = false;

      // Force refresh data
      await this.auth.refreshProfile();
      await this.programService.fetchActivePrograms();
      this.contributionService.fetchUserContributions();
      await this.loadBadges();
      this.cdr.detectChanges();
    } catch (err: any) {
      this.notify.show(err.message, 'error');
    }
  }

  private checkCooldownStatus(): boolean {
    const contributions = this.contributionService.contributionsValue;
    if (!contributions || contributions.length === 0) return false;

    const last = new Date(contributions[0].created_at!);
    const now = new Date();
    const diff = (now.getTime() - last.getTime()) / 1000;
    return diff < 180; // 3 minutes
  }

  private updateCooldownText() {
    const contributions = this.contributionService.contributionsValue;
    if (!contributions || contributions.length === 0) {
      this.cooldownDisplay = '';
      return;
    }

    const last = new Date(contributions[0].created_at!);
    const now = new Date();
    const diff = 180 - (now.getTime() - last.getTime()) / 1000;

    if (diff > 0) {
      const mins = Math.floor(diff / 60);
      const secs = Math.floor(diff % 60);
      this.cooldownDisplay = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    } else {
      this.cooldownDisplay = '';
    }
  }

  ngOnDestroy() {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
  }
}
