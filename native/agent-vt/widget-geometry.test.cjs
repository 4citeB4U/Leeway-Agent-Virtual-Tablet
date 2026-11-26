const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, 'main.cjs');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing ${name}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

function geometryContext(displays) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const names = ['overlapWithArea', 'displayForWidget', 'hasVisibleHandle', 'intersectsDisplay', 'fitSizeToArea', 'recoverWidgetBounds'];
  const context = {
    screen: {
      getAllDisplays: () => displays,
      getPrimaryDisplay: () => displays[0]
    },
    Math,
    Number
  };
  vm.createContext(context);
  vm.runInContext(names.map(name => extractFunction(source, name)).join('\n'), context);
  return context;
}

test('MOVE handle remains visible inside work area bounds', () => {
  const context = geometryContext([{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }]);
  assert.equal(context.hasVisibleHandle({ x: 100, y: 100, width: 800, height: 500 }), true);
  assert.equal(context.hasVisibleHandle({ x: -1000, y: 100, width: 800, height: 500 }), false);
  assert.equal(context.hasVisibleHandle({ x: 100, y: -1000, width: 800, height: 500 }), false);
});

test('widget requires both a visible MOVE handle and meaningful display overlap', () => {
  const context = geometryContext([{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }]);
  assert.equal(context.intersectsDisplay({ x: 100, y: 100, width: 800, height: 500 }), true);
  assert.equal(context.intersectsDisplay({ x: -1000, y: 100, width: 800, height: 500 }), false);
  assert.equal(context.intersectsDisplay({ x: 1900, y: 1000, width: 800, height: 500 }), false);
});

test('off-screen widget geometry is recovered into the primary work area', () => {
  const context = geometryContext([{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }]);
  const recovered = context.recoverWidgetBounds({ x: -1000, y: -800, width: 800, height: 500 });
  assert.equal(context.intersectsDisplay(recovered), true);
  assert.ok(recovered.x >= 0);
  assert.ok(recovered.y >= 0);
  assert.ok(recovered.x + recovered.width <= 1920);
  assert.ok(recovered.y + recovered.height <= 1080);
});
