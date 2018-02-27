function cleanModuleName(name: string) {
  let cleanName = stripLeadingRegistryPrefix(name);
  return stripTrailingVersionInfo(cleanName);
}

function stripLeadingRegistryPrefix(name: string) {
  return name.replace(/^.*:/, '');
}

function stripTrailingVersionInfo(name: string) {
  let isScoped = name.charAt(0) === '@';

  name = isScoped ? name.substr(1) : name;
  name = name.replace(/@.*$/, '');
  return isScoped ? `@${name}` : name;
}

export function getFullModuleName(moduleName: string, map: any) {
  let mapKeys = Object.keys(map);
  let matches = mapKeys.filter(m => m === moduleName);

  if (matches.length === 1) {
    return moduleName;
  }

  let cleanedModuleName = cleanModuleName(moduleName);
  matches = mapKeys
    .map(x => cleanModuleName(x))
    .filter(x => x === cleanedModuleName);

  if (matches.length > 1) {
    throw new Error(`A version conflict was found among the module names specified \
      in the configuration for '${moduleName}'. Try including a full module name with \
      a specific version number or resolve the conflict manually with jspm.`);
  }

  return matches.length === 1 ? matches[0] : moduleName;
}
