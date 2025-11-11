import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth-service.service';


@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SideNavComponent implements AfterViewInit, OnInit, OnDestroy {
  title = 'SideNav';
  currentYear: number = new Date().getFullYear();
  private routerSubscription!: Subscription;
  @ViewChild('themeButton') themeButton!: ElementRef<HTMLElement>;

  currentThemeSetting: string = 'light';
  isSidebarOpen = true;

  constructor(private router: Router,
    private themeService: ThemeService,
    private renderer: Renderer2,
    private el: ElementRef,
    private authService: AuthService
  ) { }
  ngOnInit(): void {

    const localStorageTheme = localStorage.getItem('theme');
    this.currentThemeSetting = this.themeService.calculateSettingAsThemeString(localStorageTheme);

    setTimeout(() => {
      if (this.themeButton) {
        this.themeService.updateButton(this.themeButton.nativeElement, this.currentThemeSetting === 'dark');
      }
    });


    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.handleSidebarActiveClass(event);  // Call your function after route change
      }
    });
  }
  ngOnDestroy() {
    // Unsubscribe to avoid memory leaks
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    const submenuItems = document.querySelectorAll('.sidebar-menu .sidebar-submenu li');
    submenuItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from affecting the parent `.dropdown`
        console.log('Sidebar submenu item clicked');
      });
    });

    // Handle dropdown toggle
    const dropdowns = document.querySelectorAll<HTMLElement>('.sidebar-menu .dropdown');
    dropdowns.forEach((dropdown) => {
      dropdown.addEventListener('click', (event) => {
        event.stopPropagation(); // Avoid further bubbling if necessary

        const current = event.currentTarget as HTMLElement;

        // Close sibling dropdowns
        const siblings = Array.from(current.parentElement?.children || []).filter(
          (el) => el !== current && el.classList.contains('dropdown')
        );

        siblings.forEach((sibling) => {
          const submenu = sibling.querySelector<HTMLElement>('.sidebar-submenu');
          if (submenu) {
            submenu.style.display = 'none';
          }
          sibling.classList.remove('dropdown-open', 'open');
        });

        // Toggle current submenu
        const submenu = current.querySelector<HTMLElement>('.sidebar-submenu');
        if (submenu) {
          submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        }

        current.classList.toggle('dropdown-open');
      });
    });
  }


  toggleSidebar(event: Event) {
    const toggleButton = event.currentTarget as HTMLElement;

    // Toggle 'active' on clicked button
    if (toggleButton.classList.contains('active')) {
      this.renderer.removeClass(toggleButton, 'active');
    } else {
      this.renderer.addClass(toggleButton, 'active');
    }

    // Toggle 'active' on .sidebar
    const sidebar = this.el.nativeElement.querySelector('.sidebar');
    if (sidebar.classList.contains('active')) {
      this.renderer.removeClass(sidebar, 'active');
    } else {
      this.renderer.addClass(sidebar, 'active');
    }

    // Toggle 'active' on .dashboard-main
    const dashboardMain = this.el.nativeElement.querySelector('.dashboard-main');
    if (dashboardMain.classList.contains('active')) {
      this.renderer.removeClass(dashboardMain, 'active');
    } else {
      this.renderer.addClass(dashboardMain, 'active');
    }
  }
  openSidebar() {
    this.isSidebarOpen = true;
    this.renderer.addClass(document.body, 'overlay-active');
  }
  closeSidebar() {
    this.isSidebarOpen = false;

    // Remove 'overlay-active' class from body
    this.renderer.removeClass(document.body, 'overlay-active');
  }

  handleSidebarActiveClass(event: NavigationEnd) {

    const sidebarMenu = document.querySelector('ul#sidebar-menu');

    if (!sidebarMenu) return;

    // 1. Remove existing .active-page and .open classes
    const activeLinks = sidebarMenu.querySelectorAll('a.active-page');
    activeLinks.forEach((a) => {
      a.classList.remove('active-page', 'open');
      a.parentElement?.classList.remove('active-page', 'open');
    });

    // 2. Find anchor with matching routerLink
    const currentPath = window.location.pathname;
    const allAnchors = sidebarMenu.querySelectorAll('a');
    let matchedAnchor: HTMLElement | null = null;

    allAnchors.forEach((anchor) => {
      const routerLink = anchor.getAttribute('routerlink');
      if (routerLink === currentPath) {
        anchor.classList.add('active-page');
        anchor.parentElement?.classList.add('active-page');
        matchedAnchor = anchor;
      }
    });

    // 3. Walk up the parent chain to add .show and .open
    let o = matchedAnchor?.parentElement;
    while (o && o.tagName === 'LI') {
      const parentUl = o.parentElement;
      if (parentUl && parentUl.classList.contains('sidebar-submenu')) {
        parentUl.classList.add('show');
        const parentLi = parentUl.parentElement;
        parentLi?.classList.add('open');
        o = parentLi;
      } else {
        break;
      }
    }

    // 4. Remove .open and .dropdown-open from siblings of active-page
    const activeListItems = sidebarMenu.querySelectorAll('li.active-page');
    activeListItems.forEach((li) => {
      const siblings = Array.from(li.parentElement?.children || []).filter(
        (el) => el !== li && el.classList.contains('dropdown-open')
      );

      siblings.forEach((sibling) => {
        sibling.classList.remove('open', 'dropdown-open');
        const submenu = sibling.querySelector<HTMLElement>('.sidebar-submenu');
        if (submenu) {
          submenu.style.display = 'none';
        }
      });
    });
  }

  toggleTheme(): void {
    const newTheme = this.currentThemeSetting === 'dark' ? 'light' : 'dark';

    // Save the new theme to localStorage
    localStorage.setItem('theme', newTheme);

    // Update button and theme
    if (this.themeButton) {
      this.themeService.updateButton(this.themeButton.nativeElement, newTheme === 'dark');
      this.themeService.updateThemeOnHtmlEl(newTheme);
    }

    // Update the current theme setting
    this.currentThemeSetting = newTheme;
  }

  //on logout -> from auth-service.ts
  onLogout(): void {
    this.authService.logout();
  }
}





