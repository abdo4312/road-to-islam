import i18n from '../i18n';

export interface FAQ {
  id: string;
  category: string;
  question: string;
  shortAnswer: string;
  fullAnswer: string;
  source?: string;
}

export const getFaqCategories = () => [
  { id: 'urgent', name: i18n.t('faqCategories.urgent') },
  { id: 'prayer', name: i18n.t('faqCategories.prayer') },
  { id: 'purity', name: i18n.t('faqCategories.purity') },
  { id: 'halal',  name: i18n.t('faqCategories.halal') },
  { id: 'family', name: i18n.t('faqCategories.family') },
];

export const FAQ_CATEGORIES = getFaqCategories();

export const FAQS: FAQ[] = [
  // Urgent / Basics
  {
    id: 'sins-forgiven',
    category: 'urgent',
    question: 'Are my past sins forgiven after converting?',
    shortAnswer: 'Yes, absolutely. Entering Islam wipes away all previous sins.',
    fullAnswer: 'When a person accepts Islam by sincerely saying the Shahada (testimony of faith), all of their previous sins—no matter how major or numerous—are completely forgiven and wiped away. It is as if they are a newborn child, starting with a clean slate. In fact, out of God’s extraordinary mercy, past bad deeds may even be converted into good deeds.',
    source: 'Quran 8:38, Hadith (Sahih Muslim 121)'
  },
  {
    id: 'change-name',
    category: 'urgent',
    question: 'Do I need to change my name?',
    shortAnswer: 'No, unless your name means something bad or worships someone other than God.',
    fullAnswer: 'Changing your name is not a requirement to become a Muslim. You are entirely free to keep your birth name, which helps maintain your identity and family ties. The only exception is if your name has an inherently bad meaning (e.g., "Sorrow") or implies the worship of someone/something other than the One God (e.g., "Servant of Jesus"). In such cases, taking an Islamic or neutral name is recommended.',
  },
  {
    id: 'circumcision',
    category: 'urgent',
    question: 'Do I need to be circumcised?',
    shortAnswer: 'It is highly recommended for men as part of hygiene, but not a condition to become Muslim.',
    fullAnswer: 'For men, circumcision is considered an important practice of the Prophets (Sunnah) and contributes to physical purity (fitrah) and hygiene, which is crucial for prayer. However, it is fundamentally absolutely NOT a requirement to take your Shahada and enter Islam. If the procedure causes extreme fear, financial hardship, or medical risk for an adult convert, some scholars even permit delaying or foregoing it. Your faith comes first.',
  },

  // Prayer & Worship
  {
    id: 'prayer-times',
    category: 'prayer',
    question: 'How many times a day do Muslims pray?',
    shortAnswer: 'Muslims observe five mandatory prayers a day.',
    fullAnswer: 'There are five obligatory prayers (Salah) performed throughout the day at specific times aligned with the sun: Fajr (dawn), Dhuhr (midday), Asr (late afternoon), Maghrib (just after sunset), and Isha (night). These prayers anchor a Muslim’s day, providing constant spiritual connection and returning one’s focus to God.',
    source: 'Quran 4:103'
  },
  {
    id: 'what-is-wudu',
    category: 'prayer',
    question: 'What is Wudu?',
    shortAnswer: 'Wudu is the ritual washing performed before prayer.',
    fullAnswer: 'Wudu (ablution) is the specific method of washing parts of the body using pure water to achieve physical and spiritual cleanliness before performing the daily prayers or handling the Arabic Quran. It involves washing the hands, mouth, nose, face, arms, wiping the head, and washing the feet.',
  },
  {
    id: 'pray-in-english',
    category: 'prayer',
    question: 'Can I pray in English?',
    shortAnswer: 'The core recitation must eventually be in Arabic, but you can use English while learning.',
    fullAnswer: 'The official words of the obligatory Salah (like Al-Fatiha) must be recited in the original Arabic, as it unites Muslims globally and preserves the exact words of revelation. However, as a new convert, God does not burden you beyond your capability. It is permissible to hold a cheat sheet, use transliteration, or listen to audio while praying as you learn. Any personal supplications (Dua) made during or after prayer can absolutely be done in English or any language you speak.',
  },

  // Purity
  {
    id: 'breaks-wudu',
    category: 'purity',
    question: 'What breaks Wudu?',
    shortAnswer: 'Using the restroom, passing wind, deep sleep, or loss of consciousness.',
    fullAnswer: 'Your state of Wudu is invalidated by any of the following natural occurrences: urination, defecation, passing wind, deep sleep where you lose awareness of your body, falling unconscious, or direct intimate contact (which requires a full wash, Ghusl). Eating, drinking (except camel meat), or talking does not break your Wudu.',
  },
  {
    id: 'what-is-ghusl',
    category: 'purity',
    question: 'What is Ghusl?',
    shortAnswer: 'Ghusl is a full-body ritual bath required after major impurities.',
    fullAnswer: 'Ghusl is the complete washing of the entire body with water. It is required to return to a state of purity after major ritual impurities, which include: marital intimacy, emission of bodily fluids, the end of the menstrual cycle, and post-partum bleeding. It involves forming the intention to purify oneself and ensuring water reaches every single part of the hair and body.',
  },

  // Halal & Haram
  {
    id: 'music-haram',
    category: 'halal',
    question: 'Is music haram?',
    shortAnswer: 'There is a spectrum of scholarly opinion, but most agree instruments are restricted.',
    fullAnswer: 'The topic of music has nuance in Islamic jurisprudence. The majority of classical scholars hold the view that musical instruments (with the exception of the daff/tambourine) are generally impermissible (haram). Some contemporary scholars permit uplifting or neutral music that doesn\'t promote sin. However, all scholars unanimously agree that music promoting violence, explicit sexuality, drugs, or polytheism is strictly forbidden. It is recommended for new Muslims to gradually replace music with the recitation of the Quran or Islamic vocal poetry (Nasheeds).',
  },
  {
    id: 'what-cant-i-eat',
    category: 'halal',
    question: "What can't I eat?",
    shortAnswer: 'Pork, alcohol, blood, and meat not slaughtered in the name of God.',
    fullAnswer: 'The dietary laws of Islam are quite straightforward. You are forbidden to consume: entirely any part of the pig (pork, bacon, ham, gelatin), any intoxicants including all alcohol/liquor regardless of quantity, blood, and meat that was violently killed, found dead, or slaughtered in the name of anyone other than Allah. Most seafood and vegetable products are completely Halal (permissible). For meat (beef, chicken, lamb), look for certified "Halal" butchers.',
    source: 'Quran 2:173, 5:90'
  },

  // Family & Social
  {
    id: 'tell-family',
    category: 'family',
    question: 'How do I tell my non-Muslim family?',
    shortAnswer: 'With patience, excellent character, and at a pace that ensures your safety.',
    fullAnswer: 'Telling your family is one of the hardest steps for a convert. There is no religious obligation to announce your conversion immediately. You should wait until you feel safe, knowledgeable, and emotionally ready. Lead with excellent character, showing them that becoming Muslim has made you a kinder, more respectful child/sibling. When you do tell them, be prepared for shock or anger, but answer them gently. Islam places massive emphasis on maintaining ties of kinship and treating parents with supreme excellence, even if they reject your faith.',
    source: 'Quran 31:14-15'
  },
  {
    id: 'keep-friends',
    category: 'family',
    question: 'Can I keep my non-Muslim friends?',
    shortAnswer: 'Yes, as long as they respect your faith and do not pull you into major sins.',
    fullAnswer: 'Yes, Islam does not demand that you cut off all your non-Muslim friends. You are encouraged to be a good friend, neighbor, and positive example to them. The limitation is simply whether these friendships are harmful to your new lifestyle. If your friends constantly pressure you to drink alcohol, go to clubs, or mock your religion, it is best to distance yourself gracefully. Surround yourself with supportive people, and proactively try to make new friends in the local Muslim community.',
  }
];
