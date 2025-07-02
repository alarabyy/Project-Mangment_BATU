// src/app/components/loader/loader.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../Services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent {
  /**
   * Constructs the LoaderComponent.
   * @param loaderService The service used to control the loader's visibility.
   * This service is public so it can be accessed directly from the template to get the loading state.
   */
  constructor(public loaderService: LoaderService) {}
}
