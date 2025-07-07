import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { CommonModule } from '@angular/common';
import { FloatingControlsComponent } from "./components/floating-controls/floating-controls.component";
import { LoaderComponent } from "./components/loader/loader.component";
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule ,HttpClientModule ,FormsModule , RouterOutlet, NavComponent, CommonModule, FooterComponent, FloatingControlsComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Project-Management';
}
