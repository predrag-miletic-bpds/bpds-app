import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { BpdsPrototype } from './bpds-prototype.js';

if (import.meta.hot) {
  import.meta.hot.accept();
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <BrowserRouter>
    <BpdsPrototype />
  </BrowserRouter>
);
