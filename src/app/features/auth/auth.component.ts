import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { take, filter } from 'rxjs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="glass auth-card">
        <div class="logo-circle">
          <img src="assets/images/logo-gold.png" alt="الروضة الزينبية" class="auth-logo">
        </div>

        <div class="logo-container">
          <h2 class="gold-text logo-title">الروضة الزينبية</h2>
        </div>
        
        <p class="subtitle">{{ isSignUp ? 'إنشاء حساب محب جديد' : 'تسجيل دخول المحبين والمريدين' }}</p>
        
        <div class="input-group">
          <div class="field" *ngIf="isSignUp">
            <label>الاسم الكامل</label>
            <input type="text" [(ngModel)]="fullName" placeholder="الاسم كما يحب أن ينادى به" class="luxury-input">
          </div>

          <div class="field">
            <label>البريد الإلكتروني</label>
            <input type="email" [(ngModel)]="email" placeholder="example@rawda.com" class="luxury-input">
          </div>
          
          <div class="field">
            <label>كلمة السر</label>
            <input type="password" [(ngModel)]="password" placeholder="••••••••" class="luxury-input">
          </div>
        </div>
        
        <button (click)="submit()" class="btn-primary login-btn" [disabled]="loading">
          <span *ngIf="!loading">{{ isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول' }}</span>
          <span *ngIf="loading">جاري المعالجة...</span>
        </button>

        <div class="toggle-mode">
          <a (click)="toggleMode()" class="gold-link">
            {{ isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'محب جديد؟ أنشئ حسابك الآن' }}
          </a>
        </div>

        <div *ngIf="message" [class]="'message ' + (isError ? 'error' : 'success')">
          {{ message }}
        </div>

        <div class="footer-note">أولى الناس بي يوم القيامة أكثرهم عليّ صلاة</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      background: transparent;
    }
    @media (min-width: 992px) {
      :host {
        height: 100vh;
        overflow: hidden;
      }
    }
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      position: relative;
      padding: 1rem;
      box-sizing: border-box;
    }
    @media (min-width: 992px) {
      .auth-container {
        position: fixed;
        inset: 0;
        overflow: hidden;
      }
    }
    .auth-card {
      padding: 3.5rem 1.8rem 1.8rem;
      width: 100%;
      max-width: 380px;
      text-align: center;
      position: relative;
      z-index: 10;
      margin-top: 50px; /* Offset for half-outside logo */
    }
    .logo-circle {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #a67c00 0%, #d4af37 25%, #fff9e3 50%, #d4af37 75%, #8a6d3b 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 15;
      animation: float 6s ease-in-out infinite;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.4),
        0 0 50px rgba(212, 175, 55, 0.3);
      padding: 4px;
    }
    .logo-circle::before {
      content: '';
      position: absolute;
      inset: -10px;
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 50%;
      animation: rotate 15s linear infinite;
    }
    .logo-circle::after {
      content: '';
      position: absolute;
      inset: -15px;
      border: 1px dashed rgba(212, 175, 55, 0.1);
      border-radius: 50%;
      animation: rotate 25s linear reverse infinite;
    }
    .auth-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 50%;
      background: radial-gradient(circle at center, #0a2b25 0%, #02110e 100%);
      border: 2px solid #8a6d3b;
      box-shadow: inset 0 0 25px rgba(0,0,0,0.8);
      padding: 8px;
    }
    .logo-container {
      margin-top: 0.8rem;
      margin-bottom: 1.2rem;
    }
    .logo-title {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 1px;
      text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
    }
    .subtitle {
      color: rgba(255,255,255,0.6);
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .field {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .field label {
      color: var(--primary-gold);
      font-size: 0.9rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }
    .luxury-input {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 1rem;
      padding: 1rem 1.2rem;
      color: white;
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.3s ease;
      width: 100%;
      box-sizing: border-box;
    }
    .luxury-input:focus {
      outline: none;
      border-color: var(--primary-gold);
      background: rgba(212, 175, 55, 0.05);
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
    }
    .login-btn {
      width: 100%;
      font-size: 1.1rem;
      padding: 0.8rem;
      margin-bottom: 1rem;
    }
    .toggle-mode {
      margin-bottom: 1rem;
    }
    .gold-link {
      color: var(--primary-gold);
      cursor: pointer;
      text-decoration: none;
      font-size: 0.95rem;
      transition: opacity 0.3s;
    }
    .gold-link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
    .message {
      margin-top: 1rem;
      padding: 0.8rem;
      border-radius: 0.8rem;
      font-size: 0.9rem;
    }
    .message.error { color: #ff5f5f; background: rgba(255, 95, 95, 0.1); }
    .message.success { color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1); }
    
    .footer-note {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.4);
      margin-top: 1rem;
      font-style: italic;
    }

    @keyframes float {
      0%, 100% { transform: translate(-50%, -50%) translateY(0); }
      50% { transform: translate(-50%, -50%) translateY(-10px); }
    }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AuthComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  fullName = '';
  isSignUp = false;
  loading = false;
  message = '';
  isError = false;

  ngOnInit() {
    // Disable body scroll on desktop
    if (window.innerWidth >= 992) {
      document.body.style.overflow = 'hidden';
    }

    // Check if user is already logged in but pending
    this.auth.currentProfile$.pipe(
      filter(p => p !== undefined),
      take(1)
    ).subscribe(profile => {
      if (profile?.status === 'pending') {
        this.message = 'حسابك في انتظار موافقة الإدارة...';
        this.isError = false;
      } else if (profile?.status === 'rejected') {
        this.message = 'عذراً، تم رفض طلب انضمامك.';
        this.isError = true;
      }
    });
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.message = '';
    this.isError = false;
  }

  async submit() {
    if (this.isSignUp) {
      await this.register();
    } else {
      await this.login();
    }
  }

  async login() {
    if (!this.email || !this.password) {
      this.isError = true;
      this.message = 'يرجى إدخال البريد وكلمة السر';
      return;
    }

    this.loading = true;
    this.message = '';
    this.isError = false;

    try {
      const { error, data } = await this.auth.signIn(this.email, this.password);
      if (error) throw error;

      this.message = 'تم تسجيل الدخول بنجاح! مرحباً بكم...';

      // Wait for profile to refresh so guard can check status
      const profile = await this.auth.refreshProfile();

      if (profile?.status === 'pending') {
        this.message = 'حسابك في انتظار موافقة الإدارة...';
        // The auth guard will handle redirect if we try to go to dashboard
      } else if (profile?.status === 'rejected') {
        this.isError = true;
        this.message = 'عذراً، تم رفض طلب انضمامك.';
        await this.auth.signOut();
      } else {
        setTimeout(() => this.router.navigate(['/dashboard']), 800);
      }
    } catch (err: any) {
      this.isError = true;
      this.message = 'خطأ في الدخول: تأكد من البيانات';
    } finally {
      this.loading = false;
    }
  }

  async register() {
    if (!this.email || !this.password || !this.fullName) {
      this.isError = true;
      this.message = 'يرجى إكمال جميع البيانات';
      return;
    }

    this.loading = true;
    this.message = '';
    this.isError = false;

    try {
      const { error, data } = await this.auth.signUp(this.email, this.password, this.fullName);
      if (error) throw error;

      this.isError = false;
      this.message = 'تم إنشاء الطلب بنجاح! يرجى انتظار موافقة الإدارة.';

      // Redirect to a pending page or stay here with message
      // For now, let's keep them here to see the message
      this.isSignUp = false;
    } catch (err: any) {
      this.isError = true;
      this.message = 'خطأ في التسجيل: ' + (err.message || 'حاول مرة أخرى');
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }
}
