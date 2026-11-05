const STABLE_HISTORY_MIN_VERSIONS = 5;
const RECENT_DAYS = 60;

// Flags a package whose latest version was published by a npm account that
// never published any earlier version, right after a long run of releases
// from one consistent publisher. That shape (established single-publisher
// history -> sudden new publisher -> fresh release) is the signature of an
// npm account takeover, not routine co-maintainer rotation.
function checkMaintainerChange(packument) {
  const versions = Object.keys(packument.versions || {});
  if (versions.length < STABLE_HISTORY_MIN_VERSIONS) return null;

  const time = packument.time || {};
  const ordered = versions
    .filter((v) => time[v])
    .sort((a, b) => new Date(time[a]) - new Date(time[b]));
  if (ordered.length < STABLE_HISTORY_MIN_VERSIONS) return null;

  const publishers = ordered.map((v) => packument.versions[v]._npmUser?.name).filter(Boolean);
  if (publishers.length < STABLE_HISTORY_MIN_VERSIONS) return null;

  const latestVersion = ordered[ordered.length - 1];
  const latestPublisher = publishers[publishers.length - 1];
  const priorPublishers = publishers.slice(0, -1);
  const priorUnique = new Set(priorPublishers);

  const isNewPublisher = !priorUnique.has(latestPublisher);
  const priorWasStable = priorUnique.size === 1;
  const latestDate = new Date(time[latestVersion]);
  const daysSinceLatest = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);

  if (isNewPublisher && priorWasStable && daysSinceLatest <= RECENT_DAYS) {
    return {
      type: 'maintainer-change-risk',
      package: packument.name,
      previousPublisher: [...priorUnique][0],
      newPublisher: latestPublisher,
      latestVersion,
      publishedAt: time[latestVersion],
    };
  }
  return null;
}

module.exports = { checkMaintainerChange };
