import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/api/api.service';
import { SignupRequest, SignupResponse } from 'src/app/dto/signup';
import { FormGroupTyped } from 'src/app/material/types';
import { appRoutes } from 'src/app/secured/security/appRoutes';
import { TokenService } from 'src/app/secured/security/token.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {

  form: FormGroupTyped<SignupRequest>;

  constructor(
    private api: ApiService,
    private router: Router,
    private fb: FormBuilder,
    private token: TokenService,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      code: ['', Validators.required],
    }) as FormGroupTyped<SignupRequest>;
  }

  signup() {
    this.api.callApi<SignupResponse>(appRoutes.signup, this.form.value, 'POST').subscribe(res => {
      this.token.setToken(res.token);
      this.router.navigate([appRoutes.app, appRoutes.player]);
    });
  }

  login() {
    this.router.navigate([appRoutes.login]);
  }
}