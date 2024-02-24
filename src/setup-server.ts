import http from 'http';
import {
  type Application,
  type ErrorRequestHandler,
  json,
  urlencoded
} from 'express';

import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';
import helmet from 'helmet';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import 'express-async-errors';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

import { config } from './config';
import { appRouter } from './routes';
import { CustomError } from '@globals/helpers/error-handler';

const SERVER_PORT = 5000;
const log = config.createLogger('server');

export class ChattyServer {
  constructor(private app: Application) {}

  public start(): void {
    this.securityMiddlewares(this.app);
    this.standardMiddlewares(this.app);
    this.routesMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddlewares(app: Application): void {
    app.use(
      cookieSession({
        // when we are gonna setup the load balancer in aws, we are gonna have to use this name
        name: 'session',
        keys: [config.SECRET_KEY_ONE, config.SECRET_KEY_TWO],
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: config.NODE_ENV === 'production'
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        // Because we are gonna use the cookies a lot
        // So the cors will not block cookies
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddlewares(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
  }

  private routesMiddleware(app: Application) {
    appRouter(app);
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', (req, res) => {
      res.status(HTTP_STATUS.NOT_FOUND).send({
        message: `${req.originalUrl} NOT FOUND`
      });
    });

    // ERROR HANDLER
    const errorHandler: ErrorRequestHandler = (error, req, res) => {
      if (error instanceof CustomError) {
        return res.status(error.statusCode).send(error.serializeErrors());
      }

      log.error(error);
      log.error(error.message);
    };
    app.use(errorHandler);
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer = new http.Server(app);

      await this.startHttpServer(httpServer);

      const socketIO = await this.createSocketIO(httpServer);
      this.socketIOConnections(socketIO);
    } catch (err) {
      log.error(err);
    }
  }

  private startHttpServer(httpServer: http.Server): Promise<void> {
    return new Promise(resolve => {
      log.info(`Server is started with process: ${process.pid}`);

      httpServer.listen(SERVER_PORT, () => {
        log.info(`Server running on port: ${SERVER_PORT}`);

        resolve();
      });
    });
  }

  private async createSocketIO(httpServer: http.Server) {
    const io = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });

    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    return io;
  }

  private socketIOConnections(io: Server) {
    log.info(io);
  }
}
