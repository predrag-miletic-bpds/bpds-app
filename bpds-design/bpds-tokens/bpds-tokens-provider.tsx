import { createTheme } from '@bitdesign/sparks.sparks-theme';
import { BpdsTokensSchema, bpdsTokensTokens } from './bpds-tokens-tokens.js';

/**
 * creating and declaring the bpds-tokens theme.
 * define the theme schema as a type variable for proper type completions.
 */
export const BpdsTokensProvider = createTheme<BpdsTokensSchema>({
  tokens: bpdsTokensTokens,
});

/**
 * a react hook for contextual access to design token
 * from components.
 */
export const { useTheme } = BpdsTokensProvider;
