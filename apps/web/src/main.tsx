import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import Editor from './editor/Editor';

createRoot(document.getElementById('root')!).render(<StrictMode><Editor /></StrictMode>);
