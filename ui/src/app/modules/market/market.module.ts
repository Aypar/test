import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {MarketComponent} from './market.component';

@NgModule({
  declarations: [
    MarketComponent
  ],
  imports: [

    BrowserModule
  ],
  providers: [],
  bootstrap: [MarketComponent]
})
export class MarketModule {
}
