import { Container } from 'aurelia-dependency-injection';
import { BundlerConfigManager } from './done/bundler-config-manager';
import { FileManager } from "./done/file-manager";

import * as cheerio from 'cheerio';
import { BundlerConfig, Inject, ValidatedBundlerConfig, ValidatedBundleConfig} from './models';
import { getHtmlImportBundleConfig } from './utils';
import { Config } from "./done/config";


const container = new Container();
const bundlerConfigManager: BundlerConfigManager = container.get(BundlerConfigManager);
const fileManager: FileManager = container.get(FileManager);

export function unbundle(bundlerConfig: BundlerConfig) {
  const validatedBundlerConfig = bundlerConfigManager.validateConfig(bundlerConfig);

  removeBundles(validatedBundlerConfig);

  return removeHtmlImportBundles(validatedBundlerConfig);
}

function removeBundles(cfg: ValidatedBundlerConfig) {
  let configPath = cfg.injectionConfigPath;
  let config: Config = container.get(Config);
  config.load(configPath);
  config.removeBundles();
  config.removeDepCache();
  config.save();
}

function removeHtmlImportBundles(config: ValidatedBundlerConfig) {
  let tasks: Promise<any>[] = [];
  Object
    .keys(config.bundles)
    .forEach((key) => {
      let cfg = config.bundles[key];
      if (cfg.htmlimport) {
        let htmlImportBundleConfig = getHtmlImportBundleConfig(cfg, key, config);
        tasks.push(_removeHtmlImportBundle(htmlImportBundleConfig));
      }
    });

  return Promise.all<any>(tasks);
}

async function _removeHtmlImportBundle(cfg: ValidatedBundleConfig) {
  let inject =  cfg.options.inject as Inject;
  let file = fileManager.resolve(cfg.baseURL, inject.destFile);
  let fileExists = await fileManager.fileExists(file);

  if (fileExists) {
    let content = await fileManager.readFile(file);
    let html = removeLinkInjections(content);
    await fileManager.writeFile(file, html);
  }
}

function removeLinkInjections(html: string) {
  let $ = cheerio.load(html);
  $('link[aurelia-view-bundle]').remove();
  return $.html();
}
