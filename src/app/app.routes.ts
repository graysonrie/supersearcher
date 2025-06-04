import { Routes } from "@angular/router";
import { HomePageComponent } from "./features/home-page/home-page.component";
import { SettingsPageComponent } from "./features/settings-page/settings-page.component";

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomePageComponent },
    { path: 'settings', component: SettingsPageComponent },
];
