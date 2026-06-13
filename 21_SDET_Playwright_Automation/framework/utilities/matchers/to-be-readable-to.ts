import { type Locator } from '@playwright/test';

/**
 * Custom matcher to verify an element has sufficient readability:
 * - WCAG AA contrast ratio >= 4.5:1
 * - Font size >= 12px
 *
 * @param locator - Playwright Locator to check
 * @param options - Optional timeout (default 5000ms)
 */
export async function toBeReadableTo(
  locator: Locator,
  options: { timeout?: number } = {}
): Promise<{ pass: boolean; message: () => string }> {
  const timeout = options.timeout ?? 5000;

  try {
    // Wait for element to be visible
    await locator.waitFor({ state: 'visible', timeout });

    const result = await locator.evaluate((el: Element) => {
      const style = window.getComputedStyle(el);
      const color = style.getPropertyValue('color').trim();
      const backgroundColor = style.getPropertyValue('background-color').trim();
      const fontSize = parseFloat(style.getPropertyValue('font-size'));

      // Parse rgba/rgb color values
      const parseColor = (colorStr: string): { r: number; g: number; b: number } | null => {
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          return {
            r: parseInt(match[1] ?? '0', 10),
            g: parseInt(match[2] ?? '0', 10),
            b: parseInt(match[3] ?? '0', 10),
          };
        }
        // Handle hex colors
        const hexMatch = colorStr.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (hexMatch) {
          return {
            r: parseInt(hexMatch[1] ?? '0', 16),
            g: parseInt(hexMatch[2] ?? '0', 16),
            b: parseInt(hexMatch[3] ?? '0', 16),
          };
        }
        return null;
      };

      const foreground = parseColor(color);
      const background = parseColor(backgroundColor);

      // Calculate relative luminance per WCAG 2.1
      const getLuminance = (c: { r: number; g: number; b: number }): number => {
        const [rs = 0, gs = 0, bs = 0] = [c.r, c.g, c.b].map((v) => {
          const normalized = v / 255;
          return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      let contrastRatio: number | null = null;
      if (foreground && background) {
        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        contrastRatio = (lighter + 0.05) / (darker + 0.05);
      }

      return {
        color,
        backgroundColor,
        fontSize,
        contrastRatio,
        hasContrastRatio: contrastRatio !== null,
      };
    });

    const failures: string[] = [];

    // Check font size
    if (result.fontSize < 12) {
      failures.push(
        `Font size ${result.fontSize}px is below minimum 12px`
      );
    }

    // Check contrast ratio (WCAG AA requires 4.5:1)
    if (!result.hasContrastRatio) {
      failures.push(
        `Could not parse colors: foreground="${result.color}", background="${result.backgroundColor}"`
      );
    } else if (result.contrastRatio !== null && result.contrastRatio < 4.5) {
      failures.push(
        `Contrast ratio ${result.contrastRatio.toFixed(2)}:1 is below WCAG AA minimum of 4.5:1`
      );
    }

    const pass = failures.length === 0;

    return {
      pass,
      message: () =>
        pass
          ? `Locator is readable: font-size=${result.fontSize}px, contrast=${result.contrastRatio?.toFixed(2) ?? 'unknown'}:1`
          : `Locator is not sufficiently readable:\n  ${failures.join('\n  ')}`,
    };
  } catch (error) {
    return {
      pass: false,
      message: () =>
        `Failed to check readability: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Extend Playwright expect
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeReadableTo(options?: { timeout?: number }): Promise<R>;
    }
  }
}