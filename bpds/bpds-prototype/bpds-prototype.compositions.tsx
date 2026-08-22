import { MemoryRouter } from 'react-router-dom';
import { BpdsPrototype } from "./bpds-prototype.js";
    
export const BpdsPrototypeBasic = () => {
  return (
    <MemoryRouter>
      <BpdsPrototype />
    </MemoryRouter>
  );
}