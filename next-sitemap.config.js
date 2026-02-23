/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://popey.academy',
  generateRobotsTxt: true,
  exclude: ['/mon-reseau-local/dashboard*', '/admin*', '/cockpit-preview*'],
}
