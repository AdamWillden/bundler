import { Container } from 'aurelia-dependency-injection';
import { BundlerConfigManager } from './done/bundler-config-manager';

import { ConfigManager } from './builder-factory';
import * as hitb from './html-import-template-bundler';
import { BundlerConfig }  from './models';
import {
  getBundleConfig,
  getHtmlImportBundleConfig,
} from './utils';

const container = new Container();
const bundlerConfigManager: BundlerConfigManager = container.get(BundlerConfigManager);
const configManager: ConfigManager = container.get(ConfigManager);

export function bundle(bundlerConfig: BundlerConfig) {
  let tasks: Promise<any>[] = [];
  let validatedBundlerConfig = bundlerConfigManager.validateConfig(bundlerConfig);

  Object.keys(bundlerConfig.bundles)
    .forEach(key => {
      let cfg = bundlerConfig.bundles[key];
      if (cfg.skip) {
        return;
      }

      if (cfg.htmlimport) {
        tasks.push(hitb.bundle(getHtmlImportBundleConfig(cfg, key, validatedBundlerConfig)));
      } else {
        tasks.push(bundler.bundle(getBundleConfig(cfg, key, bundlerConfig)));
      }
    });

  return Promise.all(tasks);
}

export function depCache(bundlerConfig: BundlerConfig) {
  let tasks: Promise<any>[] = [];
  bundlerConfigManager.validateConfig(bundlerConfig);

  let bundles = bundlerConfig.bundles;
  Object.keys(bundles)
    .forEach(key => {
      let config = bundles[key];

      if (config.skip || config.htmlimport) {
        return;
      }

      tasks.push(bundler.depCache(getBundleConfig(config, key, bundlerConfig)));
    });

  return Promise.all(tasks);
}
