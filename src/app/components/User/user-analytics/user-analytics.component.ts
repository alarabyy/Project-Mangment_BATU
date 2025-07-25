// src/app/components/User/user-analytics/user-analytics.component.ts
import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable, of, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { User } from '../../../models/user';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { UserService } from '../../../Services/user.service';

type ChartOptions = Partial<{ series: any; chart: any; plotOptions: any; labels: any; colors: any; dataLabels: any; legend: any; tooltip: any; stroke: any; xaxis: any; yaxis: any; grid: any; fill: any; title: any; subtitle: any; }>;
interface AnalyticsState { users: User[]; isLoading: boolean; error: string | null; } // Defined here explicitly

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

  private roleFilter$ = new BehaviorSubject<string>('all');
  private statusFilter$ = new BehaviorSubject<string>('all');

  public kpiData$!: Observable<any>;
  public roleDistributionOptions$!: Observable<Partial<ChartOptions>>;
  public emailDomainOptions$!: Observable<Partial<ChartOptions>>;
  public signupsOverTimeOptions$!: Observable<Partial<ChartOptions>>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const usersSource$ = this.userService.getUsers().pipe(
      map((users: User[]) => ({ isLoading: false, users, error: null })),
      startWith({ isLoading: true, users: [], error: null }),
      catchError(err => of({ isLoading: false, users: [], error: 'Could not load analytics data.' })),
      shareReplay(1)
    );

    this.state$ = usersSource$;

    this.filteredUsers$ = combineLatest([
      // Explicitly type 's' as AnalyticsState
      usersSource$.pipe(map((s: AnalyticsState) => s.users)),
      this.roleFilter$,
      this.statusFilter$
    ]).pipe(
      // Explicitly type the tuple for clarity and type safety
      map(([users, role, status]: [User[], string, string]) => this.applyFilters(users, role, status))
    );

    this.kpiData$ = this.filteredUsers$.pipe(map((users: User[]) => this.calculateKpiData(users)));
    this.roleDistributionOptions$ = this.filteredUsers$.pipe(map((users: User[]) => this.createRoleDistributionChart(users)));
    this.emailDomainOptions$ = this.filteredUsers$.pipe(map((users: User[]) => this.createEmailDomainChart(users)));
    this.signupsOverTimeOptions$ = this.filteredUsers$.pipe(map((users: User[]) => this.createSignupsOverTimeChart(users)));
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
    return users.filter(user => {
      const roleMatch = (role === 'all') ||
                        (user.role != null && this.getRoleInfo(user.role).name.toLowerCase() === role);

      const statusMatch = (status === 'all') ||
                          (user.status && user.status.toLowerCase() === status.toLowerCase());

      return roleMatch && statusMatch;
    });
  }

  onRoleFilterChange(event: Event): void { this.roleFilter$.next((event.target as HTMLSelectElement).value); }
  onStatusFilterChange(event: Event): void { this.statusFilter$.next((event.target as HTMLSelectElement).value); }

  public getRoleInfo(roleValue: number | string | string[] | undefined): { name: string; icon: string; class?: string } {
    let normalizedRole: string | number | undefined;

    if (Array.isArray(roleValue)) {
      normalizedRole = roleValue.length > 0 ? roleValue[0] : undefined;
    } else {
      normalizedRole = roleValue;
    }

    const numericRoleId = typeof normalizedRole === 'string' ? parseInt(normalizedRole, 10) : normalizedRole;

    switch (numericRoleId) {
      case 2: return { name: 'Admin', icon: 'fas fa-user-shield', class: 'admin' };
      case 0: return { name: 'Student', icon: 'fas fa-user-graduate', class: 'student' };
      case 1: return { name: 'Doctor', icon: 'fas fa-user-tie', class: 'doctor' };
      default: return { name: 'User', icon: 'fas fa-user', class: 'unknown' };
    }
  }

  private calculateKpiData(users: User[]): any {
    if (!users || users.length === 0) return { total: 0, active: 0, newLastMonth: 0, pending: 0 };
    const thirtyDaysAgo = subDays(new Date(), 30);
    return {
      total: users.length,
      active: users.filter(u => u.status && u.status.toLowerCase() === 'active').length,
      newLastMonth: users.filter(u => u.createdAt && new Date(u.createdAt) > thirtyDaysAgo).length,
      pending: users.filter(u => u.status && u.status.toLowerCase() === 'pending').length,
    };
  }

  private createSignupsOverTimeChart(users: User[]): Partial<ChartOptions> {
      const last30Days = subDays(new Date(), 30);
      const signupsByDay = new Map<string, number>();
      const dateInterval = eachDayOfInterval({ start: last30Days, end: new Date() });
      dateInterval.forEach(day => signupsByDay.set(format(day, 'yyyy-MM-dd'), 0));

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
          dataLabels: { enabled: false }, stroke: { curve: 'smooth', width: 3 }, colors: ['var(--primary-accent)'],
          fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1, stops: [0, 90, 100] } },
          xaxis: { categories, labels: { style: { colors: 'var(--subtle-text-color)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
          yaxis: { labels: { style: { colors: 'var(--subtle-text-color)' } } },
          grid: { borderColor: 'var(--border-color-translucent)', strokeDashArray: 4 },
          tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy' } },
      };
  }

  private createRoleDistributionChart(users: User[]): Partial<ChartOptions> {
    const roleCounts = users.reduce((acc, user) => {
      if (user.role != null) {
        const roleInfo = this.getRoleInfo(user.role);
        const roleName = roleInfo.name;
        acc[roleName] = (acc[roleName] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(roleCounts);
    const series = Object.values(roleCounts);

    return {
      series: series,
      chart: { type: 'donut', height: 350, background: 'transparent' },
      labels: labels, colors: ['#f44336', '#00b4d8', '#ffc107', '#9b59b6'],
      legend: { position: 'bottom', horizontalAlign: 'center', floating: false, labels: { colors: 'var(--subtle-text-color)' } },
      dataLabels: { enabled: true, formatter: (val: number) => `${val.toFixed(1)}%` },
      plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'Total', color: 'var(--subtle-text-color)' } } } } },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} Users` } },
    };
  }

  private createEmailDomainChart(users: User[]): Partial<ChartOptions> {
    const domainCounts = users.reduce((acc, user) => {
      if (user.email) {
        const domain = user.email.split('@')[1];
        if(domain) acc[domain] = (acc[domain] || 0) + 1;
      }
      return acc;
    }, {} as {[key: string]: number});

    let sortedDomains = Object.entries(domainCounts).sort((a,b) => b[1] - a[1]);
    const topN = 5;
    let seriesData: number[], categories: string[];

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
      tooltip: { theme: 'dark', x: { show: false } }, legend: { show: false }
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
      if (frame < totalFrames) requestAnimationFrame(count);
      else element.innerText = target.toLocaleString();
    };
    requestAnimationFrame(count);
  }
}
