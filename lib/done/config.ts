import * as _ from 'lodash';
import { autoinject, transient } from 'aurelia-dependency-injection';

import { ConfigSerializer, ConfigInfo } from './config-serializer';
import { FileManager } from './file-manager';
import { ConfigData } from "./interfaces/config-data";

export type ConfigFactory = () => Config;

@autoinject()
@transient()
export class Config {
  public path: string;
  public info: ConfigInfo[];

  constructor(
    private readonly serializer: ConfigSerializer,
    private readonly fileManager: FileManager,
  ) { }

  public async load(configPath: string) {
    let content = this.fileManager.readFileSync(configPath);
    this.info = this.serializer.parse(content);
    this.path = configPath;
  }

  public async save(): Promise<void> {
    let content = this.serializer.serialize(this.info);
    await this.fileManager.writeFile(this.path, content);
  }

  public setBundle(bundleName: string, modules: any) {
    // TODO find info data which has a bundle?
    let firstInfo = this.info[0].data;

    if (!firstInfo.bundles) {
      firstInfo.bundles = {};
    }

    firstInfo.bundles[bundleName] = modules;
  }

  public setDepCache(depCache: any) {
    // TODO find info data which has a depCache?
    // If multiple which? It matters.
    let firstInfo = this.info[0].data;

    let combinedDepCache = {};
    _.assign(combinedDepCache, depCache, firstInfo.depCache);
    firstInfo.depCache = combinedDepCache;
  }

  public get data(): ConfigData {
    let data: any = {};

    this.info.forEach(x => _.merge(data, x.data));

    return data as ConfigData;
  }

  public removeBundles() {
    this.info.forEach(y => delete y.data.bundles);
  }

  public removeDepCache() {
    this.info.forEach(y => delete y.data.depCache);
  }
}