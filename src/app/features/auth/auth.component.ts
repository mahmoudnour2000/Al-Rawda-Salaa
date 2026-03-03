import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

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
        
        <p class="subtitle">تسجيل دخول الخدام والمريدين</p>
        
        <div class="input-group">
          <div class="field">
            <label>البريد الإلكتروني</label>
            <input type="email" [(ngModel)]="email" placeholder="example@rawda.com" class="luxury-input">
          </div>
          
          <div class="field">
            <label>كلمة السر</label>
            <input type="password" [(ngModel)]="password" placeholder="••••••••" class="luxury-input">
          </div>
        </div>
        
        <button (click)="login()" class="btn-primary login-btn" [disabled]="loading">
          <span *ngIf="!loading">تسجيل الدخول</span>
          <span *ngIf="loading">جاري التحقق...</span>
        </button>

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
      margin-bottom: 2.5rem;
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
      margin-bottom: 2rem;
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
export class AuthComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  message = '';
  isError = false;

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
      setTimeout(() => this.router.navigate(['/dashboard']), 800);
    } catch (err: any) {
      this.isError = true;
      this.message = 'خطأ في الدخول: تأكد من البيانات';
    } finally {
      this.loading = false;
    }
  }
}
