import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="standard-badge-card" [class]="badge.tier" (click)="toggleDescription($event)">
      <div class="logo-frame">
        <div class="logo-glow"></div>
        <img src="assets/images/لوجووو (2).png" class="badge-custom-logo" alt="logo">
      </div>
      
      <div class="badge-info">
        <div class="badge-name">{{ badge.name }}</div>
      </div>

      <!-- Description Popup -->
      <div class="badge-description-popup" *ngIf="showDescription" (click)="$event.stopPropagation()">
        <p>{{ badge.description }}</p>
        <div class="tier-label">{{ badge.tier }}</div>
      </div>
    </div>
  `,
  styles: [`
    .standard-badge-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.6rem 0.4rem;
      background: rgba(10, 43, 37, 0.4);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 1rem;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      min-width: 85px;
      overflow: visible;
    }
    .standard-badge-card:hover {
      transform: translateY(-5px);
      border-color: var(--tier-color, var(--primary-gold));
      background: rgba(212, 175, 55, 0.1);
      box-shadow: 0 10px 20px rgba(0,0,0,0.3);
      z-index: 10;
    }
    .logo-frame {
      position: relative;
      width: 42px;
      height: 42px;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge-custom-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 0 5px var(--tier-glow));
      z-index: 2;
    }
    .logo-glow {
      position: absolute;
      inset: -5px;
      background: var(--tier-glow);
      border-radius: 50%;
      filter: blur(15px);
      opacity: 0.3;
      z-index: 1;
    }
    
    .badge-name { 
      font-size: 0.7rem; 
      font-weight: 700; 
      color: rgba(255,255,255,0.95);
      line-height: 1.2;
      max-width: 80px;
    }

    /* Description Popup */
    .badge-description-popup {
      position: absolute;
      bottom: 110%;
      left: 50%;
      transform: translateX(-50%);
      width: 160px;
      padding: 0.8rem;
      background: rgba(10, 43, 37, 0.98);
      backdrop-filter: blur(15px);
      border: 1px solid var(--tier-color, var(--primary-gold));
      border-radius: 1rem;
      box-shadow: 0 15px 35px rgba(0,0,0,0.6);
      z-index: 100;
      animation: popupFadeUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .badge-description-popup p {
      font-size: 0.75rem;
      color: white;
      margin: 0 0 0.4rem 0;
      line-height: 1.4;
    }
    .tier-label {
      font-size: 0.55rem;
      text-transform: uppercase;
      color: var(--tier-color);
      font-weight: 800;
      letter-spacing: 1px;
    }

    @media (max-width: 480px) {
      .standard-badge-card {
        min-width: 75px;
        padding: 0.5rem 0.3rem;
      }
      .logo-frame {
        width: 35px;
        height: 35px;
      }
      .badge-name {
        font-size: 0.65rem;
      }
      .badge-description-popup {
        width: 140px;
      }
    }

    @keyframes popupFadeUp {
      from { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.9); }
      to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }

    .bronze { --tier-color: #cd7f32; --tier-glow: rgba(205, 127, 50, 0.4); }
    .silver { --tier-color: #e0e0e0; --tier-glow: rgba(224, 224, 224, 0.4); }
    .gold { --tier-color: #ffd700; --tier-glow: rgba(255, 215, 0, 0.4); }
    .legendary { 
      --tier-color: #ff4d4d; 
      --tier-glow: rgba(255, 77, 77, 0.6);
      animation: mystic-pulse 2s infinite;
    }
    @keyframes mystic-pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
    }
  `]
})
export class BadgeComponent {
  @Input() badge: any = {
    name: '',
    description: '',
    tier: 'bronze',
    icon_url: null,
    icon: null
  };

  showDescription = false;

  toggleDescription(event: Event) {
    event.stopPropagation();
    this.showDescription = !this.showDescription;
  }

  // Close description when clicking elsewhere - optional but good UX
  constructor() {
    window.addEventListener('click', () => {
      this.showDescription = false;
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
