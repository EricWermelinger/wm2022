import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './public/login/login.component';
import { SignupComponent } from './public/signup/signup.component';
import { LeaderboardComponent } from './secured/leaderboard/leaderboard.component';
import { BetsComponent } from './secured/bets/bets.component';
import { AdminComponent } from './secured/admin/admin.component';
import { MaterialModule } from './material/material.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomToastyComponent } from './api/custom-toasty/custom-toasty.component';
import { ToastrModule } from 'ngx-toastr';
import { ApiInterceptor } from './api/api.interceptor';
import { PlayerComponent } from './secured/player/player.component';
import { BetGameComponent } from './secured/bets/bet-game/bet-game.component';
import { BetsGamesComponent } from './secured/bets/bets-games/bets-games.component';

@NgModule({
  declarations: [
    AppComponent,
    CustomToastyComponent,
    LoginComponent,
    SignupComponent,
    LeaderboardComponent,
    BetsComponent,
    AdminComponent,
    PlayerComponent,
    BetGameComponent,
    BetsGamesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    ToastrModule.forRoot({
      toastComponent: CustomToastyComponent,
      timeOut: 3000,
      maxOpened: 5,
      newestOnTop: true,
      preventDuplicates: true,
      positionClass: 'toast-bottom-right',
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
