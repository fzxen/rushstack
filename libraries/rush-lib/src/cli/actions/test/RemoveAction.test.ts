// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import '../../test/mockRushCommandLineParser';

import {
  PackageJsonUpdater,
  IPackageJsonUpdaterRushRemoveOptions,
  IRemoveProjectOptions
} from '../../../logic/PackageJsonUpdater';
import { DependencyType } from '../../../api/PackageJsonEditor';
import { RushCommandLineParser } from '../../RushCommandLineParser';
import { RemoveAction } from '../RemoveAction';

describe(RemoveAction.name, () => {
  describe('basic "rush remove" tests', () => {
    let doRushRemoveMock: jest.SpyInstance;
    let removePackageFromProjectMock: jest.SpyInstance;
    let oldExitCode: number | undefined;
    let oldArgs: string[];

    beforeEach(() => {
      removePackageFromProjectMock = jest
        .spyOn(PackageJsonUpdater.prototype, 'removePackageFromProject')
        .mockImplementation(() => {});
      jest.spyOn(process, 'exit').mockImplementation();
      oldExitCode = process.exitCode;
      oldArgs = process.argv;
    });

    afterEach(() => {
      jest.clearAllMocks();
      process.exitCode = oldExitCode;
      process.argv = oldArgs;
    });

    describe("'remove' action", () => {
      it(`remove a dependency that is listed as both dependency of different types`, async () => {
        const startPath: string = `${__dirname}/removeRepo`;
        const cPath: string = `${__dirname}/removeRepo/c`;

        // Create a Rush CLI instance. This instance is heavy-weight and relies on setting process.exit
        // to exit and clear the Rush file lock. So running multiple `it` or `describe` test blocks over the same test
        // repo will fail due to contention over the same lock which is kept until the test runner process
        // ends.
        const parser: RushCommandLineParser = new RushCommandLineParser({ cwd: startPath });

        // Switching to the "c" package of removeRepo
        jest.spyOn(process, 'cwd').mockReturnValue(cPath);

        // Mock the command
        process.argv = ['pretend-this-is-node.exe', 'pretend-this-is-rush', 'remove', '-p', 'assert', '-s'];

        await expect(parser.execute()).resolves.toEqual(true);
        expect(removePackageFromProjectMock).toHaveBeenCalledTimes(1);
        const removePackageFromProjectOptions: IRemoveProjectOptions =
          removePackageFromProjectMock.mock.calls[0][0];
        expect(removePackageFromProjectOptions.project.friendlyName).toEqual('c');
        expect(removePackageFromProjectOptions.dependenciesToRemove.assert).toHaveLength(2);
        expect(removePackageFromProjectOptions.dependenciesToRemove.assert).toEqual([
          DependencyType.Regular,
          DependencyType.Dev
        ]);
      });
      it(`remove a dependency to just one repo in the workspace`, async () => {
        const startPath: string = `${__dirname}/removeRepo`;
        const aPath: string = `${__dirname}/removeRepo/a`;
        doRushRemoveMock = jest
          .spyOn(PackageJsonUpdater.prototype, 'doRushRemoveAsync')
          .mockImplementation(() => Promise.resolve());

        // Create a Rush CLI instance. This instance is heavy-weight and relies on setting process.exit
        // to exit and clear the Rush file lock. So running multiple `it` or `describe` test blocks over the same test
        // repo will fail due to contention over the same lock which is kept until the test runner process
        // ends.
        const parser: RushCommandLineParser = new RushCommandLineParser({ cwd: startPath });

        // Switching to the "a" package of removeRepo
        jest.spyOn(process, 'cwd').mockReturnValue(aPath);

        // Mock the command
        process.argv = ['pretend-this-is-node.exe', 'pretend-this-is-rush', 'remove', '-p', 'assert'];

        await expect(parser.execute()).resolves.toEqual(true);
        expect(doRushRemoveMock).toHaveBeenCalledTimes(1);
        const doRushRemoveOptions: IPackageJsonUpdaterRushRemoveOptions = doRushRemoveMock.mock.calls[0][0];
        expect(doRushRemoveOptions.projects).toHaveLength(1);
        expect(doRushRemoveOptions.projects[0].packageName).toEqual('a');
        expect(doRushRemoveOptions.packagesToRemove).toMatchInlineSnapshot(`
          Array [
            Object {
              "packageName": "assert",
            },
          ]
        `);
      });
    });

    describe("'remove' action with --all", () => {
      it(`remove a dependency from all repos in the workspace`, async () => {
        const startPath: string = `${__dirname}/removeRepo`;
        const aPath: string = `${__dirname}/removeRepo/a`;

        doRushRemoveMock = jest
          .spyOn(PackageJsonUpdater.prototype, 'doRushRemoveAsync')
          .mockImplementation(() => Promise.resolve());

        // Create a Rush CLI instance. This instance is heavy-weight and relies on setting process.exit
        // to exit and clear the Rush file lock. So running multiple `it` or `describe` test blocks over the same test
        // repo will fail due to contention over the same lock which is kept until the test runner process
        // ends.
        const parser: RushCommandLineParser = new RushCommandLineParser({ cwd: startPath });

        // Switching to the "a" package of addRepo
        jest.spyOn(process, 'cwd').mockReturnValue(aPath);

        // Mock the command
        process.argv = [
          'pretend-this-is-node.exe',
          'pretend-this-is-rush',
          'remove',
          '-p',
          'assert',
          '--all'
        ];

        // const a = await parser.execute();
        await expect(parser.execute()).resolves.toEqual(true);
        expect(doRushRemoveMock).toHaveBeenCalledTimes(1);
        const doRushRemoveOptions: IPackageJsonUpdaterRushRemoveOptions = doRushRemoveMock.mock.calls[0][0];
        expect(doRushRemoveOptions.projects).toHaveLength(3);
        expect(doRushRemoveOptions.projects[0].packageName).toEqual('a');
        expect(doRushRemoveOptions.projects[1].packageName).toEqual('b');
        expect(doRushRemoveOptions.projects[2].packageName).toEqual('c');
        expect(doRushRemoveOptions.packagesToRemove).toMatchInlineSnapshot(`
          Array [
            Object {
              "packageName": "assert",
            },
          ]
        `);
      });
    });
  });
});
