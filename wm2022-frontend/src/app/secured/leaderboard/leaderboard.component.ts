import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Leaderboard } from 'src/app/dto/leaderboard';
import { countryToIso2Code } from '../bets/bet-game/bet-game.component';
import { BetsComponent } from '../bets/bets.component';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent {

  @Input() leaderboard: Leaderboard[] = [];

  constructor(
    private dialog: MatDialog,
  ) { }

  openDetail(isCurrentUser: boolean, username: string) {
    if (isCurrentUser) {
      return;
    }
    this.dialog.open(BetsComponent, {
      data: username,
    });
  }

  countryToIso2Code(country: string) {
    return countryToIso2Code(country);
  }
}