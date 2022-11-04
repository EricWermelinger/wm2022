import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from 'src/app/api/api.service';
import { BetsRequest, BetsResponse } from 'src/app/dto/bets';
import { FormGroupTyped } from 'src/app/material/types';
import { appRoutes } from '../../security/appRoutes';

@Component({
  selector: 'app-bet-game',
  templateUrl: './bet-game.component.html',
  styleUrls: ['./bet-game.component.scss']
})
export class BetGameComponent implements OnInit {

  @Input() bet?: BetsResponse = undefined;
  form: FormGroupTyped<BetsRequest>;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      id: ['', Validators.required],
      score1: [0, Validators.required],
      score2: [0, Validators.required],
    }) as FormGroupTyped<BetsRequest>;
  }

  ngOnInit(): void {
    if (this.bet) {
      this.form.patchValue(this.bet);
    }
  }

  save() {
    const bet = {
      ...this.form.value,
    }
    this.api.callApi(appRoutes.bets, bet, 'POST').subscribe();
  }
}