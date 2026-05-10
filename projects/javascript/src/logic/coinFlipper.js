/**
 * Coin flip probabilities and outcomes — ported from
 * https://github.com/citlaliac/coin-boys (logic/coinFlipper.tsx)
 */
export const CoinType = {
  headsCoin: 'headsCoin',
  tailsCoin: 'tailsCoin',
  headSideCoin: 'headSideCoin',
  tailsSideCoin: 'tailsSideCoin',
  freshCoin: 'freshCoin',
};

export const COIN_IMAGE_URL = {
  [CoinType.headsCoin]: '/assets/coin-boys/coin-heads.png',
  [CoinType.tailsCoin]: '/assets/coin-boys/coin-tails.png',
  [CoinType.headSideCoin]: '/assets/coin-boys/coin-head-side.png',
  [CoinType.tailsSideCoin]: '/assets/coin-boys/coin-tails-side.png',
  [CoinType.freshCoin]: '/assets/coin-boys/coin-side.png',
};

/** Match Expo app Animated.timing duration (App.tsx) */
export const COIN_FLIP_DURATION_MS = 880;

function coinFlipper() {
  const randomNumber = Math.random();

  if (randomNumber < 0.995 && randomNumber >= 0.5) {
    return CoinType.headsCoin;
  }
  if (randomNumber > 0.005 && randomNumber < 0.5) {
    return CoinType.tailsCoin;
  }
  if (randomNumber >= 0.995) {
    return CoinType.headSideCoin;
  }
  if (randomNumber <= 0.005) {
    return CoinType.tailsSideCoin;
  }
  console.error(
    'randomNumber value in coinFlipper did not match any outcome:',
    randomNumber
  );
  return CoinType.freshCoin;
}

export default coinFlipper;
