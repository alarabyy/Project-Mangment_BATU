// src/app/components/unauthorized/unauthorized.component.ts

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink], // RouterLink ضروري لـ [routerLink]
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.css']
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
