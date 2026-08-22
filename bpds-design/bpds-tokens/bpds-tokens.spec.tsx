import { render } from '@testing-library/react';
import { BpdsTokens } from './bpds-tokens.js';

it('renders with the correct children', () => {
  const { getByText } = render(<BpdsTokens>Hello world!</BpdsTokens>);
  const rendered = getByText('Hello world!');
  expect(rendered).toBeTruthy();
});
