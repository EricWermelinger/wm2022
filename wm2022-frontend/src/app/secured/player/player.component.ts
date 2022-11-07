import { Component } from '@angular/core';
import { TokenService } from '../security/token.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent {

  constructor(
    private tokenService: TokenService,
  ) { }

  logout() {
    this.tokenService.logout();
  }
}