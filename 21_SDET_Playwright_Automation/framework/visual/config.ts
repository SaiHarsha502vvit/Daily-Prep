/**
 * Visual Regression Configuration
 *
 * Controls screenshot comparison thresholds and element masking for
 * consistent visual testing across environments.
 */

export const VISUAL_CONFIG = {
  /**
   * Maximum allowed pixel ratio difference (0.0 - 1.0).
   * Screenshots with a diff ratio above this threshold will fail.
   */
  threshold: 0.2,

  /**
   * Maximum number of pixels that may differ before the screenshot is
   * considered a failure, regardless of the overall ratio.
   */
  maxDiffPixels: 100,

  /**
   * CSS selectors for elements that should be masked (hidden) before
   * taking screenshots. These elements typically contain dynamic content
   * like timestamps, dates, or user-specific data.
   */
  maskRegions: ['.timestamp', '.date', '[data-visual-mask]'],
};
