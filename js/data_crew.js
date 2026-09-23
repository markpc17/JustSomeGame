'use strict';
// The crew of the ISV Collins, the emotions that drive them, and the things they carry.

const EMOS = ['joy', 'sorrow', 'anger', 'fear', 'love', 'greed', 'hope', 'wonder'];

const EMO = {
  joy:    { name: 'Joy',    color: '#ffd23f', glyph: '♪', room: 'lounge',   verb: 'laughing' },
  sorrow: { name: 'Sorrow', color: '#5b8def', glyph: '…', room: 'archive',  verb: 'grieving' },
  anger:  { name: 'Anger',  color: '#ef476f', glyph: '#', room: 'gym',      verb: 'seething' },
  fear:   { name: 'Fear',   color: '#a06cd5', glyph: '!', room: 'medbay',   verb: 'afraid' },
  love:   { name: 'Love',   color: '#ff8fcf', glyph: '♥', room: 'dome',     verb: 'tender' },
  greed:  { name: 'Greed',  color: '#3ddc97', glyph: '¤', room: 'cargo',    verb: 'grasping' },
  hope:   { name: 'Hope',   color: '#8ce9ff', glyph: '✦', room: 'hydro',    verb: 'hopeful' },
  wonder: { name: 'Wonder', color: '#ffa552', glyph: '✧', room: 'dome',     verb: 'awestruck' },
};

// Things you can find, carry and give away.
const ITEMS = {
  golden_record: { name: "Voyager's Golden Record", tags: ['music', 'relic', 'artifact'], desc: 'Sounds of Earth, launched 1977. A greeting to strangers, recovered by the last humans to leave.' },
  alien_seed:    { name: 'Alien Seed Pod', tags: ['seed', 'organic', 'flower'], desc: 'It is warm to the touch, and very slightly heavier at night.' },
  singing_stone: { name: 'Singing Stone', tags: ['crystal', 'music', 'artifact'], desc: 'Hums a low chord whenever someone nearby is sad.' },
  fossil_shell:  { name: 'Fossil Spiral', tags: ['relic', 'mineral', 'artifact'], desc: 'Something lived in this, a very long time ago, very far from home.' },
  star_fragment: { name: 'Star Chart Fragment', tags: ['data', 'artifact'], desc: 'Mateo swears the coordinates point somewhere nobody has looked.' },
  glow_moss:     { name: 'Glow Moss', tags: ['flower', 'organic'], desc: 'Pulses softly, like breathing.' },
  tablet:        { name: 'Carved Tablet', tags: ['relic', 'book', 'artifact'], desc: 'Writing in no human language. Someone took great care over it.' },
  meteor_iron:   { name: 'Meteor Iron', tags: ['mineral', 'valuable'], desc: 'Nickel-iron, polished by a billion years of falling.' },
  geode:         { name: 'Opal Geode', tags: ['crystal', 'valuable', 'mineral'], desc: 'Split open, it holds a whole sunset.' },
  probe_chip:    { name: 'Old Probe Memory', tags: ['data', 'gadget'], desc: 'From a 2040s survey drone. Somebody\'s holiday photos are on it.' },
  whisky:        { name: 'Last Bottle of Islay', tags: ['drink', 'valuable'], desc: 'Distilled in Scotland, 2031. There will never be another.' },
  chocolate:     { name: 'Real Chocolate', tags: ['food', 'valuable'], desc: 'Grown in actual soil under an actual sun.' },
  sea_glass:     { name: 'Alien Sea Glass', tags: ['crystal', 'flower'], desc: 'Tumbled smooth by tides of a sea no one has swum in.' },
  lumen_petal:   { name: 'Lumen Petal', tags: ['flower', 'artifact', 'organic'], desc: 'Given, not taken. It is still faintly glowing.' },
  ash_journal:   { name: 'Ashfall Journal', tags: ['book', 'relic', 'artifact'], desc: 'The last words of a people who thought there would always be another world.' },
  pearl:         { name: 'Storm Pearl', tags: ['valuable', 'crystal'], desc: 'Grown in a creature that lives in hurricanes.' },
  harmonica:     { name: 'Battered Harmonica', tags: ['music', 'instrument'], desc: 'Found in the derelict. Someone played this in the dark.' },
};

