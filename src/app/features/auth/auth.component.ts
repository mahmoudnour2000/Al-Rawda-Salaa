import { Component, inject, OnInit } from '@angular/core';
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
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      padding: 1rem;
    }
    .auth-card {
      padding: 3.5rem 2.5rem;
      width: 100%;
      max-width: 450px;
      text-align: center;
      position: relative;
      z-index: 10;
    }
    .logo-container {
      position: relative;
      margin-bottom: 1.5rem;
    }
    .logo-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 1px;
    }
    .subtitle {
      color: rgba(255,255,255,0.6);
      font-size: 1.1rem;
      margin-bottom: 3rem;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
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
      font-size: 1.2rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .toggle-mode {
      margin-bottom: 2rem;
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
      font-size: 0.85rem;
      color: rgba(255,255,255,0.4);
      margin-top: 2rem;
      font-style: italic;
    }

  `]
})
export class AuthComponent implements OnInit {
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
}
