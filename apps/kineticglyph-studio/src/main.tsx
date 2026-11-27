/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.APP.BOOTSTRAP
TAG: LEEWAY.APP.DOM.MOUNT

5WH:
WHAT = Client React DOM mount entrypoint for KineticGlyph Studio.
WHY = Mount the governed React application root onto the HTML #root container.
WHO = Leeway Innovations — KineticGlyph Studio
WHERE = src/main.tsx
WHEN = 2026-11-27
HOW = Invokes react-dom/client createRoot().render(<App />).

LICENSE = Apache-2.0
*/

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
