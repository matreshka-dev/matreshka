type ClientRouteSlice = {
  path: string;
  query: Record<string, string>;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function normalizePathname(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, "");
}

function parseNavigatePath(path: string): {
  pathname: string;
  query: Record<string, string>;
} {
  const questionIndex = path.indexOf("?");
  const pathnamePart =
    questionIndex === -1 ? path : path.slice(0, questionIndex);
  const queryPart = questionIndex === -1 ? "" : path.slice(questionIndex + 1);
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const [key, value] of new URLSearchParams(queryPart)) {
      query[key] = value;
    }
  }
  return {
    pathname: normalizePathname(pathnamePart),
    query,
  };
}

function segmentToRegexPattern(segment: string): string {
  let pattern = "";
  let index = 0;
  while (index < segment.length) {
    if (segment.startsWith("@{", index)) {
      const close = segment.indexOf("}", index + 2);
      if (close !== -1) {
        pattern += "[^/]+";
        index = close + 1;
        continue;
      }
    }
    if (segment[index] === "{") {
      const close = segment.indexOf("}", index + 1);
      if (close !== -1) {
        pattern += "[^/]+";
        index = close + 1;
        continue;
      }
    }
    const nextSpecial = (() => {
      const at = segment.indexOf("@{", index);
      const brace = segment.indexOf("{", index);
      const candidates = [at, brace].filter((i) => i !== -1);
      return candidates.length ? Math.min(...candidates) : -1;
    })();
    const literalEnd = nextSpecial === -1 ? segment.length : nextSpecial;
    pattern += escapeRegExp(segment.slice(index, literalEnd));
    index = literalEnd;
  }
  return pattern;
}

function pathnameToRegex(pathname: string): RegExp {
  if (pathname === "") {
    return /^$/;
  }
  const segments = pathname.split("/");
  const regexBody = segments.map(segmentToRegexPattern).join("/");
  return new RegExp(`^${regexBody}$`);
}

function queryMatches(
  expected: Record<string, string>,
  actual: Record<string, string>,
): boolean {
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (actual[key] !== expectedValue) {
      return false;
    }
  }
  return true;
}

/**
 * Сравнивает фактический route клиента с аргументом {@link Platform.navigate}:
 * литералы и query должны совпасть, `@{context.path}` и `{param}` — wildcard сегмента.
 */
export function clientRouteMatchesNavigatePath(
  clientRoute: ClientRouteSlice,
  navigatePath: string,
): boolean {
  const expected = parseNavigatePath(navigatePath);
  const actualPathname = normalizePathname(clientRoute.path);
  if (!pathnameToRegex(expected.pathname).test(actualPathname)) {
    return false;
  }
  return queryMatches(expected.query, clientRoute.query);
}

export function isExternalNavigatePath(path: string): boolean {
  if (!path || path.startsWith("/")) {
    return false;
  }
  try {
    const url = new URL(path);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
