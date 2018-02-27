import { Options as CleanCssOptions } from 'clean-css';
import { Options as HtmlMinifierOptions } from 'html-minifier';

export type FetchHook = (load: any, fetch: (load: any) => any) => void;
export type Inject = { indexFile: string, destFile: string };

export type ConfigHeader = {
  baseURL: string;
  builderCfg?: any;
  configPath: string | string[];
  force?: boolean;
  injectionConfigPath?: string;
  outputPath?: string,
};

export type ValidatedConfigHeader = ConfigHeader & {
  builderCfg: any;
  configPath: string[];
  force: boolean;
  injectionConfigPath: string;
  outputPath: string;
}

export type ConfigBody = {
  skip?: boolean;
  htmlimport?: boolean;
  includes: string[];
  excludes: string[];
  options: {
    inject: boolean | Inject
    sourceMaps: boolean,
    depCache: boolean,
    minify: boolean,
    htmlminopts?: HtmlMinifierOptions,
    cssminopts?: CleanCssOptions,
    rev?: boolean,
    fetch: FetchHook,
  };
};

export type ValidatedConfigBody = {
  options: {
    inject: Inject
  }
}

export type BundlerConfig = ConfigHeader & { bundles: { [name: string]: ConfigBody } };
export type ValidatedBundlerConfig = BundlerConfig & ValidatedConfigHeader;

export type BundleConfig = ConfigHeader & ConfigBody & { bundleName: string };
export type ValidatedBundleConfig = BundleConfig & ValidatedConfigHeader & ValidatedConfigBody;
