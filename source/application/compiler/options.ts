import {Tsc} from '@angular/tsc-wrapped/src/tsc';

import {AngularCompilerOptions} from '@angular/tsc-wrapped';

import {
  CompilerOptions,
  ModuleResolutionKind,
  ModuleKind,
  Program,
} from 'typescript';

import {CompilerException} from '../../exception';

import {ModuleDeclaration, Project} from '../project';

import {discoverRootModule} from './../static';

export interface CompilationOptions {
  ts: CompilerOptions;
  ng: AngularCompilerOptions;
  sources: Array<string>;
}

export const projectToOptions = (project: Project): CompilationOptions => {
  const tsc = new Tsc();

  const {parsed, ngOptions: ng} = tsc.readConfiguration(
    project.tsconfig.toString(),
    project.basePath.toString());

  const ts = adjustOptions(parsed.options);

  ts.declaration = true;
  ng.declaration = true;
  ng.basePath = project.basePath.toString();
  ng.generateCodeForLibraries = true;

  const sources = parsed.fileNames.filter(file => testHeuristic(file) === false);

  return {ts, ng, sources};
};

const adjustOptions = (baseOptions?: CompilerOptions): CompilerOptions => {
  return Object.assign({}, baseOptions, {
    declaration: true,
    module: ModuleKind.CommonJS,
    moduleResolution: ModuleResolutionKind.NodeJs,
    noEmitHelpers: false,
  });
};

const testHeuristic = (filename: string) => /(e2e|\.?(spec|tests?)\.)/.test(filename);

export const loadApplicationModule = (program: Program, basePath: string, module: ModuleDeclaration): ModuleDeclaration => {
  const invalid = () => !module || !module.source || !module.symbol;

  if (invalid()) {
    module = discoverRootModule(basePath, program);

    if (invalid()) {
      throw new CompilerException(`Cannot discover the source file containing the root application NgModule and the name of the module, please use explicit options`);
    }
  }

  return module;
};