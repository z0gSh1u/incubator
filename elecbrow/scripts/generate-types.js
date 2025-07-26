const ts = require('typescript');
const path = require('path');
const fs = require('fs');

// Source files we want to generate types for
const sourceFiles = ['src/index.ts', 'src/lib/browser.ts'];

// TypeScript compiler options
const compilerOptions = {
  declaration: true,
  emitDeclarationOnly: true,
  outDir: './dist',
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  esModuleInterop: true,
  skipLibCheck: true,
};

// Create program
const program = ts.createProgram(
  sourceFiles.map((file) => path.resolve(file)),
  compilerOptions
);

// Emit only the declaration files
const emitResult = program.emit(
  undefined, // all source files
  undefined, // writeFile callback
  undefined, // cancellationToken
  true // emitOnlyDtsFiles
);

// Report any errors
const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

allDiagnostics.forEach((diagnostic) => {
  if (diagnostic.file) {
    const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  } else {
    console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
});
