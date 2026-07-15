/**
 * Sections shown on /cmap. Kept in sync with routes in App.js — see
 * src/__tests__/cmapRoutesSync.test.js
 */
export const CMAP_SECTIONS = [
  {
    title: 'Main',
    links: [
      { path: '/', label: 'Home' },
      { path: '/see', label: 'See' },
      { path: '/listen', label: 'Listen' },
      { path: '/laugh', label: 'Laugh' },
      { path: '/tour', label: 'Tour' },
      { path: '/tech', label: 'Tech' },
      { path: '/contact', label: 'Contact' },
      { path: '/read', label: 'Read' },
      { path: '/book', label: 'Book' },
      { path: '/shop', label: 'Shop (redirect)' },
      { path: '/surprise', label: 'Surprise' },
      { path: '/cmap', label: 'Site map' },
    ],
  },
  {
    title: 'Tech',
    links: [
      { path: '/tech/resume', label: 'Resume' },
      { path: '/tech/resume-pdf', label: 'Resume PDF' },
      { path: '/tech/resume-success', label: 'Resume success' },
      { path: '/tech/github', label: 'GitHub' },
      { path: '/tech/ai', label: 'AI' },
      { path: '/hintgiver', label: 'Hint giver' },
    ],
  },
  {
    title: 'Photos',
    links: [
      { path: '/photos/summer-2023', label: 'Summer 2023' },
      { path: '/photos/spring-2023', label: 'Spring 2023' },
      { path: '/photos/spring-2024', label: 'Spring 2024' },
      { path: '/photos/portrait', label: 'Portrait' },
      { path: '/photos/moody', label: 'Moody' },
      { path: '/photos/natural', label: 'Natural' },
      { path: '/photos/urban', label: 'Urban' },
      { path: '/photos/espionner', label: 'Espionner' },
    ],
  },
  {
    title: 'Guestbook & more',
    links: [
      { path: '/signGuestbook', label: 'Sign guestbook' },
      { path: '/guestbook', label: 'Guestbook' },
      { path: '/birthday', label: 'Birthday' },
      { path: '/karaoke', label: 'Karaoke' },
      { path: '/weather', label: 'Weather' },
      { path: '/mesh', label: 'Mesh' },
      { path: '/coinboys', label: 'Coin Boys (coin flip)' },
      { path: '/movethingsaround', label: 'Move things around' },
      { path: '/nicework', label: 'Nice work' },
      { path: '/kudos', label: 'Kudos hall of fame' },
      { path: '/makekudos', label: 'Add kudos (owner)' },
      { path: '/cloud', label: 'Catholic e Cloud (short link)' },
      { path: '/catholicecloud', label: 'Catholic e Cloud' },
      { path: '/catholicecloudtest', label: 'Catholic e Cloud (season test)' },
      { path: '/meals/*', label: 'Meal planner' },
      { path: '/finance/*', label: 'Finance (Oops)' },
      { path: '/finance2/*', label: 'Finance2 UI playground' },
    ],
  },
];
