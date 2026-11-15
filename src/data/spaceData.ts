export type DestinationId = 'moon' | 'mars' | 'jupiter' | 'saturn' | 'deep-space';

export type HardwareStatus =
  | 'Active'
  | 'Dormant'
  | 'Retired'
  | 'Still Traveling'
  | 'Impact Site';

export type HardwareType =
  | 'Rover'
  | 'Lander'
  | 'Descent Stage'
  | 'Probe'
  | 'Orbiter'
  | 'Instrument'
  | 'Rotorcraft'
  | 'Space Telescope';

export interface SpaceArtifact {
  id: string;
  name: string;
  mission: string;
  destinationId: DestinationId;
  locationOrTrajectory: string;
  coordinates?: string;
  launchDate: string;
  arrivalDate: string;
  endDate?: string;
  year: number;
  hardwareType: HardwareType;
  status: HardwareStatus;
  purpose: string;
  discoveries: string[];
  story: string;
  whyLeftBehind: string;
  glossaryTerm?: {
    term: string;
    definition: string;
  };
  nasaSourceUrl: string;
  nasaSourceTitle: string;
  model3dId: string;
  massKg: number;
}

export interface DestinationInfo {
  id: DestinationId;
  name: string;
  subtitle: string;
  distanceFromSun: string;
  travelTimeFromEarth: string;
  totalArtifactsNote: string;
  summary: string;
  scienceContext: string;
  colorHex: string;
  accentClass: string;
  orbitRadiusUnits: number;
  planetRadiusUnits: number;
  orbitSpeed: number;
  nasaUrl: string;
}

export interface Nasa3DModelEntry {
  id: string;
  name: string;
  category: 'Moon' | 'Mars' | 'Outer Planets & Probes' | 'Planets' | 'Moons' | 'Telescopes';
  missionOrTarget: string;
  status: HardwareStatus | 'Celestial Body';
  description: string;
  glbUrl?: string;
  glbSizeLabel?: string;
  proceduralArchetype?:
    | 'moon-rock'
    | 'mars-globe'
    | 'mer-rover'
    | 'perseverance-rover'
    | 'ingenuity-chopper'
    | 'insight-lander'
    | 'maven-orbiter'
    | 'mro-orbiter'
    | 'jupiter-globe'
    | 'juno-probe'
    | 'cassini-orbiter'
    | 'voyager-probe'
    | 'pioneer-probe'
    | 'new-horizons'
    | 'europa-clipper'
    | 'icy-moon'
    | 'apollo-descent';
  nasaResourceUrl: string;
  attribution: string;
  keySpecs: {
    label: string;
    value: string;
  }[];
}

export const STRICT_REFUSAL_MESSAGE =
  "I'm Space Explorer AI, and I'm specialized in space and astronomy questions! I can't help with non-space topics, but I'd be glad to answer a space-related question about planets, stars, black holes, telescopes, or space missions.";

export const DESTINATIONS: DestinationInfo[] = [
  {
    id: 'moon',
    name: 'The Moon',
    subtitle: 'Earth’s Natural Satellite · 384,400 km from Earth',
    distanceFromSun: '1.00 AU (384,400 km from Earth)',
    travelTimeFromEarth: '~3 days (Apollo trajectory)',
    totalArtifactsNote: 'Over 180,000 kg of human-made material across 90+ lunar sites',
    summary:
      'Our closest cosmic neighbor holds the footsteps of 12 Apollo astronauts alongside lunar rovers, golden descent stages, seismometers, and laser mirrors that scientists still ping from Earth today.',
    scienceContext:
      'Every kilogram saved on the return trip allowed astronauts to bring back priceless Moon rocks. Leaving descent stages, rovers, and surface experiments behind turned landing sites into long-term science stations.',
    colorHex: '#94A3B8',
    accentClass: 'text-slate-300',
    orbitRadiusUnits: 14,
    planetRadiusUnits: 1.35,
    orbitSpeed: 0.35,
    nasaUrl: 'https://science.nasa.gov/moon/',
  },
  {
    id: 'mars',
    name: 'Mars',
    subtitle: 'The Red Planet · 4th Planet from the Sun',
    distanceFromSun: '1.52 AU (228 million km avg)',
    travelTimeFromEarth: '7 to 9 months',
    totalArtifactsNote: 'Over 7,100 kg of robotic hardware across 10+ landing & impact sites',
    summary:
      'Mars is the only known world inhabited entirely by robots. Across its rusty plains and ancient lakebeds sit silent rovers, dusty solar landers, discarded heat shields, and a tiny helicopter that made history.',
    scienceContext:
      'Because no Mars mission has yet launched back to Earth, every rover and lander stays permanently on the Martian surface—transforming from active geologists into historic monuments once their power fades.',
    colorHex: '#EA580C',
    accentClass: 'text-orange-400',
    orbitRadiusUnits: 23,
    planetRadiusUnits: 1.75,
    orbitSpeed: 0.24,
    nasaUrl: 'https://science.nasa.gov/mars/',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    subtitle: 'Gas Giant & Galilean Moons · 5.20 AU',
    distanceFromSun: '5.20 AU (778 million km)',
    travelTimeFromEarth: '2 to 6 years',
    totalArtifactsNote: 'Atmospheric entry probes, radiation-hardened orbiters, and icy-moon scouts',
    summary:
      'Jupiter’s immense gravity and intense radiation belts make it one of the toughest places for spacecraft. To protect ocean moons like Europa from Earth microbes, retired orbiters are intentionally steered into Jupiter’s atmosphere.',
    scienceContext:
      'Planetary protection rules forbid leaving unsterilized spacecraft where they might crash into Europa or Ganymede, whose subsurface oceans could harbor life.',
    colorHex: '#D97706',
    accentClass: 'text-amber-400',
    orbitRadiusUnits: 34,
    planetRadiusUnits: 3.1,
    orbitSpeed: 0.14,
    nasaUrl: 'https://science.nasa.gov/jupiter/',
  },
  {
    id: 'saturn',
    name: 'Saturn & Titan',
    subtitle: 'The Ringed World & Methane Moon · 9.58 AU',
    distanceFromSun: '9.58 AU (1.43 billion km)',
    travelTimeFromEarth: '~7 years',
    totalArtifactsNote: '1 lander on Titan’s surface and Cassini’s final plunge into Saturn',
    summary:
      'Nearly a billion miles from home, a golden saucer-shaped probe rests on the frozen methane shores of Saturn’s largest moon, Titan, while its mothership Cassini became part of Saturn itself.',
    scienceContext:
      'When Cassini discovered warm water plumes erupting from Enceladus, mission engineers chose to vaporize the orbiter in Saturn’s skies rather than risk contaminating pristine alien seas.',
    colorHex: '#FBBF24',
    accentClass: 'text-yellow-300',
    orbitRadiusUnits: 46,
    planetRadiusUnits: 2.65,
    orbitSpeed: 0.09,
    nasaUrl: 'https://science.nasa.gov/saturn/',
  },
  {
    id: 'deep-space',
    name: 'Deep Space & Interstellar',
    subtitle: 'Kuiper Belt, Heliosphere & Beyond · 30+ to 165+ AU',
    distanceFromSun: '50 AU to 165+ AU (Up to 24+ billion km)',
    travelTimeFromEarth: '10 to 48+ years and counting',
    totalArtifactsNote: '5 interstellar-bound spacecraft and retired deep-space observatories',
    summary:
      'Out past the planets, humanity’s farthest ambassadors coast silently through the dark. Carrying golden records and metal plaques, probes like Voyager and Pioneer will outlast the pyramids—and perhaps Earth itself.',
    scienceContext:
      'In the vacuum of deep space, there is no air or rain to wear metal away. Once a spacecraft’s thrusters and nuclear batteries run out, Newton’s first law keeps it coasting among the stars for millions of years.',
    colorHex: '#06B6D4',
    accentClass: 'text-cyan-400',
    orbitRadiusUnits: 58,
    planetRadiusUnits: 1.6,
    orbitSpeed: 0.04,
    nasaUrl: 'https://science.nasa.gov/mission/voyager/',
  },
];

