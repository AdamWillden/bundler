import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

export class FileExistsError extends Error {
  public readonly filePath: string;

  constructor(filePath: string) {
    super(`The file identified by '${filePath}' already exists`);
  }
}

export interface FileManagerOptions {
  encoding: string;
}

export class FileManager {
  private options: FileManagerOptions = {
    encoding: 'utf8',
  };

  public setOptions(options: FileManagerOptions) {
    this.options = options;
  }

  public readFile(filePath: string): Promise<string> {
    return new Promise<string>((resolver: (content: string) => void, rejecter: () => void) => {
      fs.readFile(filePath, this.options, (err: NodeJS.ErrnoException, content: string) => {
        if (typeof err.code === 'undefined') {
          resolver(content);
        } else {
          rejecter();
        }
      });
    });
  }

  public writeFile(filePath: string, content: string): Promise<void>;
  public writeFile(filePath: string, content: string, force: boolean): Promise<void>;
  public writeFile(filePath: string, content: string, force: boolean = false): Promise<void> {
    if (this.fileOrDirectoryExists(filePath)) {
      if (!force) {
        throw new FileExistsError(filePath);
      }

      this.deleteFile(filePath);
    } else {
      this.ensureFileDirectoryExists(filePath);
    }

    return new Promise<void>((resolver: () => void, rejecter: () => void) => {
      fs.writeFile(filePath, content, this.options, (err: NodeJS.ErrnoException) => {
        if (typeof err.code === 'undefined') {
          resolver();
        } else {
          rejecter();
        }
      });
    });
  }

  public fileExists(filePath: string) {
     return new Promise<boolean>((resolver: (fileExists: boolean) => void) => {
       fs.exists(filePath, fileExists => resolver(fileExists));
     });
  }

  public resolve(...filePath: string[]) {
    return path.resolve(...filePath);
  }

  public getFileName(filePath: string) {
    return path.basename(filePath);
  }

  private fileOrDirectoryExists(path: string) {
    return fs.existsSync(path);
  }

  private deleteFile(filePath: string) {
    return fs.unlink(filePath);
  }

  private ensureFileDirectoryExists(filePath: string) {
    let directoryPath = path.dirname(filePath);

    if (!this.fileOrDirectoryExists(directoryPath)) {
      this.createDirectory(directoryPath);
    }
  }

  private createDirectory(directoryPath: string) {
    mkdirp.sync(directoryPath);
  }
}
