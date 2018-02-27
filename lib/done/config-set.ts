import { factory, transient } from 'aurelia-dependency-injection';

import * as _ from 'lodash';

import { Config, ConfigFactory } from './config';
import { ConfigData } from "./interfaces/config-data";

@transient()
export class ConfigSet {
  private configs: Config[];

  constructor(
    @factory(Config) private readonly configFactory: ConfigFactory,
  ) {
    this.configs = [];
  }

  public async load(configPaths: string | string[]) {
    if (typeof configPaths === 'string') {
      configPaths = [configPaths];
    }

    let loadingConfigs: Promise<void>[] = [];

    this.configs = configPaths.map(x => {
      let config = this.configFactory();
      loadingConfigs.push(config.load(x));
      return config;
    });

    await Promise.all(loadingConfigs);
  }

  public async save() {
    await Promise.all(this.configs.map(x => x.save()));
  }

  public get map() {
    return this.data.map;
  }

  private get data(): ConfigData {
    let data: any = {};

    this.getFlattenedInfo()
      .forEach(x => _.merge(data, x.data));

    return data as ConfigData;
  }

  public removeBundles() {
    // TODO
  }

  public removeDepCache() {
    // TODO
  }

  private getFlattenedInfo() {
    return this.configs
      .map(x => x.info)
      .reduce((x, y) => x.concat(y));
  }
}
