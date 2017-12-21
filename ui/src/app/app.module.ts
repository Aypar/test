import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {MarketComponent} from "./modules/market/market.component";
import {WebSocketService} from "./services/web-socket.service";
import {KeysPipe} from './pipes/keys.pipe';


@NgModule({
  declarations: [
    AppComponent,
    MarketComponent,
    KeysPipe
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    FormsModule,
  ],
  providers: [WebSocketService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