// Each crew member: who they are, what they feel by default, what they say, and the story they'll share if you earn it.
const CREW = [
  {
    id: 'amara', name: 'Amara Okafor', age: 24, role: 'Botanist', from: 'Lagos, Nigeria',
    suit: '#4caf50', skin: '#6b4226', hair: '#1a1110', work: 'hydro', romance: true,
    base: { joy: 45, sorrow: 30, anger: 10, fear: 20, love: 40, greed: 5, hope: 60, wonder: 40 },
    likes: ['seed', 'flower', 'organic'],
    bio: 'Carries a tin of her grandmother\'s seeds. Left her mother in a Lagos hospital that is now underwater.',
    lines: {
      joy: 'The tomatoes came in overnight. Tiny, stupid, perfect. I could cry.',
      sorrow: 'My mother used to hum while she weeded. The hydroponics hum too. It isn\'t the same.',
      anger: 'Someone left the grow lights on max again. We don\'t get to waste things any more. Not out here.',
      fear: 'What if nothing grows where we land? What if I carried all these seeds for nothing?',
      love: 'Have you noticed everyone drifts into the garden when they\'re sad? Plants look after people too.',
      greed: 'I\'ve been keeping the best cuttings for myself. Is that awful? I just want something that\'s mine.',
      hope: 'Somewhere out there is soil nobody has poisoned. I\'m going to put my hands in it.',
      wonder: 'Chlorophyll works the same four light-years from home. Isn\'t that the most beautiful thing?',
    },
    arc: [
      {
        title: 'The Seed Tin',
        text: 'Amara opens a dented biscuit tin. Inside: dozens of paper twists, each labelled in a shaky hand. “Okra. Bitterleaf. Scent leaf. My grandmother\'s garden in Lagos. The garden is under the lagoon now.” She closes the lid gently. “I promised I wouldn\'t plant them until we found somewhere worthy of them.”',
        choices: [
          { label: '“They\'ll grow somewhere beautiful. I\'ll make sure of it.”', tag: 'hope', fx: () => { emo('amara', { hope: 12, joy: 5 }); aff('amara', 6); return 'She smiles and hugs the tin to her chest. “Hold you to that.”'; } },
          { label: '“Plant a few now. Don\'t wait for perfect.”', tag: 'joy', fx: () => { emo('amara', { joy: 10, fear: -5 }); aff('amara', 4); flag('amara_planted_early'); return 'She hesitates, then laughs. “Just one row of bitterleaf. Grandma would call me impatient.” By evening there is a tiny labelled pot in the corner of Hydroponics.'; } },
        ],
      },
      {
        title: 'Two Messages',
        text: 'A delayed transmission has caught up with the ship. Two messages for Amara from Lagos General. The first is her mother, voice thin, laughing about the hospital food. The second is from a doctor. Amara hasn\'t opened it. She has been sitting in the dark between the grow racks for an hour. “I know what it says. If I don\'t open it, she\'s still alive somewhere.”',
        choices: [
          { label: 'Sit beside her. “We\'ll open it together.”', tag: 'love', fx: () => { emo('amara', { sorrow: 25, love: 20, fear: -15 }); aff('amara', 10); flag('amara_heard'); return 'The doctor is kind. It was peaceful. At the end there is a last recording, barely a whisper: “Tell Amara to grow something.” Amara cries until the grow lights cycle to dawn. You stay.'; } },
          { label: '“Keep it closed until you\'re ready. There\'s no rush.”', tag: 'fear', fx: () => { emo('amara', { fear: 8, hope: 5 }); aff('amara', 5); flag('amara_waiting'); return 'She tucks the message into a folder named ‘Later’. “Thank you for not making me.” You notice she hums her mother\'s song more often after that.'; } },
        ],
      },
      {
        title: 'The First Row',
        text: () => `Amara has been drawing garden plans: rows and paths, a bench, a gate. ${hasFlag('amara_heard') ? '“Mum said grow something. I\'ve decided what.”' : '“I opened the message. I think I always knew.”'} She taps the seed tin. “When we land, will you help me plant the first row?”`,
        choices: [
          { label: '“Yes. The first row is hers.”', tag: 'hope', fx: () => { emo('amara', { hope: 20, sorrow: -15, joy: 10 }); aff('amara', 10); flag('amara_resolved'); return 'She writes a name at the top of the plan: FUNMILAYO\'S ROW. Her mother\'s name. The whole garden smells of basil and possibility.'; } },
          { label: '“Plant them here. Home isn\'t a place, it\'s us.”', tag: 'love', fx: () => { emo('amara', { love: 20, sorrow: -10 }); emoAll({ love: 3 }); aff('amara', 10); flag('amara_shipgarden'); res({ food: 20 }); return 'Within a week there is okra growing on the Collins. Amara gives the first pods away in the Mess. It tastes like somebody\'s grandmother.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('amara_resolved') ? 'Amara planted Funmilayo\'s Row on the first morning. Every child born on the new world learns the word ‘okra’ before the word ‘Earth’.'
      : hasFlag('amara_shipgarden') ? 'Amara kept a garden on the Collins until the day it was decommissioned, then carried every plant down by hand.'
      : 'Amara ran the colony\'s farms. She never talked about Lagos, but she hummed while she weeded.',
  },
  {
    id: 'kenji', name: 'Kenji Watanabe', age: 26, role: 'Pilot', from: 'Osaka, Japan',
    suit: '#29b6f6', skin: '#e0b48a', hair: '#222', work: 'bridge', romance: true,
    base: { joy: 70, sorrow: 15, anger: 10, fear: 35, love: 30, greed: 10, hope: 45, wonder: 50 },
    likes: ['music', 'gadget', 'drink'],
    bio: 'Best pilot in the Lunar Corps and the ship\'s self-appointed party organiser. Survived a shuttle crash in training. His co-pilot didn\'t.',
    lines: {
      joy: 'Did you see that jump? Smooth as butter. Tell everyone. Tell them twice.',
      sorrow: 'Osaka had a noodle stand under the train tracks. I keep trying to remember the owner\'s face.',
      anger: 'Jonah tried to ‘optimise’ my flight plan. I optimised it back. Into the bin.',
      fear: 'Ha. No, I\'m fine. Totally fine. Hands always shake like this. Pilot thing.',
      love: 'You know what I love about this crew? Nobody\'s pretending any more. Well. Except me, maybe.',
      greed: 'If we find a planet with actual beer, I\'m claiming the brewery. Pilot\'s privilege.',
      hope: 'I\'ve got a feeling about the next system. Pilots get feelings. It\'s science.',
      wonder: 'When we drop out of a jump there\'s a second where the stars haven\'t settled. I live for that second.',
    },
    arc: [
      {
        title: 'Night Sim',
        text: 'It\'s 03:00 and Kenji is on the bridge, flying the same simulation over and over: a lunar approach, a warning light, a crash. Reset. Again. He doesn\'t notice you until you\'re right behind him, and then he grins far too quickly. “Oh hey! Just, uh. Practising. Can\'t sleep. Too much coffee. Ha.”',
        choices: [
          { label: '“Want some company?”', tag: 'love', fx: () => { emo('kenji', { love: 10, fear: -8 }); aff('kenji', 7); return 'You sit in the co-pilot\'s chair. Neither of you says much. Around 05:00 he turns the sim off and just watches the stars instead.'; } },
          { label: '“You should get some sleep, Kenji.”', tag: 'fear', fx: () => { emo('kenji', { fear: -3 }); aff('kenji', 3); return '“Yeah. Yeah, you\'re right.” He doesn\'t move. You leave him to it, and hear the crash alarm sound again as the door closes.'; } },
        ],
      },
      {
        title: 'Haru',
        text: '“His name was Haru Tanaka.” Kenji is looking at the helm, not at you. “Training run, Mare Imbrium. Fuel valve stuck. I made the call to bring her down hard. I walked away. He didn\'t.” A long breath. “So now I tell jokes. Because if it\'s quiet I hear the valve. Every jump, I wonder if I\'m lucky, or just next.”',
        choices: [
          { label: '“It wasn\'t your fault. You made the best call you could.”', tag: 'love', fx: () => { emo('kenji', { sorrow: -12, fear: -10, love: 8 }); aff('kenji', 8); flag('kenji_forgiven'); return 'He nods slowly, like someone trying on a coat that doesn\'t fit yet. “Say it again sometime. Maybe it\'ll stick.”'; } },
          { label: '“Then share the helm. Train Mateo as a second pilot.”', tag: 'hope', fx: () => { emo('kenji', { fear: -20, hope: 12 }); emo('mateo', { joy: 15, wonder: 10 }); aff('kenji', 8); flag('kenji_shares'); return 'Mateo nearly explodes with joy. Within a week, Kenji is shouting “GENTLY! GENTLY!” across the bridge, and he\'s sleeping through the night.'; } },
          { label: '“Fear keeps you sharp. Use it.”', tag: 'anger', fx: () => { emo('kenji', { fear: 5, anger: 10, sorrow: 5 }); aff('kenji', 2); flag('kenji_hard'); return '“Yeah,” he says. “Yeah. Sharp.” His knuckles are white on the controls.'; } },
        ],
      },
      {
        title: 'A Star for Haru',
        text: 'Kenji calls you to the dome. He\'s pointing at an unnamed blue star. “Survey rules say the pilot names the first star we pass after a hundred days. I was thinking.” He doesn\'t finish. He doesn\'t have to.',
        choices: [
          { label: '“Name it Haru.”', tag: 'sorrow', fx: () => { emo('kenji', { sorrow: 8, joy: 15, fear: -20, love: 10 }); emoAll({ love: 3 }); aff('kenji', 10); flag('kenji_resolved'); logEv('Kenji named a blue star “Haru”.', 'love'); return 'The whole crew gathers to watch him enter it in the survey log: HARU. Kenji laughs, and for once it sounds like his real laugh.'; } },
          { label: '“Name it after yourself. You\'re still here. That\'s allowed.”', tag: 'joy', fx: () => { emo('kenji', { joy: 20, fear: -15 }); aff('kenji', 8); flag('kenji_alive'); return 'He stares at you, then bursts out laughing. “Watanabe\'s Star. Sounds like a ramen brand.” He names it that anyway. He stops practising the crash.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('kenji_resolved') ? 'Kenji flew the first shuttle down, whooping the whole way. On clear nights he points out a blue star to anyone who will listen and tells them about his friend.'
      : hasFlag('kenji_shares') ? 'Kenji and Mateo founded a flight school. Every student\'s first lesson is how to make the hard call and live with it.'
      : hasFlag('kenji_hard') ? 'Kenji landed them safely. He was always sharp. He was always a little bit afraid.'
      : 'Kenji threw the first party on the new world before the tents were even up.',
  },
  {
    id: 'sofia', name: 'Sofia Reyes', age: 23, role: 'Engineer', from: 'Mexico City, Mexico',
    suit: '#ff7043', skin: '#c68b59', hair: '#3b1f0f', work: 'engine', romance: true,
    base: { joy: 35, sorrow: 20, anger: 55, fear: 15, love: 40, greed: 10, hope: 35, wonder: 30 },
    likes: ['gadget', 'mineral', 'tool'],
    bio: 'Keeps the fold engine alive with spare parts and pure fury. Her brother died in the Mexico City water riots.',
    lines: {
      joy: 'Coolant loop\'s purring like a cat. I fixed it with a spoon. A SPOON.',
      sorrow: 'My brother used to fix things too. Badly. With tape. I miss his bad tape.',
      anger: 'They sold the rivers and then acted surprised when the city drank dust. I\'m still so angry I can taste it.',
      fear: 'Hull stress is up three percent. It\'s nothing. It\'s nothing. I\'ll check it again.',
      love: 'I\'d take a bolt to the face for anyone on this ship. Don\'t tell them I said that.',
      greed: 'I\'ve been stashing the good spanners. The ones that don\'t strip. Nobody touches my spanners.',
      hope: 'Every weld I make is going to outlive me. That\'s the plan, anyway.',
      wonder: 'This engine folds space. Folds it. And I keep it running with my own two hands.',
    },
    arc: [
      {
        title: 'Dents',
        text: 'There\'s a new fist-sized dent in the engineering bulkhead. Sofia is wrapping her knuckles. “Every bolt on this ship was paid for by the people who drowned my city,” she says without looking up. “The Lunar Consortium. The water barons. They sold us the ticket out after they burned the house down.”',
        choices: [
          { label: '“Be angry. You\'ve earned it.”', tag: 'anger', fx: () => { emo('sofia', { anger: 5, love: 8 }); aff('sofia', 7); return 'She looks up, surprised. “Everyone else tells me to calm down.” She offers you the roll of tape. You help her wrap the other hand.'; } },
          { label: '“Anger won\'t fix a coolant loop.”', tag: 'hope', fx: () => { emo('sofia', { anger: -8, joy: 3 }); aff('sofia', 2); return '“No,” she snaps. Then, grudgingly: “But it gets me out of bed.” She goes back to work. The dent stays.'; } },
        ],
      },
      {
        title: 'The Productivity Plan',
        text: 'Jonah has posted a proposal on the ship board: rations and cabin privileges assigned by “productivity score”. Sofia is standing in front of it, very still. “My brother died in a queue for water that was rationed by ‘productivity’. I\'m going to break his nose.”',
        choices: [
          { label: '“Do it.”', tag: 'anger', fx: () => { emo('sofia', { anger: -10, joy: 10 }); emo('jonah', { anger: 25, fear: 20 }); rel('sofia', 'jonah', -30); res({ meds: -1 }); aff('sofia', 6); flag('sofia_punched'); logEv('Sofia broke Jonah\'s nose.', 'anger'); return 'She does. It\'s a very good punch. Priya patches Jonah up, muttering. The plan is withdrawn. Nobody on the ship talks about anything else for a week.'; } },
          { label: '“Beat him with votes, not fists. Organise.”', tag: 'hope', fx: () => { emo('sofia', { anger: -15, hope: 15 }); emo('jonah', { anger: 10 }); aff('sofia', 9); flag('sofia_organizes'); return 'Sofia turns out to be terrifyingly good at organising. By dinner, nine crew have signed a counter-proposal: nobody eats less than anyone else, ever. Jonah withdraws his plan.'; } },
          { label: '“Let it go. It\'s not worth it.”', tag: 'sorrow', fx: () => { emo('sofia', { anger: -5, sorrow: 12 }); aff('sofia', -3); return 'She walks away. The plan stays up for three days before someone quietly takes it down. Sofia doesn\'t speak to you for a while.'; } },
        ],
      },
      {
        title: 'The Well',
        text: 'Sofia shows you blueprints: an atmospheric water condenser, simple enough to build with a hand-press, strong enough to last a century. “For the new world,” she says. “So nobody ever queues for water again. So nobody ever owns it.”',
        choices: [
          { label: '“Name it after your brother.”', tag: 'love', fx: () => { emo('sofia', { sorrow: 5, love: 20, anger: -25 }); aff('sofia', 10); flag('sofia_resolved'); return 'She writes MATEO REYES along the side of the blueprint, then crosses it out, then writes ‘Beto’, the name only family used. She cries for the first time since launch, very briefly, and then gets back to work.'; } },
          { label: '“Make the design free. For everyone. Forever.”', tag: 'hope', fx: () => { emo('sofia', { hope: 20, anger: -20 }); emoAll({ hope: 4 }); aff('sofia', 10); flag('sofia_free'); return 'She uploads it to the ship archive with a licence that is just one sentence long: THIS BELONGS TO EVERYONE WHO IS THIRSTY.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('sofia_resolved') ? 'Every settlement on the new world has a Beto well at its centre. Sofia still gets angry. Now it builds things.'
      : hasFlag('sofia_free') ? 'Sofia\'s condenser design spread to every settlement. Nobody ever owned the water.'
      : hasFlag('sofia_punched') ? 'Sofia kept the colony\'s machines running and its powerful people honest, occasionally with her fists.'
      : 'Sofia became Chief Engineer of the colony. The dents in her workshop wall are a local landmark.',
  },
  {
    id: 'luka', name: 'Luka Novak', age: 27, role: 'Quartermaster', from: 'Zagreb, Croatia',
    suit: '#8d6e63', skin: '#f1c7a5', hair: '#6d4c2b', work: 'cargo', romance: true,
    base: { joy: 30, sorrow: 25, anger: 20, fear: 40, love: 15, greed: 65, hope: 20, wonder: 20 },
    likes: ['valuable', 'drink', 'food'],
    bio: 'Grew up in the Balkan resettlement camps. Counts everything. Trusts nothing he can\'t hold.',
    lines: {
      joy: 'Inventory balanced to the last gram! You don\'t understand how good that feels. It\'s like music.',
      sorrow: 'In the camp, my sister traded her shoes for bread. I got the bread. I still think about her feet.',
      anger: 'Someone has been in my stores. I count everything. EVERYTHING.',
      fear: 'Food for how many days? Say it slower. No, wait. I know the number. I always know the number.',
      love: 'I saved the last chocolate bar. For you. Don\'t make it a thing.',
      greed: 'Everything has a price, my friend. Even out here. Especially out here.',
      hope: 'Maybe on the new world I\'ll open a little shop. Honest prices. Well. Mostly honest.',
      wonder: 'I catalogued an alien rock today. Weight, colour, density. Then I just held it for ten minutes.',
    },
    arc: [
      {
        title: 'The Stash',
        text: 'Behind a false panel in the cargo hold you find it: ration bars, three bottles of real whisky, chocolate, a gold watch, batteries, socks. Luka is standing behind you. He doesn\'t look angry. He looks terrified.',
        choices: [
          { label: '“Why, Luka?”', tag: 'love', fx: () => { emo('luka', { sorrow: 10, greed: -8, fear: -5 }); aff('luka', 8); return '“Winter of ‘52. The camp ran out. They said more was coming. It didn\'t come.” He closes the panel very carefully. “I will never be hungry again. Never. Do you understand?” You do, a little.'; } },
          { label: '“This belongs to everyone. I\'m reporting it.”', tag: 'anger', fx: () => { emo('luka', { anger: 20, fear: 15 }); res({ food: 25 }); aff('luka', -10); flag('luka_reported'); logEv('Luka\'s hidden stash was returned to the ship stores.', 'greed'); return 'The stash goes back into ship stores. Luka does his job perfectly for weeks and won\'t meet your eye.'; } },
        ],
      },
      {
        title: 'The Market',
        text: 'Luka has a plan, drawn up in beautiful handwriting. “A ship economy. Credits. People trade, people value things. Right now everything is free, so nothing is precious. People waste. Give it structure, give it prices, and I promise you: nothing wasted, ever.”',
        choices: [
          { label: '“Try it, but nobody goes hungry. Ever.”', tag: 'greed', fx: () => { emo('luka', { joy: 15, greed: 5, hope: 10 }); emoAll({ greed: 4 }); aff('luka', 8); flag('luka_market'); logEv('Luka opened the Cargo Exchange.', 'greed'); return 'The Cargo Exchange opens the next day. You can now trade found items for supplies in the hold. Some crew love it. Some, like Sofia, call it the beginning of the end.'; } },
          { label: '“Everything here is shared. That\'s the point.”', tag: 'love', fx: () => { emo('luka', { greed: -12, anger: 10, sorrow: 5 }); aff('luka', 2); return '“The point,” he says, “is surviving.” But he tears up the plan. Later you see him sharing a bar of chocolate with Mateo.'; } },
        ],
      },
      {
        title: 'Opening the Hoard',
        text: () => `Luka finds you in the Mess. He\'s holding a crate. ${hasFlag('luka_reported') ? '“I started another stash after you took the first. Of course I did.”' : '“You know about the stash. You never told anyone.”'} He sets the crate down. “I dreamt about my sister. She was barefoot and laughing. I don\'t think I need this any more. Or... maybe I do. I don\'t know.”`,
        choices: [
          { label: '“Throw a feast. Tonight. Everyone.”', tag: 'joy', fx: () => { emo('luka', { greed: -35, joy: 25, love: 20, fear: -15 }); emoAll({ joy: 12, love: 6 }); giveItem('whisky'); aff('luka', 12); flag('luka_resolved'); logEv('Luka\'s Feast. Nobody will ever forget it.', 'joy'); return 'It\'s the best night since launch. Chocolate, whisky, dried mango, somebody\'s aunt\'s plum brandy. Luka is toasted eleven times. He keeps back one bottle, and presses it into your hands. “For the new world.”'; } },
          { label: '“Keep a little. Just in case. That\'s allowed too.”', tag: 'fear', fx: () => { emo('luka', { greed: -15, fear: -25, hope: 10 }); aff('luka', 9); flag('luka_safe'); res({ food: 15 }); return 'He shares most of it with the ship and keeps one small box. He shows it to you, opens it, closes it. “Just knowing it\'s there.” He sleeps better.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('luka_resolved') ? 'Luka ran the colony stores. There was always enough, and he always knew exactly how much. Every year he threw a feast.'
      : hasFlag('luka_market') ? 'Luka\'s Exchange became the colony\'s first bank. He got rich. He was, mostly, honest.'
      : hasFlag('luka_safe') ? 'Luka kept a little box under his bed until the day he died. It was full of chocolate wrappers.'
      : 'Luka counted every seed and every bolt the colony owned. Nobody ever went hungry on his watch.',
  },
  {
    id: 'priya', name: 'Priya Nair', age: 25, role: 'Medic', from: 'Kochi, India',
    suit: '#f5f5f5', skin: '#a8714a', hair: '#0d0d0d', work: 'medbay', romance: true,
    base: { joy: 35, sorrow: 30, anger: 10, fear: 40, love: 50, greed: 5, hope: 45, wonder: 30 },
    likes: ['flower', 'book', 'crystal'],
    bio: 'The only doctor for trillions of kilometres. Worked the heat clinics during the Scorching. Always asks how you are.',
    lines: {
      joy: 'Nobody\'s been sick all week. I\'ve reorganised the gauze three times out of pure joy.',
      sorrow: 'I keep a list of every patient I lost in the heat clinics. I read it sometimes. So they\'re not only numbers.',
      anger: 'Kenji sprained his wrist doing zero-G flips. AGAIN. I\'m going to sedate him for his own good.',
      fear: 'I\'m the only doctor for four light-years. Do you know what that feels like at three in the morning?',
      love: 'Everybody on this ship has a heartbeat I\'ve listened to. That makes them mine, a little.',
      greed: 'I\'ve been hoarding the good tea. The cardamom one. Medical necessity. Mine.',
      hope: 'Children will be born out here. I\'m going to make sure they\'re born safe.',
      wonder: 'Our bodies are adapting to the ship. Bone density, sleep rhythms. We\'re becoming something new.',
    },
    arc: [
      {
        title: 'Nobody Asks',
        text: 'Priya is restocking the med cabinet at midnight, humming. You ask how she\'s doing. She stops. Puts down the gauze. “Oh,” she says. “Oh. Nobody asks the medic that.” Her eyes are suddenly very bright. “I\'m... I\'m actually not sure.”',
        choices: [
          { label: '“Well, I\'m asking. Take your time.”', tag: 'love', fx: () => { emo('priya', { love: 12, sorrow: -10, fear: -5 }); aff('priya', 8); return 'She talks for an hour. About Kochi, about monsoon rain, about the heat clinics. At the end she laughs and says it\'s the best check-up she\'s had in years.'; } },
          { label: '“You\'re doing great, Priya. Really.”', tag: 'joy', fx: () => { emo('priya', { joy: 5 }); aff('priya', 3); return '“Thanks,” she says, and smiles, and goes back to the gauze. You get the feeling you missed something.'; } },
        ],
      },
      {
        title: 'The Empty Bottle',
        text: 'You notice it by accident: an empty bottle of sedatives in the medbay bin. Priya\'s name is on the log. She sees you see it. “It\'s just to sleep. Just some nights. I\'m a doctor, I know my doses.” Her hands are shaking. “Please don\'t tell anyone. If they think the doctor can\'t cope—”',
        choices: [
          { label: '“You\'re allowed to not cope. Let\'s tell someone together.”', tag: 'love', fx: () => { emo('priya', { fear: -18, sorrow: -8, love: 12 }); emo('yasmin', { love: 10 }); aff('priya', 10); flag('priya_honest'); return 'You go to Yasmin together, the closest thing Priya has to a best friend. Yasmin just holds her. They agree a plan. Priya sleeps without pills four nights later, and tells you at breakfast like it\'s an Olympic medal.'; } },
          { label: '“I\'ll keep your secret.”', tag: 'fear', fx: () => { emo('priya', { fear: -4, sorrow: 10 }); aff('priya', 5); flag('priya_secret'); return '“Thank you,” she whispers. She looks relieved. She also looks very, very alone.'; } },
        ],
      },
      {
        title: 'Second Opinions',
        text: 'Priya has a proposal. “What happens if I\'m the one who gets sick? Nobody on this ship can do a suture. That\'s insane. That\'s my fault.” She has a syllabus written already. “Or,” she says, much more quietly, “I could take a week off. I\'ve never taken a week off. Not once. Since I was nineteen.”',
        choices: [
          { label: '“Start the class. Nobody should carry this alone.”', tag: 'hope', fx: () => { emo('priya', { hope: 20, fear: -20 }); emoAll({ hope: 3 }); res({ meds: 3 }); aff('priya', 10); flag('priya_resolved'); return 'Six crew sign up for Basic Medicine. Kenji faints at the first sight of blood. Priya laughs so hard she has to sit down. The medbay runs better than ever.'; } },
          { label: '“Take the week. We\'ll manage. Doctor\'s orders.”', tag: 'joy', fx: () => { emo('priya', { joy: 25, sorrow: -15, fear: -10 }); aff('priya', 10); flag('priya_rest'); return 'Priya spends a week reading novels in the observation dome. She comes back glowing, and immediately reorganises the gauze.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('priya_resolved') ? 'Priya founded the colony\'s first hospital and trained every doctor on the new world. Her first rule: ask the medic how she is.'
      : hasFlag('priya_rest') ? 'Priya delivered the first baby born on the new world, then took the afternoon off. She takes an afternoon off every week now.'
      : hasFlag('priya_secret') ? 'Priya kept everyone alive. She kept her own nights to herself.'
      : 'Priya was the colony doctor for forty years. She remembered every heartbeat.',
  },
  {
    id: 'cal', name: 'Cal Byrne', age: 22, role: 'Comms & Morale', from: 'Dublin, Ireland',
    suit: '#ab47bc', skin: '#f3d2c1', hair: '#b5541c', work: 'lounge', romance: true,
    base: { joy: 55, sorrow: 25, anger: 10, fear: 15, love: 70, greed: 5, hope: 50, wonder: 40 },
    likes: ['music', 'instrument', 'artifact'],
    bio: 'Comms officer, part-time DJ, full-time romantic. Broke up with his girlfriend at the launch gate.',
    lines: {
      joy: 'Wrote a song about the coffee machine. It\'s a banger. You\'ll hear it at the next party.',
      sorrow: 'Aoife stood at the launch gate and didn\'t wave. I think about that a lot.',
      anger: 'Who unplugged my amp to charge a drill? Who does that? Monsters, that\'s who.',
      fear: 'What if we\'re the last people who remember how the old songs go?',
      love: 'I think I\'m in love with everyone on this ship a little bit. Is that a problem? It feels like a problem.',
      greed: 'I want the lounge on Fridays. Just me and the mic. Is that so much to ask?',
      hope: 'There\'s a note between two notes nobody\'s played yet. I think I\'ll find it out here.',
      wonder: 'Comms picks up pulsars. They sound like drums. The universe keeps time, did you know?',
    },
    arc: [
      {
        title: 'Aoife\'s Song',
        text: 'Cal plays you a song in the empty lounge. It\'s gentle, a little clumsy, and absolutely heartbroken. “It\'s for Aoife. She wanted me to stay. I wanted her to come. We both just stood there at the gate.” He picks at a string. “Is it daft to write songs for someone who\'ll never hear them?”',
        choices: [
          { label: '“It\'s not daft. It\'s beautiful.”', tag: 'love', fx: () => { emo('cal', { joy: 10, love: 8 }); aff('cal', 7); return 'He plays it again, a little braver this time. You clap. He bows so low he hits his head on the mic stand.'; } },
          { label: '“Maybe it\'s time to let her go.”', tag: 'sorrow', fx: () => { emo('cal', { sorrow: 15, hope: 5 }); aff('cal', 3); return '“Yeah.” He puts the guitar down. “Yeah. Maybe.” He doesn\'t play for a few days.'; } },
        ],
      },
      {
        title: 'Last Transmission',
        text: 'Cal has been writing a message to Aoife for a week. A real one, full power, the kind that will actually reach Earth. It would drain the comms array, and the ship would need parts to recharge it. “One last thing to say to her. Or,” he says, “I could turn it into a song for the crew. For all of us who left someone.”',
        choices: [
          { label: '“Send it. Some things need saying.”', tag: 'love', fx: () => { res({ parts: -3 }); emo('cal', { sorrow: -15, love: 12, hope: 8 }); aff('cal', 9); flag('cal_sent'); return 'The message goes out at 14:02 ship time. It will reach Dublin in four years. Cal sits on the bridge afterwards, lighter than you\'ve ever seen him.'; } },
          { label: '“Sing it for the crew.”', tag: 'joy', fx: () => { emo('cal', { joy: 15, sorrow: -8 }); emoAll({ love: 6, sorrow: 4, joy: 4 }); aff('cal', 9); flag('cal_song'); logEv('Cal played “Everyone We Left” to the whole crew.', 'love'); return 'He calls it ‘Everyone We Left’. The whole crew cries, then laughs at themselves for crying, then asks him to play it again.'; } },
        ],
      },
      {
        title: 'Brave',
        text: () => { const t = calCrush(); return t ? `Cal is pacing the dome. “Okay. So. There\'s someone. On the ship. It\'s ${N(t)}.” He sits. Stands. Sits. “Should I tell them? What if it ruins everything? We\'re stuck on a ship forever!”` : 'Cal is pacing the dome. “I think I\'ve finally stopped falling for everyone,” he says. “Is that growing up? It feels a bit sad, honestly.”'; },
        choices: [
          { label: '“Tell them. Life is short and space is big.”', tag: 'love', fx: () => { const t = calCrush(); if (!t) { emo('cal', { hope: 10 }); flag('cal_resolved'); return 'He laughs. “Right. Big space. Short life. Got it.” He writes a song about it instead.'; } flag('cal_resolved'); if (rel('cal', t) > 15 && C(t).e.love > 25 && !partnerOf(t)) { makePartners('cal', t); emo('cal', { joy: 25, love: 15 }); emo(t, { joy: 15, love: 15 }); aff('cal', 10); return `${N(t)} says yes. Of course ${N(t)} says yes. Cal plays a song so happy that Sofia, who hates everything, dances.`; } emo('cal', { sorrow: 20, love: -5 }); aff('cal', 5); flag('cal_heartbreak'); return `${N(t)} is kind about it. Very kind. It\'s still no. Cal writes eleven songs in two days. Three of them are genuinely great.`; } },
          { label: '“Wait. Be sure first.”', tag: 'fear', fx: () => { emo('cal', { fear: 5, hope: 5 }); aff('cal', 5); flag('cal_waiting'); return '“Sure. Yeah. Sure.” He\'s been sure for months. He waits anyway.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('cal_heartbreak') ? 'Cal wrote the colony\'s first songbook. The saddest ones were the most popular. He fell in love again, twice, happily.'
      : hasFlag('cal_resolved') ? 'Cal played at every wedding on the new world, including, eventually, his own.'
      : hasFlag('cal_sent') ? 'Four years after landing, a message arrived from Dublin. It said only: I waved. You just didn\'t see.'
      : 'Cal\'s songs were the first music ever played on the new world. Children still sing the one about the coffee machine.',
  },
  {
    id: 'mateo', name: 'Mateo Silva', age: 21, role: 'Astronomer', from: 'São Paulo, Brazil',
    suit: '#ffca28', skin: '#8d5a3b', hair: '#1b1b1b', work: 'dome', romance: true,
    base: { joy: 50, sorrow: 15, anger: 5, fear: 20, love: 30, greed: 5, hope: 60, wonder: 80 },
    likes: ['data', 'artifact', 'crystal'],
    bio: 'Youngest aboard. Built his first telescope from scrap in a favela. His father told him stars don\'t feed anyone.',
    lines: {
      joy: 'I found a binary star doing a little dance! Spinning round each other like at a festa!',
      sorrow: 'My dad never came to the launch. I kept looking at the gate anyway.',
      anger: 'Jonah wants to cut observation hours for ‘efficiency’. The stars ARE the mission!',
      fear: 'The dark between stars is so big. Sometimes I have to stop looking.',
      love: 'I taught Kenji the constellations as they look from here. He named one after a sandwich.',
      greed: 'I want naming rights on the next planet. I\'ve earned it. I have a list.',
      hope: 'Somewhere out there a kid on another world is looking up at us. I just know it.',
      wonder: 'Every photon I catch has been travelling longer than humans have existed. And it ends in my eye.',
    },
    arc: [
      {
        title: 'Stars Don\'t Feed Anyone',
        text: 'Mateo pulls you to the dome\'s big lens. “Look, look! Epsilon Indi, from the other side!” You look. It\'s a star. He\'s vibrating. Then, quieter: “My dad said stars don\'t feed anyone. He worked three jobs. He was right, I guess. But I couldn\'t stop looking up.”',
        choices: [
          { label: '“They\'re feeding you now. They\'re feeding all of us.”', tag: 'wonder', fx: () => { emo('mateo', { wonder: 10, joy: 10, sorrow: -5 }); aff('mateo', 7); return 'He grins so wide it looks painful. He spends the next hour teaching you to find Sol. It\'s just a dim yellow dot now.'; } },
          { label: '“Did your dad see you leave?”', tag: 'sorrow', fx: () => { emo('mateo', { sorrow: 12, love: 8 }); aff('mateo', 6); return '“No.” A long pause. “He sent a message though. Two words. ‘Look up.’ I don\'t know what he meant. I think about it every day.”'; } },
        ],
      },
      {
        title: 'The Anomaly',
        text: 'Mateo bursts into the Mess at breakfast. “There\'s a gravitational lens! Right there! Off our course, but if we burn ten units of fuel, we can see through it—maybe halfway across the galaxy!” The whole room turns to look at you. Luka is already calculating fuel in his head, and looking pale.',
        choices: [
          { label: '“Burn the fuel. Let\'s see.”', tag: 'wonder', req: () => S.res.fuel >= 12, fx: () => { res({ fuel: -10 }); emo('mateo', { wonder: 25, joy: 20, hope: 10 }); emoAll({ wonder: 8 }); giveItem('star_fragment'); revealSpecial(); aff('mateo', 10); flag('mateo_anomaly'); return 'Through the lens, galaxies. Thousands. The crew crowd the dome in silence. And Mateo spots something: a system with an impossible spectral signature, far ahead. He marks it on the star map.'; } },
          { label: '“We can\'t spare the fuel, Mateo. I\'m sorry.”', tag: 'fear', fx: () => { emo('mateo', { sorrow: 12, hope: -10 }); aff('mateo', -2); return 'He nods. “No, you\'re right. Fuel.” He watches the lens slide out of view through the dome for an hour.'; } },
        ],
      },
      {
        title: 'Look Up',
        text: 'Mateo is recording something at the comms desk. “It\'s for kids. On Earth. Like me. The ones building telescopes out of rubbish.” He stops. “Earth might not be listening any more. Maybe nobody\'s listening. Should I still send it?”',
        choices: [
          { label: '“Send it. Someone is always listening.”', tag: 'hope', fx: () => { emo('mateo', { hope: 15, joy: 10 }); aff('mateo', 10); flag('mateo_resolved'); return 'The message is two minutes long. It ends: “My dad told me to look up. So I did. And now I\'m up here. Look up. We\'re waving.”'; } },
          { label: '“Record it for the kids who\'ll be born out here instead.”', tag: 'wonder', fx: () => { emo('mateo', { wonder: 15, hope: 20 }); emoAll({ hope: 3 }); aff('mateo', 10); flag('mateo_future'); return 'He does. He addresses it to ‘Whoever is First’. It will be played on the new world, one day, in a classroom with a real window.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('mateo_future') ? 'Mateo built the colony\'s observatory. The first thing every child hears there is a recording of a young man telling them to look up.'
      : hasFlag('mateo_resolved') ? 'Mateo mapped the new world\'s sky and named its brightest star after a man who worked three jobs in São Paulo.'
      : 'Mateo never stopped looking up. He discovered eleven comets. He named one after the ship\'s cat.',
  },
  {
    id: 'yasmin', name: 'Yasmin Haddad', age: 26, role: 'Archivist', from: 'Beirut, Lebanon',
    suit: '#26a69a', skin: '#d9a47a', hair: '#2a1a14', work: 'archive', romance: true,
    base: { joy: 25, sorrow: 55, anger: 20, fear: 20, love: 45, greed: 5, hope: 30, wonder: 45 },
    likes: ['book', 'relic', 'artifact'],
    bio: 'Keeper of the Earth Archive: every book, song, and photograph that fit. Every choice about what to leave was hers.',
    lines: {
      joy: 'Kenji asked me for jazz from 1959. Somebody used the archive! I\'m thrilled!',
      sorrow: 'I have twelve million photographs of Earth. I can\'t look at the ones of Beirut yet.',
      anger: 'They burned libraries during the Scorching riots. On purpose. I will never forgive that.',
      fear: 'If the archive fails, we lose everything. Every poem. Every recipe. Every name.',
      love: 'Humans wrote love letters for five thousand years. I\'ve read so many. They\'re all the same letter.',
      greed: 'I want every scrap. Every book. Every song. I can\'t stop collecting. It\'s a sickness.',
      hope: 'One day someone will read these files on a world with two moons. That\'s who I keep them for.',
      wonder: 'We\'re the first humans to carry the whole library past the Sun. We\'re a library that flies.',
    },
    arc: [
      {
        title: 'What Was Left Out',
        text: 'Yasmin is in the Archive, lit only by her screen. “Do you know how much fits in the Earth Archive? A lot. Not everything. I chose. Which poets. Which songs. Which languages got dictionaries.” She scrolls a deletion log, thousands of lines long. “I deleted a whole century of Tuvaluan radio to fit the complete works of a man who wrote about golf.”',
        choices: [
          { label: '“You saved what you could. That\'s all anyone can do.”', tag: 'hope', fx: () => { emo('yasmin', { sorrow: -10, hope: 5 }); aff('yasmin', 6); return '“That\'s what everyone says.” She closes the log, though. “Thank you for saying it anyway.”'; } },
          { label: '“Tell me about one of the things you lost.”', tag: 'love', fx: () => { emo('yasmin', { sorrow: 5, love: 12 }); aff('yasmin', 9); return 'She tells you about a lullaby from a village in the Chouf mountains that only three old women still knew. She sings it for you, badly. Now it isn\'t lost. Now two people know it.'; } },
        ],
      },
      {
        title: 'Corruption',
        text: 'Radiation has damaged a storage bank. Yasmin can save one of two collections before the sectors fail: the complete record of human war (every battle, every treaty, every lesson) or the collected art of the twentieth century. “Unless,” she says, “you can get me spare parts for a rebuild. But the ship needs those too.”',
        choices: [
          { label: '“Keep the wars. We have to remember.”', tag: 'sorrow', fx: () => { emo('yasmin', { sorrow: 12, hope: 5 }); aff('yasmin', 6); flag('yasmin_wars'); return 'She saves the war archive. Picasso, Kahlo and Hokusai prints dissolve into static. “We\'ll remember why,” she says. “Maybe we\'ll forget how to paint. Maybe that\'s the price.”'; } },
          { label: '“Keep the art. Let them remember what we could be.”', tag: 'joy', fx: () => { emo('yasmin', { joy: 12, fear: 5 }); aff('yasmin', 6); flag('yasmin_art'); return 'She saves the art. Four thousand years of war history turns to noise. “I hope we don\'t need it,” she whispers. “I hope we\'re different.”'; } },
          { label: 'Give her the parts. Save both.', tag: 'love', req: () => S.res.parts >= 8, fx: () => { res({ parts: -8 }); emo('yasmin', { love: 20, joy: 15, sorrow: -10 }); aff('yasmin', 12); flag('yasmin_both'); return 'Sofia grumbles, but helps rebuild the bank overnight. Everything survives. Yasmin names the new storage array after you, which is embarrassing and lovely.'; } },
        ],
      },
      {
        title: 'The Memory Project',
        text: 'Yasmin has a new project. “The archive has history. It doesn\'t have us. I\'m recording everyone\'s memories of Earth. Their mum\'s kitchen. The street they grew up on. The smell of rain.” She holds out the recorder. “Will you give me one?”',
        choices: [
          { label: 'Tell her your memory of Earth.', tag: 'love', fx: () => { emo('yasmin', { love: 15, sorrow: -15, hope: 10 }); emoAll({ love: 4, sorrow: -3 }); aff('yasmin', 10); flag('yasmin_resolved'); return 'You talk about home for a long time. When you finish, she plays back the other recordings: Kenji\'s noodle stand, Sofia\'s brother\'s tape, Amara\'s grandmother humming. The archive has a heart now.'; } },
          { label: '“I\'d rather not look back. Sorry.”', tag: 'fear', fx: () => { emo('yasmin', { sorrow: 5 }); aff('yasmin', 3); flag('yasmin_resolved'); return '“That\'s alright,” she says. “That\'s a kind of memory too.” She writes it down: ‘One of us could not look back. We loved it too much.’'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('yasmin_both') ? 'Yasmin built the Library of Two Worlds. Nothing was lost. She said it was the second happiest day of her life, and never said what the first was.'
      : hasFlag('yasmin_wars') ? 'Yasmin\'s library taught every generation the history of war. The colony has never fought one.'
      : hasFlag('yasmin_art') ? 'Yasmin\'s library was full of beautiful things. The colony\'s children paint on every wall.'
      : 'Yasmin kept the memory of Earth alive, down to the smell of rain on a Beirut balcony.',
  },
  {
    id: 'jonah', name: 'Jonah Whitfield III', age: 27, role: 'Systems Analyst', from: 'Houston, USA',
    suit: '#607d8b', skin: '#f0cfb5', hair: '#d8b25c', work: 'bridge', romance: true,
    base: { joy: 30, sorrow: 20, anger: 40, fear: 30, love: 15, greed: 55, hope: 35, wonder: 25 },
    likes: ['gadget', 'valuable', 'data'],
    bio: 'Heir to Whitfield Lunar, the company that owned the Moon in the rich-only era. Volunteered. Nobody knows why.',
    lines: {
      joy: 'Efficiency is up nine percent this week. My spreadsheets are singing.',
      sorrow: 'My father sent one message before launch. It was a list of investment instructions.',
      anger: 'Nobody listens until something breaks. Then suddenly I\'m everyone\'s best friend.',
      fear: 'There\'s no bailout out here. No safety net. If we fail, we just... fail.',
      love: 'Sofia called my plan ‘only half stupid’. That\'s practically affection, from her.',
      greed: 'Someone has to lead. Might as well be the one who actually reads the reports.',
      hope: 'We could build a world that runs properly this time. Clean. Fair. Planned.',
      wonder: 'I ran the numbers on how unlikely we are. The numbers broke. I keep running them.',
    },
    arc: [
      {
        title: 'A Quarter of the Moon',
        text: 'Jonah is in the gym, lifting too much weight badly. “My father owned a quarter of the Moon,” he says between reps. “Private dome. Earthrise from the bathtub. Now I share a bathroom with nine people and Kenji uses my towel.” He drops the bar. “I chose this. I keep having to remind myself.”',
        choices: [
          { label: '“Welcome to the rest of us.”', tag: 'joy', fx: () => { emo('jonah', { joy: 8, anger: 5 }); aff('jonah', 4); return 'He laughs despite himself. “Yeah. Yeah, fair.” He re-racks the bar properly for once.'; } },
          { label: '“Why did you choose it?”', tag: 'love', fx: () => { emo('jonah', { sorrow: 10, love: 8, anger: -8 }); aff('jonah', 8); return 'He\'s quiet a long time. “Because every Whitfield in history took. I wanted to see if I could give.” He looks embarrassed. “Don\'t tell Sofia.”'; } },
        ],
      },
      {
        title: 'Captain Whitfield',
        text: 'Jonah has called a crew meeting. “We don\'t have a captain. We have a committee of twenty-somethings and a cat. We need clear command. I\'m qualified, and I\'m volunteering.” The room goes very quiet. Everyone looks at you. You\'re the Crew Liaison; your word carries.',
        choices: [
          { label: 'Support him. The ship needs structure.', tag: 'greed', fx: () => { emo('jonah', { joy: 20, greed: 10, hope: 10 }); emo('sofia', { anger: 15 }); emoAll({ fear: -3, anger: 3 }); aff('jonah', 10); flag('jonah_captain'); logEv('Jonah Whitfield was named Captain of the Collins.', 'greed'); return 'Jonah is named Captain by a narrow vote. He\'s... actually good at it. Efficient. Cold, sometimes. Sofia keeps a tally of his mistakes on the engineering wall.'; } },
          { label: 'Oppose him. No kings out here.', tag: 'anger', fx: () => { emo('jonah', { anger: 20, sorrow: 10 }); emo('sofia', { joy: 10 }); aff('jonah', -8); flag('jonah_opposed'); return 'The vote fails badly. Jonah goes white, then red, then leaves. He skips dinner for three days.'; } },
          { label: 'Propose a rotating council instead. Jonah goes first.', tag: 'hope', fx: () => { emo('jonah', { greed: -12, hope: 12, anger: -5 }); emoAll({ hope: 4 }); aff('jonah', 8); flag('jonah_council'); logEv('The Collins adopted a rotating council.', 'hope'); return 'It passes almost unanimously. Jonah chairs the first council. He\'s better at it than he expected, and much better at handing it over than anyone expected.'; } },
        ],
      },
      {
        title: 'The Whitfield Wells',
        text: 'Jonah hands you a data slate. Internal Whitfield memos, 2038. Methane wells in the Arctic that the company knew were leaking. That the company decided not to cap. “The Scorching didn\'t just happen,” he says. “My family did that. I\'ve had this since I was nineteen. I volunteered so I\'d never have to pretend I didn\'t.”',
        choices: [
          { label: '“Then live differently. That\'s the only apology that counts.”', tag: 'hope', fx: () => { emo('jonah', { greed: -30, hope: 20, sorrow: -5 }); aff('jonah', 12); flag('jonah_resolved'); return 'He nods, slowly. He gives the slate to Yasmin for the archive, unredacted. Then he goes to help Amara in the garden, and is terrible at it, and keeps coming back.'; } },
          { label: '“You\'re not your father, Jonah.”', tag: 'love', fx: () => { emo('jonah', { sorrow: -15, love: 15, anger: -10 }); aff('jonah', 10); flag('jonah_forgiven'); return '“I know,” he says. “I just needed someone to say it where I could hear.” His voice breaks on the last word. He pretends it didn\'t.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('jonah_captain') && !hasFlag('jonah_resolved') ? 'Captain Whitfield ran the colony like a company: efficient, prosperous, and a little cold. Sofia kept counting his mistakes.'
      : hasFlag('jonah_resolved') ? 'Jonah Whitfield III owned nothing on the new world and worked in the gardens until he was old. He was, by all accounts, happy.'
      : hasFlag('jonah_council') ? 'The rotating council Jonah helped design governed the colony for a century. He never asked to chair it twice.'
      : 'Jonah ran the numbers on the colony every day. For once, they kept coming out right.',
  },
  {
    id: 'zhao', name: 'Zhao Wei', age: 25, role: 'Geologist', from: 'Chengdu, China',
    suit: '#78909c', skin: '#e8c29a', hair: '#111', work: 'gym', romance: true,
    base: { joy: 20, sorrow: 40, anger: 45, fear: 20, love: 25, greed: 10, hope: 25, wonder: 45 },
    likes: ['crystal', 'mineral', 'relic'],
    bio: 'Quiet, precise, and angry at the right things. His family\'s mine poisoned a river he swam in as a boy.',
    lines: {
      joy: 'Found a xenolith in the last sample. A rock inside a rock. I laughed out loud. Alone. In the lab.',
      sorrow: 'The river near my home ran orange. My family\'s mine did that. I swam in it as a boy.',
      anger: 'Every world we visit, someone asks what it\'s worth. Not what it is. What it\'s worth.',
      fear: 'What if we do to the next world what we did to the last one?',
      love: 'Rocks are patient. People could learn from them. So could I, with people.',
      greed: 'I kept a sample I shouldn\'t have. A little blue crystal. I didn\'t log it. I don\'t know why.',
      hope: 'Stone remembers everything. Maybe a new world can remember us kindly.',
      wonder: 'This world has been turning for four billion years without us. I feel like a guest.',
    },
    arc: [
      {
        title: 'Guests',
        text: 'Zhao is sorting mineral samples with tweezers. “Can I tell you something awful? Sometimes I hope we don\'t find anything.” He sets down a crystal. “A living world, I mean. Because we\'d just do it again. Dig, drain, burn. I\'ve seen what we do. My family was very good at it.”',
        choices: [
          { label: '“Then we learn. We\'re not them.”', tag: 'hope', fx: () => { emo('zhao', { hope: 12, anger: -5 }); aff('zhao', 7); return '“Maybe.” He holds up the crystal to the light. “I\'d like to be proved wrong. Really, I would.”'; } },
          { label: '“Maybe you\'re right.”', tag: 'sorrow', fx: () => { emo('zhao', { sorrow: 12, anger: -8 }); aff('zhao', 5); return 'He looks at you with surprising gratitude. “Everyone else argues. Thank you for just... letting it be true for a minute.”'; } },
        ],
      },
      {
        title: 'The Untouched',
        text: 'Zhao brings a proposal to the council. “Some worlds we find, we don\'t touch. Not one sample. Not one footprint. We map them from orbit and we leave. Some things should just be allowed to exist.” Luka looks at him like he\'s insane. Jonah starts calculating lost resources.',
        choices: [
          { label: 'Back him. Some things aren\'t ours.', tag: 'love', fx: () => { emo('zhao', { hope: 20, anger: -15, love: 10 }); emo('luka', { anger: 5 }); aff('zhao', 10); flag('zhao_preserve'); logEv('The council adopted Zhao\'s “Untouched Worlds” rule.', 'hope'); return 'The motion passes, just. Zhao doesn\'t celebrate. He just goes to the dome and looks at stars for a very long time.'; } },
          { label: '“We can\'t afford that. We need everything we find.”', tag: 'greed', fx: () => { emo('zhao', { anger: 15, sorrow: 10 }); emo('luka', { joy: 5 }); aff('zhao', -4); return '“I know,” he says. “That\'s what they always said too.”'; } },
        ],
      },
      {
        title: 'A Promise in Stone',
        text: 'Zhao gives you a small, smooth stone from the last world you walked on. “Whatever world we choose,” he says, “promise me we keep part of it wild. Forever. A valley. A river. Somewhere no one digs. Somewhere to remember what we were given.”',
        choices: [
          { label: '“I promise.”', tag: 'love', fx: () => { emo('zhao', { hope: 25, anger: -20, sorrow: -15, love: 10 }); aff('zhao', 12); flag('zhao_resolved'); return 'He nods, once, like a contract has been signed. You keep the stone in your pocket for the rest of the voyage.'; } },
          { label: '“I can\'t promise that. Not yet.”', tag: 'fear', fx: () => { emo('zhao', { sorrow: 10, anger: 5 }); aff('zhao', 4); return '“Honest,” he says. “That\'s something.” He takes the stone back, gently.'; } },
        ],
      },
    ],
    epilogue: () => hasFlag('zhao_resolved') ? 'Zhao kept the Wild Valley wild. It is the most beautiful place on the new world, and nobody has ever dug a single hole there.'
      : hasFlag('zhao_preserve') ? 'Zhao mapped a dozen untouched worlds on the way. The colony still keeps his list.'
      : 'Zhao surveyed every metre of the new world\'s crust. He never took more than he needed.',
  },
];

// A short alternate history, readable at the Archive terminal and in the intro.
const LORE = [
  { year: '1969', title: 'Tranquility', text: 'Armstrong and Aldrin land at Tranquility Base. Unlike in some quieter version of history, they do not leave. Eagle\'s descent stage becomes the cornerstone of a permanent shelter, and Michael Collins, circling alone overhead, radios down the line the whole world remembers: “Keep the lights on. We\'re coming back.”' },
  { year: '1974', title: 'Armstrong Base', text: 'The first permanent lunar station opens with a crew of six. Helium-3 is found in the regolith. The race to the Moon becomes a gold rush.' },
  { year: '1988', title: 'The Company Moon', text: 'Private consortia buy mining rights to the lunar maria. Whitfield Lunar builds the first hotel on the Moon. A night costs more than a house. Space belongs to the rich and the powerful.' },
  { year: '2009', title: 'The Mass Driver', text: 'An electromagnetic launch rail on the Moon makes lifting cargo to orbit almost free. The price of a ticket to space falls every year for twenty years.' },
  { year: '2031', title: 'Ordinary Skies', text: 'Space travel becomes normal. Teenagers take gap years on the Moon. Orbital weddings go out of fashion for being too common. But on Earth, the bill for two centuries of burning comes due.' },
  { year: '2038', title: 'The Scorching', text: 'Arctic methane wells, left uncapped to save money, tip the climate over the edge. Summers become lethal across the tropics. Coastal cities drown. Water becomes a commodity worth killing for.' },
  { year: '2052', title: 'The Long Winter', text: 'Crop failures and resettlement camps. Governments promise that help is coming. For many, it doesn\'t come.' },
  { year: '2061', title: 'The Collins Project', text: 'At Tranquility Yards, a fold-drive ship the length of a village is laid down in lunar orbit. Its purpose: carry a volunteer crew beyond the Sun to find humanity a second chance. It is named for the astronaut who stayed in orbit and watched over the others.' },
  { year: '2071', title: 'Departure', text: 'The ISV Collins launches with a young, highly trained crew who know they will almost certainly never see Earth again. They are in their twenties. They are frightened. They are thrilled. They intend to have the time of their lives.' },
];

// Crew-flavoured ambient life, used in the cruise log so the ship feels inhabited.
const AMBIENT = {
  joy: ['{a} and {b} held a water-balloon fight in the zero-G gym.', '{a} taught the lounge a card game from home. {b} cheated.', 'A spontaneous dance party broke out in the Mess. {a} started it.', '{a} laughed so hard at {b}\'s impression of Jonah that they fell off a chair.'],
  sorrow: ['{a} spent the evening scrolling old photos in the Archive.', '{a} and {b} sat in silence in the dome, watching Sol get smaller.', 'Someone left a candle burning on the Memorial wall.', '{a} didn\'t come to dinner.'],
  anger: ['{a} and {b} had a shouting match over the shower rota.', '{a} put a new dent in the gym wall.', 'Somebody wrote something rude about Jonah on the ship board.', '{a} slammed the hatch hard enough to set off a pressure alarm.'],
  fear: ['{a} checked the hull sensors four times before bed.', '{a} asked Priya for something to help them sleep.', 'A strange noise in the ventilation kept {a} and {b} up all night.', '{a} started keeping an emergency bag packed.'],
  love: ['{a} and {b} were seen holding hands in Hydroponics.', '{a} left breakfast outside {b}\'s cabin.', '{a} cut {b}\'s hair in the Mess. Everyone watched. It went well.', '{a} and {b} talked until the lights dimmed.'],
  greed: ['{a} traded their dessert rations for {b}\'s shower minutes.', 'A spanner went missing from Engineering. {a} is suspected.', '{a} started keeping a ledger of who owes them favours.', '{a} and {b} argued over who gets the bigger cabin.'],
  hope: ['{a} and {b} drew maps of an imaginary colony on the Mess table.', '{a} planted something new in Hydroponics.', '{a} started teaching {b} a language they\'ll need on the new world: their own.', '{a} pinned up a list titled ‘Things We\'ll Do When We Land’. It has 214 items.'],
  wonder: ['{a} woke the whole deck to see a comet streak past the dome.', '{a} and {b} named three new stars before breakfast.', '{a} spent six hours at the telescope and forgot to eat.', 'The ship passed through a faint aurora. {a} cried at how beautiful it was.'],
};
