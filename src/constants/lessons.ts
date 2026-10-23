import { Screen } from '../types';

export type Lesson = {
  day: number;
  week: number;
  title: string;
  subtitle: string;
  content: string;
  keyPoints: string[];
  task: string;
  taskLink?: Screen;
  durationMin: number;
  imageUrl?: string;
  coming_soon?: boolean;
};

export const LESSONS: Lesson[] = [
  {
    day: 1,
    week: 1,
    title: "What is Islam?",
    subtitle: "The Religion of Peace and Submission",
    content: "Islam is a monotheistic religion founded on the belief in one God, Allah. The word Islam itself comes from the Arabic root meaning 'peace' and 'submission'. It is a complete way of life that guides billions of people around the world in their daily actions, spiritual growth, and community relations.\n\nAt its core, Islam teaches that the purpose of life is to recognize the Creator and live according to His guidance. This guidance was revealed to the Prophet Muhammad ﷺ through the Quran, the holy book of Muslims. By adhering to these teachings, Muslims strive to achieve inner peace and harmony in society.",
    keyPoints: [
      "Monotheistic religion believing in one God (Allah)",
      "Name means 'peace' and 'submission'",
      "Guides spiritual, personal, and communal aspects of life",
      "Founded on the teachings in the Quran"
    ],
    task: "Reflect on your initial thoughts about Islam and write down one question you hope to answer during this journey.",
    durationMin: 5
  },
  {
    day: 2,
    week: 1,
    title: "Who is Allah?",
    subtitle: "The Creator and Sustainer",
    content: "Allah is the Arabic word for God, the one and only Creator of the universe. In Islam, Allah is uniquely one—He has no partners, no parents, and no children. Believing in this absolute oneness, known as Tawhid, is the most fundamental concept in the Islamic faith.\n\nMuslims believe that Allah is entirely distinct from His creation. The Quran describes Him using 99 attributes or 'Beautiful Names,' such as The Most Merciful (Ar-Rahman), The Forgiving (Al-Ghafoor), and The Provider (Ar-Razzaq). Understanding these names helps Muslims build a closer, more meaningful relationship with God.",
    keyPoints: [
      "Allah is the Arabic word for the one true God",
      "Tawhid refers to the absolute oneness of God",
      "God is separate and distinct from creation",
      "Known by 99 attributes that describe His nature"
    ],
    task: "Learn the meaning of 'Al-Rahman' (The Entirely Merciful) and 'Al-Raheem' (The Especially Merciful).",
    durationMin: 8
  },
  {
    day: 3,
    week: 1,
    title: "The Five Pillars",
    subtitle: "The Foundation of Faith",
    content: "The Five Pillars of Islam form the fundamental framework of a Muslim's faith and practice. Just as a building needs strong pillars to stand, Islam relies on these acts of worship. They are deeply spiritual and practical guidelines that shape a Muslim's daily life and commitment.\n\nThe pillars are: Shahada (Declaration of Faith), Salah (Prayer five times a day), Zakat (Charity for the needy), Sawm (Fasting during Ramadan), and Hajj (Pilgrimage to Mecca). These acts cultivate discipline, mindfulness, charity, and a deep sense of global community among Muslims.",
    keyPoints: [
      "The fundamental framework of a Muslim's life",
      "Comprises Shahada, Salah, Zakat, Sawm, and Hajj",
      "Provides a structure for daily and yearly worship",
      "Promotes spiritual discipline, community, and charity"
    ],
    task: "Memorize the names of the five pillars.",
    durationMin: 7
  },
  {
    day: 4,
    week: 1,
    title: "The Story of Prophet Muhammad ﷺ",
    subtitle: "The Final Messenger",
    content: "Prophet Muhammad ﷺ (peace be upon him) was born in Mecca in 570 CE. Unlike divine figures in some other religions, Muslims believe he was a human chosen by Allah as the final prophet to deliver God's message to mankind. His life serves as the ultimate living example—the Sunnah—of how to apply the Quran's teachings.\n\nAt age 40, he received his first revelation from the Angel Gabriel. For the next 23 years, he patiently preached the message of Islam despite extreme hardship. He is respected by Muslims worldwide for his flawless character, profound mercy, unwavering justice, and complete dedication to God.",
    keyPoints: [
      "The final prophet and messenger of Allah",
      "Received the first revelation at age 40",
      "His actions and sayings (Sunnah) are a primary guide for Muslims",
      "Known for his perfect moral character and mercy"
    ],
    task: "Read a short biography or summary of the Prophet's early life.",
    durationMin: 10
  },
  {
    day: 5,
    week: 1,
    title: "The Quran — What is it?",
    subtitle: "The Word of Allah",
    content: "The Quran is the central religious text of Islam, believed by Muslims to be the literal word of God (Allah) as revealed to the Prophet Muhammad ﷺ. It was revealed in Arabic over a period of 23 years and is considered the ultimate authority in all matters of faith, ethics, and law.\n\nUnlike other historical religious texts that have undergone numerous translations and revisions, the Quran remains preserved in its exact original Arabic language. It covers a vast range of topics including theology, morality, guidance for personal conduct, and stories of previous prophets like Moses and Jesus.",
    keyPoints: [
      "The literal, uncorrupted word of God in Islam",
      "Revealed to Prophet Muhammad ﷺ over 23 years",
      "Intact in its original Arabic language",
      "Serves as the ultimate guide for humanity"
    ],
    task: "Listen to a recitation of Surah Al-Fatiha (The Opening chapter).",
    durationMin: 6
  },
  {
    day: 6,
    week: 1,
    title: "What is Shahada?",
    subtitle: "The Declaration of Faith",
    content: "The Shahada is the most crucial of the Five Pillars of Islam. It is the simple, profound declaration of faith: 'There is no god but Allah, and Muhammad is the messenger of Allah.' Sincerely uttering this sentence with conviction is all that is required for a person to embrace Islam.\n\nThe Shahada encapsulates the entire Islamic belief system. The first part affirms strict monotheism and rejects all forms of idolatry, while the second part affirms the legitimacy of Muhammad's ﷺ prophethood and his role as the final transmitter of divine guidance.",
    keyPoints: [
      "The first and most important pillar of Islam",
      "The entry point into the Islamic faith",
      "Attests to the oneness of God and the prophethood of Muhammad ﷺ",
      "Forms the core of the Muslim call to prayer and daily prayers"
    ],
    task: "Practice pronouncing the Shahada in Arabic slowly.",
    durationMin: 5
  },
  {
    day: 7,
    week: 1,
    title: "What is Jumuah (Friday Prayer)?",
    subtitle: "The Weekly Congregation",
    content: "In Islam, Friday (Jumuah) is considered the most blessed day of the week. Unlike the Sabbath in Judaism or Sunday in Christianity, Muslims do not believe Friday is a day of rest, but rather a day of communal worship. The Friday prayer is an obligatory congregation for Muslim men and highly encouraged for women.\n\nThe Jumuah prayer consists of a sermon (Khutbah) delivered by an Imam, followed by a short congregational prayer. It is a powerful weekly gathering that fosters community cohesion, provides spiritual reminders, and allows Muslims to stand shoulder-to-shoulder in unity before God.",
    keyPoints: [
      "The weekly congregational prayer held every Friday",
      "Replaces the regular midday (Dhuhr) prayer",
      "Includes a sermon (Khutbah) for spiritual reminders",
      "Promotes community unity and equality"
    ],
    task: "Locate the nearest Mosque using the Mosques screen to prepare for your first Jumuah.",
    taskLink: 'MOSQUES',
    durationMin: 8
  },
  {
    day: 8,
    week: 2,
    title: "How to Perform Wudu",
    subtitle: "Ritual Purification",
    content: "Wudu is the ritual washing performed by Muslims before prayer. It is not just about physical cleanliness but also spiritual preparation, shifting your focus from the worldly life to standing before your Creator. Allah loves those who turn to Him and loves those who keep themselves pure.\n\nThe process follows a specific order: washing the hands, mouth, nose, face, arms up to the elbows, wiping the head, and finally washing the feet up to the ankles. Each step is done with the intention (Niyyah) of attaining purity for the sake of Allah. If you lose your Wudu (e.g., by using the restroom), you simply repeat the process before your next prayer.",
    keyPoints: [
      "Spiritual and physical preparation for Salah",
      "Requires pure water and a sincere intention",
      "Follows a specific sequence of washing body parts",
      "Maintains a state of constant mindfulness and readiness"
    ],
    task: "Watch a video on how to perform Wudu and practice the steps once without water to memorize the order.",
    durationMin: 7
  },
  {
    day: 9,
    week: 2,
    title: "How to Pray (Salah)",
    subtitle: "Step by Step Guide",
    content: "Salah is the second pillar of Islam and the most direct link between a servant and Allah. It is performed five times a day as a means of seeking guidance, forgiveness, and peace. While it may seem complex at first, remember that Allah sees your effort and rewards your sincerity as you learn.\n\nA single unit of prayer is called a Rak'ah. It involve standing (Qiyam), bowing (Ruku), prostrating (Sujud), and sitting (Tashahhud). The prostration (Sujud) is the moment when a believer is closest to God. You can use a prayer guide or an app to help you follow along until you have memorized the movements and recitations in Arabic.",
    keyPoints: [
      "Establishes a direct spiritual connection with Allah",
      "Consists of specific physical movements and recitations",
      "The prostration (Sujud) is the peak of humility",
      "Perfection comes with practice and patience"
    ],
    task: "Try to stand in a quiet place and practice the movements of one Rak'ah (bowing and prostrating) to get comfortable with the physical form.",
    taskLink: 'PRAYER_TIMES',
    durationMin: 12
  },
  {
    day: 10,
    week: 2,
    title: "Understanding the Adhan",
    subtitle: "The Call to Prayer",
    content: "The Adhan is a beautiful melodic call that invites Muslims to the five daily prayers. It is proclaimed from mosques around the world, signaling that it is time to set aside worldly concerns and turn toward the Divine. The words of the Adhan are a summary of the entire Islamic creed.\n\nWhen you hear the Adhan, it is recommended to stop and listen attentively, repeating the phrases quietly. It begins with 'Allahu Akbar' (God is Greater), reminding us that God is greater than anything we are currently busy with. It serves as a heartbeat for the Muslim community, uniting everyone in a shared rhythm of worship.",
    keyPoints: [
      "The public announcement for the start of prayer time",
      "Contains key declarations: God's greatness and the Shahada",
      "Unites the community in a synchronized schedule of worship",
      "Hearing it is a moment for reflection and preparation"
    ],
    task: "Listen to a recording of the Adhan and look up the English translation of its phrases.",
    durationMin: 6
  },
  {
    day: 11,
    week: 2,
    title: "What is Zakat?",
    subtitle: "Purifying Wealth through Charity",
    content: "Zakat is the third pillar of Islam and represents a mandatory form of charity. It is a specific percentage (usually 2.5%) of a Muslim's surplus wealth given annually to those in need. The word Zakat literally means 'purification' and 'growth,' as it purifies the giver's heart from greed and brings blessings to their remaining wealth.\n\nZakat is not a tax, but a spiritual obligation. it ensures that wealth circulates within society and that the basic needs of the poor, the orphans, and the travelers are met. By giving Zakat, a Muslim acknowledges that everything they possess ultimately belongs to Allah, and they are merely stewards of His bounties.",
    keyPoints: [
      "An obligatory annual charity of 2.5% of surplus wealth",
      "Aims to purify the heart and balance social inequality",
      "Targets specific groups like the poor and the needy",
      "Foster a sense of social responsibility and brotherhood"
    ],
    task: "Find a local or international Islamic charity website and read about how they distribute Zakat to those in need.",
    durationMin: 9
  },
  {
    day: 12,
    week: 2,
    title: "Ramadan and Fasting",
    subtitle: "Training the Soul (Sawm)",
    content: "Fasting during the holy month of Ramadan is the fourth pillar of Islam. From dawn until sunset, Muslims abstain from food, drink, and intimate relations. This practice is not about starvation; rather, it is a spiritual exercise designed to increase God-consciousness (Taqwa), self-discipline, and empathy for the hungry.\n\nRamadan is also the month in which the Quran was first revealed. It is a time for increased prayer, reading the Quran, and acts of kindness. Breaking the fast (Iftar) is a joyous occasion often shared with family and the community. Even if you cannot fast the full month initially, your intention to draw closer to Allah is what matters most.",
    keyPoints: [
      "Abstaining from dawn to sunset during the month of Ramadan",
      "Builds self-control and empathy for the less fortunate",
      "A month of spiritual renewal and the revelation of the Quran",
      "Ends with the celebratory holiday of Eid al-Fitr"
    ],
    task: "Research the date of the next Ramadan and try fasting for just a few hours as a trial run to feel the experience.",
    durationMin: 10
  },
  {
    day: 13,
    week: 2,
    title: "What is Hajj?",
    subtitle: "The Journey of a Lifetime",
    content: "Hajj is the annual pilgrimage to the holy city of Mecca in Saudi Arabia. It is an obligation once in a lifetime for every Muslim who is physically and financially able to perform it. Millions of Muslims from every corner of the globe gather in unity, all wearing simple white garments that eliminate distinctions of race, status, or wealth.\n\nThe rituals of Hajj retrace the footsteps of Prophet Ibrahim (Abraham) and his family, symbolizing complete submission to God's command. It is a profound spiritual journey that results in a 'rebirth' for the pilgrim, where they return home with their sins forgiven and a renewed commitment to their faith.",
    keyPoints: [
      "An obligatory pilgrimage once in a lifetime for those able",
      "Symbolizes the ultimate unity and equality of all Muslims",
      "Retraces the trials and submission of Prophet Ibrahim (AS)",
      "Performed during the month of Dhu al-Hijjah"
    ],
    task: "View photos or a video of the Kaaba in Mecca to understand the focal point of the Hajj pilgrimage.",
    taskLink: 'QIBLA',
    durationMin: 11
  },
  {
    day: 14,
    week: 2,
    title: "Six Articles of Faith",
    subtitle: "Inner Beliefs (Iman)",
    content: "While the Five Pillars are the outer actions of a Muslim, the Six Articles of Faith represent the inner core of belief. These are the fundamental truths that a Muslim must accept in their heart. Together, they provide a comprehensive worldview and a sense of purpose.\n\nThe articles are: Belief in Allah (the only God), His Angels, His Revealed Books (Quran, Torah, Gospel), His Messengers, the Day of Judgment, and Divine Decree (Qadar). Understanding these articles helps a Muslim navigate the world with certainty, knowing that life is purposeful and guided by a Wise Creator.",
    keyPoints: [
      "The intellectual and spiritual foundation of Islamic belief",
      "Includes belief in God, Angels, Books, and Messengers",
      "Covers the reality of the Hereafter and Divine Decree",
      "Distinguishes between outward practice and inward faith (Iman)"
    ],
    task: "Write down the six articles of faith and reflect on which one you want to learn more about first.",
    durationMin: 8
  },
  {
    day: 15,
    week: 3,
    title: "The Angels in Islam",
    subtitle: "Noble Servants of Allah",
    content: "Angels (Mala'ikah) are a fundamental part of the unseen world in Islam. Unlike humans, they were created from light and do not possess free will; they exist solely to obey and worship Allah. Believing in them is one of the pillars of faith.\n\nEach angel has a specific duty. For example, Jibril (Gabriel) brought revelations to the prophets, Mika'il is responsible for rain and sustenance, and the Guardian Angels record our daily deeds. Knowing that we are surrounded by these noble beings brings a sense of comfort and responsibility, reminding us that we are never truly alone in our journey toward God.",
    keyPoints: [
      "Created from light and do not have free will",
      "Always in a state of obedience and worship to Allah",
      "Assigned various roles, from bringing revelation to recording deeds",
      "Belief in the unseen is a core requirement of faith"
    ],
    task: "Identify the names of three different angels mentioned in Islamic tradition and their specific roles.",
    durationMin: 7
  },
  {
    day: 16,
    week: 3,
    title: "The Day of Judgment",
    subtitle: "Accountability and Justice",
    content: "Islam teaches that this worldly life is a temporary test and a preparation for the eternal life to come. The Day of Judgment (Yawm al-Qiyamah) is the day when all of humanity will be resurrected to stand before Allah and account for their choices, actions, and intentions.\n\nOn this day, perfect justice will be served. No one will be wronged by even an atom's weight. Those who believed and did good will find peace and reward in Paradise (Jannah), while those who rejected truth will face consequences. This belief encourages Muslims to live with integrity, kindness, and a clear conscience, knowing that their efforts are never wasted.",
    keyPoints: [
      "The day of final accountability for all human actions",
      "Establishes the ultimate justice that may lack in this world",
      "Leads to the eternal resting place: Paradise or Hellfire",
      "Motivates a person to do good and avoid harm to others"
    ],
    task: "Reflect on one good deed you did this week and the intention behind it.",
    durationMin: 9
  },
  {
    day: 17,
    week: 3,
    title: "Halal and Haram",
    subtitle: "Living a Pure Life",
    content: "The concepts of Halal (permissible) and Haram (forbidden) are central to an Islamic lifestyle. Allah, in His wisdom, has made good and beneficial things permissible for us while forbidding things that are harmful to our bodies, spirits, or society.\n\nThis applies to food (like avoiding pork and alcohol), finances (avoiding interest and gambling), and social conduct. However, the default in Islam is that everything is Halal unless there is a specific evidence to make it Haram. Following these guidelines is an act of worship that purifies your life and brings you closer to the pleasure of God.",
    keyPoints: [
      "Halal means permissible; Haram means forbidden",
      "Guidelines are based on what is beneficial and what is harmful",
      "Covers diet, income, relationships, and ethics",
      "Obedience in these matters is a source of spiritual growth"
    ],
    task: "The next time you go grocery shopping, look for the 'Halal' logo on meat or check the ingredients of a common snack for gelatin or alcohol.",
    durationMin: 8
  },
  {
    day: 18,
    week: 3,
    title: "Ethics and Character",
    subtitle: "The Prophetic Manner",
    content: "Prophet Muhammad ﷺ said, 'I was sent only to perfect honorable character.' In Islam, being a 'good person' is not separate from being a 'good believer.' High moral standards, such as honesty, patience, humility, and kindness, are considered weights that heavily favor a person on the scale of deeds.\n\nMuslims are encouraged to be excellent in their dealings with everyone—family, neighbors, coworkers, and even strangers. A smile is considered an act of charity, and helping someone in need is a way to gain God's mercy. Your character is the most visible representative of your faith to the world.",
    keyPoints: [
      "Good character is a central part of Islamic worship",
      "Focuses on honesty, patience, and kindness to all",
      "Prophet Muhammad ﷺ is the ultimate role model for manners",
      "Excellent conduct is rewarded heavily in the afterlife"
    ],
    task: "Make a conscious effort to perform one small act of kindness today, such as holding a door open or giving a sincere compliment.",
    durationMin: 6
  },
  {
    day: 19,
    week: 3,
    title: "Family in Islam",
    subtitle: "The Fabric of Society",
    content: "Islam places immense importance on the family unit, viewing it as the foundation of a healthy community. Each member has rights and responsibilities. Parents are to be treated with supreme kindness and respect, especially in their old age. The Quran tells us not even to say 'uff' (an expression of frustration) to them.\n\nSpouses are described as 'garments' for one another—providing protection, comfort, and beauty. Children are seen as a trust from God to be raised with love and righteous values. Maintaining 'ties of kinship' is highly rewarded, even if family members are difficult or do not share your faith.",
    keyPoints: [
      "Parents, especially mothers, hold a very high status",
      "Spousal relationships are based on mutual love and mercy",
      "Maintaining family ties is a mandatory spiritual duty",
      "A strong family leads to a strong and supportive society"
    ],
    task: "Call or message a family member today just to check in on them and show kindness.",
    durationMin: 7
  },
  {
    day: 20,
    week: 3,
    title: "Dua — Supplication",
    subtitle: "The Weapon of the Believer",
    content: "While the five daily prayers (Salah) have a set format, Dua is your personal and private conversation with Allah. It can be done at any time, in any language, and for any need—no matter how big or small. Allah says in the Quran, 'Call upon Me; I will respond to you.'\n\nDua is an acknowledgment of our dependence on God and His infinite power to help us. It is often described as the 'weapon of the believer' because it provides hope and strength during difficult times. Whether you are asking for guidance, a job, health, or simply thanking Him, Allah loves to hear the voice of His servant in supplication.",
    keyPoints: [
      "Personal, informal conversation with Allah",
      "Can be performed in any language and at any time",
      "Demonstrates humility and trust in God's power",
      "A source of immense comfort and emotional relief"
    ],
    task: "Find a quiet moment, raise your hands, and ask Allah in your own words for one thing you need and one thing you are grateful for.",
    taskLink: 'ASK_CATEGORIES',
    durationMin: 5
  },
  {
    day: 21,
    week: 3,
    title: "Dhikr — Remembrance",
    subtitle: "Polishing the Heart",
    content: "Dhikr refers to the repetitive remembrance of Allah through specific words or phrases. The Quran states, 'Verily, in the remembrance of Allah do hearts find rest.' In a busy and stressful world, Dhikr acts as a spiritual anchor that brings instantaneous peace and re-centers your life on what truly matters.\n\nSimple phrases like 'SubhanAllah' (Glory be to God), 'Alhamdulillah' (Praise be to God), and 'Allahu Akbar' (God is Greatest) can be said while walking, driving, or doing chores. These short phrases carry immense weight in rewards and help keep your heart connected to the Divine throughout the day.",
    keyPoints: [
      "Consistent remembrance of Allah during daily activities",
      "Brings tranquility and reduces anxiety in the heart",
      "Utilizes simple, powerful phrases from the Quran and Sunnah",
      "Ensures that God is present in your mind at all times"
    ],
    task: "Choose one phrase (e.g., 'Alhamdulillah') and repeat it 33 times while sitting peacefully after a meal or before bed.",
    durationMin: 5
  },
  {
    day: 22,
    week: 4,
    title: "Prophet Ibrahim (AS)",
    subtitle: "The Friend of Allah",
    content: "Prophet Ibrahim (Abraham) is a towering figure in Islam, known as 'Khalilullah' (The Friend of Allah). He is the patriarch of the monotheistic faiths and a model of unwavering trust in God. His story is one of leaving behind idolatry and sacrificing his own comfort for the sake of Divine truth.\n\nIbrahim (AS) faced many trials, including being thrown into a fire for his beliefs and being asked to leave his family in a barren desert. Each time, his response was 'HasbunAllahu wa ni'mal wakeel' (Allah is sufficient for us, and He is the best Disposer of affairs). His legacy is celebrated every year during the Hajj pilgrimage and the festival of Eid al-Adha.",
    keyPoints: [
      "A common ancestor of the major monotheistic religions",
      "Renowned for his absolute submission and trust in Allah",
      "Rebuilt the Kaaba along with his son Isma'il (AS)",
      "His life is the basis for many annual Islamic rituals"
    ],
    task: "Look up why the festival of 'Eid al-Adha' is celebrated and how it relates to Prophet Ibrahim (AS).",
    durationMin: 10
  },
  {
    day: 23,
    week: 4,
    title: "Prophet Musa (AS)",
    subtitle: "The One who Spoke to God",
    content: "Prophet Musa (Moses) is the prophet mentioned most frequently by name in the Quran. His story is an epic of liberation, grit, and the struggle against oppression (Pharaoh). Musa (AS) was given the miracle of the staff that turned into a serpent and the parting of the Red Sea.\n\nBeyond the miracles, the Quran highlights Musa's (AS) humanity—his fears, his learning, and his deep dedication to his people. He is honored as the one who spoke directly to Allah on Mount Sinai. His journey reminds us that Allah supports the weak against the arrogant and that patience combined with faith always leads to victory.",
    keyPoints: [
      "The prophet mentioned most often in the Quran",
      "Led the Children of Israel out of slavery in Egypt",
      "Revealed the Torah (Tawrat) as a guide for his people",
      "Symbolizes courage in the face of tyranny"
    ],
    task: "Read about the significance of the 'Day of Ashura' and how it commemorates Prophet Musa (AS).",
    durationMin: 11
  },
  {
    day: 24,
    week: 4,
    title: "Prophet Isa (AS)",
    subtitle: "Jesus in Islam",
    content: "Prophet Isa (Jesus) is a highly beloved and respected figure in Islam. Muslims believe in his miraculous virgin birth to Mary (Maryam), who is the most honored woman in the Quran. Isa (AS) was given powerful miracles, including healing the blind and raising the dead, all by the permission of Allah.\n\nHowever, Islam clarifies that Isa (AS) is a human messenger of God, not God himself nor the Son of God. He preached the message of pure monotheism and compassion. Muslims also believe that he was not crucified but was raised to heaven by Allah and will return to earth before the Day of Judgment to establish justice and peace.",
    keyPoints: [
      "Born miraculously to the Virgin Mary (Maryam)",
      "Performed great miracles by the power and permission of Allah",
      "A prophet who preached the same message of one God",
      "Awaited by Muslims to return to earth in the end times"
    ],
    task: "Read Surah Maryam (Chapter 19) translation to see how the Quran describes Jesus' birth.",
    durationMin: 9
  },
  {
    day: 25,
    week: 4,
    title: "Early Islamic History",
    subtitle: "The First Community",
    content: "After the death of Prophet Muhammad ﷺ, the early Muslim community was led by the Rightly Guided Caliphs—Abu Bakr, Umar, Uthman, and Ali. This era was characterized by a rapid expansion of Islam but, more importantly, a deep commitment to the values of justice, equality, and service established by the Prophet ﷺ.\n\nThis first generation (the Sahaba) sacrificed everything to preserve the Quran and spread the message of Islam across continents. Their lives provide countless examples of how to lead with integrity and how to build a society where the rich and poor, black and white, are all equal under God. Understanding their struggles gives us a sense of belonging to a great historical legacy.",
    keyPoints: [
      "The 'Sahaba' are the companions who saw and believed in the Prophet",
      "The first four leaders ensured the preservation of the faith",
      "Focus was on social justice, law, and spiritual growth",
      "Provides the historical context for the global Muslim Ummah"
    ],
    task: "Look up a short biography of one of the four 'Rightly Guided Caliphs'.",
    durationMin: 10
  },
  {
    day: 26,
    week: 4,
    title: "The Mosque (Masjid)",
    subtitle: "Role and Etiquette",
    content: "The Mosque, or Masjid, is more than just a place for prayer; it is the heart of the Muslim community. It is a sanctuary for peace, a center for learning, and a place for socializing. When you enter a mosque, you are a guest of Allah, and there are certain etiquettes (Adab) to maintain this sacred atmosphere.\n\nOne should be clean, dress modestly, and enter with the right foot while saying a specific prayer. Inside, voices are kept low, and people greet one another with 'As-salamu alaykum' (Peace be upon you). Whether you come for one of the five prayers, a lecture, or simply to find quiet time for reflection, the mosque is your spiritual home.",
    keyPoints: [
      "The central hub for communal prayer and education",
      "Requires physical cleanliness and modest attire",
      "A place that fosters brotherhood and local support",
      "Open to all who seek to learn or worship in peace"
    ],
    task: "Visit a local mosque or take a virtual tour of a famous mosque like the Prophet's Mosque in Medina.",
    taskLink: 'MOSQUES',
    durationMin: 8
  },
  {
    day: 27,
    week: 4,
    title: "Brotherhood & Community",
    subtitle: "The Ummah",
    content: "The word Ummah refers to the global community of Muslims. Islam breaks down all barriers of nationalism, ethnicity, and race, teaching that believers are like one body—if one part suffers, the whole body feels the pain. This sense of brotherhood and sisterhood is a powerful source of support for new Muslims.\n\nYou are now part of a family that spans every continent. Brotherhood in Islam means wishing for your brother what you wish for yourself. It involves visiting the sick, attending funerals, and helping those in financial distress. You are never alone; you are part of a 1.8 billion-strong community that shares your faith and your values.",
    keyPoints: [
      "The 'Ummah' is the collective community of all Muslims",
      "Eradicates racism and tribalism in favor of faith-based unity",
      "Compassion and mutual support are religious obligations",
      "You are a vital part of a global and local spiritual family"
    ],
    task: "Reach out to a community member or a mentor to share one thing you've enjoyed learning this month.",
    taskLink: 'FIND_MENTOR',
    durationMin: 7
  },
  {
    day: 28,
    week: 4,
    title: "Doubts and Questions",
    subtitle: "The Search for Truth",
    content: "Islam encourages seeking knowledge and asking questions. It is natural for a new Muslim, or even a lifelong one, to have moments of doubt or confusion as they navigate their journey. Having a question is not a sign of weak faith; rather, seeking the answer is a sign of sincere belief.\n\nAllah describes the believers as those who use their intellect. If you encounter something you don't understand, reach out to scholars, mentors, or use reliable resources. Avoid 'YouTube rabbit holes' and focus on established experts who speak with mercy and wisdom. Remember that faith is a journey of continuous learning, and clarity comes with patience and sincere Dua.",
    keyPoints: [
      "Asking questions is a healthy part of increasing knowledge",
      "Doubt should be addressed with study and mentorship",
      "Intellect and faith are meant to work together",
      "Focus on reliable, balanced, and compassionate sources"
    ],
    task: "Write down any remaining questions you have and consider asking them to a mentor or through an official FAQ channel.",
    taskLink: 'ASK_CATEGORIES',
    durationMin: 8
  },
  {
    day: 29,
    week: 5,
    title: "Continuing Your Journey",
    subtitle: "Lifelong Learning",
    content: "As you reach the end of this 30-day program, remember that this was only the beginning. The path of Islam is a lifelong journey of growth, discovery, and refinement of the soul. No one becomes a 'perfect Muslim' overnight. Graduation from this program means you now have the tools to continue walking the path with confidence.\n\nKeep your daily prayers as your anchor, keep your connection to the community strong, and never stop seeking knowledge. Consistency in small deeds is better than a huge effort that is quickly abandoned. Allah loves the consistent worker. May He keep you firm on the truth and always guided by His light.",
    keyPoints: [
      "Faith is a continuous process of growth, not a destination",
      "The value of consistent, small good deeds",
      "Importance of maintaining established spiritual habits",
      "Developing a personal plan for future Islamic studies"
    ],
    task: "Set one spiritual goal for the next 30 days (e.g., memorizing one new short Surah or praying all five prayers on time).",
    durationMin: 7
  },
  {
    day: 30,
    week: 5,
    title: "Congratulations!",
    subtitle: "Alhamdulillah for This Journey",
    content: "Alhamdulillah (All Praise is due to Allah)! You have successfully completed this 30-day introduction to your faith. This is a monumental achievement. You have spent a month dedicated to learning about your Creator, your purpose, and your community. You should feel a deep sense of gratitude for being guided to this point.\n\nTake a moment to look back at Day 1 and see how much you have grown. You have gained a solid foundation in the basics of Islam. Now, the rest of your life awaits—a life of purpose, peace, and service. We pray that Allah continues to bless you, protect you, and make you a source of light for those around you. Welcome home to the Ummah.",
    keyPoints: [
      "A moment of celebration and gratitude (Shukr)",
      "Reflecting on the progress made over the last 30 days",
      "Acknowledging Allah's guidance in completing this path",
      "Embracing your role as a member of the global Muslim community"
    ],
    task: "Congratulate yourself! Offer a special prayer of gratitude and share your completion with a friend or your mentor.",
    durationMin: 12
  }
];
