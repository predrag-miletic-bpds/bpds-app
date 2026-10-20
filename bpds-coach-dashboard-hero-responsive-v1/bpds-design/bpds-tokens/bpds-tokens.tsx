import { ReactNode, useCallback, useState } from 'react';
import classNames from 'classnames';
import { mergeTokenSchema } from '@bitdesign/sparks.sparks-theme';
import { BpdsTokensProvider } from './bpds-tokens-provider.js';
import { BpdsTokensSchema } from './bpds-tokens-tokens.js';
import { ThemeContext, ThemeContextValue, ThemeMode } from './theme-controller.js';
import { themeOptions } from './theme-options.js';
import styles from './bpds-tokens.module.css';

export type BpdsTokensProps = {
  /**
   * a root ReactNode for the component tree
   * applied with the theme.
   */
  children?: ReactNode;

  /**
   * inject a class name to override to the theme.
   * this allows people to affect your theme. remove to avoid.
   */
  className?: string;

  /**
   * override tokens in the schema
   */
  overrides?: Partial<BpdsTokensSchema>,

  /**
   * preset of the theme.
   */
  initialTheme?: ThemeMode;

  /**
   * style tags to include.
   */
  style?: React.CSSProperties,
};

/**
 * a theme for the BpdsTokens organization.
 * it provides tokens, fonts and general styling for all components.
 */
export function BpdsTokens({ children, initialTheme, overrides, className, style, ...rest }: BpdsTokensProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialTheme);
  const themePreset = themeOptions[themeMode];

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState(prevMode => prevMode === 'light' ? 'dark' : 'light');
  }, []);

  const themeContextValue: ThemeContextValue = {
    themeMode,
    toggleTheme,
    setThemeMode,
  };

  const themeOverrides = mergeTokenSchema(themePreset, overrides);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <BpdsTokensProvider.ThemeProvider
        className={classNames(styles.bpdsTokens, className)}
        overrides={themeOverrides}
        {...rest}
      >
        {children}
      </BpdsTokensProvider.ThemeProvider>
    </ThemeContext.Provider>
  );
}
