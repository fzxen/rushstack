import semver from 'semver';

export interface DependencyPath {
  name?: string;
  peersSuffix?: string;
  version?: string;
  nonSemverVersion?: string;
  patchHash?: string;
}

export function indexOfPeersSuffix(depPath: string): { peersIndex: number; patchHashIndex: number } {
  if (!depPath.endsWith(')')) return { peersIndex: -1, patchHashIndex: -1 };
  let open = 1;
  for (let i = depPath.length - 2; i >= 0; i--) {
    if (depPath[i] === '(') {
      open--;
    } else if (depPath[i] === ')') {
      open++;
    } else if (!open) {
      if (depPath.substring(i + 1).startsWith('(patch_hash=')) {
        return {
          patchHashIndex: i + 1,
          peersIndex: depPath.indexOf('(', i + 2)
        };
      }
      return {
        patchHashIndex: -1,
        peersIndex: i + 1
      };
    }
  }
  return { peersIndex: -1, patchHashIndex: -1 };
}

export function parse(dependencyPath: string): DependencyPath {
  // eslint-disable-next-line: strict-type-predicates
  if (typeof dependencyPath !== 'string') {
    throw new TypeError(
      `Expected \`dependencyPath\` to be of type \`string\`, got \`${
        // eslint-disable-next-line: strict-type-predicates
        dependencyPath === null ? 'null' : typeof dependencyPath
      }\``
    );
  }
  const sepIndex = dependencyPath.indexOf('@', 1);
  if (sepIndex === -1) {
    return {};
  }
  const name = dependencyPath.substring(0, sepIndex);
  let version = dependencyPath.substring(sepIndex + 1);
  if (version) {
    let peersSuffix: string | undefined;
    let patchHash: string | undefined;
    const { peersIndex, patchHashIndex } = indexOfPeersSuffix(version);
    if (peersIndex !== -1 || patchHashIndex !== -1) {
      if (peersIndex === -1) {
        patchHash = version.substring(patchHashIndex);
        version = version.substring(0, patchHashIndex);
      } else if (patchHashIndex === -1) {
        peersSuffix = version.substring(peersIndex);
        version = version.substring(0, peersIndex);
      } else {
        patchHash = version.substring(patchHashIndex, peersIndex);
        peersSuffix = version.substring(peersIndex);
        version = version.substring(0, patchHashIndex);
      }
    }
    if (semver.valid(version)) {
      return {
        name,
        peersSuffix,
        version,
        patchHash
      };
    }
    return {
      name,
      nonSemverVersion: version as string,
      peersSuffix,
      patchHash
    };
  }
  return {};
}
