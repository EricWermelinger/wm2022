import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/api/api.service';
import { Leaderboard } from 'src/app/dto/leaderboard';
import { BetsComponent } from '../bets/bets.component';
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
    private dialog: MatDialog,
  ) {
    this.leaderboard$ = this.api.callApi<Leaderboard[]>(appRoutes.leaderboard, { }, 'GET');
  }

  openDetail(isCurrentUser: boolean, username: string) {
    if (isCurrentUser) {
      return;
    }
    this.dialog.open(BetsComponent, {
      data: username,
    });
  }
}