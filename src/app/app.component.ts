// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/Components/nav/nav.component';
import { CommonModule } from '@angular/common';
import { FloatingControlsComponent } from "./components/Components/floating-controls/floating-controls.component";
import { LoaderComponent } from "./components/Components/loader/loader.component";
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FooterComponent } from './components/Components/footer/footer.component';
import { GeneralPopupComponent } from "./components/project/general-popup/general-popup.component";
import { NavigationControlsComponent } from "./components/Components/navigation-controls/navigation-controls.component";
import { ToastContainerComponent } from "./components/Components/toast-container/toast-container.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterOutlet,
    NavComponent,
    FooterComponent,
    FloatingControlsComponent,
    LoaderComponent,
    GeneralPopupComponent,
    ToastContainerComponent ,
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Project-Management';
}
