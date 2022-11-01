import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { appRoutes } from './appRoutes';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor(
    private router: Router,
  ) { }

  setToken(token: string) {
    localStorage.setItem(environment.TOKEN_NAME, token);
  }

  getToken() {
    return localStorage.getItem(environment.TOKEN_NAME);
  }

  logout() {
    localStorage.removeItem(environment.TOKEN_NAME);
    this.navigateLogin();
  }

  navigateLogin() {
    this.router.navigate([appRoutes.login]);
  }
}
