/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.CORE.FRONTEND.MAIN
TAG: LEEWAY.CORE.REACT.ROOT.V1

5WH:
WHAT = React root mount for LeeWay Core application.
WHY = Mount App component into #root with LeeWay Core global stylesheet.
WHO = Creator/Human Authority via Leeway Innovations.
WHERE = src/main.tsx
WHEN = 2026-11-27
HOW = React 19 createRoot mount.

LICENSE = Apache-2.0
*/
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
