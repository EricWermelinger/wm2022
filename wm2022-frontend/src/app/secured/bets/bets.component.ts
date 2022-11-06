import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/api/api.service';
import { BetsResponse, NumberOfRound, Round } from 'src/app/dto/bets';
import { appRoutes } from '../security/appRoutes';

@Component({
  selector: 'app-bets',
  templateUrl: './bets.component.html',
  styleUrls: ['./bets.component.scss']
})
export class BetsComponent {

  bets$: Observable<BetsResponse[]>;
  isAdmin: boolean = false;

  constructor(
    private api: ApiService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.isAdmin = this.activatedRoute.snapshot.url[0].path === appRoutes.admin;
    if (this.isAdmin) {
      this.bets$ = this.api.callApi<BetsResponse[]>(appRoutes.admin, { }, 'GET');
    } else {
      this.bets$ = this.api.callApi<BetsResponse[]>(appRoutes.bets, { }, 'GET');
    }
  }

  filter(bets: BetsResponse[], round: Round) {
    return bets.filter(bet => bet.round === round);
  }

  activeTab(bets: BetsResponse[]) {
    const rounds = bets.filter(bet => bet.editable).map(bet => NumberOfRound(bet.round)).sort((a, b) => a - b);
    if (rounds.length > 0) {
      return rounds[0] - 1;
    }
    return 0;
  }
}