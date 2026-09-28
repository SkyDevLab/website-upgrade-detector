import { DetectionContext, VersionSignal, ConfidenceLevel } from '../shared/types.ts';
import { extractVersionFromUrl } from '../analyzer/versionParser.ts';

/**
 * Safely extracts window object from context or global environment.
 */
export function getWindow(context?: DetectionContext): Record<string, any> | undefined {
  if (context?.windowObj) {
    return context.windowObj;
  }
  if (typeof window !== 'undefined') {
    return window as unknown as Record<string, any>;
  }
  return undefined;
}

/**
 * Safely extracts script URLs from context or document.scripts.
 */
export function getScriptUrls(context?: DetectionContext): string[] {
  if (context?.scripts) {
    return context.scripts.map((s) => s.src || '').filter(Boolean);
  }
  if (typeof document !== 'undefined' && document.scripts) {
    const urls: string[] = [];
    for (let i = 0; i < document.scripts.length; i++) {
      const src = document.scripts[i].src;
      if (src) urls.push(src);
    }
    return urls;
  }
  return [];
}

/**
 * Safely extracts stylesheet URLs from context or link elements.
 */
export function getStylesheetUrls(context?: DetectionContext): string[] {
  if (context?.stylesheets) {
    return context.stylesheets.map((s) => s.href || '').filter(Boolean);
  }
  if (typeof document !== 'undefined') {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    const urls: string[] = [];
    links.forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      if (href) urls.push(href);
    });
    return urls;
  }
  return [];
}

/**
 * Reconciles version signals according to the priority order:
 * 1. Known runtime/global version
 * 2. Script URL/package version
 * 3. CSS URL/version
 * 4. Library-specific metadata
 *
 * Detects conflicts between runtime and script/CSS versions.
 */
export function reconcileVersionSignals(
  runtimeSignal: { version?: string; evidence: string } | null,
  urlSignal: { version?: string; evidence: string; sourceName?: string } | null,
  cssSignal: { version?: string; evidence: string } | null = null,
  metaSignal: { version?: string; evidence: string } | null = null
): {
  finalVersion?: string;
  evidence: string[];
  conflictingSignals?: VersionSignal[];
  confidence: ConfidenceLevel;
} {
  const evidence: string[] = [];
  const signals: VersionSignal[] = [];

  if (runtimeSignal?.version) {
    signals.push({ source: 'Runtime', version: runtimeSignal.version });
    evidence.push(runtimeSignal.evidence);
  } else if (runtimeSignal?.evidence) {
    evidence.push(runtimeSignal.evidence);
  }

  if (urlSignal?.version) {
    signals.push({ source: urlSignal.sourceName || 'Script URL', version: urlSignal.version });
    evidence.push(urlSignal.evidence);
  } else if (urlSignal?.evidence) {
    evidence.push(urlSignal.evidence);
  }

  if (cssSignal?.version) {
    signals.push({ source: 'CSS Stylesheet', version: cssSignal.version });
    evidence.push(cssSignal.evidence);
  } else if (cssSignal?.evidence) {
    evidence.push(cssSignal.evidence);
  }

  if (metaSignal?.version) {
    signals.push({ source: 'Metadata / DOM', version: metaSignal.version });
    evidence.push(metaSignal.evidence);
  } else if (metaSignal?.evidence) {
    evidence.push(metaSignal.evidence);
  }

  // Detect conflict
  const distinctVersions = Array.from(new Set(signals.map((s) => s.version)));
  let conflictingSignals: VersionSignal[] | undefined;

  if (distinctVersions.length > 1) {
    conflictingSignals = signals;
    evidence.push(
      `⚠ Conflicting version signals detected (${signals.map((s) => `${s.source}: ${s.version}`).join(', ')}). Using strongest evidence.`
    );
  }

  // Priority selection
  let finalVersion: string | undefined;
  let confidence: ConfidenceLevel = 'low';

  if (runtimeSignal?.version) {
    finalVersion = runtimeSignal.version;
    confidence = 'high';
  } else if (urlSignal?.version) {
    finalVersion = urlSignal.version;
    confidence = 'medium';
  } else if (cssSignal?.version) {
    finalVersion = cssSignal.version;
    confidence = 'medium';
  } else if (metaSignal?.version) {
    finalVersion = metaSignal.version;
    confidence = 'medium';
  } else if (runtimeSignal || urlSignal || cssSignal || metaSignal) {
    // Library detected but version unknown
    confidence = 'medium';
  }

  return {
    finalVersion,
    evidence,
    conflictingSignals,
    confidence
  };
}

/**
 * Searches a list of URLs for a version matching a library prefix.
 */
export function findVersionInUrls(urls: string[], prefix: string): { version?: string; url: string } | null {
  for (const url of urls) {
    const version = extractVersionFromUrl(url, prefix);
    if (version) {
      return { version, url };
    }
  }
  return null;
}
