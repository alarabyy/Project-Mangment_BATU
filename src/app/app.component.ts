import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { CommonModule } from '@angular/common';
import { FooterComponent } from "./components/footer/footer.component";
import { FloatingControlsComponent } from "./components/floating-controls/floating-controls.component";
import { LoaderComponent } from "./components/loader/loader.component";
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [CommonModule ,HttpClientModule ,FormsModule , RouterOutlet, NavComponent, CommonModule, FooterComponent, FloatingControlsComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Project-Management';
}
