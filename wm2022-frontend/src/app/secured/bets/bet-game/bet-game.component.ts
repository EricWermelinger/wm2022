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
  @Input() isAdmin: boolean = false;
  @Input() isOther: boolean = false;
  form: FormGroupTyped<BetsRequest>;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      id: ['', Validators.required],
      score1: [0, [Validators.required, Validators.min(0), Validators.max(9)]],
      score2: [0, [Validators.required, Validators.min(0), Validators.max(9)]],
      team1: '',
      team2: '',
    }) as FormGroupTyped<BetsRequest>;
  }

  ngOnInit(): void {
    this.form.patchValue(this.bet as BetsRequest);
  }

  save() {
    const bet = {
      ...this.form.value,
    }
    if (this.isAdmin) {
      this.api.callApi(appRoutes.admin, bet, 'POST').subscribe();
    } else {
      this.api.callApi(appRoutes.bets, bet, 'POST').subscribe();
    }
  }

  countryToIso2Code(country: string) {
    const countries = [
      // Katar, Ecuador, Senegal, Niederlande
      { name: 'Katar', code: 'qa' },
      { name: 'Ecuador', code: 'ec' },
      { name: 'Senegal', code: 'sn' },
      { name: 'Niederlande', code: 'nl' },
      // England, Iran, USA, Wales
      { name: 'England', code: 'gb-eng' },
      { name: 'Iran', code: 'ir' },
      { name: 'USA', code: 'us' },
      { name: 'Wales', code: 'gb-wls' },
      // Argentinien, Saudi-Arabien, Mexiko, Polen
      { name: 'Argentinien', code: 'ar' },
      { name: 'Saudi-Arabien', code: 'sa' },
      { name: 'Mexiko', code: 'mx' },
      { name: 'Polen', code: 'pl' },
      // Frankreich, Australien, Dänemark, Tunesion
      { name: 'Frankreich', code: 'fr' },
      { name: 'Australien', code: 'au' },
      { name: 'Dänemark', code: 'dk' },
      { name: 'Tunesien', code: 'tn' },
      // Spanien, Costa Rica, Deutschland, Japan
      { name: 'Spanien', code: 'es' },
      { name: 'Costa Rica', code: 'cr' },
      { name: 'Deutschland', code: 'de' },
      { name: 'Japan', code: 'jp' },
      // Belgien, Kanada, Marokko, Kroatien
      { name: 'Belgien', code: 'be' },
      { name: 'Kanada', code: 'ca' },
      { name: 'Marokko', code: 'ma' },
      { name: 'Kroatien', code: 'hr' },
      // Brasilien, Serbien, Schweiz, Kamerun
      { name: 'Brasilien', code: 'br' },
      { name: 'Serbien', code: 'rs' },
      { name: 'Schweiz', code: 'ch' },
      { name: 'Kamerun', code: 'cm' },
      // Portugal, Ghana, Uruguay, Südkorea
      { name: 'Portugal', code: 'pt' },
      { name: 'Ghana', code: 'gh' },
      { name: 'Uruguay', code: 'uy' },
      { name: 'Südkorea', code: 'kr' },
    ];
    return countries.find(c => c.name === country)?.code;
  }
}