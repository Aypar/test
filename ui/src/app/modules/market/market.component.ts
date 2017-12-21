import {Component} from '@angular/core';
import {WebSocketService} from "../../services/web-socket.service";
import * as _ from 'underscore';

@Component({
  selector: 'market',
  templateUrl: './market.component.html',
})
export class MarketComponent {
  title = 'Market';
  webSocket: SocketIOClient.Socket;
  amount: number;
  bid_price: number;
  ask_amount: number;
  ask_price: number;
  bids: {[key:string]:number} = {};
  asks: {[key:string]:number} = {};

  constructor(webSocketService: WebSocketService) {

    this.webSocket = webSocketService.connect();
    // for(let i = 0; i < 10000;i++)
    // {
    //   this.webSocket.emit('bid', {
    //     member: '5a3926a25e2afeb4401e1bdf',
    //     amount: 10 *Math.random(),
    //     rate: Math.random(),
    //     market: '5a39277a5e2afeb4401e1be6',
    //   });
    //   this.webSocket.emit('ask', {
    //     member: '5a3926a25e2afeb4401e1bdf',
    //     amount: 10* Math.random(),
    //     rate: Math.random(),
    //     market: '5a39277a5e2afeb4401e1be6',
    //   });
    // }
    this.webSocket.on('exchange_state', (message) => {

      this.onExchangeState(message);
    });
    this.webSocket.on('update_exchange_state', (message) => {
      this.onExchangeUpdate(message);
    });
  }

  buyOrder() {
    this.webSocket.emit('bid', {
      member: '5a3926a25e2afeb4401e1bdf',
      amount: this.amount,
      rate: this.bid_price,
      market: '5a39277a5e2afeb4401e1be6',
    });

  }

  sellOrder() {
    this.webSocket.emit('ask', {
      member: '5a3926a25e2afeb4401e1bdf',
      amount: this.ask_amount,
      rate: this.ask_price,
      market: '5a39277a5e2afeb4401e1be6',
    });

  }

  onExchangeState(message: any) {

    _.each(message.bids, (bids: any) => {
      _.each(bids, (bid: any) => {
        let key = bid.rate.toString();
        this.bids[key] = this.bids[key] || 0;
        this.bids[key] += Number(bid.amount)
      });


    });
    _.each(message.asks, (asks: any) => {
      _.each(asks, (ask: any) => {
        let key = ask.rate.toString();

        this.asks[key] = this.asks[key] || 0;
        this.asks[key] += Number(ask.amount)
      })
    });
console.log(Object.keys(this.asks));
  }

  onExchangeUpdate(message: any) {

    if (message.bid) {
      let key = message.bid.rate.toString();
      this.bids[key] = this.bids[key] || 0;
      this.bids[key] += message.bid.amount;
    }

    if (message.ask) {
      let key = message.ask.rate.toString();
      this.asks[key] = this.asks[key] || 0;
      this.asks[key] += message.ask.amount;
    }

    message.fills.forEach((fill) => {
      if (fill.type === 'ask') {
        this.asks[fill.rate] -= fill.amount;
        if (this.asks[fill.rate] === 0) {
          delete this.asks[fill.rate];
        }
      }
      if (fill.type === 'fill') {
        this.bids[fill.rate] -= fill.amount;
        if (this.bids[fill.rate] === 0) {
          delete this.bids[fill.rate];
        }
      }

    });
  }
}
