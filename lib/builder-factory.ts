import { Container } from "aurelia-dependency-injection/dist/aurelia-dependency-injection";

import { ValidatedBundleConfig } from './models';
import { getFullModuleName } from './module-name-utils';
import { Config } from './done/config';
import { ConfigSet } from './done/config-set';
import { FileManager, FileExistsError } from "./done/file-manager";

import * as Builder from 'systemjs-builder';
import * as sysUtil from 'systemjs-builder/lib/utils.js';
import * as path from 'path';
import * as utils from './utils';
import * as htmlminifier from 'html-minifier';
import * as CleanCSS from 'clean-css';
import { FetchHook } from './models';

const container = new Container();

export class ConfigManager {
  private fileManager: FileManager;
  private builder: Builder.BuilderInstance;

  constructor() {
    this.fileManager = new FileManager();
  }

  public load(config: Config, baseURL: string, overrideConfig: any) {
    let builder = new Builder(baseURL);

    builder.config(config.data, false, true);
    builder.config(overrideConfig);

    this.builder = builder;
  }

  public depCache(cfg: ValidatedBundleConfig) {
    let buildExpression = this.createBuildExpression(cfg);
    return this._depCache(buildExpression, cfg);
  }

  public bundle(cfg: ValidatedBundleConfig) {
    let buildExpression = this.createBuildExpression(cfg);
    cfg.options.fetch = this.createFetchHook(cfg);

    let tasks = [ this._bundle(buildExpression, cfg) ];

    if (cfg.options.depCache) {
      tasks.push(this._depCache(buildExpression, cfg));
    }

    return Promise.all<any>(tasks);
  }
  private createBuildExpression(cfg: ValidatedBundleConfig) {
    const configSet: ConfigSet = container.get(ConfigSet);
    configSet.load(cfg.configPath);

    let map = configSet.map;
    let includes = cfg.includes;
    let excludes = cfg.excludes;

    let includeExpression = includes.map(m => getFullModuleName(m, map)).join(' + ');
    let excludeExpression = excludes.map(m => getFullModuleName(m, map)).join(' - ');

    return excludeExpression ? `${includeExpression} - ${excludeExpression}`  : includeExpression;
  }

  private async _depCache(buildExpression: string, cfg: ValidatedBundleConfig) {
    let builder = this.builder;
    let tree = await builder.trace(buildExpression, cfg.options);
    let depCache = builder.getDepCache(tree);
    let configPath = cfg.injectionConfigPath;

    const config: Config = container.get(Config);
    config.load(configPath);
    config.setDepCache(depCache);
    config.save();
  }

  private async _bundle(buildExpression: string, cfg: ValidatedBundleConfig) {
    let builder = this.builder;
    let bundle = await builder.bundle(buildExpression, cfg.options);
    let outfile = utils.getOutFileName(bundle.source, cfg.bundleName + '.js', cfg.options.rev);
    let outPath = createOutputPath(cfg.baseURL, outfile, cfg.outputPath);
    this.writeBundle(bundle, outPath, cfg.force, cfg.options.sourceMaps);
    if (cfg.options.sourceMaps) {
      this.writeSourcemaps(bundle, `${outPath}.map`, cfg.force);
    }
    if (cfg.options.inject) {
      this.injectBundle(builder, bundle, outfile, cfg);
    }
  }
  private async writeSourcemaps(output: Builder.Output, filePath: string, force: boolean) {
    try {
      await this.fileManager.writeFile(filePath, output.sourceMap, force);
    } catch (error) {
      if (error instanceof FileExistsError) {
        throw new Error(`A source map named '${error.filePath}' already exists. Use the --force option to overwrite it.`);
      }
      throw error;
    }
  }

  private async writeBundle(output: Builder.Output, filePath: string, force: boolean, sourceMap: boolean) {
    let source = output.source;

    if (sourceMap) {
      let fileName = this.fileManager.getFileName(filePath);
      source += `\n//# sourceMappingURL=${fileName}.map`;
    }

    try {
      await this.fileManager.writeFile(filePath, source, force);
    } catch (error) {
      if (error instanceof FileExistsError) {
        error.message = `A bundle named '${error.filePath}' already exists. Use the --force option to overwrite it.`;
      }
      throw error;
    }
  }

  private injectBundle(builder: Builder.BuilderInstance, output: Builder.Output, outfile: string, cfg: ValidatedBundleConfig) {
    let configPath = cfg.injectionConfigPath;
    let bundleName = builder.getCanonicalName(sysUtil.toFileURL(path.resolve(cfg.baseURL, outfile)));

    const config: Config = container.get(Config);
    config.load(configPath);
    config.setBundle(bundleName, output.modules.sort());
    config.save();
  }

  private createFetchHook(cfg: ValidatedBundleConfig): FetchHook {
    return (load: any, fetch: (load: any) => any): string | any => {
      let address = sysUtil.fromFileURL(load.address);
      let ext = path.extname(address); // fm.getExtension

      // TODO if not cfg.options.minify then dont add fetchHook and remove below
      if ((ext !== '.html' && ext !== '.css') || !cfg.options.minify || !this.isTextPlugin(load.name)) {
        return fetch(load);
      }

      let content = fs.readFileSync(address, 'utf8');
      switch (ext) {
        case '.html':
          return this.minifyHtml(content, cfg);
        case '.css':
          return this.minifyCss(content, cfg);
        default:
          throw new Error('Unknown extension - coding error');
      }
    };
  }

  private minifyHtml(content: string, cfg: ValidatedBundleConfig) {
    let opts = utils.getHTMLMinOpts(cfg.options.htmlminopts);

    return htmlminifier.minify(content, opts);
  }

  private minifyCss(content: string, cfg: ValidatedBundleConfig) {
    let opts = utils.getCSSMinOpts(cfg.options.cssminopts);

    let output = new CleanCSS(opts).minify(content);

    if (output.errors.length) {
      throw new Error('CSS Plugin:\n' + output.errors.join('\n'));
    }

    return output.styles;
  }

  private isTextPlugin(loadName: string) {
    let pluginUrl = loadName.split('!')[1];
    let pluginPath = sysUtil.fromFileURL(pluginUrl);
    let pluginName = path.basename(pluginPath);

    return pluginName.startsWith('plugin-text');
  }
}

function createOutputPath(baseURL: string, outfile: string, outputPath?: string) {
  return outputPath ? path.resolve(outputPath, path.basename(outfile)) : path.resolve(baseURL, outfile);
}
