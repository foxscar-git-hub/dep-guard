async function fetchPackument(name) {
  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error(`registry lookup failed for ${name}: HTTP ${res.status}`);
  }
  return res.json();
}

module.exports = { fetchPackument };
