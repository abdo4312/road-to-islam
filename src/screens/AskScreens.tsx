import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Screen } from '../types';
import { AskCategories } from './AskCategoriesScreen';
import { AskDetail } from './AskDetailScreen';
import { Mentor } from './MentorScreen';

// ─── Router ───────────────────────────────────────────────────
export default function AskScreens() {
  const location = useLocation();
  const initial = (location.state as any)?.initialScreen as Screen | undefined;

  const [screen, setScreen] = useState<Screen>(initial ?? 'ASK_CATEGORIES');

  React.useEffect(() => {
    if (initial) setScreen(initial);
  }, [location.key]);

  return (
    <>
      {screen === 'ASK_CATEGORIES' && <AskCategories setScreen={setScreen} />}
      {screen === 'ASK_DETAIL' && <AskDetail setScreen={setScreen} />}
      {screen === 'MENTOR' && <Mentor setScreen={setScreen} />}
    </>
  );
}
