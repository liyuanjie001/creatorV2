import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = resolve(root, 'src');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? files(resolve(directory, entry.name)) : resolve(directory, entry.name),
      ),
    )
  ).flat();
}

const sourceFiles = await files(src);
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const dependencies = Object.keys(manifest.dependencies);
assert(
  !dependencies.some((name) => /react|recharts|@radix-ui/.test(name)),
  'Runtime dependencies still contain React packages',
);
assert(!sourceFiles.some((name) => /\.[jt]sx$/.test(name)), 'All migrated views must be Vue SFCs');

let componentCount = 0;
for (const file of sourceFiles) {
  const text = await readFile(file, 'utf8');
  assert(
    !/from\s+['"](?:react|react-router|recharts|lucide-react|@radix-ui\/[^'"]+)['"]/.test(text),
    relative(root, file),
  );
  if (!file.endsWith('.vue')) continue;
  const { descriptor, errors } = parse(text, { filename: file });
  assert.equal(errors.length, 0, relative(root, file));
  assert(descriptor.scriptSetup && descriptor.template, `${file} needs script setup and a template`);
  const script = compileScript(descriptor, { id: file });
  const result = compileTemplate({
    filename: file,
    id: file,
    source: descriptor.template.content,
    compilerOptions: { bindingMetadata: script.bindings, expressionPlugins: ['typescript'] },
  });
  assert.equal(result.errors.length, 0, `${file}: ${result.errors.join(', ')}`);
  componentCount++;
}

const requiredPages = [
  'Dashboard',
  'Inspiration',
  'Notes',
  'Create',
  'Accounts',
  'Analytics',
  'Tasks',
  'NewTask',
  'Projects',
  'NewProject',
  'ProjectDetail',
  'Assets',
  'Settings',
  'Trash',
  'Profile',
];
for (const page of requiredPages) await access(resolve(src, 'pages', `${page}.vue`));
const sectionSource = await readFile(resolve(src, 'composables/useProjectWorkspace.ts'), 'utf8');
for (const section of [
  'gen',
  'brief',
  'product',
  'inspire',
  'element',
  'canvas',
  'chat',
  'director',
  'account',
  'publish',
  'attribution',
  'schedule',
  'trash',
])
  assert(
    sectionSource.includes(`"${section}"`) || sectionSource.includes(`'${section}'`),
    `Missing project section ${section}`,
  );

const baseline = JSON.parse(await readFile(resolve(root, 'scripts/source-baseline.json'), 'utf8'));
const legacy = resolve(root, '../源码');
const legacyExists = await access(legacy).then(
  () => true,
  () => false,
);
if (legacyExists) {
  for (const [file, expected] of Object.entries(baseline)) {
    const digest = createHash('sha256')
      .update(await readFile(resolve(legacy, file)))
      .digest('hex');
    assert.equal(digest, expected, `Legacy source changed: ${file}`);
  }
  const originalRouter = await readFile(resolve(legacy, 'src/App.tsx'), 'utf8');
  const newRouter = await readFile(resolve(src, 'router.ts'), 'utf8');
  for (const match of originalRouter.matchAll(/path="([^"]+)"/g))
    if (match[1] !== '*')
      assert(
        newRouter.includes(`"${match[1]}"`) || newRouter.includes(`'${match[1]}'`),
        `Missing route: ${match[1]}`,
      );
  console.log(`Original source unchanged: ${Object.keys(baseline).length} files`);
} else {
  console.log('Standalone checkout: legacy comparison skipped');
}
console.log(
  `Migration coverage passed: ${requiredPages.length} pages, 13 project sections, ${componentCount} Vue components`,
);
