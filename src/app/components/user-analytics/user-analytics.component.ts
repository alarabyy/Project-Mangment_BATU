import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexChart, ApexNonAxisChartSeries, ApexPlotOptions, ApexDataLabels, ApexLegend, ApexResponsive, ApexAxisChartSeries, ApexXAxis, ApexYAxis, ApexGrid, ApexTooltip, ApexStroke, ApexFill } from 'ng-apexcharts';
import { Observable, of } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { User } from '../../models/user';
import { format, formatDistanceToNow } from 'date-fns';
import { UserService } from '../../Services/user.service';

// Define a comprehensive type for all possible chart options
export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  labels: string[];
  colors: string[];
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  grid: ApexGrid;
  fill: ApexFill;
};

// State interface for cleaner data handling
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
export class UserAnalyticsComponent implements OnInit {
  public state$!: Observable<AnalyticsState>;

  // Use the strongly-typed ChartOptions
  public roleChartOptions$!: Observable<Partial<ChartOptions>>;
  public domainChartOptions$!: Observable<Partial<ChartOptions>>;
  public recentUsers$!: Observable<User[]>;
  public kpiData$!: Observable<any>;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    const source$ = this.userService.getUsers().pipe(
      map(users => ({ isLoading: false, users, error: null })),
      startWith({ isLoading: true, users: [], error: null }),
      catchError(err => of({ isLoading: false, users: [], error: 'Could not load user data.' })),
      shareReplay(1)
    );

    this.state$ = source$;

    this.kpiData$ = source$.pipe(map(({ users }) => this.calculateKpiData(users)));
    this.roleChartOptions$ = source$.pipe(map(({ users }) => this.createRoleChart(users)));
    this.domainChartOptions$ = source$.pipe(map(({ users }) => this.createDomainChart(users)));
    this.recentUsers$ = source$.pipe(map(({ users }) => users.sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime()).slice(0, 5)));
  }

  // --- Analytical Calculation Methods ---

  private calculateKpiData(users: User[]): any {
    if (users.length === 0) return { total: 0, roles: 0, mostCommonRole: 'N/A', incomplete: 0 };
    const roleCounts = this.getRoleCounts(users);
    const mostCommon = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: users.length,
      roles: Object.keys(roleCounts).length,
      mostCommonRole: mostCommon ? this.getRoleName(parseInt(mostCommon[0])).name : 'N/A',
      incomplete: users.filter(u => !u.lastname).length
    };
  }

  private createRoleChart(users: User[]): Partial<ChartOptions> {
    const roleCounts = this.getRoleCounts(users);
    const labels = Object.keys(roleCounts).map(id => this.getRoleName(parseInt(id)).name);
    const series = Object.values(roleCounts);

    return {
      series: series,
      chart: { type: 'donut', height: 350, background: 'transparent' },
      labels: labels,
      colors: ['var(--primary-accent)', 'var(--secondary-accent)', '#ffc107', '#6c757d'],
      plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total Users', color: 'var(--subtle-text-color)', fontWeight: 600 } } } } },
      dataLabels: { enabled: true, style: { fontSize: '14px', fontWeight: 'bold' }, dropShadow: { enabled: false } },
      legend: {
        position: 'bottom',
        labels: {
          useSeriesColors: false,
          colors: 'var(--text-color)'
        }
        // The 'markers' property that caused the error has been removed.
      },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} users` } },
      stroke: { width: 0 }
    };
  }

  private createDomainChart(users: User[]): Partial<ChartOptions> {
    const domainCounts: { [key: string]: number } = {};
    users.forEach(user => {
      const domain = user.email.split('@')[1];
      if (domain) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    });
    const sortedDomains = Object.entries(domainCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);

    return {
      series: [{ name: 'User Count', data: sortedDomains.map(d => d[1]) }],
      chart: { type: 'bar', height: 350, toolbar: { show: false }, background: 'transparent' },
      plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '50%', distributed: true } },
      dataLabels: { enabled: false },
      xaxis: { categories: sortedDomains.map(d => d[0]), labels: { style: { colors: 'var(--subtle-text-color)', fontWeight: 500 } } },
      yaxis: { labels: { style: { colors: 'var(--subtle-text-color)', fontWeight: 500 } } },
      grid: { borderColor: 'var(--border-color-translucent)' },
      tooltip: { theme: 'dark' },
      legend: { show: false },
      colors: ['#23d160', '#00b4d8', '#f1c40f', '#e67e22', '#e74c3c']
    };
  }

  // --- Helper Methods ---

  getRoleName(roleId: number): { name: string; icon: string } {
    const roles: { [key: number]: { name: string; icon: string } } = {
      2: { name: 'Admin', icon: 'fa-user-shield' },
      1: { name: 'Student', icon: 'fa-user-graduate' },
      3: { name: 'Doctor', icon: 'fa-user-tie' }
    };
    return roles[roleId] || { name: 'User', icon: 'fa-user' };
  }

  getRoleCounts(users: User[]): { [key: number]: number } {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number });
  }

  getTimeAgo(date: Date | undefined): string {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }
}
