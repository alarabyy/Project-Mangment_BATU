// src/app/components/User/user-analytics/user-analytics.component.ts
import { Component, OnInit, ElementRef, QueryList, ViewChildren, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable, of, BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { UserService } from '../../../Services/user.service';
import { User } from '../../../models/user';

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

  private roleFilter$ = new BehaviorSubject<string>('all');

  public kpiData$!: Observable<any>;
  public roleDistributionOptions$!: Observable<ChartOptions>;
  public genderDistributionOptions$!: Observable<ChartOptions>; // ✅ New chart
  public emailDomainOptions$!: Observable<ChartOptions>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const usersSource$ = this.userService.getUsers().pipe(
      map(users => ({ isLoading: false, users, error: null })),
      startWith({ isLoading: true, users: [], error: null }),
      catchError(() => of({ isLoading: false, users: [], error: 'Could not load analytics data.' })),
      shareReplay(1)
    );

    this.state$ = usersSource$;

    // ✅ FIX: Removed the non-existent statusFilter$ from combineLatest
    this.filteredUsers$ = combineLatest([
      usersSource$.pipe(map(s => s.users)),
      this.roleFilter$
    ]).pipe(
      map(([users, role]) => this.applyFilters(users, role))
    );

    this.kpiData$ = this.filteredUsers$.pipe(map(users => this.calculateKpiData(users)));
    this.roleDistributionOptions$ = this.filteredUsers$.pipe(map(users => this.createRoleDistributionChart(users)));
    this.genderDistributionOptions$ = this.filteredUsers$.pipe(map(users => this.createGenderDistributionChart(users)));
    this.emailDomainOptions$ = this.filteredUsers$.pipe(map(users => this.createEmailDomainChart(users)));
  }

  ngAfterViewInit(): void {
    this.kpiSubscription = this.kpiData$.subscribe(() => {
      setTimeout(() => this.animateCounters(), 0);
    });
  }

  ngOnDestroy(): void {
    if (this.kpiSubscription) this.kpiSubscription.unsubscribe();
  }

  // ✅ FIX: Removed the 'status' parameter and logic
  applyFilters(users: User[], role: string): User[] {
    if (role === 'all') return users;
    return users.filter(user => this.getRoleInfo(user.role).name.toLowerCase() === role);
  }

  onRoleFilterChange(event: Event): void {
    this.roleFilter$.next((event.target as HTMLSelectElement).value);
  }

  // ✅ FIX: Simplified to only accept 'number' for role
  public getRoleInfo(roleValue: number): { name: string; icon: string; class: string } {
    switch (roleValue) {
      case 0: return { name: 'Student', icon: 'fas fa-user-graduate', class: 'student' };
      case 1: return { name: 'Doctor', icon: 'fas fa-user-tie', class: 'doctor' };
      case 2: return { name: 'Admin', icon: 'fas fa-user-shield', class: 'admin' };
      default: return { name: 'User', icon: 'fas fa-user', class: 'unknown' };
    }
  }

  // ✅ FIX: KPIs are now calculated from available data
  private calculateKpiData(users: User[]): any {
    if (!users) return { total: 0, students: 0, doctors: 0, admins: 0 };
    return {
      total: users.length,
      students: users.filter(u => u.role === 0).length,
      doctors: users.filter(u => u.role === 1).length,
      admins: users.filter(u => u.role === 2).length,
    };
  }

  // ✅ NEW: Chart based on available 'gender' data
  private createGenderDistributionChart(users: User[]): ChartOptions {
    const genderCounts = users.reduce((acc, user) => {
      const genderName = user.gender === 0 ? 'Male' : 'Female';
      acc[genderName] = (acc[genderName] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      series: Object.values(genderCounts),
      chart: { type: 'pie', height: 350, background: 'transparent' },
      labels: Object.keys(genderCounts),
      colors: ['#3498db', '#e91e63'], // Blue for Male, Pink for Female
      legend: { position: 'bottom', labels: { colors: 'var(--subtle-text-color)' } },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} Users` } },
    };
  }

  private createRoleDistributionChart(users: User[]): ChartOptions {
    const roleCounts = users.reduce((acc, user) => {
      const roleName = this.getRoleInfo(user.role).name;
      acc[roleName] = (acc[roleName] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      series: Object.values(roleCounts),
      chart: { type: 'donut', height: 350, background: 'transparent' },
      labels: Object.keys(roleCounts),
      colors: ['#3498db', '#2ecc71', '#e74c3c'],
      legend: { position: 'bottom', labels: { colors: 'var(--subtle-text-color)' } },
      plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'Total Users' } } } } },
    };
  }

  private createEmailDomainChart(users: User[]): ChartOptions {
    const domainCounts = users.reduce((acc, user) => {
      const domain = user.email.split('@')[1];
      if (domain) acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    const sortedDomains = Object.entries(domainCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    return {
      series: [{ name: 'User Count', data: sortedDomains.map(d => d[1]) }],
      chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 4 } },
      xaxis: { categories: sortedDomains.map(d => d[0]), labels: { style: { colors: 'var(--subtle-text-color)' } } },
      yaxis: { labels: { style: { colors: 'var(--subtle-text-color)' } } },
      legend: { show: false },
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
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 100));
    const update = () => {
      current += step;
      if (current >= target) {
        element.innerText = target.toLocaleString();
        return;
      }
      element.innerText = current.toLocaleString();
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}
