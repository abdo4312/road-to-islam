export type Screen =
  | 'LANDING'
  | 'LANGUAGE'
  | 'ONBOARDING_1'
  | 'ONBOARDING_2'
  | 'ONBOARDING_3'
  | 'REGISTER'
  | 'LOGIN'
  | 'AUTH_LOADING'
  | 'HOME'
  | 'LEARN_PROGRAM'
  | 'LEARN_DAY_DETAIL'
  | 'LEARN_PRAY'
  | 'ASK_CATEGORIES'
  | 'ASK_DETAIL'
  | 'QIBLA'
  | 'PRAYER_TIMES'
  | 'MENTOR'
  | 'MOSQUES'
  | 'SETTINGS'
  | 'NOTIFICATIONS'
  | 'FIND_MENTOR'
  | 'MENTOR_DASHBOARD'
  | 'MENTOR_CHAT';

export interface AppState {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export interface LocationState {
  initialScreen?: Screen;
  chatParams?: {
    requestId: string;
    otherPersonName: string;
  };
}
