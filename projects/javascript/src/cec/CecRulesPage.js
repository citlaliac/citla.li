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
            <li>Any account with at least 3,000 Pontifex Points can found a congregation.</li>
            <li>Anyone in a congregation can recruit followers using their character name.</li>
            <li>Followers can recruit followers of their own, making one connected family tree.</li>
            <li>You may change who you follow every 48 hours. Your entire follower branch moves with you.</li>
          </ul>
        </section>

        <section>
          <h2>Rewards and protection</h2>
          <ul>
            <li>Ten percent of earned PP is shared fractionally up the sponsor line.</li>
            <li>Your own listed PP reward is not reduced to fund the share.</li>
            <li>Larger active congregations lower each member&rsquo;s chance of being smote.</li>
            <li>A smite removes up to 5% of PP, capped at 150 PP, and weakens rewards for 48 hours.</li>
          </ul>
        </section>

        <section>
          <h2>Popes and succession</h2>
          <ul>
            <li>The Supreme Pope is the active congregation founder with the most PP.</li>
            <li>If a founder falls below 3,000 PP, their congregation freezes for five days.</li>
            <li>Recovering to 3,000 PP during grace restores the congregation.</li>
            <li>
              After grace, the eligible direct follower with the most PP succeeds the founder. If no direct
              follower has 3,000 PP, the congregation dissolves.
            </li>
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
