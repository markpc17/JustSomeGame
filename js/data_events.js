'use strict';
// Life aboard: the moments that happen to the Collins, and the choices they ask of you.
// when() returns a weight (0 = cannot happen now). setup() builds context or returns null to skip.

const traveling = () => !!S.travel;
const pickTop = (k, excl = []) => aliveIds().filter((id) => !excl.includes(id)).sort((a, b) => C(b).e[k] - C(a).e[k])[0];
const pickRand = (excl = []) => U.pick(aliveIds().filter((id) => !excl.includes(id)));

const EVENTS = [
  {
    id: 'last_look', once: true, when: () => 0,
    title: 'The Last Look',
    text: () => `Day 1. The Collins has cleared lunar orbit. Every porthole on the ship is crowded with faces. Through the observation dome, Earth is a blue-and-brown marble, wrapped in cloud, smaller every minute.<br><br>Somebody starts to cry. Somebody else laughs. Cal has his guitar but hasn\'t played a note. Everyone is looking at you, ${U.esc(S.playerName)}: the Crew Liaison they elected, the one whose job is to hold them together.<br><br>What do you say?`,
    choices: [
      { label: '“Take a good look. Then let\'s go and find somewhere worth leaving it for.”', tag: 'hope', fx: () => { emoAll({ hope: 10, sorrow: 5 }); return 'A cheer goes up, a bit ragged but real. Kenji fires the fold drive, and Earth becomes a star.'; } },
      { label: 'Say nothing. Just stand with them and watch.', tag: 'sorrow', fx: () => { emoAll({ sorrow: 10, love: 8 }); return 'You stand shoulder to shoulder until Earth is too small to see. Nobody speaks. Nobody needs to.'; } },
      { label: '“Right! Who wants a party?”', tag: 'joy', fx: () => { emoAll({ joy: 12, sorrow: -5 }); emo('kenji', { joy: 10 }); return 'Kenji whoops. Cal hits a chord. The party goes on until 04:00, and it is exactly what everyone needed.'; } },
      { label: '“They did this. The people who burned it. Remember that.”', tag: 'anger', fx: () => { emoAll({ anger: 10 }); emo('sofia', { anger: 8, love: 5 }); emo('zhao', { anger: 5 }); return 'A murmur goes round. Sofia nods hard. Jonah looks at the floor. The anger feels like fuel, and like poison.'; } },
    ],
  },
  {
    id: 'voyager', once: true, when: () => (S.jumps === 0 && traveling() ? 100 : 0),
    title: 'The Golden Record',
    text: () => 'Mid-jump, the sensors ping. An object, old and small and unmistakeable: Voyager 1, launched 1977, drifting at the edge of the solar system for almost a century. Its golden record, a message from Earth to anyone who might find it, is still bolted to its side.<br><br>“We could bring it aboard,” Luka says softly. “It\'s the most valuable object in the universe.” Yasmin shakes her head. “It\'s not ours. It\'s addressed to someone else.”',
    choices: [
      { label: 'Leave it. It\'s a message for strangers, not for us.', tag: 'wonder', fx: () => { emoAll({ wonder: 10, hope: 6 }); emo('yasmin', { love: 10 }); emo('luka', { greed: 5, sorrow: 3 }); return 'You fly alongside it for an hour. Then you let it go, still travelling, still hoping someone will listen. Mateo salutes.'; } },
      { label: 'Bring the record aboard. Humanity\'s last message belongs with the last humans.', tag: 'greed', fx: () => { giveItem('golden_record'); emo('luka', { joy: 15, greed: 5 }); emo('yasmin', { anger: 15 }); emo('zhao', { anger: 8 }); return 'Sofia cuts it free in a careful EVA. The record is now in the Archive. Half the crew thinks it\'s a triumph. The other half won\'t go near it.'; } },
      { label: 'Play the record over the ship\'s speakers, then leave it be.', tag: 'love', fx: () => { emoAll({ love: 8, sorrow: 6, wonder: 6 }); return 'Bach. Whale song. A mother\'s kiss. Greetings in fifty-five languages. The whole crew listens in silence. When it ends, someone whispers “hello” back.'; } },
    ],
  },
  {
    id: 'sol_fades', once: true, when: () => (S.day >= 3 ? 50 : 0),
    title: 'Just Another Star',
    text: 'Mateo announces it quietly at breakfast: from the ship\'s current position, the Sun is no longer the brightest object in the sky. It\'s just a star now. One among thousands. The Mess goes silent.',
    choices: [
      { label: 'Gather everyone in the dome to watch it.', tag: 'wonder', fx: () => { emoAll({ wonder: 10, sorrow: 6, love: 5 }); return 'Mateo points it out: a little yellow dot. Someone holds up a thumb and covers it. Everything they ever knew, hidden behind a thumb.'; } },
      { label: 'Get Cal to play something loud. No moping.', tag: 'joy', fx: () => { emoAll({ joy: 10, sorrow: -4 }); emo('cal', { joy: 10 }); return 'Cal plays a punk cover of a lullaby. It\'s terrible. It works.'; } },
      { label: 'Let people grieve in their own way.', tag: 'sorrow', fx: () => { emoAll({ sorrow: 10, fear: -3 }); emo('yasmin', { love: 6 }); return 'The ship is quiet all day. Yasmin opens the Archive for anyone who wants to look at old photographs. It\'s full until midnight.'; } },
    ],
  },
  {
    id: 'message_home', cooldown: 6, when: () => (!hasFlag('earth_silent') && S.day > 3 ? 18 : 0),
    setup: () => { const who = pickRand(); return who ? { who, good: U.chance(0.45), kind: U.rint(0, 2) } : null; },
    title: (x) => `A Message for ${N(x.who)}`,
    text: (x) => {
      const good = ['a video from their little sister. She\'s had a baby, and named him after the ship.', 'a message from their old school. The students built a model of the Collins and hung it in the hall.', 'a voice note from their best friend: “I got the water permit. We\'re moving north. We\'re going to be OK.”'];
      const bad = ['news that their home district has been evacuated. Nobody knows where their family went.', 'a message from their father. He\'s sick, he says. Not to worry. He\'s very clearly worried.', 'nothing, again. Three months without a word from home. The silence is its own message.'];
      return `The delayed transmission from Earth has arrived. For ${N(x.who)}, there is ${x.good ? good[x.kind] : bad[x.kind]}`;
    },
    choices: (x) => [
      { label: `Find ${N(x.who)} and sit with them.`, tag: 'love', fx: () => { if (x.good) { emo(x.who, { joy: 15, love: 10 }); } else { emo(x.who, { sorrow: 12, love: 10, fear: -5 }); } aff(x.who, 6); return x.good ? `${N(x.who)} plays it for you four times. You watch every one.` : `${N(x.who)} doesn\'t want to talk. You stay anyway. After an hour, they lean their head on your shoulder.`; } },
      { label: 'Suggest they share it with the crew.', tag: 'joy', fx: () => { if (x.good) { emo(x.who, { joy: 12 }); emoAll({ joy: 6, hope: 4 }); return 'The whole Mess watches. People cheer at the screen like it\'s a football match. Earth feels a little closer.'; } emo(x.who, { sorrow: 5, love: 6 }); emoAll({ sorrow: 5, love: 4 }); return 'It\'s hard news. But nobody lets them eat dinner alone.'; } },
      { label: 'Give them space.', tag: 'sorrow', fx: () => { emo(x.who, x.good ? { joy: 8 } : { sorrow: 15 }); return x.good ? 'They grin all day.' : 'Their cabin door stays closed until the next morning.'; } },
    ],
  },
  {
    id: 'missing_rations', cooldown: 12, when: () => (avgEmo('greed') > 25 && S.res.food > 30 ? 10 + avgEmo('greed') / 3 : 0),
    setup: () => ({ thief: pickTop('greed') }),
    title: 'Missing Rations',
    text: () => 'The morning inventory is wrong. Twenty days of rations are missing from the cold store. Luka is beside himself. The Mess is full of sidelong glances. Somebody on this ship is taking more than their share.',
    choices: (x) => [
      { label: 'Investigate. Find out who.', tag: 'anger', fx: () => { res({ food: -8 }); emo(x.thief, { fear: 20, sorrow: 10, greed: -12 }); aff(x.thief, -5); emoAll({ anger: 4 }); logEv(`${N(x.thief)} was caught taking extra rations.`, 'greed'); return `It\'s ${N(x.thief)}. Some of the food is still there, stuffed behind a panel in their cabin. They can\'t explain why. They say they just got scared. Most of the ration bars go back to stores.`; } },
      { label: 'Lock the stores. New rule: two people to open them.', tag: 'fear', fx: () => { res({ food: -20 }); emoAll({ greed: -8, fear: 5, anger: 3 }); return 'Nobody likes the new locks. But the numbers balance after that.'; } },
      { label: 'Announce an amnesty. Put it back, no questions.', tag: 'love', fx: () => { res({ food: -5 }); emo(x.thief, { greed: -15, love: 8 }); emoAll({ greed: -4, love: 3 }); return 'Overnight, most of the rations reappear on the Mess table, with a note: ‘Sorry. I got scared.’'; } },
      { label: 'Let it go. Food is food.', tag: 'greed', fx: () => { res({ food: -20 }); emoAll({ greed: 6 }); return 'The thefts don\'t stop. Now more people are doing it.'; } },
    ],
  },
  {
    id: 'fight', cooldown: 8, when: () => (avgEmo('anger') > 30 ? avgEmo('anger') / 2 : 0),
    setup: () => { const a = pickTop('anger'); const b = aliveIds().filter((i) => i !== a).sort((p, q) => rel(a, p) - rel(a, q))[0]; return a && b ? { a, b } : null; },
    title: 'Fight in the Mess',
    text: (x) => `Raised voices, then a crash. ${N(x.a)} and ${N(x.b)} are on the floor of the Mess, trays everywhere. It started over something stupid, a shower rota, a joke, a look. It isn\'t about that now.`,
    choices: (x) => [
      { label: 'Step between them.', tag: 'love', fx: () => { emo(x.a, { anger: -15 }); emo(x.b, { anger: -15 }); rel(x.a, x.b, 5); aff(x.a, 4); aff(x.b, 4); return `You take an elbow to the jaw for your trouble. But they stop. Later, ${N(x.a)} brings you an ice pack and an apology.`; } },
      { label: 'Let them wear themselves out.', tag: 'anger', fx: () => { res({ meds: -1 }); emo(x.a, { anger: -20, sorrow: 5 }); emo(x.b, { anger: -10, fear: 8 }); rel(x.a, x.b, -12); return 'It ends with a split lip and a sprained wrist. Priya is furious with everyone, including you.'; } },
      { label: 'Make them talk it out, right now, in front of everyone.', tag: 'hope', fx: () => { const ok = U.chance(0.6); if (ok) { rel(x.a, x.b, 18); emo(x.a, { anger: -20, love: 5 }); emo(x.b, { anger: -20, love: 5 }); emoAll({ hope: 3 }); return 'It\'s excruciating for twenty minutes, then unexpectedly moving. They end up laughing. By next week they\'re friends.'; } rel(x.a, x.b, -8); emo(x.a, { anger: 10 }); emo(x.b, { anger: 5, sorrow: 5 }); return 'It goes badly. Very publicly badly. They storm off in opposite directions.'; } },
    ],
  },
  {
    id: 'party', cooldown: 10, when: () => (alive('kenji') && S.day > 4 ? 12 : 0),
    title: 'Zero-G Party',
    text: 'Kenji has a proposal and a gleam in his eye. “Hear me out. We switch off the gravity plates in the gym. Cal on the decks. Glow sticks. Luka\'s secret fruit punch.” (“It\'s not secret,” says Luka. “It\'s rationed.”) “Everyone needs this. Everyone.”',
    choices: [
      { label: 'Approve it. Go big.', tag: 'joy', fx: () => { res({ food: -12 }); emoAll({ joy: 15, love: 6, sorrow: -6, anger: -5 }); emo('luka', { fear: 5 }); logEv('The first Zero-G Party. Legendary.', 'joy'); return 'It is spectacular. People float and spin and collide and shriek with laughter. At midnight, everyone links hands in a slowly rotating ring and Cal plays something soft. Nobody will ever forget it.'; } },
      { label: 'Approve it, and DJ the second half yourself.', tag: 'joy', fx: () => { res({ food: -12 }); emoAll({ joy: 18, love: 5, sorrow: -5 }); aliveIds().forEach((id) => aff(id, 2)); return 'Your set is objectively bad. Everyone agrees it is the best set in the history of spaceflight.'; } },
      { label: 'Not now. We can\'t spare the food.', tag: 'fear', fx: () => { emo('kenji', { sorrow: 10, anger: 5 }); emoAll({ joy: -4 }); aff('kenji', -3); return 'Kenji says he understands. He doesn\'t really.'; } },
    ],
  },
  {
    id: 'meteors', cooldown: 6, when: () => (traveling() ? 14 : 0),
    title: 'Micrometeoroid Swarm',
    text: 'Alarms. The ship has dropped briefly out of fold into a stream of dust and gravel travelling at forty kilometres a second. Kenji\'s voice on the intercom is very calm, which is how you know it\'s bad. “Options, please. Quickly.”',
    choices: [
      { label: 'Emergency burn to get clear. (Fuel)', tag: 'fear', fx: () => { res({ fuel: -6 }); emoAll({ fear: 6 }); emo('kenji', { joy: 5 }); return 'The Collins lurches sideways hard enough to throw people out of bunks. The swarm passes behind you. Only a few pings on the hull.'; } },
      { label: 'Brace and ride it out.', tag: 'anger', fx: () => { res({ hull: -14 }); emoAll({ fear: 10 }); emo('sofia', { anger: 8 }); return 'It sounds like hail on a tin roof, for eleven minutes. When it stops, there are fourteen new patches for Sofia to weld.'; } },
      { label: 'Send an EVA team to deploy the debris shield.', tag: 'hope', fx: () => {
        const who = U.chance(0.5) && alive('sofia') ? 'sofia' : pickRand(['priya']);
        if (U.chance(0.12)) { killCrew(who, 'lost on EVA during the meteor swarm'); res({ hull: -5 }); return `The shield deploys. The ship is saved. But ${N(who)}\'s tether is cut by a fragment the size of a grain of rice. By the time Kenji brings the ship around, there is nothing on the scanners.`; }
        res({ hull: -3 }); emo(who, { fear: 15, joy: 10 }); aff(who, 5); emoAll({ love: 4 }); return `${N(who)} deploys the shield in a textbook spacewalk. The whole crew is waiting at the airlock when they come in. They get a hug from everyone, including Luka.`;
      } },
    ],
  },
  {
    id: 'cat', once: true, when: () => (S.day >= 5 ? 30 : 0),
    title: 'Stowaway',
    text: 'Something has been eating the ration bars in cargo. Luka has set traps. Sofia has set better traps. This morning, sitting in the middle of one of them, looking outraged, is a small grey tabby cat. Nobody has any idea how she got aboard. Nobody will admit to anything.',
    choices: [
      { label: 'She\'s crew now. Name her Buzz.', tag: 'joy', fx: () => { flag('cat'); emoAll({ joy: 14, love: 8 }); logEv('Buzz the cat joined the crew.', 'joy'); return 'Buzz Aldrin the cat is given her own crew badge. She ignores it. She sleeps on a different bunk every night, and every single crew member thinks she likes them best.'; } },
      { label: 'She\'s eating our food. Keep her in cargo.', tag: 'greed', fx: () => { flag('cat'); emoAll({ joy: 6 }); emo('luka', { love: 15, joy: 10 }); logEv('A cat was found in cargo.', 'joy'); return 'Luka pretends to be annoyed. By Friday, the cat sleeps on his chest and he has made her a tiny inventory tag. She escapes cargo within the week and has the run of the ship.'; } },
    ],
  },
  {
    id: 'first_bloom', once: true, when: () => (S.day >= 7 && alive('amara') ? 25 : 0),
    title: 'Strawberries',
    text: 'Amara calls everyone to Hydroponics. She is holding a bowl. In the bowl: eleven strawberries. Real ones, red all the way through, grown under lamps four light-years from any sun. There is exactly one each.',
    choices: [
      { label: 'Everyone eats one. Together. Right now.', tag: 'joy', fx: () => { emoAll({ joy: 12, hope: 8 }); emo('amara', { joy: 15, love: 10 }); return 'Eleven people eat eleven strawberries in total, reverent silence. Then Kenji says “that was the best thing that has ever happened to me” and everybody agrees.'; } },
      { label: 'Save them for seed. More strawberries later.', tag: 'hope', fx: () => { res({ food: 15 }); emoAll({ hope: 8, joy: -2 }); emo('amara', { hope: 10 }); return 'A groan goes around the room. But in three weeks, there are three hundred strawberries.'; } },
    ],
  },
  {
    id: 'birthday', cooldown: 9, when: () => (S.day > 6 ? 12 : 0),
    setup: () => ({ who: pickRand() }),
    title: (x) => `${N(x.who)}'s Birthday`,
    text: (x) => `It\'s ${N(x.who)}\'s birthday today. They haven\'t mentioned it. You only know because Yasmin keeps a spreadsheet of everyone\'s birthdays. ${N(x.who)} is going about their shift like it\'s any other day.`,
    choices: (x) => [
      { label: 'Throw a surprise party. Cake. Candles. Everything.', tag: 'joy', fx: () => { res({ food: -6 }); emo(x.who, { joy: 25, love: 12, sorrow: -10 }); emoAll({ joy: 6 }); aff(x.who, 8); return `${N(x.who)} walks into a dark Mess and every light snaps on. They burst into tears. Happy ones, mostly. The cake is made of ration bars and it\'s delicious.`; } },
      { label: 'Give them something quietly.', tag: 'love', fx: () => { emo(x.who, { love: 15, joy: 10 }); aff(x.who, 10); return `You leave a note under their door. Just “Happy birthday. Glad you\'re here.” They keep it on their wall for the rest of the voyage.`; } },
      { label: 'Let them have the day they want.', tag: 'sorrow', fx: () => { emo(x.who, { sorrow: 12 }); return 'The day passes. At midnight, someone hears them singing happy birthday to themselves in the shower.'; } },
    ],
  },
  {
    id: 'fever', cooldown: 20, when: () => (S.day > 10 ? 8 : 0),
    title: 'Fever',
    text: 'Three crew are running high temperatures. Then five. Priya thinks it\'s a mutated rhinovirus that hitched a ride in someone\'s sinuses. Probably harmless. Probably. The word ‘probably’ is doing a lot of work on this ship today.',
    choices: [
      { label: 'Quarantine the sick in the medbay.', tag: 'fear', fx: () => { res({ meds: -2 }); emoAll({ fear: 8, sorrow: 4 }); emo('priya', { fear: 10 }); return 'It burns through the ship in a week and then it\'s gone. Nobody was seriously hurt. Everyone is still a little jumpy about sneezes.'; } },
      { label: 'Use the good antivirals. All of them if needed.', tag: 'love', fx: () => { res({ meds: -5 }); emoAll({ fear: -4, love: 4 }); emo('priya', { hope: 10 }); return 'The fever breaks in three days. Priya looks at the empty shelf and swallows hard, but says nothing.'; } },
      { label: 'Keep calm and let it run its course.', tag: 'hope', fx: () => { if (U.chance(0.35)) { emoAll({ fear: 15, sorrow: 5 }); res({ food: -10 }); return 'It\'s worse than anyone expected. Two weeks of vomiting, fever, and fear. Half the crew can\'t work. The garden suffers.'; } emoAll({ joy: 3 }); return 'Priya was right. Harmless. A week of sniffles and bad jokes about ‘space flu’.'; } },
    ],
  },
  {
    id: 'derelict', once: true, when: () => (traveling() && S.jumps >= 2 ? 20 : 0),
    title: 'The Elysium',
    text: 'A ship. Human. Ancient by modern standards. Its hull reads ELYSIUM PRIVATE ARK: WHITFIELD LUNAR HOLDINGS, 2044. A billionaire\'s escape pod from the Scorching, carrying two hundred of the richest people alive in cryosleep.<br><br>The cryopods failed decades ago. Everyone aboard is dead. The hold is full of fuel, parts, gold, art and champagne. Jonah stands very still at the viewport. “My grandfather\'s ship,” he says. “He\'s in there.”',
    choices: [
      { label: 'Strip it. The dead don\'t need fuel.', tag: 'greed', fx: () => { res({ fuel: 25, parts: 15, food: 20 }); giveItem('harmonica'); emoAll({ greed: 6, sorrow: 5 }); emo('jonah', { sorrow: 20, anger: 10 }); emo('luka', { joy: 15 }); emo('zhao', { anger: 10 }); return 'It takes two days to empty. You find fuel, food, parts, and a battered harmonica in a child\'s cabin. Jonah doesn\'t help. He goes aboard once, alone, and comes back with nothing.'; } },
      { label: 'Take only what we need, then give them a funeral.', tag: 'love', fx: () => { res({ fuel: 12, parts: 6 }); emoAll({ love: 6, sorrow: 6, hope: 3 }); emo('jonah', { love: 15, sorrow: 10 }); aff('jonah', 10); return 'Yasmin reads the passenger list aloud, all two hundred names. Jonah reads his grandfather\'s himself. Then Kenji nudges the Elysium gently towards the nearest star.'; } },
      { label: 'Take nothing. Some things you leave alone.', tag: 'sorrow', fx: () => { emoAll({ sorrow: 5, hope: 5 }); emo('zhao', { love: 10 }); emo('luka', { anger: 12, greed: 6 }); emo('jonah', { love: 8 }); return 'Luka actually shouts at you. But the others nod. You leave the Elysium as you found it: a warning, drifting.'; } },
    ],
  },
  {
    id: 'nebula', cooldown: 15, when: () => (traveling() ? 8 : 0),
    title: 'Through the Veil',
    text: 'The Collins drifts through the edge of a nebula. Outside, gas glows in colours that don\'t have names yet: bruised violet, radioactive rose. Mateo has pressed his whole face against the dome glass.',
    choices: [
      { label: 'Kill all the lights. Everyone to the dome.', tag: 'wonder', fx: () => { emoAll({ wonder: 15, joy: 6, love: 4, anger: -5 }); return 'For three hours the entire crew lies on the dome floor in the dark while the sky burns above them. Someone whispers, “we\'re so lucky.” Nobody argues.'; } },
      { label: 'Scoop the gas for fuel while we pass.', tag: 'greed', fx: () => { res({ fuel: 12 }); emoAll({ wonder: 4 }); emo('mateo', { sorrow: 5 }); return 'The ram-scoops fill the tanks. Mateo watches through the dome anyway, alone, and tells you later it was the most beautiful thing he has ever seen.'; } },
    ],
  },
  {
    id: 'earth_silent', once: true, when: () => (S.day >= 45 || S.jumps >= 5 ? 60 : 0),
    title: 'Silence',
    text: 'Cal comes to find you. He\'s white. “It\'s been nine days. No transmission from Earth. Not the news feed, not the family packets, not the Lunar relay. Nothing. I\'ve checked everything. The receiver\'s fine.” He swallows. “There\'s no one talking any more. Or there\'s no one listening to us.”<br><br>It could be anything: a relay failure, a solar storm, a war. You will never know.',
    choices: [
      { label: 'Hold a vigil for Earth. All of it.', tag: 'sorrow', fx: () => { flag('earth_silent'); emoAll({ sorrow: 18, love: 12, anger: -5 }); logEv('Earth went silent.', 'sorrow'); return 'The whole crew lights candles in the Mess (Priya sighs about the fire risk and then lights one too). Yasmin reads the names of every city she can remember. It takes all night.'; } },
      { label: 'Keep broadcasting. Every day. Just in case.', tag: 'hope', fx: () => { flag('earth_silent'); flag('keep_broadcasting'); emoAll({ sorrow: 10, hope: 8 }); logEv('Earth went silent. The Collins keeps calling home.', 'hope'); return 'Every morning at 08:00, Cal broadcasts the ship\'s log towards Sol. Nobody ever answers. He never misses a day.'; } },
      { label: '“Then we\'re what\'s left. So we\'d better be worth it.”', tag: 'anger', fx: () => { flag('earth_silent'); emoAll({ sorrow: 8, anger: 6, hope: 8 }); logEv('Earth went silent.', 'anger'); return 'It lands hard. People straighten up. Something in the crew changes after that: less like tourists, more like the last of something.'; } },
    ],
  },
  {
    id: 'turn_back', once: true, when: () => (avgEmo('fear') > 42 && S.day > 12 ? 40 : 0),
    setup: () => ({ who: pickTop('fear') }),
    title: 'Petition',
    text: (x) => `${N(x.who)} hands you a slate with six signatures on it. A petition to turn back. “We\'re not saying it\'s a good idea,” ${N(x.who)} says. “Earth is dying. We know. But at least it\'s a place. Out here there\'s nothing. We\'re so scared all the time.”`,
    choices: (x) => [
      { label: 'Hear them out. Every single one.', tag: 'love', fx: () => { emoAll({ fear: -10, love: 5 }); aff(x.who, 8); return 'It takes all day. You don\'t promise anything. But being listened to is its own kind of medicine. The petition quietly disappears.'; } },
      { label: 'Show them the data. We have fuel. We have food. We have a chance.', tag: 'hope', fx: () => { const ok = S.res.food > 120 && S.res.hull > 50; emoAll(ok ? { fear: -12, hope: 10 } : { fear: 5, anger: 5 }); return ok ? 'The numbers are good. People can see it. The petition is withdrawn.' : 'The numbers aren\'t good, and everyone can see that too. The petition stays on the board.'; } },
      { label: 'Refuse. We are not going back.', tag: 'anger', fx: () => { emoAll({ fear: 5, anger: 10 }); aff(x.who, -8); return 'Nobody argues. That\'s almost worse.'; } },
    ],
  },
  {
    id: 'signal', once: true, when: () => (S.jumps >= 3 ? 20 : 0),
    title: 'A Signal',
    text: 'Cal nearly drops his tea. “That\'s not a pulsar.” On the comms display: a repeating pattern, prime numbers, then a pause, then a simple shape: a circle with seven lines. It\'s coming from far ahead, deeper than you\'ve planned to go. It is, without any doubt, a message.',
    choices: [
      { label: 'Mark the source on the star map. We\'re going.', tag: 'wonder', fx: () => { revealSpecial(); emoAll({ wonder: 20, hope: 10, fear: 5 }); logEv('The Collins received an alien signal.', 'wonder'); return 'The whole ship goes slightly mad with excitement. Mateo doesn\'t sleep for two days. The source is marked on the star map, glowing.'; } },
      { label: 'Keep it quiet for now. We don\'t know what it is.', tag: 'fear', fx: () => { revealSpecial(); emo('cal', { fear: 10 }); emoAll({ fear: 3 }); return 'You and Cal lock it down. The source goes on the map as ‘Navigational Anomaly’. Cal can\'t stop listening to it in the dark.'; } },
    ],
  },
  {
    id: 'long_night', cooldown: 14, when: () => (avgEmo('sorrow') > 35 ? avgEmo('sorrow') / 2 : 0),
    setup: () => ({ who: pickTop('sorrow') }),
    title: 'The Long Night',
    text: (x) => `03:14. You find ${N(x.who)} sitting alone by the airlock window, knees pulled up, crying without making a sound. “I don\'t know what\'s wrong,” they say. “Nothing happened. I just can\'t stop. I keep thinking about how far away everything is. How we\'re never going home.”`,
    choices: (x) => [
      { label: 'Sit down beside them. Say nothing. Stay.', tag: 'love', fx: () => { emo(x.who, { sorrow: -15, love: 15, fear: -8 }); aff(x.who, 10); return 'You sit there until the lights come up for morning shift. At some point they fall asleep on your shoulder. Before they go, they say, “Thank you for not trying to fix it.”'; } },
      { label: 'Walk them to Priya.', tag: 'hope', fx: () => { emo(x.who, { sorrow: -10, fear: -5 }); emo('priya', { love: 5 }); aff(x.who, 5); return 'Priya makes tea and talks with them for an hour. It helps. It\'s a start.'; } },
      { label: 'Tell them something funny about home.', tag: 'joy', fx: () => { if (C(x.who).e.sorrow > 60) { emo(x.who, { sorrow: 5 }); return 'They try to laugh, and it turns back into crying. You sit with them anyway.'; } emo(x.who, { joy: 12, sorrow: -12 }); aff(x.who, 6); return 'They laugh, wetly, despite themselves. You end up swapping stories until breakfast.'; } },
    ],
  },
  {
    id: 'taste_home', cooldown: 18, when: () => (S.day > 8 ? 9 : 0),
    setup: () => ({ who: pickRand() }),
    title: 'A Taste of Home',
    text: (x) => `${N(x.who)} has taken over the galley. After weeks of experimentation with hydroponic herbs and synthesised proteins, they have recreated a dish from home. It smells like somebody\'s childhood. They\'re nervous. “It\'s not right. It\'s close. It\'s not right.”`,
    choices: (x) => [
      { label: 'Invite everyone. Make it a feast.', tag: 'joy', fx: () => { res({ food: -8 }); emo(x.who, { joy: 18, love: 10 }); emoAll({ joy: 8, sorrow: 3 }); aff(x.who, 6); return 'It\'s not quite right. It doesn\'t matter at all. People go back for thirds. Someone asks for the recipe and they cry.'; } },
      { label: 'Eat it together, just the two of you.', tag: 'love', fx: () => { emo(x.who, { love: 15, sorrow: -8 }); aff(x.who, 10); return 'They tell you about the kitchen it came from, the person who taught them, the market where the ingredients came from. By the end, you can almost taste the original.'; } },
    ],
  },
  {
    id: 'hull_strain', cooldown: 8, when: () => (S.res.hull < 45 ? 30 : 0),
    title: 'Groaning Hull',
    text: 'The ship is making a new noise. A low groan along the spine, every few minutes, like something very large is tired. Sofia\'s face tells you everything. “We need parts. Or we need to land somewhere and do proper repairs. Or,” she says, “we pray.”',
    choices: [
      { label: 'Emergency repairs. Use whatever we\'ve got.', tag: 'hope', req: () => S.res.parts >= 6, fx: () => { res({ parts: -6, hull: 18 }); emoAll({ fear: -5 }); emo('sofia', { joy: 8 }); return 'Two days of double shifts. The groaning stops.'; } },
      { label: 'Strip the gym and lounge for metal.', tag: 'fear', fx: () => { res({ hull: 12 }); emoAll({ joy: -8, anger: 5, fear: -3 }); return 'The ship holds. The lounge is bare metal now. Nobody plays music for a while.'; } },
      { label: 'Keep going and hope.', tag: 'sorrow', fx: () => { emoAll({ fear: 12 }); return 'Nobody sleeps well. Every groan makes people flinch.'; } },
    ],
  },
  {
    id: 'hunger', cooldown: 6, when: () => (S.res.food < 60 ? 45 : 0),
    title: 'Half Rations',
    text: 'Luka stands up at dinner and reads the number out loud. It\'s low. It\'s very low. At current rates, the ship runs out of food in a matter of weeks. Nobody finishes their meal.',
    choices: [
      { label: 'Half rations for everyone, starting now.', tag: 'fear', fx: () => { res({ food: 18 }); emoAll({ fear: 6, anger: 5, joy: -6 }); return 'Everybody is hungry and short-tempered. But it buys time.'; } },
      { label: 'Double shifts in Hydroponics.', tag: 'hope', fx: () => { res({ food: 12 }); emoAll({ hope: 5, joy: -3 }); emo('amara', { hope: 10, fear: 8 }); return 'Amara runs the garden like a general. Things grow faster when people are watching them, apparently.'; } },
      { label: 'Find a world. Any world. With food.', tag: 'wonder', fx: () => { emoAll({ fear: 8, hope: 3 }); return 'The next landing becomes the most important thing on the ship. Look for ocean and jungle worlds.'; } },
    ],
  },
  {
    id: 'mutiny_talk', cooldown: 10, when: () => (morale() < 30 ? 50 : 0),
    setup: () => ({ who: alive('jonah') ? 'jonah' : pickTop('anger') }),
    title: 'Whispers',
    text: (x) => `The ship feels wrong. Meals are silent. People eat in their cabins. And you keep walking in on conversations that stop when you enter. Finally ${N(x.who)} says it to your face: “People are saying you\'re not up to this. People are saying we need someone else. Or we need to go back.”`,
    choices: (x) => [
      { label: 'Call an all-hands. Let everyone say their piece.', tag: 'love', fx: () => { emoAll({ anger: -10, fear: -6, love: 5 }); return 'It\'s brutal. Three hours of grievances. But at the end, people are talking again, and that\'s something.'; } },
      { label: '“If they want me gone, they can vote.”', tag: 'anger', fx: () => { const ok = aliveIds().reduce((s, id) => s + C(id).aff, 0) / Math.max(1, aliveIds().length) > 25; emoAll(ok ? { anger: -8, hope: 6 } : { anger: 10 }); return ok ? 'They vote. You win, clearly. The whispers stop.' : 'They don\'t call a vote. They don\'t stop whispering either.'; } },
      { label: 'Throw a party. Right now. Everyone.', tag: 'joy', fx: () => { res({ food: -10 }); emoAll({ joy: 12, anger: -5 }); return 'It\'s awkward. Then it\'s less awkward. Then someone laughs, and something unlocks.'; } },
    ],
  },
  {
    id: 'funeral', once: false, when: () => 0,
    setup: () => { const d = S.dead[S.dead.length - 1]; return d ? { who: d.id } : null; },
    title: (x) => `Goodbye, ${N(x.who)}`,
    text: (x) => `The whole crew gathers in the observation dome. ${U.esc(crewDef(x.who).name)}, ${crewDef(x.who).age}, ${crewDef(x.who).role} of the ISV Collins. Born in ${crewDef(x.who).from}. ${U.esc(crewDef(x.who).bio)}<br><br>There are so few of you. Every absence is enormous.`,
    choices: (x) => [
      { label: 'Speak about who they were. Make people laugh.', tag: 'love', fx: () => { emoAll({ sorrow: -8, love: 12, joy: 4 }); return 'You tell the story about the time they got stuck in the laundry tube. Everyone laughs until they cry, and then just cries. It\'s the right kind of crying.'; } },
      { label: 'Carve their name on the Memorial Wall.', tag: 'sorrow', fx: () => { emoAll({ sorrow: 6, love: 6, hope: 3 }); return 'Their name goes on the wall in the Archive. Yasmin writes it in their own alphabet too. People touch it on their way past for the rest of the voyage.'; } },
      { label: '“We finish this for them.”', tag: 'hope', fx: () => { emoAll({ hope: 10, sorrow: 4, anger: 4 }); return 'It becomes a kind of vow. Every jump, someone says the name out loud.'; } },
    ],
  },
  {
    id: 'romance', once: false, when: () => 0,
    setup: () => { const p = S.newBond; S.newBond = null; return p ? { a: p[0], b: p[1] } : null; },
    title: 'Something New',
    text: (x) => `It\'s not exactly a secret any more. ${N(x.a)} and ${N(x.b)} came to breakfast together, holding hands, and both of them are pretending that\'s normal. Kenji is making a noise like a kettle. Everyone is looking at you, as if you\'re supposed to do something official.`,
    choices: (x) => [
      { label: 'Raise a mug. “To ' + N(x.a) + ' and ' + N(x.b) + '!”', tag: 'joy', fx: () => { emoAll({ joy: 8, love: 6 }); emo(x.a, { joy: 10 }); emo(x.b, { joy: 10 }); return 'The Mess erupts. They go bright red. It\'s wonderful.'; } },
      { label: 'Give them a quiet nod. Let them have it for themselves.', tag: 'love', fx: () => { emo(x.a, { love: 10 }); emo(x.b, { love: 10 }); aff(x.a, 4); aff(x.b, 4); return 'They catch your eye and smile. Some things don\'t need an audience.'; } },
    ],
  },
  {
    id: 'wedding', once: false, cooldown: 30, when: () => ((S.bonds.find((b) => b.type === 'partners' && S.day - b.since > 12 && !b.wed && alive(b.a) && alive(b.b))) ? 25 : 0),
    setup: () => { const b = S.bonds.find((q) => q.type === 'partners' && S.day - q.since > 12 && !q.wed && alive(q.a) && alive(q.b)); return b ? { bond: b, a: b.a, b: b.b } : null; },
    title: 'A Wedding Between the Stars',
    text: (x) => `${N(x.a)} and ${N(x.b)} want to get married. Here. Now. Among the stars. They\'ve asked you to officiate, because you\'re the closest thing to an authority the Collins has, and because, ${N(x.a)} says, “you\'re the one who keeps us together.”`,
    choices: (x) => [
      { label: 'Officiate. Make it the most beautiful thing this ship has ever seen.', tag: 'love', fx: () => { x.bond.wed = true; res({ food: -10 }); emoAll({ love: 18, joy: 14, hope: 10, sorrow: -8, anger: -8 }); aff(x.a, 10); aff(x.b, 10); logEv(`${N(x.a)} and ${N(x.b)} were married in the observation dome.`, 'love'); return 'Amara makes garlands from the garden. Cal writes a song. Buzz the cat walks down the aisle and refuses to leave. In the dome, under a sky no human has ever married under, two people promise each other everything. There isn\'t a dry eye on the ship.'; } },
      { label: 'Keep it small: just them and two witnesses.', tag: 'hope', fx: () => { x.bond.wed = true; emo(x.a, { love: 15, joy: 10 }); emo(x.b, { love: 15, joy: 10 }); emoAll({ hope: 5 }); logEv(`${N(x.a)} and ${N(x.b)} were quietly married.`, 'love'); return 'A quiet ceremony by the dome glass. Afterwards, they walk through the Mess to cheering anyway. Secrets don\'t last on a ship this size.'; } },
    ],
  },
  {
    id: 'jealousy', cooldown: 16, when: () => (S.bonds.some((b) => b.type === 'partners' && alive(b.a) && alive(b.b)) ? 8 : 0),
    setup: () => {
      const b = S.bonds.find((q) => q.type === 'partners' && alive(q.a) && alive(q.b)); if (!b) return null;
      const j = aliveIds().filter((id) => id !== b.a && id !== b.b && !partnerOf(id)).sort((p, q) => rel(q, b.a) - rel(p, b.a))[0];
      return j ? { a: b.a, b: b.b, j } : null;
    },
    title: 'Green',
    text: (x) => `${N(x.j)} has been odd for days. Snappy. Skipping meals. Finally, in the corridor, they blurt it out: “I can\'t stand watching ${N(x.a)} with ${N(x.b)}. I know it\'s stupid. I know it\'s not fair. I was there first, you know? Nobody noticed. Nobody ever notices.”`,
    choices: (x) => [
      { label: '“That hurts. It\'s allowed to hurt.”', tag: 'love', fx: () => { emo(x.j, { sorrow: 6, anger: -12, love: 6 }); aff(x.j, 8); return 'They deflate, and nod, and lean against the wall. “Yeah,” they say. “Yeah. It really does.”'; } },
      { label: '“You need to let it go, for everyone\'s sake.”', tag: 'fear', fx: () => { emo(x.j, { anger: 10, sorrow: 10 }); rel(x.j, x.b, -10); return 'They storm off. Things are frosty between them and ' + N(x.b) + ' for a long while.'; } },
      { label: '“Nobody noticed? I notice. Come on, let\'s get a drink.”', tag: 'joy', fx: () => { emo(x.j, { joy: 10, anger: -8, sorrow: -5 }); aff(x.j, 6); return 'One drink turns into three and a long argument about which Star Wars film is best. They don\'t mention it again.'; } },
    ],
  },
  {
    id: 'launch_anniv', once: true, when: () => (S.day >= 100 ? 80 : 0),
    title: 'One Hundred Days',
    text: 'One hundred days since the Collins left the Moon. Yasmin puts together a slideshow: the launch, the first jump, the first planet, the parties, the fights, the funerals, the strawberries. The crew watches it in the Mess. When it ends, nobody moves.',
    choices: [
      { label: '“Look how far we\'ve come.”', tag: 'hope', fx: () => { emoAll({ hope: 12, joy: 6 }); return 'Someone starts clapping. Then everyone is.'; } },
      { label: '“Look who we\'ve become.”', tag: 'love', fx: () => { emoAll({ love: 12, sorrow: 4 }); return 'People look around the room, at each other. You aren\'t strangers any more. You haven\'t been for a long time.'; } },
    ],
  },
];
