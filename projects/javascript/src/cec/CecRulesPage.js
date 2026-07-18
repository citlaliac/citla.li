import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import CecBrandTitle from './CecBrandTitle';
import '../styles/CatholiceCloudPage.css';

/** Plain-language game rules kept separate from the playful map UI. */
function CecRulesPage() {
  useSEO({
    title: 'Congregation Rules | Catholic e Cloud',
    description: 'Rules for Catholic e Cloud congregations, followers, PP, and smiting.',
    canonicalUrl: 'https://citla.li/catholicecloud/rules',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="cec-page cec-rules-page">
      <Header />
      <main className="cec-rules-main">
        <CecBrandTitle as="p" className="cec-rules-brand" />
        <h1>Congregation rules</h1>

        <section>
          <h2>Founding and following</h2>
          <ul>
            <li>
              Anyone with at least 3,000 Pontifex Points can lead a congregation. It opens
              automatically when their first follower joins — they do not need to tap Found.
            </li>
            <li>Follow someone by entering their character name.</li>
            <li>
              You can also follow people who are already inside a congregation (not only the founder).
            </li>
            <li>Followers can recruit followers of their own, making one connected family tree.</li>
            <li>
              If you already follow someone and later reach 3,000 PP, you may branch off into your own
              congregation (with the usual 48-hour switch wait).
            </li>
            <li>You may change who you follow every 48 hours. Your entire follower branch moves with you.</li>
          </ul>
        </section>

        <section>
          <h2>Smiting</h2>
          <ul>
            <li>
              Every few days, when you come back to play, you face a personal smite check. It is not a
              shared timer for the whole site; each worshiper has their own next check.
            </li>
            <li>
              Alone, the chance is about 30%. In a larger active congregation the chance falls (down to
              about 5%). Bigger flocks are safer.
            </li>
            <li>
              If you are smote, you lose about 5% of your PP (at least 10, at most 150). Rewards stay
              weaker for the next 48 hours.
            </li>
            <li>
              After a check resolves, your next one is scheduled a few days later. Congregation size is
              the main defense.
            </li>
          </ul>
        </section>

        <section>
          <h2>Trickle rewards</h2>
          <ul>
            <li>Ten percent of earned PP is shared fractionally up the sponsor line.</li>
            <li>Your own listed PP reward is not reduced to fund the share.</li>
          </ul>
        </section>

        <section>
          <h2>Grace (when a founder falls below 3,000 PP)</h2>
          <ul>
            <li>
              If a founder drops under 3,000 PP (for example after a smite), the congregation freezes
              and a five-day grace period begins.
            </li>
            <li>
              During grace, the flock stays together, but the congregation is frozen: it cannot take new
              members, and frozen status does not give the same smite protection as an active flock.
            </li>
            <li>
              If the founder climbs back to 3,000 PP within those five days, the congregation unfreezes
              and life continues as before.
            </li>
            <li>
              If grace ends without recovery, the eligible direct follower with the most PP (and at least
              3,000 PP) becomes the new founder. If nobody qualifies, the congregation dissolves and
              everyone is released.
            </li>
          </ul>
        </section>

        <section>
          <h2>Popes</h2>
          <ul>
            <li>The Supreme Pope is the active congregation founder with the most PP.</li>
            <li>Founders need 3,000+ PP to remain eligible for that throne.</li>
          </ul>
        </section>

        <p className="cec-rules-note">
          PP, cooldowns, smites, and congregation changes are recorded by the server so everyone plays by the
          same rules.
        </p>
        <Link className="cec-rules-back" to="/catholicecloud">
          Return to Catholic eCloud
        </Link>
      </main>
      <Footer />
    </div>
  );
}

export default CecRulesPage;
