import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable, of, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { User } from '../../../models/user';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { UserService } from '../../../Services/user.service';

type ChartOptions = Partial<{ series: any; chart: any; plotOptions: any; labels: any; colors: any; dataLabels: any; legend: any; tooltip: any; stroke: any; xaxis: any; yaxis: any; grid: any; fill: any; title: any; subtitle: any; }>;
interface AnalyticsState { users: User[]; isLoading: boolean; error: string | null; }

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
  public roleDistributionOptions$!: Observable<Partial<ChartOptions>>;
  public emailDomainOptions$!: Observable<Partial<ChartOptions>>;
  public signupsOverTimeOptions$!: Observable<Partial<ChartOptions>>; // NEW

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
    this.roleDistributionOptions$ = this.filteredUsers$.pipe(map(users => this.createRoleDistributionChart(users)));
    this.emailDomainOptions$ = this.filteredUsers$.pipe(map(users => this.createEmailDomainChart(users)));
    // NEW: Create the new signups chart
    this.signupsOverTimeOptions$ = this.filteredUsers$.pipe(map(users => this.createSignupsOverTimeChart(users)));
  }

  ngAfterViewInit(): void {
    this.kpiSubscription = this.kpiData$.subscribe(data => {
      if (data && this.kpiValueElements && this.kpiValueElements.length) {
        setTimeout(() => this.animateCounters(), 0);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.kpiSubscription) this.kpiSubscription.unsubscribe();
  }

  applyFilters(users: User[], role: string, status: string): User[] {
    return users.filter(user =>
      (role === 'all' || this.getRoleName(user.role).name.toLowerCase() === role) &&
      (status === 'all' || user.status?.toLowerCase() === status)
    );
  }

  onRoleFilterChange(event: Event): void { this.roleFilter$.next((event.target as HTMLSelectElement).value); }
  onStatusFilterChange(event: Event): void { this.statusFilter$.next((event.target as HTMLSelectElement).value); }

  public getRoleName(roleId: number): { name: string; icon: string; class: string } {
    switch (roleId) {
      case 1: return { name: 'Admin', icon: 'fas fa-user-shield', class: 'admin' };
      case 2: return { name: 'Doctor', icon: 'fas fa-user-md', class: 'doctor' };
      case 3: return { name: 'Student', icon: 'fas fa-user-graduate', class: 'student' };
      default: return { name: 'Unknown', icon: 'fas fa-user', class: 'unknown' };
    }
  }

  private calculateKpiData(users: User[]): any {
    if (!users || users.length === 0) return { total: 0, active: 0, newLastMonth: 0, pending: 0 };
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      newLastMonth: users.filter(u => new Date(u.createdAt!) > subDays(new Date(), 30)).length,
      pending: users.filter(u => u.status === 'Pending').length,
    };
  }

  // --- NEW: Chart for New User Signups Over Time ---
  private createSignupsOverTimeChart(users: User[]): Partial<ChartOptions> {
      const last30Days = subDays(new Date(), 30);

      // Create a map to hold counts for each of the last 30 days, initialized to 0
      const signupsByDay = new Map<string, number>();
      const dateInterval = eachDayOfInterval({ start: last30Days, end: new Date() });
      dateInterval.forEach(day => {
          signupsByDay.set(format(day, 'yyyy-MM-dd'), 0);
      });

      // Populate the map with actual user signup counts
      users.forEach(user => {
          if (user.createdAt && new Date(user.createdAt) >= last30Days) {
              const dayKey = format(startOfDay(new Date(user.createdAt)), 'yyyy-MM-dd');
              if (signupsByDay.has(dayKey)) {
                  signupsByDay.set(dayKey, signupsByDay.get(dayKey)! + 1);
              }
          }
      });

      const sortedDays = Array.from(signupsByDay.keys()).sort();
      const seriesData = sortedDays.map(day => signupsByDay.get(day)!);
      const categories = sortedDays.map(day => format(new Date(day), 'MMM d'));

      return {
          series: [{ name: 'New Users', data: seriesData }],
          chart: { type: 'area', height: 350, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
          dataLabels: { enabled: false },
          stroke: { curve: 'smooth', width: 3 },
          colors: ['var(--primary-accent)'],
          fill: {
              type: 'gradient',
              gradient: {
                  shadeIntensity: 1,
                  opacityFrom: 0.7,
                  opacityTo: 0.1,
                  stops: [0, 90, 100]
              }
          },
          xaxis: { categories: categories, labels: { style: { colors: 'var(--subtle-text-color)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { colors: 'var(--subtle-text-color)' } } },
          grid: { borderColor: 'var(--border-color-translucent)', strokeDashArray: 4 },
          tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy' } },
      };
  }

  private createRoleDistributionChart(users: User[]): Partial<ChartOptions> {
    const roleCounts = users.reduce((acc, user) => {
      const roleName = this.getRoleName(user.role).name;
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(roleCounts);
    const series = Object.values(roleCounts);

    return {
      series: series,
      chart: { type: 'donut', height: 350, background: 'transparent' },
      labels: labels,
      colors: ['#e74c3c', '#00b4d8', '#f1c40f', '#9b59b6'], // Added one more color for 'Unknown'
      legend: { position: 'bottom', horizontalAlign: 'center', floating: false, labels: { colors: 'var(--subtle-text-color)' } },
      dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(1)}%` },
      plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'Total', color: 'var(--subtle-text-color)' } } } } },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} Users` } },
    };
  }

  private createEmailDomainChart(users: User[]): Partial<ChartOptions> {
    const domainCounts = users.reduce((acc, user) => {
      const domain = user.email.split('@')[1];
      if(domain) acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});

    let sortedDomains = Object.entries(domainCounts).sort((a,b) => b[1] - a[1]);

    const topN = 5;
    let seriesData;
    let categories;

    if(sortedDomains.length > topN) {
      const topDomains = sortedDomains.slice(0, topN);
      const otherCount = sortedDomains.slice(topN).reduce((sum, current) => sum + current[1], 0);
      topDomains.push(['Other', otherCount]);
      seriesData = topDomains.map(d => d[1]);
      categories = topDomains.map(d => d[0]);
    } else {
      seriesData = sortedDomains.map(d => d[1]);
      categories = sortedDomains.map(d => d[0]);
    }

    return {
      series: [{ name: 'User Count', data: seriesData }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
      plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true, barHeight: '50%' } },
      dataLabels: { enabled: false },
      xaxis: { categories: categories, labels: { style: { colors: 'var(--subtle-text-color)' } } },
      yaxis: { labels: { show: true, style: { colors: 'var(--subtle-text-color)', fontSize: '14px' } } },
      grid: { borderColor: 'var(--border-color-translucent)', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      tooltip: { theme: 'dark', x: { show: false } },
      legend: { show: false }
    };
  }

  private animateCounters(): void {
    this.kpiValueElements.forEach(el => {
      const element = el.nativeElement;
      const targetValue = parseInt(element.getAttribute('data-value') || '0', 10);
      this.animateCount(element, targetValue);
    });
  }

  private animateCount(element: HTMLElement, target: number): void {
    if (isNaN(target)) { element.innerText = '0'; return; }
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    const count = () => {
      frame++;
      const progress = frame / totalFrames;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * easedProgress);

      element.innerText = current.toLocaleString();

      if (frame < totalFrames) {
        requestAnimationFrame(count);
      } else {
        element.innerText = target.toLocaleString();
      }
    };
    requestAnimationFrame(count);
  }
}
