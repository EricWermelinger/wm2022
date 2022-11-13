import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/api/api.service';
import { LoginRequest, LoginResponse } from 'src/app/dto/login';
import { FormGroupTyped } from 'src/app/material/types';
import { appRoutes } from 'src/app/secured/security/appRoutes';
import { TokenService } from 'src/app/secured/security/token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  form: FormGroupTyped<LoginRequest>;
  showSpinner = true;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private router: Router,
    private token: TokenService,
  ) {
    this.form = this.fb.group({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    }) as FormGroupTyped<LoginRequest>;
  }

  ngOnInit(): void {
    this.api.callApi(appRoutes.wakeUp, {}, 'POST').subscribe(_ => this.showSpinner = false);
  }

  login() {
    this.api.callApi<LoginResponse>(appRoutes.login, this.form.value, 'POST').subscribe(res => {
      this.token.setToken(res.token);
      this.router.navigate([appRoutes.app, appRoutes.player]);
    });
  }

  signup() {
    this.router.navigate([appRoutes.signup]);
  }
}
