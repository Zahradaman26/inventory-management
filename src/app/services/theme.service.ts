import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  updateThemeOnHtmlEl(theme: string): void {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }

  updateButton(buttonEl: HTMLElement, isDark: boolean): void {
    const newCta = isDark ? 'dark' : 'light';
    buttonEl.setAttribute('aria-label', newCta);
    buttonEl.innerText = newCta;
  }

  calculateSettingAsThemeString(localStorageTheme: string | null): string {
    // Determine if a theme exists in localStorage, otherwise return 'light' by default
    return localStorageTheme === 'dark' ? 'dark' : 'light';
  }
}
