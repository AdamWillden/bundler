import * as _ from 'lodash';
import { FileManager } from './file-manager';
import { BundlerConfig, ValidatedBundlerConfig } from '../models';

export class BundlerConfigManager {
    constructor(
      private readonly fileManager: FileManager
    ) { }

  public validateConfig(bundlerConfig: BundlerConfig): ValidatedBundlerConfig {
    const validatedBudlerConfig = this.ensureDefaults(bundlerConfig);
    this.assertBaseUrlExists(validatedBudlerConfig);
    this.assertConfigPathsExist(validatedBudlerConfig);
    return validatedBudlerConfig;
  }

  private ensureDefaults(config: BundlerConfig): ValidatedBundlerConfig {
    const defaults: BundlerConfig = {
      baseURL: '.',
      builderCfg: {},
      bundles: {},
      configPath: './config.js',
      force: false,
      injectionConfigPath: this.getInjectionConfigPathDefault(config.configPath),
    };
    return _.defaults<ValidatedBundlerConfig, BundlerConfig, BundlerConfig>({} as any, config, defaults);
  }

  private assertConfigPathsExist(bundlerConfig: BundlerConfig) {
    let configPaths = bundlerConfig.configPath;

    if (typeof configPaths === 'string') {
      configPaths = [configPaths];
    }

    configPaths.forEach(x => this.assertConfigPathExists(x));
  }

  private async assertBaseUrlExists(bundlerConfig: BundlerConfig) {
    let baseURL = bundlerConfig.baseURL;
    let fileExists = await this.fileManager.fileExists(baseURL);
    if (!fileExists) {
      let absoluteBaseUrl = this.fileManager.resolve(baseURL);
      throw new Error(`Path '${absoluteBaseUrl}' does not exist. Please provide a valid 'baseURL' in your bundle configuration.`);
    }
  }

  private async assertConfigPathExists(configPath: string) {
    let fileExists = await this.fileManager.fileExists(configPath);
    if (!fileExists) {
      let absoluteConfigPath = this.fileManager.resolve(configPath);
      throw new Error(`File '${absoluteConfigPath}' was not found! Please provide a valid 'config.js' file for use during bundling.`);
    }
  }

  private getInjectionConfigPathDefault(configPath: string | string[]) {
    if (typeof configPath === 'string') {
      return configPath;
    } else if (Array.isArray(configPath)) {
      return configPath[0];
    } else {
      throw new Error('No bundle injection config file path provided. Set `injectionConfigPath` property in the bundle config.');
    }
  }
}
