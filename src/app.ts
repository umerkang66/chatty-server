import express from 'express';

import { ChattyServer } from './setup-server';
import { setupDb } from './setup-db';

class Application {
  public initialize(): void {
    setupDb();

    const app = express();
    const server = new ChattyServer(app);

    server.start();
  }
}

const application = new Application();
application.initialize();
