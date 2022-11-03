import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { catchError, NEVER, Observable } from 'rxjs';
import { TokenService } from '../secured/security/token.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor(
    private token: TokenService,
    private toastr: ToastrService,
  ) { }

  private cloneRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      }
    });
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.token.getToken();
    if (!!token) {
      request = this.cloneRequest(request, token);
    }

    return next.handle(request).pipe(
      catchError(err => {
        if (err.status === 401) {
          this.token.logout();
        }
        this.toastr.show(err.error, 'Fehler...', { positionClass: 'toast-bottom-right' });
        return NEVER;
      }),
    )
  }
}
