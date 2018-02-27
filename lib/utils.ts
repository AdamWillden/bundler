import * as _ from 'lodash';
import * as revPath from 'rev-path';
import * as revHash from 'rev-hash';

import { Options as CleanCssOptions } from 'clean-css';
import { Options as HtmlMinifierOptions } from 'html-minifier';

import { BundlerConfig, BundleConfig, ConfigBody, Inject, ValidatedBundlerConfig, ValidatedBundleConfig } from './models';

export function getOutFileName(source: string, fileName: string, rev?: boolean) {
  return rev ? revPath(fileName, revHash(new Buffer(source, 'utf-8'))) : fileName;
}

export function getHTMLMinOpts(opts?: HtmlMinifierOptions) {
  return _.defaults<HtmlMinifierOptions>(opts, {
    caseSensitive: true,
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeCDATASectionsFromCDATA: true,
    removeComments: true,
    removeCommentsFromCDATA: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: false,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true
  });
}

export function getCSSMinOpts(opts?: CleanCssOptions) {
  return _.defaults<CleanCssOptions>(opts, {
    advanced: true,
    agressiveMerging: true,
    mediaMerging: true,
    restructuring: true,
    shorthandCompacting: true,
  });
}

export function getBundleConfig(bundleCfg: ConfigBody, bundleName: string, config: BundlerConfig) {
  return _.defaultsDeep<ConfigBody, BundleConfig>(bundleCfg, {
    baseURL: config.baseURL,
    builderCfg: config.builderCfg,
    bundleName: bundleName,
    configPath: config.configPath,
    excludes: [],
    includes: [],
    outputPath: config.outputPath,
    injectionConfigPath: config.injectionConfigPath,
    force: config.force,
    options: {
      depCache: false,
      inject: true,
      minify: false,
    },
  });
}

export function getHtmlImportBundleConfig(bundleCfg: ConfigBody, bundleName: string, config: ValidatedBundlerConfig) {
  let defaults = {
    htmlimport: true,
    includes: [ '*.html' ],
    excludes: [],
    bundleName: bundleName,
    options: {
      inject: false
    },
    force: config.force,
    baseURL: config.baseURL,
    configPath: config.configPath,
    builderCfg: config.builderCfg
  };
  let cfg = _.defaultsDeep<ConfigBody, ValidatedBundleConfig>(bundleCfg, defaults);

  if (!cfg.options.inject) {
    return cfg;
  }

  let injectOptions: Inject = {
    indexFile: 'index.html',
    destFile: 'index.html'
  };

  if (typeof cfg.options.inject === 'boolean') {
    cfg.options.inject = injectOptions;
  } else {
    _.defaults<Inject>(cfg.options.inject, injectOptions);
  }

  return cfg;
}
