/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Suit NEXT_PUBLIC_SITE_URL : le sitemap ne doit pas annoncer un domaine
  // que le site ne sert plus.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.popey.academy',
  generateRobotsTxt: true,
  exclude: ['/mon-reseau-local/dashboard*', '/admin*', '/cockpit-preview*', '/emploi*', '/mon-reseau-local/connexion*', '/connexion*', '/login*'],
}
