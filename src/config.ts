import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config();

/*
// BELOW IS THE CORRECT VERSION OF THIS
type UppercaseKeys<T> = {
  [K in keyof T as Uppercase<K> extends K ? K : never]: K;
};
*/

type UppercaseKeys<T> = {
  [K in keyof T as K extends string
    ? Uppercase<K> extends K
      ? K // here 'K' also should be only uppercase
      : never
    : never]: never; // only need to set the keys, no need to set the values to set the values to never
};
type Props = keyof UppercaseKeys<Config>;

class Config {
  private static instance: Config;

  // because we are validating them all in the future
  public DATABASE_URL: string;
  public JWT_TOKEN: string;
  public NODE_ENV: 'development' | 'production' | 'testing';
  public SECRET_KEY_ONE: string;
  public SECRET_KEY_TWO: string;
  public CLIENT_URL: string;
  public REDIS_HOST: string;

  private constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL!;
    this.JWT_TOKEN = process.env.JWT_TOKEN!;
    this.CLIENT_URL = process.env.CLIENT_URL!;
    this.NODE_ENV = process.env.NODE_ENV as
      | 'development'
      | 'production'
      | 'testing';
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE!;
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO!;
    this.REDIS_HOST = process.env.REDIS_HOST!;

    this.validate('*');
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  private validate(props: '*' | Props[]) {
    if (props === '*') {
      props = Object.keys(this).filter(
        key => key === key.toUpperCase()
      ) as Props[];
    }

    props.forEach(prop => {
      if (!this[prop]) {
        throw new Error(
          `These environment variables should be present: '${prop}'`
        );
      }
    });
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new this();
    }
    return Config.instance;
  }
}

export const config = Config.getInstance();
