import { getDefaultNormalizer } from '@testing-library/react';

/** Text-query options that keep META_GAP, which the default normalizer collapses into a plain space. */
export const keepGaps = { normalizer: getDefaultNormalizer({ collapseWhitespace: false }) };
