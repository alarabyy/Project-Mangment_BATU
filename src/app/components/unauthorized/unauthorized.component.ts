// src/app/components/unauthorized/unauthorized.component.ts

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.css'],
  // imports: [RouterLink]
})
export class UnauthorizedComponent {

  constructor(
    private location: Location,
    private router: Router
  ) { }

  /**
   * دالة للعودة إلى الصفحة السابقة في تاريخ المتصفح.
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * دالة للانتقال إلى الصفحة الرئيسية.
   */
  goToHome(): void {
    this.router.navigate(['/Home']);
  }
}
