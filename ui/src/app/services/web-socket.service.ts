import {Injectable} from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class WebSocketService {


  constructor() {


  }

  /**
   *
   * @returns {SocketIOClient.Socket}
   */
  connect() {
    return io('http://localhost:3000');
  }
}
