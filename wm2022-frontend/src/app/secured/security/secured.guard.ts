import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class SecuredGuard implements CanActivate {
  
  constructor (
    private tokenService: TokenService,
  ) { }
  
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return of(!!this.tokenService.getToken()).pipe(
      tap(isLoggedIn => {
        if (!isLoggedIn) {
          this.tokenService.navigateLogin();
        }
      })
    );
  }  
}