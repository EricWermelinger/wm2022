import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './public/login/login.component';
import { SignupComponent } from './public/signup/signup.component';
import { BetsComponent } from './secured/bets/bets.component';
import { LeaderboardComponent } from './secured/leaderboard/leaderboard.component';
import { PlayerComponent } from './secured/player/player.component';
import { appRoutes } from './secured/security/appRoutes';
import { SecuredGuard } from './secured/security/secured.guard';

const routes: Routes = [
  { path: '', redirectTo: appRoutes.login, pathMatch: 'full' },
  { path: appRoutes.login, component: LoginComponent },
  { path: appRoutes.signup, component: SignupComponent },
  {
    path: appRoutes.app,
    canActivate: [SecuredGuard],
    children: [
      { path: appRoutes.player, component: PlayerComponent },
      { path: appRoutes.admin, component: BetsComponent },
    ],
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
