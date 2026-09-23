# After Tranquility

*An open world made of feelings.*

In 1969 the astronauts at Tranquility Base didn't go home. The Moon became a base, then a shipyard. Space travel started as a toy for the rich and ended up ordinary, while the Earth burned. In 2071 the **ISV Collins**, a fold-drive ship built in lunar orbit, leaves for deep space with ten volunteers in their twenties and you, their elected **Crew Liaison**. They know they will never see Earth again. They want to see everything, have the time of their lives, and find humanity a new home.

## Play

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
npx http-server .   # then visit http://localhost:8080
```

| Key | Action |
| --- | --- |
| WASD / Arrows | Walk |
| E / Space | Talk / interact |
| 1-9 | Pick a choice |
| J | Journal (crew, bonds, your heart, log, items, help) |
| M | Star map |
| N | Mute |
| Esc | Close / help |

Touch controls appear automatically on phones and tablets. The game autosaves when you sleep and when you arrive at a new system.

## The new style: an emotional ecology

In most open worlds the map is terrain and the systems are combat and loot. In *After Tranquility* the world you explore is **how people feel**, and every system reads from and writes to those feelings.

- **Eight emotions per person.** Joy, Sorrow, Anger, Fear, Love, Greed, Hope and Wonder. Each crew member has their own temperament and drifts back towards it.
- **Feelings drive movement.** At work hours people go to their stations. In the evenings they go to the room that matches their strongest feeling: the grieving gather in the Earth Archive, the angry in the Gym, the greedy in Cargo, the hopeful in Hydroponics, lovers and dreamers in the Observation Dome.
- **Moods are contagious.** People who share a room pull each other's feelings together. One furious person sours a room and one joyful one lifts it. Being alone for long makes people lonely.
- **Relationships emerge.** Time spent together in good or bad moods builds friendships, rivalries and romances. Couples form on their own, get married, and get jealous.
- **The ship's weather.** The HUD shows the crew's combined emotions as a band of colour, and the ambient music changes chord to match the dominant feeling.
- **Consequences are emotional and practical.** Hope makes the garden grow. Greed empties the food stores. Anger starts fights that use up medicine. Fear leads to petitions to turn back. If morale collapses there's a mutiny. If food runs out people starve.
- **Your heart is tracked.** Every choice is tagged with an emotion. The journal shows what kind of leader you're becoming, and the ending reflects it.

## What's in it

- **The Collins**, a walkable ship with ten rooms, day/night cycles, crew who keep their own schedules, and Buzz the stowaway cat.
- **Ten crew members** with personal voices and a three-part story each, told through heart-to-hearts you unlock by earning their trust. Amara carries her grandmother's seeds. Kenji jokes to drown out a crash he survived. Luka hoards because he once starved. Jonah is the heir of the company that burned the Earth.
- **27 story events** covering the whole range of feeling: Voyager's Golden Record, strawberries grown under lamps, a billionaire's dead ark ship, the day Earth goes silent, birthdays, fights, fevers, weddings and funerals.
- **A procedural galaxy** of about 25 star systems and dozens of planets across 11 world types, each with temperature, atmosphere, gravity, water, life and a habitability score.
- **Planet surfaces** to walk with a crewmate of your choice. Gather fuel, parts and food, watch your oxygen, avoid hostile life, and decide whether to take what you find or leave it alone.
- **Three special worlds** further out: Ashfall (the ruins of a civilisation that destroyed itself), Thalassa (a singing ocean) and Eden's Echo (a garden world that is already someone's home).
- **The Assembly.** When you find a world worth living on, the crew votes with their hearts after you make one speech. Your appeal (hope, fear, love, wonder, plenty or defiance) sways the people who feel it most.
- **Endings** built from what happened: the world you chose, the state of the crew, each person's fate based on their story choices, and the shape of your own heart.

## Code map

```
index.html          page shell and DOM overlays
style.css           styling
js/util.js          seeded RNG, value noise, helpers
js/data_crew.js     emotions, crew, personal stories, items, lore, ambient life
js/data_events.js   story events and their choices
js/state.js         game state, emotion simulation, relationships, saves
js/galaxy.js        star systems, planets, habitability
js/ship.js          the ship world, crew AI and pathfinding, rendering
js/planet.js        procedural planet surfaces and exploration
js/ui.js            dialogue windows, HUD, journal, portraits
js/audio.js         mood-driven ambient drone
js/main.js          game loop, interactions, star map, travel, the Assembly, endings
```

Plain browser JavaScript with no frameworks, drawn on a canvas.
