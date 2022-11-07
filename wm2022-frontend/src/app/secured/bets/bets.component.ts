import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/api/api.service';
import { BetsResponse } from 'src/app/dto/bets';
import { appRoutes } from '../security/appRoutes';

@Component({
  selector: 'app-bets',
  templateUrl: './bets.component.html',
  styleUrls: ['./bets.component.scss']
})
export class BetsComponent {

  bets$: Observable<BetsResponse[]>;
  isAdmin: boolean = false;
  isOther: boolean = false;

  constructor(
    private api: ApiService,
    private activatedRoute: ActivatedRoute,
    @Optional() @Inject(MAT_DIALOG_DATA) public username: string | undefined,
  ) {
    this.isAdmin = this.activatedRoute.snapshot.url[0]?.path === appRoutes.admin;
    this.isOther = !!this.username;
    this.bets$ = this.api.callApi<BetsResponse[]>(this.getEndpoint(), this.getParams(), 'GET');
  }

  getEndpoint() {
    if (this.isAdmin) {
      return appRoutes.admin;
    }
    if (this.isOther) {
      return appRoutes.other;
    }
    return appRoutes.bets;
  }

  getParams() {
    if (this.isOther) {
      return { username: this.username };
    }
    return {};
  }
}