export const ARTIFACTS: SpaceArtifact[] = [
  {
    id: 'apollo-11-eagle-descent',
    name: 'Apollo 11 Lunar Module Descent Stage ("Eagle")',
    mission: 'Apollo 11 (First Crewed Lunar Landing)',
    destinationId: 'moon',
    locationOrTrajectory: 'Mare Tranquillitatis (Sea of Tranquility), The Moon',
    coordinates: '0.674° N, 23.473° E',
    launchDate: 'July 16, 1969',
    arrivalDate: 'July 20, 1969',
    endDate: 'July 21, 1969 (Liftoff of Ascent Stage)',
    year: 1969,
    hardwareType: 'Descent Stage',
    status: 'Retired',
    purpose:
      'Braked Apollo 11 out of lunar orbit, hovered over boulder fields, landed Neil Armstrong and Buzz Aldrin safely on the Moon, and served as the launchpad for their return home.',
    discoveries: [
      'Proved precision rocket-powered landings on another celestial body were possible.',
      'Carried the Early Apollo Scientific Experiments Package (EASEP) to the lunar surface.',
      'Bears the stainless-steel commemorative plaque reading: "We came in peace for all mankind."',
    ],
    story:
      'Wrapped in gleaming amber Kapton foil to block extreme solar heat, the octagonal four-legged base of Eagle cushioned humanity’s first steps on another world. When Armstrong and Aldrin blasted off 21 hours later, Eagle’s lower half stayed behind as a launchpad—still standing in the Sea of Tranquility today.',
    whyLeftBehind:
      'Launching the heavy landing legs and empty descent fuel tanks back into lunar orbit would have required massive extra fuel. Leaving the descent stage behind saved thousands of kilograms.',
    glossaryTerm: {
      term: 'Descent Stage',
      definition:
        'The lower half of a two-part spacecraft containing landing legs, shock absorbers, and braking rockets used to touch down on a planet or moon.',
    },
    nasaSourceUrl: 'https://www.nasa.gov/mission/apollo-11/',
    nasaSourceTitle: 'NASA Apollo 11 Mission Overview',
    model3dId: 'apollo-descent-model',
    massKg: 2134,
  },
  {
    id: 'apollo-lunar-rover-lrv',
    name: 'Apollo 15, 16 & 17 Lunar Roving Vehicles ("Moon Buggies")',
    mission: 'Apollo 15, Apollo 16, and Apollo 17',
    destinationId: 'moon',
    locationOrTrajectory: 'Hadley-Apennine, Descartes Highlands & Taurus-Littrow, The Moon',
    coordinates: '26.13° N, 3.63° E (Apollo 15 LRV-1)',
    launchDate: 'July 26, 1971 (Apollo 15)',
    arrivalDate: 'July 30, 1971',
    endDate: 'December 14, 1972 (Apollo 17 final drive)',
    year: 1971,
    hardwareType: 'Rover',
    status: 'Dormant',
    purpose:
      'Battery-powered, foldable four-wheel-drive electric vehicles that allowed astronauts to explore up to 35 km across rugged lunar mountains and craters.',
    discoveries: [
      'Enabled Apollo 15 astronauts to find the "Genesis Rock" (over 4 billion years old).',
      'Allowed Apollo 17 geologist Harrison Schmitt to discover orange volcanic glass soil.',
      'Remote TV cameras on the parked rovers filmed the Lunar Module blasting off from the Moon.',
    ],
    story:
      'Imagine folding a two-seater car like a lawn chair and strapping it to the side of a spacecraft! Instead of rubber tires that would pop or freeze, the Moon Buggies used woven piano-wire mesh wheels with titanium treads. Three rovers remain parked in the lunar dust with their keys figuratively still in the ignition.',
    whyLeftBehind:
      'Powered by non-rechargeable silver-zinc batteries and weighing 210 kg each, the rovers were designed as one-way exploration vehicles so astronauts could bring back 382 kg of lunar rocks instead.',
    glossaryTerm: {
      term: 'Wire-Mesh Wheel',
      definition:
        'A flexible tire woven from zinc-coated steel wire and titanium chevrons designed to float over powdery lunar regolith without air pressure.',
    },
    nasaSourceUrl: 'https://www.nasa.gov/mission/apollo-15/',
    nasaSourceTitle: 'NASA Apollo 15 & Lunar Roving Vehicle Archive',
    model3dId: 'apollo-lrv-3d',
    massKg: 210,
  },
  {
    id: 'apollo-retroreflectors',
    name: 'Lunar Laser Ranging Retroreflector Arrays (LRRR)',
    mission: 'Apollo 11, Apollo 14, and Apollo 15',
    destinationId: 'moon',
    locationOrTrajectory: 'Mare Tranquillitatis, Fra Mauro & Hadley Rille, The Moon',
    coordinates: '0.673° N, 23.472° E',
    launchDate: 'July 16, 1969',
    arrivalDate: 'July 21, 1969',
    year: 1969,
    hardwareType: 'Instrument',
    status: 'Active',
    purpose:
      'Suitcase-sized trays of fused-silica corner-cube mirrors that bounce laser beams fired from Earth observatories straight back to their source to measure the Earth-Moon distance down to the millimeter.',
    discoveries: [
      'Revealed that the Moon is slowly spiraling away from Earth at 3.8 centimeters (1.5 inches) per year.',
      'Proved the Moon has a partially fluid core by measuring tiny wobbles in its rotation.',
      'Confirmed Einstein’s Theory of General Relativity to extreme precision.',
    ],
    story:
      'Over 55 years after Apollo 11, one piece of equipment left on the Moon is still working today! Because the retroreflector is made of ultra-pure quartz prisms that need zero electricity, astronomers on Earth still fire green laser pulses at it and time how long the light takes to bounce back (~2.5 seconds).',
    whyLeftBehind:
      'Intentionally deployed as a permanent, passive optical target on the lunar surface requiring no power or maintenance.',
    glossaryTerm: {
      term: 'Corner-Cube Retroreflector',
      definition:
        'A special three-sided mirror prism that reflects any incoming beam of light back in the exact direction it came from, no matter the angle.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/moon/',
    nasaSourceTitle: 'NASA Science: Earth’s Moon & Lunar Science',
    model3dId: 'moon-rocks-3d',
    massKg: 21,
  },
  {
    id: 'surveyor-3-lander',
    name: 'Surveyor 3 Lunar Lander',
    mission: 'Surveyor 3 & Apollo 12 Visited Site',
    destinationId: 'moon',
    locationOrTrajectory: 'Oceanus Procellarum (Sea of Storms), The Moon',
    coordinates: '3.016° S, 336.582° E',
    launchDate: 'April 17, 1967',
    arrivalDate: 'April 20, 1967',
    endDate: 'May 4, 1967 (Visited by Apollo 12 Crew on Nov 19, 1969)',
    year: 1967,
    hardwareType: 'Lander',
    status: 'Retired',
    purpose:
      'Robotic three-legged lunar lander sent ahead of Apollo to test how firmly lunar dust could support spacecraft weight and dig soil trenches with a remote surface sampler claw.',
    discoveries: [
      'Dug four trenches and performed bearing tests in the lunar regolith, proving astronauts could walk and land safely.',
      'Transmitted 6,315 television images of a crater interior in the Sea of Storms.',
      'Became the first spacecraft ever visited on another world when Apollo 12 astronauts walked 163 meters to inspect it and return its TV camera in 1969.',
    ],
    story:
      'In April 1967, Surveyor 3 bounced twice inside a shallow lunar crater in Oceanus Procellarum before settling at a tilt. Over 14 Earth days it dug miniature soil trenches and photographed the lunar horizon. Two and a half years later, Apollo 12 astronauts Pete Conrad and Alan Bean landed within walking distance, inspected the silent lander, and brought its camera back to Earth.',
    whyLeftBehind:
      'One-way solar-powered robotic precursor lander left on the Moon after completing its 1967 surface mission; its tripod frame still stands near the Apollo 12 landing site.',
    glossaryTerm: {
      term: 'Surface Sampler Scoop',
      definition:
        'A motorized accordion-arm claw mounted on Surveyor 3 that dug, dropped, and pressed lunar soil to measure its strength before Apollo.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/surveyor-3/',
    nasaSourceTitle: 'NASA Science: Surveyor 3 Mission Archive',
    model3dId: 'surveyor-3-3d',
    massKg: 296,
  },
  {
    id: 'opportunity-rover',
    name: 'Opportunity Rover (MER-B, "Oppy")',
    mission: 'Mars Exploration Rover – Opportunity',
    destinationId: 'mars',
    locationOrTrajectory: 'Perseverance Valley, Endeavour Crater, Mars',
    coordinates: '2.28° S, 354.47° E',
    launchDate: 'July 7, 2003',
    arrivalDate: 'January 25, 2004',
    endDate: 'June 10, 2018 (Last contact during global dust storm)',
    year: 2004,
    hardwareType: 'Rover',
    status: 'Dormant',
    purpose:
      'A golf-cart-sized robotic field geologist sent for a 90-Martian-day mission to search for clues of ancient water in Martian rocks and soil.',
    discoveries: [
      'Found "blueberries"—tiny spheres of hematite mineral that form in liquid water.',
      'Discovered veins of gypsum mineral in Endeavour Crater, proving neutral, drinkable water once flowed on Mars.',
      'Drove a record-breaking 45.16 kilometers (28.06 miles)—more than a full marathon on another planet!',
    ],
    story:
      'Built to last just 90 days, Opportunity explored Mars for nearly 15 years—60 times longer than planned! Friendly Martian winds kept blowing dust off its solar panels until a planet-wide dust storm in 2018 blotted out the Sun for months. Its final data transmission showed skies gone dark and battery power critically low.',
    whyLeftBehind:
      'A global dust storm coated its solar arrays and drained its batteries below the survival heater threshold during the freezing Martian winter.',
    glossaryTerm: {
      term: 'Sol (Martian Day)',
      definition:
        'One full rotation of Mars on its axis, lasting 24 hours, 39 minutes, and 35 seconds—just slightly longer than an Earth day.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/mer-opportunity/',
    nasaSourceTitle: 'NASA Mars Exploration Rover – Opportunity',
    model3dId: 'mer-rover-3d',
    massKg: 185,
  },
  {
    id: 'ingenuity-helicopter',
    name: 'Ingenuity Mars Helicopter ("Ginny")',
    mission: 'Mars 2020 / Perseverance',
    destinationId: 'mars',
    locationOrTrajectory: 'Neretva Vallis ("Valinor Hills"), Jezero Crater, Mars',
    coordinates: '18.49° N, 77.32° E',
    launchDate: 'July 30, 2020',
    arrivalDate: 'February 18, 2021',
    endDate: 'January 18, 2024 (Flight 72 rotor blade damage)',
    year: 2021,
    hardwareType: 'Rotorcraft',
    status: 'Retired',
    purpose:
      'A 1.8-kilogram solar-powered helicopter sent to test whether powered, controlled flight was possible in Mars’ paper-thin atmosphere (just 1% as dense as Earth’s).',
    discoveries: [
      'Completed the Wright Brothers moment on another planet on April 19, 2021.',
      'Flew 72 times (originally designed for just 5 test flights), scouting boulders and sand traps ahead of Perseverance.',
      'Carries a postage-stamp-sized swatch of fabric from the 1903 Wright Flyer under its solar panel.',
    ],
    story:
      'Flying on Mars is like trying to fly a helicopter at 100,000 feet altitude on Earth—the air is almost a vacuum! Ingenuity spun two carbon-fiber rotors at 2,400 RPM to lift off. After 72 flights, a hard landing on a featureless sand dune snapped a rotor tip. Though grounded forever, Ginny still wakes up to record weather data in Jezero Crater.',
    whyLeftBehind:
      'After damaging its carbon-fiber rotor blades on Flight 72, Ingenuity could no longer fly and Perseverance had to continue climbing out of Jezero Crater.',
    glossaryTerm: {
      term: 'Coaxial Rotors',
      definition:
        'Two sets of helicopter blades mounted one above the other that spin in opposite directions so the aircraft does not spin out of control.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    nasaSourceTitle: 'NASA Mars 2020 & Ingenuity Helicopter Mission',
    model3dId: 'ingenuity-3d',
    massKg: 1.8,
  },
  {
    id: 'insight-lander',
    name: 'InSight Mars Lander',
    mission: 'Interior Exploration using Seismic Investigations, Geodesy and Heat Transport',
    destinationId: 'mars',
    locationOrTrajectory: 'Elysium Planitia, Mars',
    coordinates: '4.502° N, 135.623° E',
    launchDate: 'May 5, 2018',
    arrivalDate: 'November 26, 2018',
    endDate: 'December 15, 2022',
    year: 2018,
    hardwareType: 'Lander',
    status: 'Retired',
    purpose:
      'The first robotic geophysical observatory designed to give Mars a "checkup"—listening for marsquakes and measuring the size of the planet’s crust, mantle, and core.',
    discoveries: [
      'Detected over 1,300 marsquakes, including a magnitude 5 quake and meteoroid impacts that excavated underground ice.',
      'Measured that Mars has a large liquid iron-alloy core rich in lighter elements like sulfur.',
      'Recorded the haunting sounds of Martian wind vibrations for the first time.',
    ],
    story:
      'Using its robotic arm, InSight gently placed a dome-covered seismometer directly onto the Martian ground—so sensitive it could detect vibrations smaller than a hydrogen atom! Over four years, fine red dust settled thickly over its circular solar panels until it could no longer recharge.',
    whyLeftBehind:
      'Stationary solar-powered lander whose circular solar panels gradually became covered in thick Martian dust.',
    glossaryTerm: {
      term: 'Seismometer',
      definition:
        'An ultra-sensitive instrument that measures ground vibrations from earthquakes, marsquakes, or meteorite impacts to map a planet’s interior layers.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/insight/',
    nasaSourceTitle: 'NASA InSight Mars Lander Overview',
    model3dId: 'insight-3d',
    massKg: 358,
  },
  {
    id: 'perseverance-rover',
    name: 'Perseverance Rover & Sample Depot ("Percy")',
    mission: 'Mars 2020',
    destinationId: 'mars',
    locationOrTrajectory: 'Jezero Crater Rim & Three Forks Depot, Mars',
    coordinates: '18.44° N, 77.45° E',
    launchDate: 'July 30, 2020',
    arrivalDate: 'February 18, 2021',
    year: 2021,
    hardwareType: 'Rover',
    status: 'Active',
    purpose:
      'Searching an ancient river delta in Jezero Crater for signs of past microbial life, generating oxygen from Martian air (MOXIE), and sealing titanium sample tubes left on the surface for future retrieval.',
    discoveries: [
      'Created the first sample depot on another planet by placing 10 sealed titanium rock tubes at "Three Forks" on the Martian surface.',
      'Produced breathable oxygen directly from Mars’ carbon dioxide atmosphere using the MOXIE instrument.',
      'Discovered "Cheyava Falls," an intriguing rock with leopard-spot mineral patterns linked to ancient water and organic chemistry.',
    ],
    story:
      'While Perseverance itself is still actively climbing out of Jezero Crater, it has already left behind its parachute, sky-crane descent stage, heat shield, and 10 lightsaber-shaped titanium tubes filled with Martian rock cores neatly arranged on the ground like a cosmic treasure hunt.',
    whyLeftBehind:
      'The titanium sample tubes were intentionally placed on flat ground at Three Forks as a backup cache so a future Mars Sample Return mission can pick them up.',
    glossaryTerm: {
      term: 'Sky Crane Maneuver',
      definition:
        'A rocket-powered jetpack that hovers above Mars and lowers a heavy rover down on nylon cables before flying away to crash at a safe distance.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/resource/explore-with-perseverance-experience/',
    nasaSourceTitle: 'NASA Explore with Perseverance Experience',
    model3dId: 'perseverance-3d',
    massKg: 1025,
  },
  {
    id: 'galileo-jupiter-probe',
    name: 'Galileo Orbiter & Atmospheric Entry Probe',
    mission: 'Galileo Jupiter Mission',
    destinationId: 'jupiter',
    locationOrTrajectory: 'Vaporized in Jupiter’s Upper Atmosphere',
    coordinates: '6.5° N, 4.4° W (Entry Probe Site)',
    launchDate: 'October 18, 1989',
    arrivalDate: 'December 7, 1995',
    endDate: 'September 21, 2003 (Intentional Planetary Protection Plunge)',
    year: 1995,
    hardwareType: 'Orbiter',
    status: 'Impact Site',
    purpose:
      'First spacecraft to orbit an outer planet and drop a probe directly inside Jupiter’s crushing clouds while studying its four large Galilean moons.',
    discoveries: [
      'Discovered strong evidence of a vast salty liquid water ocean beneath the icy crust of Europa.',
      'Found that Ganymede generates its own magnetic field—the only moon known to do so.',
      'Observed giant volcanic plumes on Io erupting higher than Mount Everest.',
    ],
    story:
      'Galileo’s success actually sealed its fate! Because Galileo proved that Jupiter’s moon Europa hides a warm salty ocean that could support alien life, NASA could not risk the aging, low-fuel spacecraft accidentally crashing into Europa and contaminating it with Earth bacteria. Engineers steered Galileo straight into Jupiter at 173,000 km/h.',
    whyLeftBehind:
      'Intentionally commanded to plunge into Jupiter’s atmosphere when propellant ran low to protect Europa’s subsurface ocean.',
    glossaryTerm: {
      term: 'Planetary Protection',
      definition:
        'International space rules that prevent Earth microbes from Hitchhiking on spacecraft and contaminating moons or planets where alien life might exist.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/galileo/',
    nasaSourceTitle: 'NASA Galileo Mission Overview',
    model3dId: 'juno-3d',
    massKg: 2223,
  },
  {
    id: 'juno-spacecraft',
    name: 'Juno Jupiter Polar Orbiter',
    mission: 'Juno (New Frontiers Program)',
    destinationId: 'jupiter',
    locationOrTrajectory: 'Elliptical Polar Orbit around Jupiter',
    launchDate: 'August 5, 2011',
    arrivalDate: 'July 4, 2016',
    year: 2016,
    hardwareType: 'Orbiter',
    status: 'Active',
    purpose:
      'The farthest solar-powered spacecraft ever flown, peering beneath Jupiter’s swirling cloud tops to map its gravity, magnetic field, deep atmosphere, and icy moons.',
    discoveries: [
      'Revealed geometric clusters of giant cyclones swirling around Jupiter’s north and south poles.',
      'Showed that Jupiter’s Great Red Spot extends hundreds of kilometers deep into the planet.',
      'Captured close-up flyby images of Europa’s fractured ice and Io’s lava lakes.',
    ],
    story:
      'With three giant solar wings the size of tractor-trailers, Juno braves Jupiter’s fierce radiation belts by diving in fast over the poles. Its sensitive electronics sit locked inside a 180-kilogram titanium vault with walls a centimeter thick!',
    whyLeftBehind:
      'Currently in its extended mission; when its propellant is depleted, Juno will remain in the Jovian system under strict planetary protection rules.',
    glossaryTerm: {
      term: 'Radiation Vault',
      definition:
        'A thick titanium box built around a spacecraft’s computer brain to shield it from high-energy electrons that would fry normal electronics.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/resource/juno-3d-model/',
    nasaSourceTitle: 'NASA Juno Spacecraft 3D Resource',
    model3dId: 'juno-3d',
    massKg: 3625,
  },
  {
    id: 'cassini-huygens',
    name: 'Cassini Orbiter & Huygens Titan Lander',
    mission: 'Cassini-Huygens (NASA / ESA / ASI)',
    destinationId: 'saturn',
    locationOrTrajectory: 'Huygens on Adiri Region, Titan; Cassini in Saturn’s Atmosphere',
    coordinates: '10.57° S, 192.34° W (Huygens on Titan)',
    launchDate: 'October 15, 1997',
    arrivalDate: 'July 1, 2004 (Saturn Orbit) / Jan 14, 2005 (Titan Landing)',
    endDate: 'September 15, 2017 (Cassini Grand Finale)',
    year: 2005,
    hardwareType: 'Lander',
    status: 'Retired',
    purpose:
      'Spent 13 years exploring Saturn’s rings and moons while delivering the Huygens lander to parachute onto the hazy, nitrogen-rich world of Titan—the farthest landing from Earth in history.',
    discoveries: [
      'Huygens photographed rounded pebbles of water ice and river channels carved by liquid methane rain on Titan.',
      'Cassini discovered geysers of warm water, organic molecules, and hydrothermal silica spraying out of Saturn’s icy moon Enceladus.',
      'Dived 22 times between Saturn and its innermost rings during its daring "Grand Finale."',
    ],
    story:
      'On January 14, 2005, the saucer-shaped Huygens probe drifted down through orange smog for two and a half hours and thudded onto a damp floodplain of liquid methane on Titan. It transmitted data for 72 minutes before Cassini flew over the horizon. Today, Huygens sits silently on Titan’s frozen shore—the most distant human-made object sitting on another world.',
    whyLeftBehind:
      'Huygens was a battery-powered one-way surface probe on Titan; Cassini was intentionally plunged into Saturn in 2017 to protect Enceladus and Titan.',
    glossaryTerm: {
      term: 'Cryovolcanism (Ice Geysers)',
      definition:
        'Volcanic-style eruptions on freezing moons that shoot liquid water, ammonia, or methane into space instead of molten rock.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/cassini/',
    nasaSourceTitle: 'NASA Cassini-Huygens Mission Archive',
    model3dId: 'cassini-3d',
    massKg: 2523,
  },
  {
    id: 'voyager-1-2',
    name: 'Voyager 1 & Voyager 2 Interstellar Probes',
    mission: 'Voyager Interstellar Mission',
    destinationId: 'deep-space',
    locationOrTrajectory: 'Interstellar Space (Beyond the Heliopause, ~166 AU & ~139 AU)',
    launchDate: 'August 20 & September 5, 1977',
    arrivalDate: 'August 25, 2012 (Voyager 1 crossed into Interstellar Space)',
    year: 1977,
    hardwareType: 'Probe',
    status: 'Still Traveling',
    purpose:
      'Took advantage of a rare 176-year alignment of the outer planets ("The Grand Tour") to visit Jupiter, Saturn, Uranus, and Neptune before heading out into the galaxy.',
    discoveries: [
      'First and only spacecraft to visit Uranus and Neptune up close (Voyager 2).',
      'First human-made objects to cross the heliopause and directly sample the interstellar medium between the stars.',
      'Took the famous "Pale Blue Dot" portrait of Earth from 6 billion kilometers away.',
    ],
    story:
      'Launched in 1977 with computers millions of times less powerful than a modern smartphone, the twin Voyagers are humanity’s farthest pioneers. Bolted to each probe’s side is a 12-inch gold-plated copper phonograph record—the Golden Record—containing greetings in 55 languages, whale songs, Bach, Chuck Berry, and a map to our Sun.',
    whyLeftBehind:
      'Boosted by gravity assists from the giant planets, the Voyagers achieved solar escape velocity and will drift around the Milky Way galaxy for billions of years.',
    glossaryTerm: {
      term: 'Heliopause',
      definition:
        'The boundary where the Sun’s protective bubble of solar wind meets the cold cosmic wind of interstellar space between the stars.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/voyager/',
    nasaSourceTitle: 'NASA Voyager Interstellar Mission',
    model3dId: 'voyager-3d',
    massKg: 722,
  },
  {
    id: 'pioneer-10-11',
    name: 'Pioneer 10 & Pioneer 11 Spacecraft',
    mission: 'Pioneer Outer Solar System Program',
    destinationId: 'deep-space',
    locationOrTrajectory: 'Solar Escape Trajectories toward Aldebaran & Aquila (~137 AU & ~115 AU)',
    launchDate: 'March 2, 1972 (Pioneer 10)',
    arrivalDate: 'December 3, 1973 (Jupiter Flyby)',
    endDate: 'January 23, 2003 (Final faint radio beep from Pioneer 10)',
    year: 1972,
    hardwareType: 'Probe',
    status: 'Still Traveling',
    purpose:
      'Trailblazers sent to prove spacecraft could survive crossing the Asteroid Belt and Jupiter’s radiation belts so Voyager could follow safely.',
    discoveries: [
      'First spacecraft to cross the main Asteroid Belt and fly past Jupiter (Pioneer 10) and Saturn (Pioneer 11).',
      'Mapped Jupiter’s intense magnetosphere and radiation environment.',
      'Carry the famous gold-anodized aluminum Pioneer Plaques designed by Carl Sagan and Frank Drake.',
    ],
    story:
      'Before Pioneer 10, scientists worried the Asteroid Belt might be so full of rock shards that no spacecraft could pass through it unharmed. Pioneer 10 proved the path was open! Although its nuclear power source faded too low to transmit in 2003, the silent dish-shaped probe is still coasting toward the red star Aldebaran—a journey that will take 2 million years.',
    whyLeftBehind:
      'Flung out of the solar system by Jupiter’s gravity; their radioisotope power sources eventually decayed below the watts needed to reach Earth.',
    glossaryTerm: {
      term: 'Gravity Assist (Slingshot)',
      definition:
        'Flying a spacecraft close behind a moving planet so the planet’s gravity pulls the probe forward and flings it outward at much higher speed without using fuel.',
    },
    nasaSourceUrl: 'https://science.nasa.gov/mission/pioneer-10/',
    nasaSourceTitle: 'NASA Pioneer 10 & 11 Mission Archive',
    model3dId: 'pioneer-3d',
    massKg: 258,
  },
  {
    id: 'new-horizons-probe',
    name: 'New Horizons Kuiper Belt Explorer',
    mission: 'New Horizons (New Frontiers Program)',
    destinationId: 'deep-space',
    locationOrTrajectory: 'Kuiper Belt (~61 AU from the Sun)',
    launchDate: 'January 19, 2006',
    arrivalDate: 'July 14, 2015 (Pluto) / Jan 1, 2019 (Arrokoth)',
    year: 2015,
    hardwareType: 'Probe',
    status: 'Still Traveling',
    purpose:
      'Launched as the fastest spacecraft ever to leave Earth to conduct the first reconnaissance of dwarf planet Pluto, its moons, and ancient icy bodies in the Kuiper Belt.',
    discoveries: [
      'Revealed Pluto is an active world with towering water-ice mountains and a vast heart-shaped nitrogen glacier (Sputnik Planitia).',
      'Performed the farthest flyby in history at Arrokoth (43 AU)—a two-lobed "snowman" planetesimal preserved since the birth of the solar system.',
      'Carries a small portion of the ashes of Pluto discoverer Clyde Tombaugh.',
    ],
    story:
      'Shaped like a grand piano and travelling at over 50,000 km/h, New Horizons crossed the distance from Earth to the Moon in just 9 hours on launch day! After transforming Pluto from a blurry pixel into a breathtaking world of blue skies and nitrogen glaciers, it continues cruising through the icy Kuiper Belt.',
    whyLeftBehind:
      'On a one-way solar-system escape trajectory through the Kuiper Belt into interstellar space.',
    glossaryTerm: {
      term: 'Kuiper Belt',
      definition:
        'A vast donut-shaped ring of icy worlds, comets, and dwarf planets (including Pluto) orbiting beyond Neptune from 30 to 55 AU.',
    },
    nasaSourceUrl: 'https://pluto.jhuapl.edu/',
    nasaSourceTitle: 'Johns Hopkins APL & NASA New Horizons Mission',
    model3dId: 'new-horizons-3d',
    massKg: 478,
  },
];

export const NASA_3D_MODELS: Nasa3DModelEntry[] = [
  {
    id: 'moon-3d',
    name: 'Earth’s Moon (3D High-Resolution Globe)',
    category: 'Moon',
    missionOrTarget: 'Lunar Reconnaissance Orbiter / Apollo & Surveyor Sites',
    status: 'Celestial Body',
    description:
      'High-resolution 3D globe of Earth’s Moon showcasing dark volcanic maria (seas), bright ray craters, and rugged highlands where Surveyor landers and six Apollo missions touched down.',
    glbUrl: '/models/moon.glb',
    glbSizeLabel: '13.2 MB GLB',
    nasaResourceUrl: 'https://science.nasa.gov/moon/',
    attribution: 'NASA / LRO / Custom 3D Moon Globe Asset',
    keySpecs: [
      { label: 'Diameter', value: '3,474.8 km' },
      { label: 'Surface Gravity', value: '1.62 m/s² (1/6 Earth)' },
      { label: 'Human Artifacts', value: '90+ surface sites' },
    ],
  },
  {
    id: 'apollo-lrv-3d',
    name: 'Apollo Lunar Roving Vehicle ("Moon Buggy")',
    category: 'Moon',
    missionOrTarget: 'Apollo 15, 16 & 17 Surface Exploration',
    status: 'Dormant',
    description:
      'Detailed 3D reconstruction of the electric four-wheel Lunar Roving Vehicle featuring rugged mesh tires, twin crew seats, gold thermal foil insulation, high-gain dish antenna, and navigation mast.',
    glbUrl: '/models/apollo-lrv.glb',
    glbSizeLabel: '1.48 MB GLB',
    nasaResourceUrl: 'https://www.nasa.gov/mission/apollo-15/',
    attribution: 'NASA Apollo Program / Custom 3D Rover Asset',
    keySpecs: [
      { label: 'Dry Mass', value: '210 kg (35 kg on Moon)' },
      { label: 'Drive System', value: '4-wheel electric hub drive' },
      { label: 'Parked Sites', value: '3 Rovers (Apollo 15–17)' },
    ],
  },
  {
    id: 'surveyor-3-3d',
    name: 'Surveyor 3 Lunar Lander',
    category: 'Moon',
    missionOrTarget: 'Oceanus Procellarum (Surveyor 3 & Apollo 12)',
    status: 'Retired',
    description:
      'Detailed 3D model of NASA’s tripod Surveyor 3 lunar lander featuring its white tubular frame, three crushable landing footpads, elevated solar panel mast, planar high-gain antenna, and thermal instrument boxes.',
    glbUrl: '/models/surveyor-3.glb',
    glbSizeLabel: '0.22 MB GLB',
    nasaResourceUrl: 'https://science.nasa.gov/mission/surveyor-3/',
    attribution: 'NASA / JPL-Caltech / Custom 3D Surveyor 3 Asset',
    keySpecs: [
      { label: 'Touchdown Date', value: 'April 20, 1967' },
      { label: 'TV Images Sent', value: '6,315 lunar photographs' },
      { label: 'Apollo 12 Visit', value: 'Nov 19, 1969 (163 m away)' },
    ],
  },
  {
    id: 'apollo-descent-model',
    name: 'Apollo Lunar Module ("Eagle")',
    category: 'Moon',
    missionOrTarget: 'Apollo 11–17 Lunar Landings',
    status: 'Retired',
    description:
      'Official NASA 3D model of the iconic Apollo Lunar Module whose golden Kapton-wrapped octagonal descent stage remains standing at six lunar landing sites as a launchpad and permanent monument.',
    glbUrl: '/models/apollo-lunar-module.glb',
    glbSizeLabel: '0.50 MB NASA GLB',
    proceduralArchetype: 'apollo-descent',
    nasaResourceUrl: 'https://www.nasa.gov/mission/apollo-11/',
    attribution: 'NASA 3D Resources / Johnson Space Center',
    keySpecs: [
      { label: 'Width (Landing Gear)', value: '9.4 m' },
      { label: 'Thermal Shielding', value: 'Multi-layer Kapton & Mylar' },
      { label: 'Sites on Moon', value: '6 Apollo Landing Sites' },
    ],
  },
  {
    id: 'moon-rocks-3d',
    name: 'Apollo Astromaterials Moon Rock & Retroreflector',
    category: 'Moon',
    missionOrTarget: 'Apollo Lunar Sample & Laser Ranging',
    status: 'Active',
    description:
      'Explore a vesicular lunar basalt sample alongside the corner-cube retroreflector array left behind so astronauts could bring 382 kg of Moon rocks back to Earth.',
    proceduralArchetype: 'moon-rock',
    nasaResourceUrl: 'https://science.nasa.gov/resource/astromaterials-3d-moon-rocks/',
    attribution: 'NASA Astromaterials 3D / Johnson Space Center',
    keySpecs: [
      { label: 'Total Samples Returned', value: '382 kg (2,200 samples)' },
      { label: 'Rock Age', value: '3.2 to 4.46 billion years' },
      { label: 'Laser Array Status', value: 'Active since July 1969' },
    ],
  },
  {
    id: 'mars-3d',
    name: 'Planet Mars Topographic Globe',
    category: 'Mars',
    missionOrTarget: 'Mars Global Exploration',
    status: 'Celestial Body',
    description:
      '3D globe of the Red Planet featuring iron-oxide dust plains, polar ice caps, Valles Marineris canyon, and landing zones for Viking, Spirit, Opportunity, InSight, and Perseverance.',
    proceduralArchetype: 'mars-globe',
    nasaResourceUrl: 'https://science.nasa.gov/resource/planet-mars-3d-model/',
    attribution: 'NASA / JPL-Caltech / USGS',
    keySpecs: [
      { label: 'Diameter', value: '6,779 km' },
      { label: 'Atmosphere', value: '95% CO₂ (1% Earth pressure)' },
      { label: 'Surface Hardware', value: '11 robotic landing sites' },
    ],
  },
  {
    id: 'mer-rover-3d',
    name: 'Spirit & Opportunity Mars Exploration Rover',
    category: 'Mars',
    missionOrTarget: 'Mars Exploration Rover Mission (MER-A & MER-B)',
    status: 'Dormant',
    description:
      'Official NASA 3D model of the six-wheeled solar-powered robotic geologist featuring its panoramic camera mast ("Pancam"), winged solar arrays, high-gain antenna, and robotic arm.',
    glbUrl: '/models/mer-rover.glb',
    glbSizeLabel: '0.72 MB NASA GLB',
    proceduralArchetype: 'mer-rover',
    nasaResourceUrl: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
    attribution: 'NASA / JPL-Caltech',
    keySpecs: [
      { label: 'Planned Mission', value: '90 Martian Sols' },
      { label: 'Opportunity Lifespan', value: '5,111 Sols (14.5 years)' },
      { label: 'Suspension', value: '6-wheel Rocker-Bogie' },
    ],
  },
  {
    id: 'perseverance-3d',
    name: 'Perseverance Rover & Sample Cache Tubes',
    category: 'Mars',
    missionOrTarget: 'Mars 2020 Mission (Jezero Crater)',
    status: 'Active',
    description:
      'Official NASA 3D model of the car-sized nuclear-powered (MMRTG) rover equipped with the SuperCam laser mast, 2-meter coring drill arm, and sealed titanium sample cache system.',
    glbUrl: '/models/perseverance.glb',
    glbSizeLabel: '1.55 MB NASA GLB',
    proceduralArchetype: 'perseverance-rover',
    nasaResourceUrl: 'https://science.nasa.gov/resource/explore-with-perseverance-experience/',
    attribution: 'NASA / JPL-Caltech',
    keySpecs: [
      { label: 'Power Source', value: 'MMRTG Radioisotope Generator' },
      { label: 'Sample Tubes Cached', value: '10 at Three Forks Depot' },
      { label: 'Mass', value: '1,025 kg' },
    ],
  },
  {
    id: 'ingenuity-3d',
    name: 'Ingenuity Mars Helicopter',
    category: 'Mars',
    missionOrTarget: 'Mars 2020 Aerial Scout',
    status: 'Retired',
    description:
      'Official NASA 3D model of the ultra-lightweight coaxial rotorcraft with counter-rotating 1.2-meter carbon-fiber blades, top solar array, insulated fuselage, and four spindly landing legs.',
    glbUrl: '/models/ingenuity.glb',
    glbSizeLabel: '0.39 MB NASA GLB',
    proceduralArchetype: 'ingenuity-chopper',
    nasaResourceUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
    attribution: 'NASA / JPL-Caltech / AeroVironment',
    keySpecs: [
      { label: 'Rotor Speed', value: '~2,400 to 2,537 RPM' },
      { label: 'Total Flights', value: '72 Flights (17.0 km flown)' },
      { label: 'Total Mass', value: '1.8 kg (4 lbs on Earth)' },
    ],
  },
  {
    id: 'insight-3d',
    name: 'InSight Mars Geophysical Lander',
    category: 'Mars',
    missionOrTarget: 'Elysium Planitia Seismic Observatory',
    status: 'Retired',
    description:
      'Official NASA 3D model of the stationary Mars lander in its deployed configuration featuring twin decagonal fan-out solar arrays, robotic deployment arm, and instrument deck.',
    glbUrl: '/models/insight-deployed.glb',
    glbSizeLabel: '2.00 MB NASA GLB',
    proceduralArchetype: 'insight-lander',
    nasaResourceUrl: 'https://science.nasa.gov/mission/insight/',
    attribution: 'NASA / JPL-Caltech / Lockheed Martin',
    keySpecs: [
      { label: 'Wingspan', value: '6.0 meters' },
      { label: 'Marsquakes Detected', value: '1,319 seismic events' },
      { label: 'Status', value: 'Retired Dec 2022 (Dust-covered)' },
    ],
  },
  {
    id: 'maven-3d',
    name: 'MAVEN Mars Atmospheric Orbiter',
    category: 'Mars',
    missionOrTarget: 'Mars Atmospheric & Surface Relay Orbiters',
    status: 'Active',
    description:
      'Official NASA 3D model of the high-altitude Mars orbiter with gull-wing solar panels, magnetometer booms, and high-gain dish that relays data from surface rovers back to Earth.',
    glbUrl: '/models/maven.glb',
    glbSizeLabel: '0.68 MB NASA GLB',
    proceduralArchetype: 'maven-orbiter',
    nasaResourceUrl: 'https://science.nasa.gov/mission/maven/',
    attribution: 'NASA / Goddard Space Flight Center / JPL',
    keySpecs: [
      { label: 'Wingspan', value: '11.4 meters' },
      { label: 'Primary Role', value: 'Atmospheric Escape & Relay' },
      { label: 'MRO Companion', value: 'Mars Reconnaissance Orbiter' },
    ],
  },
  {
    id: 'juno-3d',
    name: 'Juno Jupiter Polar Orbiter',
    category: 'Outer Planets & Probes',
    missionOrTarget: 'Jupiter Polar Orbit & Galilean Moon Flybys',
    status: 'Active',
    description:
      'Official NASA 3D model of the hexagonal titanium-vaulted spacecraft with three massive 9-meter solar arrays arranged like a pinwheel to capture faint sunlight 778 million km from the Sun.',
    glbUrl: '/models/juno.glb',
    glbSizeLabel: '0.68 MB NASA GLB',
    proceduralArchetype: 'juno-probe',
    nasaResourceUrl: 'https://science.nasa.gov/resource/juno-3d-model/',
    attribution: 'NASA / JPL-Caltech / SwRI',
    keySpecs: [
      { label: 'Solar Span', value: '20 meters (66 feet)' },
      { label: 'Titanium Vault', value: '180 kg radiation shield' },
      { label: 'Sister Mission', value: 'NASA Europa Clipper' },
    ],
  },
  {
    id: 'cassini-3d',
    name: 'Cassini Orbiter & Huygens Titan Probe',
    category: 'Outer Planets & Probes',
    missionOrTarget: 'Saturn, Enceladus & Titan',
    status: 'Retired',
    description:
      'Official NASA 3D model of the towering deep-space flagship featuring its 4-meter white high-gain antenna dish, magnetometer boom, RTG power units, and the gold saucer-shaped Huygens Titan probe.',
    glbUrl: '/models/cassini.glb',
    glbSizeLabel: '0.36 MB NASA GLB',
    proceduralArchetype: 'cassini-orbiter',
    nasaResourceUrl: 'https://science.nasa.gov/mission/cassini/',
    attribution: 'NASA / JPL-Caltech / ESA',
    keySpecs: [
      { label: 'Height', value: '6.7 meters (22 feet)' },
      { label: 'Huygens Landing', value: 'Jan 14, 2005 on Titan' },
      { label: 'Cassini End of Mission', value: 'Sept 15, 2017 Saturn Plunge' },
    ],
  },
  {
    id: 'voyager-3d',
    name: 'Voyager 1 & 2 Interstellar Spacecraft',
    category: 'Outer Planets & Probes',
    missionOrTarget: 'Grand Tour & Interstellar Medium',
    status: 'Still Traveling',
    description:
      'Official NASA 3D model of the iconic deep-space probe featuring its 3.7-meter parabolic dish, 13-meter magnetometer boom, triple RTG nuclear boom, and Golden Record.',
    glbUrl: '/models/voyager.glb',
    glbSizeLabel: '0.24 MB NASA GLB',
    proceduralArchetype: 'voyager-probe',
    nasaResourceUrl: 'https://science.nasa.gov/mission/voyager/',
    attribution: 'NASA / JPL-Caltech',
    keySpecs: [
      { label: 'Dish Diameter', value: '3.7 meters (12 feet)' },
      { label: 'Current Distance', value: '> 24.5 billion km (166+ AU)' },
      { label: 'Time Capsule', value: 'Voyager Golden Record' },
    ],
  },
  {
    id: 'pioneer-3d',
    name: 'Pioneer 10 & 11 Deep-Space Probe',
    category: 'Outer Planets & Probes',
    missionOrTarget: 'Asteroid Belt, Jupiter, Saturn & Solar Escape',
    status: 'Still Traveling',
    description:
      'Official NASA 3D model of the spin-stabilized spacecraft dominated by a 2.74-meter dish antenna, twin SNAP-19 nuclear generators on booms, and the engraved gold Pioneer Plaque.',
    glbUrl: '/models/pioneer-10.glb',
    glbSizeLabel: '0.14 MB NASA GLB',
    proceduralArchetype: 'pioneer-probe',
    nasaResourceUrl: 'https://science.nasa.gov/mission/pioneer-10/',
    attribution: 'NASA Ames Research Center',
    keySpecs: [
      { label: 'Launch Years', value: '1972 (P10) & 1973 (P11)' },
      { label: 'Status', value: 'Silent, coasting at ~12 km/s' },
      { label: 'Message Aboard', value: 'Gold-anodized Pioneer Plaque' },
    ],
  },
  {
    id: 'new-horizons-3d',
    name: 'New Horizons Pluto & Kuiper Belt Probe',
    category: 'Outer Planets & Probes',
    missionOrTarget: 'Pluto, Charon & Arrokoth (Kuiper Belt)',
    status: 'Still Traveling',
    description:
      'Official NASA 3D model of the triangle-bodied spacecraft insulated in gold thermal blankets with a 2.1-meter high-gain dish and cylindrical black RTG power source.',
    glbUrl: '/models/new-horizons.glb',
    glbSizeLabel: '0.19 MB NASA GLB',
    proceduralArchetype: 'new-horizons',
    nasaResourceUrl: 'https://pluto.jhuapl.edu/',
    attribution: 'NASA / Johns Hopkins APL / SwRI',
    keySpecs: [
      { label: 'Launch Speed', value: '58,536 km/h (Fastest Earth departure)' },
      { label: 'Farthest Flyby', value: 'Arrokoth at 43.4 AU (2019)' },
      { label: 'Current Location', value: 'Outer Kuiper Belt (~61 AU)' },
    ],
  },
  {
    id: 'mercury-3d',
    name: 'Planet Mercury MESSENGER Globe',
    category: 'Planets',
    missionOrTarget: 'MESSENGER & BepiColombo Target',
    status: 'Celestial Body',
    description:
      'Official NASA 3D globe of the solar system’s innermost world—showing the cratered basaltic surface where NASA’s MESSENGER orbiter impacted in 2015 after running out of fuel.',
    glbUrl: '/models/mercury.glb',
    glbSizeLabel: '0.10 MB NASA GLB',
    nasaResourceUrl: 'https://science.nasa.gov/mercury/',
    attribution: 'NASA / JHUAPL / Carnegie Institution',
    keySpecs: [
      { label: 'Diameter', value: '4,879 km' },
      { label: 'Orbit Distance', value: '0.39 AU from Sun' },
      { label: 'Left-Behind Hardware', value: 'MESSENGER Impact Site (2015)' },
    ],
  },
  {
    id: 'venus-3d',
    name: 'Venus Surface Radar Globe',
    category: 'Planets',
    missionOrTarget: 'Magellan Radar Mapping & Pioneer Venus',
    status: 'Celestial Body',
    description:
      'Official NASA 3D surface globe derived from the Magellan spacecraft’s synthetic aperture radar, peering beneath Venus’s crushing sulfuric-acid clouds.',
    glbUrl: '/models/venus-surface.glb',
    glbSizeLabel: '0.13 MB NASA GLB',
    proceduralArchetype: 'mars-globe',
    nasaResourceUrl: 'https://science.nasa.gov/venus/',
    attribution: 'NASA / JPL-Caltech (Magellan)',
    keySpecs: [
      { label: 'Diameter', value: '12,104 km' },
      { label: 'Surface Temp', value: '~465 °C (Crushing CO₂ pressure)' },
      { label: 'NASA Probes', value: 'Pioneer Venus Multiprobe (1978)' },
    ],
  },
  {
    id: 'earth-3d',
    name: 'Planet Earth Blue Marble Globe',
    category: 'Planets',
    missionOrTarget: 'Homeworld & Deep Space Launchpad',
    status: 'Celestial Body',
    description:
      'Official NASA 3D globe of Earth—our launchpad for every Apollo, Mars, and Voyager mission, and the "Pale Blue Dot" photographed by Voyager 1 from 6 billion km away.',
    glbUrl: '/models/earth.glb',
    glbSizeLabel: '0.06 MB NASA GLB',
    proceduralArchetype: 'icy-moon',
    nasaResourceUrl: 'https://science.nasa.gov/earth/',
    attribution: 'NASA / GSFC Blue Marble',
    keySpecs: [
      { label: 'Diameter', value: '12,756 km' },
      { label: 'Deep Space Link', value: 'Deep Space Network (DSN)' },
      { label: 'Orbiting Observatories', value: 'Hubble, ISS & Satellites' },
    ],
  },
  {
    id: 'jupiter-3d',
    name: 'Jupiter Gas Giant Globe',
    category: 'Planets',
    missionOrTarget: 'Jovian System & Great Red Spot',
    status: 'Celestial Body',
    description:
      'Official NASA 3D banded ammonia-cloud globe of the solar system’s largest planet, where the Galileo probe and orbiter were intentionally vaporized to protect Europa.',
    glbUrl: '/models/jupiter.glb',
    glbSizeLabel: '0.04 MB NASA GLB',
    proceduralArchetype: 'jupiter-globe',
    nasaResourceUrl: 'https://science.nasa.gov/resource/jupiter-3d-model/',
    attribution: 'NASA / JPL-Caltech',
    keySpecs: [
      { label: 'Diameter', value: '139,820 km (11x Earth)' },
      { label: 'Known Moons', value: '95 moons' },
      { label: 'Rotation Period', value: '9 hours 55 minutes' },
    ],
  },
  {
    id: 'saturn-3d',
    name: 'Saturn & Ring System',
    category: 'Planets',
    missionOrTarget: 'Cassini-Huygens Kronian System',
    status: 'Celestial Body',
    description:
      'High-detail 3D model of Saturn and its expansive ice-and-rock ring system (A, B, and C rings with the Cassini Division), explored closely by Cassini for 13 years.',
    glbUrl: '/models/saturn.glb',
    glbSizeLabel: '5.22 MB GLB',
    nasaResourceUrl: 'https://science.nasa.gov/resource/saturn-3d-model/',
    attribution: 'NASA / JPL-Caltech / Custom 3D Saturn & Rings Asset',
    keySpecs: [
      { label: 'Ring Span', value: '282,000 km across' },
      { label: 'Ring Thickness', value: '~10 to 30 meters' },
      { label: 'Mean Density', value: '0.687 g/cm³ (Less than water)' },
    ],
  },
  {
    id: 'uranus-3d',
    name: 'Uranus Tilted Ice Giant Globe',
    category: 'Planets',
    missionOrTarget: 'Voyager 2 Grand Tour Flyby (1986)',
    status: 'Celestial Body',
    description:
      'Official NASA 3D globe of the pale cyan ice giant—visited only once in history by NASA’s Voyager 2 spacecraft in January 1986 and famously rolling on its 98-degree side.',
    glbUrl: '/models/uranus.glb',
    glbSizeLabel: '0.02 MB NASA GLB',
    proceduralArchetype: 'icy-moon',
    nasaResourceUrl: 'https://science.nasa.gov/resource/uranus-3d-model/',
    attribution: 'NASA / JPL-Caltech',
    keySpecs: [
      { label: 'Diameter', value: '51,118 km' },
      { label: 'Axial Tilt', value: '97.77 degrees (Sideways)' },
      { label: 'Only Visitor', value: 'Voyager 2 (Jan 24, 1986)' },
    ],
  },
  {
    id: 'neptune-3d',
    name: 'Neptune Supersonic Ice Giant Globe',
    category: 'Planets',
    missionOrTarget: 'Voyager 2 Grand Tour Flyby (1989)',
    status: 'Celestial Body',
    description:
      'Official NASA 3D globe of the deep-cobalt outermost major planet—last planetary stop of Voyager 2 in August 1989 before heading into interstellar space.',
    glbUrl: '/models/neptune.glb',
    glbSizeLabel: '0.03 MB NASA GLB',
    proceduralArchetype: 'icy-moon',
    nasaResourceUrl: 'https://science.nasa.gov/resource/neptune-3d-model/',
    attribution: 'NASA / JPL-Caltech',
    keySpecs: [
      { label: 'Diameter', value: '49,528 km' },
      { label: 'Wind Speeds', value: 'Up to 2,100 km/h (Supersonic)' },
      { label: 'Only Visitor', value: 'Voyager 2 (Aug 25, 1989)' },
    ],
  },
  {
    id: 'icy-moons-3d',
    name: 'Ocean Worlds: Europa, Titan & Enceladus',
    category: 'Moons',
    missionOrTarget: 'Outer Planet Ocean Moons',
    status: 'Celestial Body',
    description:
      'Icy moons whose subsurface oceans inspired NASA’s strict planetary protection rules—explaining why Galileo and Cassini were sacrificed rather than left in orbit.',
    proceduralArchetype: 'icy-moon',
    nasaResourceUrl: 'https://science.nasa.gov/resource/europa-3d-model/',
    attribution: 'NASA / JPL-Caltech (Europa, Titan & Enceladus Science)',
    keySpecs: [
      { label: 'Europa Overview', value: 'science.nasa.gov/jupiter/jupiter-moons/europa/' },
      { label: 'Titan Overview', value: 'science.nasa.gov/saturn/moons/titan/' },
      { label: 'Enceladus Overview', value: 'science.nasa.gov/saturn/moons/enceladus/' },
    ],
  },
  {
    id: 'hubble-3d',
    name: 'Hubble Space Telescope (Orbital Observatory)',
    category: 'Telescopes',
    missionOrTarget: 'Low Earth Orbit (1990 – Present)',
    status: 'Active',
    description:
      'Full 3D assembly of the iconic orbital observatory serviced five times by Space Shuttle astronauts, peering more than 13 billion light-years across the universe from Low Earth Orbit.',
    glbUrl: '/models/hubble-1.glb',
    glbSizeLabel: '10.9 MB GLB',
    nasaResourceUrl: 'https://science.nasa.gov/resource/hubble-space-telescope-3d-model-2/',
    attribution: 'NASA / Goddard Space Flight Center / ESA / HubbleSite',
    keySpecs: [
      { label: 'Primary Mirror', value: '2.4 meters' },
      { label: 'Orbit Altitude', value: '~520 km above Earth' },
      { label: 'Servicing Missions', value: '5 Space Shuttle Missions' },
    ],
  },
  {
    id: 'jwst-3d',
    name: 'James Webb Space Telescope',
    category: 'Telescopes',
    missionOrTarget: 'Sun-Earth Lagrange Point 2 (1.5M km)',
    status: 'Active',
    description:
      'Full realistic-color 3D assembly of the flagship infrared space observatory, featuring its 18-segment gold-coated beryllium primary mirror, secondary mirror tripod, spacecraft bus, and 5-layer sunshield.',
    glbUrl: '/models/jwst.glb',
    glbSizeLabel: '0.45 MB GLB',
    nasaResourceUrl: 'https://science.nasa.gov/mission/webb/',
    attribution: 'NASA / ESA / CSA / STScI / ESA-Webb',
    keySpecs: [
      { label: 'Primary Mirror', value: '6.5 meters (18 gold segments)' },
      { label: 'Orbit Location', value: 'Lagrange Point 2 (1.5M km)' },
      { label: 'Status', value: 'Active Infrared Science Ops' },
    ],
  },
];

export const OFFICIAL_CATALOG_LINKS = [
  {
    name: 'NASA 3D Resources Catalog',
    url: 'https://science.nasa.gov/3d-resources/',
    description: 'Official repository of printable and interactive 3D spacecraft, planets, and asteroids.',
  },
  {
    name: 'NASA Science Solar System',
    url: 'https://science.nasa.gov/solar-system/',
    description: 'Official NASA mission archives for planets, moons, and deep-space explorers.',
  },
  {
    name: 'NASA Eyes on the Solar System',
    url: 'https://eyes.nasa.gov/apps/orrery/',
    description: 'Real-time interactive 3D telemetry visualization of NASA missions.',
  },
  {
    name: 'HubbleSite Observatory Archive',
    url: 'https://science.nasa.gov/mission/hubble/',
    description: 'Official Space Telescope Science Institute portal for Hubble observations and discoveries.',
  },
  {
    name: 'ESA / Webb Space Telescope',
    url: 'https://esawebb.org/',
    description: 'Official European Space Agency James Webb Space Telescope imagery and mission updates.',
  },
  {
    name: 'NASA Planetary Science Resources',
    url: 'https://science.nasa.gov/planetary-science/resources/',
    description: 'Educational archives and mission datasets across the solar system.',
  },
  {
    name: 'NASA James Webb Space Telescope Portal',
    url: 'https://science.nasa.gov/mission/webb/',
    description: 'Official NASA observatory overview, infrared discoveries, and engineering specifications.',
  },
  {
    name: 'NASA Planetary Data System (PDS)',
    url: 'https://pds.nasa.gov/',
    description: 'Long-term archive of digital data products returned from NASA planetary missions.',
  },
];

/**
 * Direct mapping from any Solar System target or named space object to its exact 3D model entry.
 * Returns null if no 3D model exists for that target (e.g. the Sun), so the UI can show
 * a clean "3D model coming soon" message instead of opening an unrelated model.
 */
export function getModelIdForSolarTarget(targetId: string): string | null {
  switch (targetId) {
    case 'mercury':
      return 'mercury-3d';
    case 'venus':
      return 'venus-3d';
    case 'earth':
      return 'earth-3d';
    case 'moon':
      return 'moon-3d';
    case 'mars':
      return 'mars-3d';
    case 'jupiter':
      return 'jupiter-3d';
    case 'saturn':
      return 'saturn-3d';
    case 'uranus':
      return 'uranus-3d';
    case 'neptune':
      return 'neptune-3d';
    case 'voyager-1':
    case 'voyager-2':
    case 'deep-space':
      return 'voyager-3d';
    case 'pioneer-10':
    case 'pioneer-11':
      return 'pioneer-3d';
    case 'new-horizons':
      return 'new-horizons-3d';
    case 'hubble':
    case 'hubble-3d':
      return 'hubble-3d';
    case 'jwst':
    case 'webb':
    case 'jwst-3d':
      return 'jwst-3d';
    case 'apollo-lrv':
    case 'apollo-lunar-rover-lrv':
    case 'lrv':
    case 'lunar-rover':
    case 'apollo-lrv-3d':
      return 'apollo-lrv-3d';
    case 'surveyor':
    case 'surveyor-3':
    case 'surveyor-3-lander':
    case 'surveyor-3-3d':
      return 'surveyor-3-3d';
    case 'sun':
    case 'overview':
    default:
      return NASA_3D_MODELS.some((m) => m.id === targetId) ? targetId : null;
  }
}

/**
 * Pure helper to filter artifacts by destination, status, or search text.
 */
export function filterArtifacts(
  artifacts: SpaceArtifact[],
  options: {
    destinationId?: DestinationId | 'all';
    statusFilter?: HardwareStatus | 'all' | 'silent' | 'traveling';
    searchQuery?: string;
  }
): SpaceArtifact[] {
  const { destinationId = 'all', statusFilter = 'all', searchQuery = '' } = options;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return artifacts.filter((item) => {
    if (destinationId !== 'all' && item.destinationId !== destinationId) {
      return false;
    }

    if (statusFilter === 'silent') {
      const isSilentHardware =
        item.status === 'Dormant' ||
        item.status === 'Retired' ||
        item.status === 'Impact Site' ||
        item.id === 'pioneer-10-11';
      if (!isSilentHardware) {
        return false;
      }
    } else if (statusFilter === 'traveling') {
      if (item.status !== 'Still Traveling') {
        return false;
      }
    } else if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const hay = `${item.name} ${item.mission} ${item.hardwareType} ${item.locationOrTrajectory} ${item.purpose} ${item.story}`.toLowerCase();
      if (!hay.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

export interface GhostMissionEntry {
  artifact: SpaceArtifact;
  ghostStatus: 'Dormant' | 'Retired';
  silenceYearLabel: string;
  lastTransmissionNote: string;
}

/**
 * Pure helper returning the curated 'Ghost Missions' gallery entries featuring retired
 * or dormant NASA hardware (including the Opportunity rover and Pioneer 10 & 11 probes).
 */
export function getGhostMissions(
  artifacts: SpaceArtifact[],
  statusFilter: 'all' | 'Dormant' | 'Retired' = 'all'
): GhostMissionEntry[] {
  const ghostCandidates = artifacts.filter(
    (a) =>
      a.status === 'Dormant' ||
      a.status === 'Retired' ||
      a.status === 'Impact Site' ||
      a.id === 'pioneer-10-11'
  );

  const entries: GhostMissionEntry[] = ghostCandidates.map((artifact) => {
    const ghostStatus: 'Dormant' | 'Retired' =
      artifact.status === 'Dormant' || artifact.id === 'pioneer-10-11' ? 'Dormant' : 'Retired';

    const silenceYearMatch = artifact.endDate?.match(/\b(19\d{2}|20\d{2})\b/);
    const silenceYearLabel = silenceYearMatch
      ? `SILENT SINCE ${silenceYearMatch[1]}`
      : `LEGACY SINCE ${artifact.year}`;

    return {
      artifact,
      ghostStatus,
      silenceYearLabel,
      lastTransmissionNote: artifact.endDate || `Mission completed (${artifact.year})`,
    };
  });

  if (statusFilter === 'all') {
    return entries;
  }
  return entries.filter((entry) => entry.ghostStatus === statusFilter);
}

/**
 * Pure helper to sort artifacts chronologically by mission year.
 */
export function getChronologicalTimeline(artifacts: SpaceArtifact[]): SpaceArtifact[] {
  return [...artifacts].sort((a, b) => a.year - b.year);
}

/**
 * Validates whether a user question pertains to space or astronomy topics for Space Explorer AI,
 * rejecting non-space requests (coding, essays, crypto, medical/legal/political advice, sports, shopping).
 */
export function isSpaceTopicQuery(question: string): boolean {
  const q = question.trim().toLowerCase();
  if (!q) return false;

  const prohibitedPatterns = [
    /\b(write an essay|write my homework|write a resume|cover letter|write an email|write a story|creative fiction)\b/i,
    /\b(generate code|write python|write javascript|react component|html code|sql query|leetcode|compile)\b/i,
    /\b(stock market|crypto|bitcoin|mortgage|tax advice|investment advice|financial advice)\b/i,
    /\b(medical advice|diagnose|symptom|prescription|dosage|doctor|legal advice|lawsuit|attorney)\b/i,
    /\b(election|political party|president vote|democrat|republican|senator)\b/i,
    /\b(buy shoes|order pizza|book a flight|recipe for cookies|bake a cake|soccer score|nba finals|shakespeare|taylor swift)\b/i,
  ];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(q)) {
      return false;
    }
  }

  const spaceKeywords = [
    'nasa',
    'esa',
    'jaxa',
    'isro',
    'space',
    'astronomy',
    'astrophysics',
    'cosmology',
    'universe',
    'cosmos',
    'big bang',
    'dark matter',
    'dark energy',
    'black hole',
    'event horizon',
    'singularity',
    'neutron star',
    'pulsar',
    'quasar',
    'supernova',
    'nebula',
    'nebulae',
    'galaxy',
    'galaxies',
    'milky way',
    'andromeda',
    'exoplanet',
    'star',
    'stars',
    'comet',
    'comets',
    'asteroid',
    'asteroids',
    'meteor',
    'meteorite',
    'rocket',
    'rockets',
    'launch',
    'telescope',
    'telescopes',
    'observatory',
    'astronaut',
    'astronauts',
    'cosmonaut',
    'iss',
    'space station',
    'artemis',
    'shuttle',
    'moon',
    'moons',
    'lunar',
    'mars',
    'martian',
    'jupiter',
    'saturn',
    'ring',
    'rings',
    'cassini division',
    'titan',
    'europa',
    'enceladus',
    'ganymede',
    'callisto',
    'io',
    'pluto',
    'arrokoth',
    'kuiper',
    'oort cloud',
    'solar system',
    'planet',
    'planets',
    'dwarf planet',
    'gas giant',
    'ice giant',
    'rover',
    'lander',
    'orbiter',
    'probe',
    'spacecraft',
    'descent stage',
    'apollo',
    'eagle',
    'buggy',
    'lrv',
    'lunar roving',
    'surveyor',
    'retroreflector',
    'laser',
    'opportunity',
    'oppy',
    'spirit',
    'perseverance',
    'percy',
    'ingenuity',
    'ginny',
    'helicopter',
    'insight',
    'marsquake',
    'seismometer',
    'maven',
    'mro',
    'curiosity',
    'viking',
    'voyager',
    'golden record',
    'pioneer',
    'plaque',
    'new horizons',
    'cassini',
    'huygens',
    'juno',
    'galileo',
    'webb',
    'jwst',
    'hubble',
    'spitzer',
    'kepler',
    'tess',
    'chandra',
    'lagrange',
    'l2',
    'infrared',
    'discarded',
    'left behind',
    'equipment',
    'hardware',
    'artifact',
    'dormant',
    'retired',
    'active',
    'traveling',
    'interstellar',
    'heliopause',
    'heliosphere',
    'solar wind',
    'gravity assist',
    'gravity',
    'planetary protection',
    'mission',
    'science',
    'discover',
    'orbit',
    'crater',
    'jezero',
    'endeavour',
    'tranquility',
    'dust storm',
    'rtg',
    'solar panel',
    '3d model',
    'sun',
    'solar',
    'mercury',
    'venus',
    'earth',
    'uranus',
    'neptune',
    'ceres',
    'vesta',
    'bennu',
    'psyche',
    'lucy',
    'osiris',
    'dawn',
    'armstrong',
    'aldrin',
    'light year',
    'light-year',
    'parsec',
    'au',
    'eclipse',
    'aurora',
    'red giant',
    'white dwarf',
    'habitable zone',
  ];

  const contextualPhrases = [
    'what is this',
    'tell me more',
    'more detail',
    'in more detail',
    'explain further',
    'go deeper',
    'elaborate',
    'why did they leave',
    'why was it left',
    'is it still working',
    'still active',
    'where is it now',
    'what did it discover',
    'what did it find',
    'how old',
    'when did it launch',
    'when did it land',
  ];

  return (
    spaceKeywords.some((kw) => q.includes(kw)) ||
    contextualPhrases.some((phrase) => q.includes(phrase))
  );
}

/**
 * Deterministic educational knowledge synthesizer & fallback for Space Explorer AI.
 * Covers all astronomy/space topics accurately and concisely, supports follow-up detail requests,
 * and responds politely for off-topic queries.
 */
export function buildLocalExplorerGuideAnswer(
  question: string,
  context?: {
    destinationId?: DestinationId;
    artifactId?: string;
    lastTopicText?: string;
  }
): {
  reply: string;
  sources: { title: string; url: string }[];
  relatedArtifacts: string[];
  isRefusal: boolean;
} {
  if (!isSpaceTopicQuery(question)) {
    return {
      reply: STRICT_REFUSAL_MESSAGE,
      sources: [],
      relatedArtifacts: [],
      isRefusal: true,
    };
  }

  const q = question.toLowerCase();
  const wantsMoreDetail =
    q.includes('more detail') ||
    q.includes('tell me more') ||
    q.includes('elaborate') ||
    q.includes('go deeper') ||
    q.includes('explain further');

  // Follow-up detail requests: enrich using the prior conversation turn if available
  const effectiveQuery =
    wantsMoreDetail && context?.lastTopicText ? `${context.lastTopicText.toLowerCase()} ${q}` : q;

  // 1. Saturn's rings
  if (effectiveQuery.includes('saturn') && effectiveQuery.includes('ring')) {
    return {
      reply: wantsMoreDetail
        ? 'Saturn’s rings stretch about 282,000 km across yet are astonishingly thin—typically only 10 to 30 meters thick! They are made of billions of pieces of water ice and rocky dust ranging from microscopic grains to house-sized boulders, sculpted by shepherd moons and resonance gaps like the 4,800-km-wide Cassini Division. You can also inspect the 3D Saturn & Ring System model directly in the 3D viewer.'
        : 'Saturn’s rings are made of billions of chunks of water ice and rock—from tiny dust grains to boulders as large as houses—orbiting the planet at high speed. Although the main ring system spans roughly 282,000 km wide, it is remarkably thin, averaging just 10 to 30 meters thick! Want more detail about the Cassini Division or how the rings formed?',
      sources: [
        { title: 'NASA Science: Saturn', url: 'https://science.nasa.gov/saturn/' },
        { title: 'NASA Cassini-Huygens Mission', url: 'https://science.nasa.gov/mission/cassini/' },
      ],
      relatedArtifacts: ['cassini-huygens'],
      isRefusal: false,
    };
  }

  // 2. James Webb Space Telescope
  if (effectiveQuery.includes('webb') || effectiveQuery.includes('jwst')) {
    return {
      reply: wantsMoreDetail
        ? 'Orbiting 1.5 million km from Earth at Sun-Earth Lagrange Point 2 (L2), Webb uses a 6.5-meter gold-coated beryllium mirror of 18 hexagonal segments shielded from Sun heat by a 5-layer Kapton sunshield. Detecting faint infrared light lets Webb pierce dusty stellar nurseries, measure exoplanet atmospheres, and see galaxies from just a few hundred million years after the Big Bang.'
        : 'The James Webb Space Telescope (JWST) is NASA, ESA, and CSA’s flagship infrared space observatory launched in December 2021. Positioned 1.5 million kilometers away at Lagrange Point 2, its 6.5-meter gold-coated segmented mirror captures faint infrared light from the earliest galaxies, star-forming nebulae, and exoplanet atmospheres. Ask if you want more detail on its 5-layer sunshield or 3D model!',
      sources: [
        { title: 'NASA James Webb Space Telescope', url: 'https://science.nasa.gov/mission/webb/' },
        { title: 'ESA / Webb Observatory', url: 'https://esawebb.org/' },
      ],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  // 3. Hubble Space Telescope
  if (effectiveQuery.includes('hubble')) {
    return {
      reply: wantsMoreDetail
        ? 'Orbiting ~520 km above Earth, Hubble avoids atmospheric blur using a 2.4-meter primary mirror that channels ultraviolet, visible, and near-infrared light to cameras and spectrographs. Serviced five times by Space Shuttle crews between 1993 and 2009, Hubble helped pinpoint the universe’s expansion rate, imaged galaxies over 13 billion light-years away, and remains active today.'
        : 'The Hubble Space Telescope orbits roughly 520 km above Earth, free from atmospheric blur, gathering crisp ultraviolet, visible, and near-infrared light with its 2.4-meter mirror. Launched in 1990 and upgraded five times by Space Shuttle astronauts, Hubble revolutionized astronomy—from measuring how fast the universe is expanding to capturing the famous Deep Field images.',
      sources: [
        { title: 'NASA Hubble Mission', url: 'https://science.nasa.gov/mission/hubble/' },
        { title: 'HubbleSite Official Archive', url: 'https://science.nasa.gov/mission/hubble/' },
      ],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  // 4. Black holes
  if (effectiveQuery.includes('black hole') || effectiveQuery.includes('event horizon')) {
    return {
      reply: wantsMoreDetail
        ? 'Stellar-mass black holes form when massive stars exhaust their nuclear fuel and collapse in a supernova, while supermassive black holes millions or billions of times the Sun’s mass anchor galaxy centers like Sagittarius A* in the Milky Way. Inside the event horizon, spacetime bends so steeply that not even light reaches escape velocity; astronomers study them via X-rays from superheated accretion disks and gravitational waves.'
        : 'A black hole is a region of space where matter is packed so densely that gravity is strong enough to prevent anything—even light—from escaping once it crosses the boundary called the event horizon. Most form when giant stars collapse at the end of their lives, while supermassive black holes sit at the hearts of galaxies like our Milky Way. Ask for more detail if you’d like to explore how astronomers detect them!',
      sources: [{ title: 'NASA Science: Universe & Black Holes', url: 'https://science.nasa.gov/solar-system/' }],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  // 5. How far is Mars from Earth?
  if (
    effectiveQuery.includes('mars') &&
    (effectiveQuery.includes('far') || effectiveQuery.includes('distance') || effectiveQuery.includes('km') || effectiveQuery.includes('miles'))
  ) {
    return {
      reply: wantsMoreDetail
        ? 'Because Earth and Mars follow elliptical orbits at different speeds, their separation varies from about 54.6 million km at closest approach to 401 million km when on opposite sides of the Sun. Radio signals take 3 to 22 minutes one-way, and spacecraft launched every ~26 months during optimal alignment take 7 to 9 months to arrive.'
        : 'Because both Earth and Mars orbit the Sun along different paths, the distance between them constantly changes! On average Mars is about 225 million km (140 million miles) from Earth, ranging from ~54.6 million km at closest approach up to ~401 million km when on opposite sides of the Sun—a 7 to 9 month journey for spacecraft.',
      sources: [{ title: 'NASA Science: Mars', url: 'https://science.nasa.gov/mars/' }],
      relatedArtifacts: ['perseverance-rover', 'opportunity-rover', 'ingenuity-helicopter'],
      isRefusal: false,
    };
  }

  // General Astronomy topics: nebulae, stars, galaxies, exoplanets, comets, asteroids, rockets, cosmology
  if (effectiveQuery.includes('nebula')) {
    return {
      reply:
        'A nebula is a vast interstellar cloud of glowing gas and cosmic dust—often stretching tens or hundreds of light-years across. Emission nebulae like the Orion Nebula act as stellar nurseries where new stars are born, while planetary nebulae and supernova remnants are glowing shells cast off by dying stars.',
      sources: [
        { title: 'HubbleSite Official Archive', url: 'https://science.nasa.gov/mission/hubble/' },
        { title: 'ESA / Webb Observatory', url: 'https://esawebb.org/' },
      ],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('galaxy') || effectiveQuery.includes('galaxies') || effectiveQuery.includes('milky way') || effectiveQuery.includes('andromeda')) {
    return {
      reply:
        'A galaxy is an enormous gravitationally bound system of stars, star clusters, gas, dust, and dark matter. Earth and our Solar System sit in a spiral arm of the Milky Way galaxy—which holds 100 to 400 billion stars—among hundreds of billions of galaxies scattered across the observable universe.',
      sources: [
        { title: 'HubbleSite Official Archive', url: 'https://science.nasa.gov/mission/hubble/' },
        { title: 'ESA / Webb Observatory', url: 'https://esawebb.org/' },
      ],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('exoplanet')) {
    return {
      reply:
        'An exoplanet is any planet orbiting a star beyond our Sun! Astronomers have confirmed over 5,500 exoplanets—ranging from scorching lava worlds and puffy gas giants to rocky Earth-sized planets inside habitable zones where liquid water could exist, studied in detail by Kepler, TESS, Hubble, and JWST.',
      sources: [{ title: 'ESA / Webb Observatory', url: 'https://esawebb.org/' }],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('comet') || effectiveQuery.includes('asteroid')) {
    return {
      reply:
        'Asteroids are rocky or metallic leftovers from the Solar System’s formation—most orbiting in the Asteroid Belt between Mars and Jupiter—while comets are icy bodies of frozen water, gases, and dust from the Kuiper Belt and Oort Cloud that sprout glowing tails when warmed near the Sun.',
      sources: [{ title: 'NASA Science Solar System', url: 'https://science.nasa.gov/solar-system/' }],
      relatedArtifacts: ['new-horizons-probe', 'pioneer-10-11'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('rocket') || effectiveQuery.includes('astronaut') || effectiveQuery.includes('iss') || effectiveQuery.includes('space station')) {
    return {
      reply:
        'Rockets escape Earth’s gravity by burning propellant and throwing high-speed exhaust downward (Newton’s third law), accelerating spacecraft past ~28,000 km/h to enter orbit or ~40,000 km/h to reach the Moon and planets. Astronauts live and conduct microgravity science aboard the International Space Station roughly 400 km above Earth.',
      sources: [{ title: 'NASA Apollo 11 Mission', url: 'https://www.nasa.gov/mission/apollo-11/' }],
      relatedArtifacts: ['apollo-11-eagle-descent'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('star') || effectiveQuery.includes('supernova') || effectiveQuery.includes('sun')) {
    return {
      reply:
        'Stars are giant spheres of hot plasma powered by nuclear fusion—crushing hydrogen into helium in their cores and releasing light and heat. Our Sun is an average yellow dwarf star, while massive blue stars burn fast and end in dramatic supernova explosions that forge heavy elements like iron and gold.',
      sources: [{ title: 'NASA Science Solar System', url: 'https://science.nasa.gov/solar-system/' }],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('cosmology') || effectiveQuery.includes('big bang') || effectiveQuery.includes('universe') || effectiveQuery.includes('dark matter') || effectiveQuery.includes('dark energy')) {
    return {
      reply:
        'Modern cosmology shows the universe began about 13.8 billion years ago in the hot, dense Big Bang and has been expanding ever since. Galaxies we see today are held together by unseen dark matter, while a mysterious force called dark energy is accelerating cosmic expansion.',
      sources: [{ title: 'HubbleSite Official Archive', url: 'https://science.nasa.gov/mission/hubble/' }],
      relatedArtifacts: [],
      isRefusal: false,
    };
  }

  // Specific mission & hardware queries
  if (effectiveQuery.includes('opportunity') || effectiveQuery.includes('oppy') || effectiveQuery.includes('blueberr')) {
    const oppy = ARTIFACTS.find((a) => a.id === 'opportunity-rover')!;
    return {
      reply:
        'Opportunity ("Oppy") landed on Mars in January 2004 for a planned 90-day mission, yet explored for nearly 15 years! It discovered tiny iron-rich mineral spheres nicknamed "blueberries" (hematite) and veins of gypsum in Endeavour Crater—proving that ancient Mars once had liquid, drinkable water. A planet-wide dust storm in 2018 covered its solar panels and put it into a permanent sleep after driving 45.16 km.',
      sources: [{ title: oppy.nasaSourceTitle, url: oppy.nasaSourceUrl }],
      relatedArtifacts: ['opportunity-rover', 'ingenuity-helicopter', 'insight-lander'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('surveyor')) {
    const surveyor = ARTIFACTS.find((a) => a.id === 'surveyor-3-lander')!;
    return {
      reply:
        'Surveyor 3 was a robotic NASA lunar lander that touched down inside a crater in Oceanus Procellarum on April 20, 1967. It tested lunar soil strength with a mechanical scoop and sent back 6,315 images before shutting down. In November 1969, Apollo 12 astronauts Pete Conrad and Alan Bean landed 163 meters away and walked over to inspect Surveyor 3—bringing its camera back to Earth.',
      sources: [{ title: surveyor.nasaSourceTitle, url: surveyor.nasaSourceUrl }],
      relatedArtifacts: ['surveyor-3-lander', 'apollo-11-eagle-descent'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('lunar roving') || effectiveQuery.includes('moon buggy') || effectiveQuery.includes('lrv')) {
    const lrv = ARTIFACTS.find((a) => a.id === 'apollo-lunar-rover-lrv')!;
    return {
      reply:
        'The Apollo Lunar Roving Vehicles ("Moon Buggies") were lightweight 210 kg electric four-wheel cars carried folded inside the Apollo 15, 16, and 17 Lunar Modules. Driven by four electric hub motors and woven wire-mesh tires, they let astronauts travel up to 35 km across lunar mountains and valleys before remaining parked forever on the Moon.',
      sources: [{ title: lrv.nasaSourceTitle, url: lrv.nasaSourceUrl }],
      relatedArtifacts: ['apollo-lunar-rover-lrv', 'apollo-11-eagle-descent', 'surveyor-3-lander'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('apollo') || (effectiveQuery.includes('moon') && (effectiveQuery.includes('leave') || effectiveQuery.includes('left') || effectiveQuery.includes('why')))) {
    const eagle = ARTIFACTS.find((a) => a.id === 'apollo-11-eagle-descent')!;
    const retro = ARTIFACTS.find((a) => a.id === 'apollo-retroreflectors')!;
    return {
      reply:
        'Apollo astronauts left equipment on the Moon for two big reasons: weight and long-term science! Every kilogram left behind (like the heavy four-legged Descent Stages and electric Moon Buggies) meant astronauts could bring more priceless Moon rocks back to Earth without needing extra rocket fuel. They also left behind scientific instruments like the Lunar Laser Ranging Retroreflectors, which astronomers on Earth still bounce lasers off today!',
      sources: [
        { title: eagle.nasaSourceTitle, url: eagle.nasaSourceUrl },
        { title: retro.nasaSourceTitle, url: retro.nasaSourceUrl },
      ],
      relatedArtifacts: ['apollo-11-eagle-descent', 'apollo-lunar-rover-lrv', 'surveyor-3-lander'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('voyager') || effectiveQuery.includes('interstellar') || effectiveQuery.includes('golden record')) {
    const voyager = ARTIFACTS.find((a) => a.id === 'voyager-1-2')!;
    return {
      reply:
        'Voyager 1 and Voyager 2 are currently in interstellar space—the region between the stars beyond our Sun’s protective bubble (the heliopause)! Launched in 1977, Voyager 1 is now over 24.5 billion kilometers (166+ AU) from Earth, making it the farthest human-made object in history. Both spacecraft are still communicating with NASA’s Deep Space Network and carry Golden Records filled with Earth sounds, music, and greetings.',
      sources: [{ title: voyager.nasaSourceTitle, url: voyager.nasaSourceUrl }],
      relatedArtifacts: ['voyager-1-2', 'pioneer-10-11', 'new-horizons-probe'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('descent stage')) {
    const eagle = ARTIFACTS.find((a) => a.id === 'apollo-11-eagle-descent')!;
    return {
      reply:
        'A descent stage is the lower half of a two-part lander containing the landing legs, shock absorbers, and braking rocket engine used to touch down safely on a moon or planet. On the Apollo Lunar Module, once astronauts finished their moonwalk, the top half (the ascent stage) used the descent stage as a launchpad to blast back into orbit, leaving the gold-foil base behind on the Moon.',
      sources: [{ title: eagle.nasaSourceTitle, url: eagle.nasaSourceUrl }],
      relatedArtifacts: ['apollo-11-eagle-descent', 'perseverance-rover'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('active') && effectiveQuery.includes('mars')) {
    const percy = ARTIFACTS.find((a) => a.id === 'perseverance-rover')!;
    return {
      reply:
        'On the Martian surface today, NASA’s Perseverance rover (in Jezero Crater) and Curiosity rover (in Gale Crater) are actively exploring, powered by nuclear radioisotope generators that aren’t stopped by dust storms! High above Mars, orbiters like Mars Reconnaissance Orbiter (MRO), MAVEN, and Mars Odyssey also remain active, studying the atmosphere and beaming rover data back to Earth.',
      sources: [
        { title: percy.nasaSourceTitle, url: percy.nasaSourceUrl },
        { title: 'NASA Mars Exploration Program', url: 'https://science.nasa.gov/mars/' },
      ],
      relatedArtifacts: ['perseverance-rover', 'ingenuity-helicopter', 'insight-lander'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('ingenuity') || effectiveQuery.includes('helicopter') || effectiveQuery.includes('ginny')) {
    const ginny = ARTIFACTS.find((a) => a.id === 'ingenuity-helicopter')!;
    return {
      reply:
        'Ingenuity ("Ginny") was a 1.8 kg solar-powered helicopter that made the first powered, controlled flight on another planet on April 19, 2021! Designed for just 5 test flights, it flew 72 times over nearly three years, scouting ahead for the Perseverance rover. In January 2024, a hard landing on a sand dune damaged its rotor blades, retiring it from flight—though it still rests in Jezero Crater.',
      sources: [{ title: ginny.nasaSourceTitle, url: ginny.nasaSourceUrl }],
      relatedArtifacts: ['ingenuity-helicopter', 'perseverance-rover'],
      isRefusal: false,
    };
  }

  if (effectiveQuery.includes('cassini') || effectiveQuery.includes('huygens') || effectiveQuery.includes('saturn') || effectiveQuery.includes('titan')) {
    const cassini = ARTIFACTS.find((a) => a.id === 'cassini-huygens')!;
    return {
      reply:
        'The Cassini-Huygens mission explored Saturn for 13 years! In 2005, it dropped the saucer-shaped Huygens lander onto Saturn’s largest moon, Titan—still the farthest landing from Earth ever achieved. When Cassini discovered warm water plumes on Enceladus that could host life, NASA intentionally steered Cassini into Saturn’s atmosphere in 2017 so it could never crash into and contaminate those icy moons.',
      sources: [{ title: cassini.nasaSourceTitle, url: cassini.nasaSourceUrl }],
      relatedArtifacts: ['cassini-huygens', 'galileo-jupiter-probe'],
      isRefusal: false,
    };
  }

  // Match other planets cleanly
  const planetBlurbs: Record<string, { reply: string; url: string; title: string }> = {
    mercury: {
      title: 'NASA Science: Mercury',
      url: 'https://science.nasa.gov/mercury/',
      reply:
        'Mercury is the smallest and innermost planet, zipping around the Sun every 88 Earth days. Without a thick atmosphere, daytime temperatures hit ~430 °C while nights plunge to -180 °C. NASA’s MESSENGER orbiter mapped Mercury for four years before impacting its surface in 2015.',
    },
    venus: {
      title: 'NASA Science: Venus',
      url: 'https://science.nasa.gov/venus/',
      reply:
        'Venus is Earth’s rocky twin in size, yet wrapped in a thick carbon-dioxide atmosphere and sulfuric acid clouds that create a runaway greenhouse effect—making its surface ~465 °C, hot enough to melt lead! NASA’s Magellan spacecraft radar-mapped its volcanic plains.',
    },
    uranus: {
      title: 'NASA Resource: Uranus',
      url: 'https://science.nasa.gov/resource/uranus-3d-model/',
      reply:
        'Uranus is a pale cyan ice giant spinning almost completely on its side with a 98-degree axial tilt—likely from a giant ancient collision. Voyager 2 is the only spacecraft ever to visit Uranus, flying past in January 1986.',
    },
    neptune: {
      title: 'NASA Resource: Neptune',
      url: 'https://science.nasa.gov/resource/neptune-3d-model/',
      reply:
        'Neptune is the farthest major planet at 30 AU from the Sun, whipped by the fastest planetary winds in the Solar System (over 2,000 km/h). Voyager 2 visited Neptune and its geyser-active moon Triton in August 1989.',
    },
    pluto: {
      title: 'New Horizons Pluto Mission',
      url: 'https://science.nasa.gov/dwarf-planets/pluto/',
      reply:
        'Pluto is a dwarf planet in the icy Kuiper Belt beyond Neptune. In 2015, NASA’s New Horizons spacecraft revealed towering water-ice mountains and a vast nitrogen glacier shaped like a heart (Tombaugh Regio).',
    },
  };

  for (const [key, info] of Object.entries(planetBlurbs)) {
    if (effectiveQuery.includes(key)) {
      return {
        reply: info.reply,
        sources: [{ title: info.title, url: info.url }],
        relatedArtifacts: [],
        isRefusal: false,
      };
    }
  }

  // Match any artifact by name or context
  const matchedArtifact =
    ARTIFACTS.find((a) => effectiveQuery.includes(a.name.toLowerCase()) || effectiveQuery.includes(a.id.replace(/-/g, ' '))) ||
    (context?.artifactId ? ARTIFACTS.find((a) => a.id === context.artifactId) : undefined);

  if (matchedArtifact) {
    return {
      reply: `${matchedArtifact.name} (${matchedArtifact.mission}) is currently classified as ${matchedArtifact.status} at ${matchedArtifact.locationOrTrajectory}. ${matchedArtifact.purpose} Why it remains in space: ${matchedArtifact.whyLeftBehind}`,
      sources: [{ title: matchedArtifact.nasaSourceTitle, url: matchedArtifact.nasaSourceUrl }],
      relatedArtifacts: ARTIFACTS.filter(
        (a) => a.destinationId === matchedArtifact.destinationId && a.id !== matchedArtifact.id
      )
        .slice(0, 2)
        .map((a) => a.id),
      isRefusal: false,
    };
  }

  const dest =
    DESTINATIONS.find((d) => effectiveQuery.includes(d.name.toLowerCase()) || effectiveQuery.includes(d.id)) ||
    (context?.destinationId ? DESTINATIONS.find((d) => d.id === context.destinationId) : DESTINATIONS[0]);

  if (dest) {
    const destArtifacts = ARTIFACTS.filter((a) => a.destinationId === dest.id);
    return {
      reply: `In our exploration of ${dest.name} (${dest.subtitle}), ${dest.summary} ${dest.scienceContext} Featured hardware here includes ${destArtifacts.map((a) => a.name).join(', ')}.`,
      sources: [{ title: `NASA Science: ${dest.name}`, url: dest.nasaUrl }],
      relatedArtifacts: destArtifacts.map((a) => a.id),
      isRefusal: false,
    };
  }

  return {
    reply:
      'I’m Space Explorer AI! From Saturn’s icy rings and black holes to the Hubble and James Webb Space Telescopes or NASA’s rovers and Voyager probes across the Solar System, ask me anything about space and astronomy—or ask for more detail anytime.',
    sources: [{ title: 'NASA Science Solar System Exploration', url: 'https://science.nasa.gov/solar-system/' }],
    relatedArtifacts: ['apollo-11-eagle-descent', 'opportunity-rover', 'voyager-1-2'],
    isRefusal: false,
  };
}
