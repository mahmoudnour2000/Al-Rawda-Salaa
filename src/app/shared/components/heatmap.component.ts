import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-outer-container">
      <div class="heatmap-scroll-container" #scrollContainer>
        <div class="heatmap-grid-inner">
          <!-- Month Labels -->
          <div class="months-header">
            <span *ngFor="let m of monthsWithOffset" 
                  [style.grid-column]="m.col" 
                  class="month-label">
              {{ m.name }}
            </span>
          </div>
          
          <!-- Grid Body -->
          <div class="grid-body">
            <div class="cells-wrapper">
              <div *ngFor="let cell of cells" 
                   [class]="'cell ' + getLevelClass(cell.count)" 
                   [title]="cell.date + ': ' + (cell.count | number) + ' صلاة'">
              </div>
            </div>
            
            <div class="days-labels-column">
              <span>س</span>
              <span>ث</span>
              <span>خ</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="legend-area">
        <div class="legend-items">
          <span>أقل</span>
          <div class="cell level-0"></div>
          <div class="cell level-1"></div>
          <div class="cell level-2"></div>
          <div class="cell level-3"></div>
          <div class="cell level-4"></div>
          <span>أكثر</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-outer-container {
      width: 100%;
      position: relative;
      direction: rtl;
    }
    .heatmap-scroll-container {
      width: 100%;
      overflow-x: auto;
      padding: 1rem 0;
      -webkit-overflow-scrolling: touch;
      /* Subtle scrollbar for modern browsers */
      scrollbar-width: thin;
      scrollbar-color: var(--primary-gold) transparent;
    }
    .heatmap-scroll-container::-webkit-scrollbar {
      height: 4px;
    }
    .heatmap-scroll-container::-webkit-scrollbar-thumb {
      background: var(--primary-gold);
      border-radius: 4px;
    }
    .heatmap-grid-inner {
      display: inline-flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0 0.2rem;
      min-width: min-content;
      margin: 0 auto; /* Center on desktop if space allows */
    }
    .months-header {
      display: grid;
      grid-template-columns: repeat(53, 12px); /* 9px cell + 3px gap */
      margin-right: 2rem;
    }
    .month-label {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.4);
      text-align: center;
      grid-row: 1;
      white-space: nowrap;
    }
    .grid-body {
      display: flex;
      gap: 15px;
    }
    .cells-wrapper {
      display: grid;
      grid-template-rows: repeat(7, 9px);
      grid-auto-flow: column;
      gap: 3px;
    }
    .cell {
      width: 9px;
      height: 9px;
      border-radius: 2px;
      background: rgba(255,255,255,0.05);
      transition: transform 0.2s;
    }
    .cell:hover { transform: scale(1.3); z-index: 10; cursor: help; }
    
    .days-labels-column {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      height: 95px;
      color: var(--primary-gold);
      font-size: 0.65rem;
      min-width: 1.5rem;
      text-align: right;
      font-weight: bold;
    }
    .legend-area {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
      padding: 0 1rem;
    }
    .legend-items {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.65rem;
      color: rgba(255,255,255,0.4);
    }
    
    @media (max-width: 480px) {
      .cell { width: 9px; height: 9px; }
      .cells-wrapper { grid-template-rows: repeat(7, 9px); gap: 2px; }
      .months-header { grid-template-columns: repeat(53, 11px); }
      .days-labels-column { height: 75px; }
      .heatmap-grid-inner { gap: 0.4rem; }
    }

    /* Heatmap Levels */
    .level-0 { background: rgba(255, 255, 255, 0.05); }
    .level-1 { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.2); }
    .level-2 { background: rgba(16, 185, 129, 0.4); border: 1px solid rgba(16, 185, 129, 0.3); }
    .level-3 { background: rgba(212, 175, 55, 0.5); border: 1px solid rgba(212, 175, 55, 0.4); }
    .level-4 { background: var(--primary-gold); box-shadow: 0 0 10px rgba(212, 175, 55, 0.4); }
  `]
})
export class HeatmapComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private _data: any[] = [];
  @Input() set data(value: any[]) {
    this._data = value || [];
    this.generateCells();
    this.cdr.detectChanges();
  }
  get data() { return this._data; }

  months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  cells: any[] = [];
  monthsWithOffset: any[] = [];

  ngOnInit() {
    this.generateCells();
  }

  generateCells() {
    this.cells = [];
    this.monthsWithOffset = [];

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setDate(today.getDate() - (52 * 7)); // Exactly 52 weeks back

    // Aggregate data by date
    const aggregatedData = this._data.reduce((acc: any, curr: any) => {
      const dateStr = curr.contribution_date || curr.date; // Support both just in case
      if (dateStr) {
        acc[dateStr] = (acc[dateStr] || 0) + (curr.amount || 0);
      }
      return acc;
    }, {});

    let currentMonth = -1;
    let weekCount = 0;

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const amount = aggregatedData[dateStr] || 0;

      this.cells.push({
        date: dateStr,
        count: amount
      });

      // Track months for labels
      if (d.getDay() === 0) { // Start of a new week column
        weekCount++;
        const monthNum = d.getMonth();
        if (monthNum !== currentMonth) {
          currentMonth = monthNum;
          this.monthsWithOffset.push({
            name: this.months[currentMonth],
            col: 53 - weekCount + 1
          });
        }
      }
    }
  }

  getLevelClass(count: number): string {
    if (count === 0) return 'level-0';
    if (count < 500) return 'level-1';
    if (count < 2000) return 'level-2';
    if (count < 5000) return 'level-3';
    return 'level-4';
  }
}
