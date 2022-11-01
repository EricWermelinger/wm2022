import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/api/api.service';
import { BetsResponse, Round } from 'src/app/dto/bets';
import { appRoutes } from '../security/appRoutes';

@Component({
  selector: 'app-bets',
  templateUrl: './bets.component.html',
  styleUrls: ['./bets.component.scss']
})
export class BetsComponent {

  bets$: Observable<BetsResponse[]>;

  constructor(
    private api: ApiService,
  ) {
    this.bets$ = this.api.callApi<BetsResponse[]>(appRoutes.bets, { }, 'GET');
  }

  filter(bets: BetsResponse[], round: Round) {
    return bets.filter(bet => bet.round === round);
  }
}