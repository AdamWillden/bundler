import * as vm from 'vm';

import { ConfigData } from './interfaces/config-data';

export enum ConfigFormat {
  System,
  SystemJS,
};

export interface ConfigInfo {
  json: string;
  format: ConfigFormat;
  data: ConfigData;
}

type ConfigParser = (json: string) => ConfigInfo[];

export class ConfigSerializer {
  public static serialize(data: ConfigData, format: ConfigFormat) {
    let tab = '  ';
    let json = JSON.stringify(data, null, 2)
      .replace(new RegExp('^' + tab + '"(\\w+)"', 'mg'), tab + '$1');

    switch (format) {
      case ConfigFormat.SystemJS:
        return `SystemJS.config(${json});`;
      case ConfigFormat.System:
        return `System.config(${json});`;
      default:
        throw 'Unknown config format';
    }
  }

  private readonly parser: ConfigParser;

  constructor() {
    this.parser = this.createConfigParser();
  }

  public parse(content: string): ConfigInfo[] {
    return this.parser(content);
  }

  public serialize(info: ConfigInfo[]) {
    return info
      .map(x => ConfigSerializer.serialize(x.data, x.format))
      .join('\r\n\r\n');
  }

  private createConfigParser(): ConfigParser {
    let infos: ConfigInfo[] = [];

    const system = (format: ConfigFormat) => {
      return {
        config: (data: ConfigData) => {
          let json = ConfigSerializer.serialize(data, format);
          infos.push({ json, format, data });
        }
      };
    };

    const sandbox = {
      System: system(ConfigFormat.System),
      SystemJS: system(ConfigFormat.SystemJS),
    };

    vm.createContext(sandbox);

    return (content: string) => {
      try {
        vm.runInContext(content, sandbox);
        return infos;
      } finally {
        infos = [];
      }
    };
  }
}
