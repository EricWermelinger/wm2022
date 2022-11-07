import { Component, Input, OnInit } from '@angular/core';
import { BetsResponse, Round, NumberOfRound } from 'src/app/dto/bets';

@Component({
  selector: 'app-bets-wrapper',
  templateUrl: './bets-wrapper.component.html',
  styleUrls: ['./bets-wrapper.component.scss']
})
export class BetsWrapperComponent implements OnInit {

  @Input() isAdmin: boolean = false;
  @Input() isOther: boolean = false;
  @Input() username: string = '';
  @Input() bets: BetsResponse[] = [];
  init: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.init = true;
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