import { useBetsNow as useReal } from './useBetsNow';
import { useBetsNowMock as useMock } from './useBetsNowMock';

const useBetsNowUnified =
    process.env.NEXT_PUBLIC_USE_MOCK_BETS === '1' ? useMock : useReal;

export { useBetsNowUnified as useBetsNow };
