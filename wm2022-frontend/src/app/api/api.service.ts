import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
  ) { }

  callApi<T>(endpoint: string, payload: any, method: HttpMethod): Observable<T> {
    const url = `${environment.URL_API}/${endpoint}`;
    let request;
    switch (method) {
      case 'GET':
        request = this.http.get(this.createUrl(url, payload));
        break;
      case 'POST':
        request = this.http.post(url, payload);
        break;
      case 'PUT':
        request = this.http.put(url, payload);
        break;
      case 'DELETE':
        request = this.http.delete(this.createUrl(url, payload));
        break;
    }
    return request as Observable<T>;
  };

  createUrl(url: string, params: any) {
    if (Object.keys(params).length !== 0) {
      for (const key in params) {
        url += `/${params[key]}`;
      }
    }
    return url;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';