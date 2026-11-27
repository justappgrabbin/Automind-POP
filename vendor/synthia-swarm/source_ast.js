import { parseTree, parser, types } from "./vendor/recast/recast.mjs";

const treeOf = source => parseTree(source, { parser });

export function inspectJavaScript(source) {
  const tree = treeOf(source);
  const functions = [], imports = new Set();
  types.visit(tree, {
    visitImportDeclaration(path) { imports.add(path.node.source.value); return false; },
    visitExportNamedDeclaration(path) {
      if (path.node.source) imports.add(path.node.source.value);
      this.traverse(path);
    },
    visitExportAllDeclaration(path) { imports.add(path.node.source.value); return false; },
    visitNode(path) {
      const n = path.node;
      if (n.type === "ImportExpression") imports.add(n.source.value ?? "<dynamic import>");
      if (n.type === "CallExpression" && n.callee.name === "require") {
        imports.add(n.arguments[0]?.value ?? "<dynamic require>");
      }
      this.traverse(path);
    },
  });
  for (const statement of tree.program.body) {
    if (!["ExportNamedDeclaration", "ExportDefaultDeclaration"].includes(statement.type)) continue;
    const fn = statement.declaration;
    if (fn?.type !== "FunctionDeclaration" || !fn.id || fn.async || fn.generator) continue;
    const params = fn.params.map(param => param.type === "AssignmentPattern" ? param.left : param);
    if (params.some(param => param.type !== "Identifier")) continue;
    functions.push({ name: fn.id.name, params: params.map(param => param.name) });
  }
  return { functions, imports: [...imports] };
}

/** Replace only the named function body. Source offsets come from the AST. */
export function replaceFunctionBody(source, name, body) {
  const program = parser.parse(source);
  const matches = program.body.map(statement => statement.declaration ?? statement)
    .filter(node => node.type === "FunctionDeclaration" && node.id?.name === name);
  if (matches.length !== 1) throw Error("Expected one top-level function named " + name);
  const fn = matches[0];
  const candidate = source.slice(0, fn.body.start + 1) + body + source.slice(fn.body.end - 1);
  const after = parser.parse(candidate).body;
  const target = after[program.body.findIndex(statement => (statement.declaration ?? statement) === fn)];
  if (after.length !== program.body.length || (target?.declaration ?? target)?.body?.end !== fn.body.start + body.length + 2) {
    throw Error("Replacement must stay within the function body");
  }
  return candidate;
}

export function stripModuleExports(source) {
  const program = parser.parse(source);
  let result = source;
  for (const node of [...program.body].reverse()) {
    if (["ExportNamedDeclaration", "ExportDefaultDeclaration"].includes(node.type) && node.declaration) {
      result = result.slice(0, node.start) + result.slice(node.declaration.start);
    }
  }
  return result;
}
