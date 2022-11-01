import { Component, Input, OnInit } from '@angular/core';
import { BetsResponse } from 'src/app/dto/bets';

@Component({
  selector: 'app-bets-games',
  templateUrl: './bets-games.component.html',
  styleUrls: ['./bets-games.component.scss']
})
export class BetsGamesComponent implements OnInit {

  @Input() games: BetsResponse[] = [];
  init: boolean = false;

  constructor() { }
  ngOnInit(): void {
    this.init = true;
  }
}