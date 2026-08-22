import { useTheme } from './bpds-tokens-provider.js';
import { BpdsTokens } from './bpds-tokens.js';
import { TokenViewer } from '@bitdesign/sparks.sparks-theme';

function ViewTokens() {
  const theme = useTheme();

  return <TokenViewer theme={theme} />;
}

export const LightTheme = () => {
  return (
    <BpdsTokens>
      <ViewTokens />
    </BpdsTokens>
  );
};

export const DarkTheme = () => {
  return (
    <BpdsTokens initialTheme='dark'>
      <ViewTokens />
    </BpdsTokens>
  );
};
