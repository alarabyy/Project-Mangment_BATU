import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable, of, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { User } from '../../models/user';
import { subDays } from 'date-fns';
import { UserService } from '../../Services/user.service';

// Define a more specific type for ApexCharts options to help with type safety
type ChartOptions = Partial<{
  series: any;
  chart: any;
  plotOptions: any;
  labels: any;
  colors: any;
  dataLabels: any;
  legend: any;
  tooltip: any;
  stroke: any;
  xaxis: any;
  yaxis: any;
  grid: any;
  fill: any;
  title: any;
}>;

interface AnalyticsState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './user-analytics.component.html',
  styleUrls: ['./user-analytics.component.css']
})
export class UserAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('kpiValue') kpiValueElements!: QueryList<ElementRef>;
  private kpiSubscription!: Subscription;

  public state$!: Observable<AnalyticsState>;
  public filteredUsers$!: Observable<User[]>;

  // Filter Subjects
  private roleFilter$ = new BehaviorSubject<string>('all');
  private statusFilter$ = new BehaviorSubject<string>('all');

  // Derived Observables
  public kpiData$!: Observable<any>;
  public activityHeatmapOptions$!: Observable<Partial<ChartOptions>>;
  public geoChartOptions$!: Observable<Partial<ChartOptions>>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const source$ = this.userService.getUsers().pipe(
      map(users => ({ isLoading: false, users, error: null })),
      startWith({ isLoading: true, users: [], error: null }),
      catchError(err => of({ isLoading: false, users: [], error: 'Could not load analytics data.' })),
      shareReplay(1)
    );

    this.state$ = source$;

    this.filteredUsers$ = combineLatest([
      source$.pipe(map(s => s.users)),
      this.roleFilter$,
      this.statusFilter$
    ]).pipe(
      map(([users, role, status]) => this.applyFilters(users, role, status))
    );

    this.kpiData$ = this.filteredUsers$.pipe(map(users => this.calculateKpiData(users)));
    this.activityHeatmapOptions$ = this.filteredUsers$.pipe(map(users => this.createActivityHeatmap(users)));
    this.geoChartOptions$ = this.filteredUsers$.pipe(map(users => this.createGeoChart(users)));
  }

  ngAfterViewInit(): void {
    this.kpiSubscription = this.kpiData$.subscribe(data => {
      // Use setTimeout to ensure elements are rendered before animating
      if (data && this.kpiValueElements && this.kpiValueElements.length) {
        setTimeout(() => this.animateCounters(), 0);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.kpiSubscription) {
      this.kpiSubscription.unsubscribe();
    }
  }

  applyFilters(users: User[], role: string, status: string): User[] {
    return users.filter(user =>
      (role === 'all' || this.getRoleName(user.role).name.toLowerCase() === role) &&
      (status === 'all' || user.status?.toLowerCase() === status)
    );
  }

  onRoleFilterChange(event: Event): void { this.roleFilter$.next((event.target as HTMLSelectElement).value); }
  onStatusFilterChange(event: Event): void { this.statusFilter$.next((event.target as HTMLSelectElement).value); }

  private calculateKpiData(users: User[]): any {
    if (users.length === 0) {
      return { total: 0, active: 0, newLastMonth: 0, inactive: 0 };
    }
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      newLastMonth: users.filter(u => new Date(u.createdAt!) > subDays(new Date(), 30)).length,
      inactive: users.filter(u => u.status === 'Inactive').length
    };
  }

  private createActivityHeatmap(users: User[]): Partial<ChartOptions> {
    const seriesData = Array.from({ length: 12 }, () => ({
      name: '', data: Array.from({ length: 30 }, () => 0)
    }));
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    users.forEach(user => {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const month = date.getMonth();
        const day = date.getDate() - 1;
        if (seriesData[month] && seriesData[month].data[day] !== undefined) {
          seriesData[month].data[day]++;
        }
      }
    });
    seriesData.forEach((s, i) => s.name = monthNames[i]);

    return {
      series: seriesData,
      chart: { type: 'heatmap', height: 350, background: 'transparent', toolbar: { show: false } },
      plotOptions: { heatmap: { radius: 4, enableShades: true, colorScale: { ranges: [
        { from: 0, to: 0, name: '0', color: '#2a3038' },
        { from: 1, to: 2, name: '1-2', color: '#006d77' },
        { from: 3, to: 5, name: '3-5', color: 'var(--secondary-accent)' },
        { from: 6, to: 10, name: '6+', color: 'var(--primary-accent)' }
      ] } } },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: { theme: 'dark' },
      xaxis: { labels: { show: false } },
      yaxis: { labels: { style: { colors: 'var(--subtle-text-color)' } } }
    };
  }

  private createGeoChart(users: User[]): Partial<ChartOptions> {
    const countryCounts = users.reduce((acc, user) => {
      if (user.country) {
        acc[user.country] = (acc[user.country] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });
    const sorted = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

    return {
      series: [{ data: sorted.map(d => d[1]) }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '60%', distributed: true } },
      dataLabels: {
        enabled: true,
        textAnchor: 'start',
        style: { colors: ['#fff'] },
        // FIX: Added explicit types for 'val' and 'opt' parameters
        formatter: (val: number, opt: { w: any; seriesIndex: number; dataPointIndex: number; }) =>
          opt.w.globals.labels[opt.dataPointIndex] + ":  " + val,
        offsetX: 0,
        dropShadow: { enabled: true }
      },
      xaxis: { categories: sorted.map(d => d[0]), labels: { show: false } },
      yaxis: { labels: { show: false } },
      grid: { show: false },
      tooltip: { theme: 'dark', x: { show: false } },
      legend: { show: false },
      colors: ['#23d160', '#00b4d8', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6', '#34495e']
    };
  }

  // FIX: Renamed from animateCounters to match the call in ngAfterViewInit
  private animateCounters(): void {
    this.kpiValueElements.forEach(el => {
      const element = el.nativeElement;
      const targetValue = parseInt(element.getAttribute('data-value') || '0', 10);
      this.animateCount(element, targetValue);
    });
  }

  // FIX: Provided implementation for the animateCount method
  private animateCount(element: HTMLElement, target: number): void {
    const duration = 1500; // ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    const startValue = 0;

    const count = () => {
      frame++;
      const progress = frame / totalFrames;
      const current = Math.round(startValue + (target - startValue) * progress);
      element.innerText = current.toLocaleString();

      if (frame < totalFrames) {
        requestAnimationFrame(count);
      } else {
        element.innerText = target.toLocaleString();
      }
    };
    requestAnimationFrame(count);
  }

  // FIX: Provided implementation for the getRoleName method
  getRoleName(roleId: number): { name: string; icon: string } {
    switch (roleId) {
      case 1: return { name: 'Admin', icon: 'fas fa-user-shield' };
      case 2: return { name: 'Doctor', icon: 'fas fa-user-md' };
      case 3: return { name: 'Student', icon: 'fas fa-user-graduate' };
      default: return { name: 'Unknown', icon: 'fas fa-user' };
    }
  }
}
