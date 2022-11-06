import { Component } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/api/api.service';
import { Leaderboard } from 'src/app/dto/leaderboard';
import { appRoutes } from '../security/appRoutes';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent {

  leaderboard$: Observable<Leaderboard[]>;

  constructor(
    private api: ApiService,
  ) {
    this.leaderboard$ = this.api.callApi<Leaderboard[]>(appRoutes.leaderboard, { }, 'GET');
  }
}