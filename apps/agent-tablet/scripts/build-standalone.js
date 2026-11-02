import fs from 'fs';
import path from 'path';

const previewLauncher = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LeeWay Agent Work Preview</title>
    <style>
      :root { color-scheme: dark; font-family: system-ui, sans-serif; background: #07111f; color: #e4e4e7; }
      body { display: grid; min-height: 100vh; margin: 0; place-items: center; }
      main { box-sizing: border-box; max-width: 42rem; padding: 2rem; }
      h1 { font-size: 1.5rem; }
      p { color: #a1a1aa; line-height: 1.6; }
      a { display: inline-block; margin-top: 1rem; padding: .8rem 1rem; border-radius: .5rem; background: #0e7490; color: white; font-weight: 700; text-decoration: none; }
    </style>
    <script>
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        location.replace(new URL('/?view=preview', location.href));
      }
    </script>
  </head>
  <body>
    <main>
      <h1>Agent work preview</h1>
      <p>The Agent Tablet is a single workstation. This page is only a preview entry point; it does not contain another copy of the tablet.</p>
      <p>Open the LeeWay Editor preview from the running Agent Tablet to inspect a composition. Assignment and agent communication remain on the LeeWay Workboard.</p>
      <a href="/?view=preview">Open LeeWay Editor preview</a>
    </main>
  </body>
</html>
`;

const publicDir = path.join(process.cwd(), 'public');
const distDir = path.join(process.cwd(), 'dist');
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'standalone.html'), previewLauncher, 'utf8');
fs.writeFileSync(path.join(distDir, 'standalone.html'), previewLauncher, 'utf8');
