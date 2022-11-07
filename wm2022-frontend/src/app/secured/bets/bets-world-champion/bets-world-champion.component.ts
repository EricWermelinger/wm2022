import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/api/api.service';
import { WorldChampion } from 'src/app/dto/worldChampion';
import { appRoutes } from '../../security/appRoutes';

@Component({
  selector: 'app-bets-world-champion',
  templateUrl: './bets-world-champion.component.html',
  styleUrls: ['./bets-world-champion.component.scss']
})
export class BetsWorldChampionComponent implements OnInit {

  @Input() isAdmin: boolean = false;
  @Input() isOther: boolean = false;
  @Input() username: string = '';
  form: FormGroup;
  bet$: Observable<WorldChampion> | undefined;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      worldChampion: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (!this.isOther) {
      this.bet$ = this.api.callApi<WorldChampion>(appRoutes.worldChampion, {}, 'GET');
    } else {
      this.bet$ = this.api.callApi<WorldChampion>(appRoutes.othersWorldChampion, { username: this.username }, 'GET');
    }
    this.bet$.subscribe((wc: any) => {
      if (!this.isOther) {
        this.form.patchValue(wc.worldChampion);
      }
    });
  }

  save(worldChampion: string) {
    if (this.isAdmin) {
      this.api.callApi('adminWorldChampion', { worldChampion }, 'POST').subscribe();
    } else {
      this.api.callApi('worldChampion', { worldChampion }, 'POST').subscribe();
    }
  }

  getTeams() {
    const allCountries = [
      'Katar',
      'Ecuador',
      'Senegal',
      'Niederlande',
      'England',
      'Iran',
      'USA',
      'Wales',
      'Argentinien',
      'Saudi-Arabien',
      'Mexiko',
      'Polen',
      'Frankreich',
      'Australien',
      'Dänemark',
      'Tunesien',
      'Spanien',
      'Costa Rica',
      'Deutschland',
      'Japan',
      'Belgien',
      'Kanada',
      'Marokko',
      'Kroatien',
      'Brasilien',
      'Serbien',
      'Schweiz',
      'Kamerun',
      'Portugal',
      'Ghana',
      'Uruguay',
      'Südkorea',
    ];
    return allCountries.sort();
  }
}