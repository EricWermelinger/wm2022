import { Component } from '@angular/core';
import { first } from 'rxjs';
import { ApiService } from 'src/app/api/api.service';
import { Leaderboard } from 'src/app/dto/leaderboard';
import { appRoutes } from '../security/appRoutes';
import { TokenService } from '../security/token.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent {

  leaderboard: Leaderboard[] = [];
  showSpinner = true;

  constructor(
    private tokenService: TokenService,
    private api: ApiService,
  ) {
    const leaderboard$ = this.api.callApi<Leaderboard[]>(appRoutes.leaderboard, { }, 'GET').pipe(first());
    leaderboard$.subscribe(leaderboard => {
      this.leaderboard = leaderboard;
      this.showSpinner = false;
    });
  }

  logout() {
    this.tokenService.logout();
  }
}