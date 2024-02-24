import mongoose from 'mongoose';
import { config } from './config';

const log = config.createLogger('database');

export function setupDb() {
  const connect = () => {
    mongoose
      .connect(config.DATABASE_URL)
      .then(() => log.info('Successfully connected to database'))
      .catch(() => {
        log.error('Error connecting to database');
        return process.exit(1);
      });
  };

  connect();

  // whenever the disconnected event will be called, try to connect again
  mongoose.connection.on('disconnected', connect);
}
