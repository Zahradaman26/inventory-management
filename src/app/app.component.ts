import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth-service.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  currentThemeSetting: string = 'light';
  constructor(
    private themeService: ThemeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const localStorageTheme = localStorage.getItem('theme');
    this.currentThemeSetting =
      this.themeService.calculateSettingAsThemeString(localStorageTheme);
    this.themeService.updateThemeOnHtmlEl(this.currentThemeSetting);
  }
}
