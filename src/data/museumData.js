// Node coordinates match the SVG floor plan drawn in NHMMap.jsx.
// Ground floor viewport: x 60–950, y 120–470.
// Zone boundaries: Orange 60–290 | Blue 290–560 | Green 560–760 | Red 760–950.

export const NODES = [
  // ORANGE ZONE – west side, ground floor
  { id: "zoology_spirit", name: "Zoology Spirit Building", zone: "orange", floor: "G", x: 175, y: 178, desc: "Zoology spirit collections", dur: 15 },
  { id: "attenborough",   name: "Attenborough Studio",    zone: "orange", floor: "G", x: 130, y: 315, desc: "Nature talks and film screenings", dur: 20 },
  { id: "cocoon",         name: "Cocoon",                 zone: "orange", floor: "G", x: 200, y: 218, desc: "See scientific research up close inside the Cocoon", dur: 25 },
  { id: "darwin_centre",  name: "Darwin Centre",          zone: "orange", floor: "G", x: 175, y: 425, desc: "Scientists at work, millions of specimens", dur: 20 },
  { id: "wildlife_garden",name: "Wildlife Garden",        zone: "orange", floor: "Out", x: 110, y: 548, desc: "Outdoor British wildlife habitats (seasonal)", dur: 15 },

  // BLUE ZONE – central, ground floor
  { id: "dinosaurs",       name: "Dinosaurs",                   zone: "blue", floor: "G", x: 355, y: 178, desc: "Animatronic T. rex and fossil displays", dur: 25 },
  { id: "fishes",          name: "Fishes, Amphibians & Reptiles",zone: "blue", floor: "G", x: 355, y: 268, desc: "Aquatic life from frogs to salamanders", dur: 15 },
  { id: "human_biology",   name: "Human Biology",               zone: "blue", floor: "G", x: 490, y: 178, desc: "Interactive human body exhibits", dur: 15 },
  { id: "images_of_nature",name: "Images of Nature",            zone: "blue", floor: "G", x: 455, y: 268, desc: "Nature artwork and photography", dur: 10 },
  { id: "jerwood",         name: "Jerwood Gallery",             zone: "blue", floor: "G", x: 355, y: 362, desc: "Rotating exhibitions and special displays", dur: 10 },
  { id: "mammals",         name: "Mammals",                     zone: "blue", floor: "G", x: 510, y: 340, desc: "Mammal specimens from around the world", dur: 15 },
  { id: "hintze_hall",     name: "Hintze Hall (Blue Whale)",    zone: "blue", floor: "G", x: 475, y: 422, desc: "Iconic Blue Whale, the Museum's grand central hall", dur: 20 },
  { id: "marine_inverts",  name: "Marine Invertebrates",        zone: "blue", floor: "G", x: 355, y: 448, desc: "Sea creatures without backbones", dur: 12 },

  // GREEN ZONE – east-centre, ground floor
  { id: "birds",          name: "Birds",                  zone: "green", floor: "G",  x: 612, y: 170, desc: "Bird specimens and avian biology", dur: 12 },
  { id: "creepy_crawlies",name: "Creepy Crawlies",        zone: "green", floor: "G",  x: 612, y: 262, desc: "Insects, spiders and arthropods", dur: 15 },
  { id: "fossil_marine",  name: "Fossil Marine Reptiles", zone: "green", floor: "G",  x: 612, y: 354, desc: "Ichthyosaurs, plesiosaurs, ancient marine reptiles", dur: 12 },
  { id: "waterhouse",     name: "Waterhouse Gallery",     zone: "green", floor: "G",  x: 612, y: 435, desc: "Temporary exhibitions space", dur: 10 },
  { id: "east_pavilion",  name: "East Pavilion",          zone: "green", floor: "G",  x: 700, y: 295, desc: "Exhibition space in the east wing", dur: 10 },
  { id: "investigate",    name: "Investigate Centre",     zone: "green", floor: "LG", x: 700, y: 445, desc: "Hands-on science for families (lower ground)", dur: 20 },
  { id: "minerals",       name: "Minerals",               zone: "green", floor: "F1", x: 635, y: 178, desc: "Mineral and crystal specimens (Floor 1, via lift)", dur: 15 },
  { id: "treasures",      name: "Treasures",              zone: "green", floor: "F1", x: 685, y: 148, desc: "22 extraordinary objects (Floor 1, via lift)", dur: 12 },
  { id: "the_vault",      name: "The Vault",              zone: "green", floor: "F1", x: 585, y: 148, desc: "Rare gems, meteorites (Floor 1, via lift)", dur: 10 },
  { id: "giant_sequoia",  name: "Giant Sequoia",          zone: "green", floor: "F2", x: 635, y: 108, desc: "Giant sequoia cross-section (Floor 2, via lift)", dur: 5 },

  // RED ZONE – far east
  { id: "earth_hall",      name: "Earth Hall",             zone: "red", floor: "G",  x: 855, y: 295, desc: "Escalator through a giant globe", dur: 8 },
  { id: "human_evolution", name: "Human Evolution",        zone: "red", floor: "G",  x: 808, y: 205, desc: "The story of human evolution", dur: 15 },
  { id: "lasting_imp",     name: "Lasting Impressions",    zone: "red", floor: "G",  x: 808, y: 388, desc: "Touchable specimens, interactive", dur: 10 },
  { id: "earths_treasury", name: "Earth's Treasury",       zone: "red", floor: "F1", x: 875, y: 235, desc: "Gemstones and minerals (Floor 1)", dur: 12 },
  { id: "from_beginning",  name: "From the Beginning",     zone: "red", floor: "F1", x: 875, y: 310, desc: "Earth's formation to today (Floor 1)", dur: 15 },
  { id: "volcanoes",       name: "Volcanoes & Earthquakes",zone: "red", floor: "F2", x: 875, y: 165, desc: "Earthquake simulator, eruptions (Floor 2)", dur: 15 },
  { id: "restless_surface",name: "Restless Surface",       zone: "red", floor: "F2", x: 875, y: 385, desc: "Wind, water and ice shaping Earth (Floor 2)", dur: 10 },

  // ENTRANCES & KEY NODES
  { id: "entrance_cromwell",   name: "Cromwell Road Entrance",   zone: "entrance", floor: "G", x: 490, y: 555, desc: "Main entrance (step-free)", dur: 0 },
  { id: "entrance_queens",     name: "Queen's Gate Entrance",    zone: "entrance", floor: "G", x: 55,  y: 295, desc: "Accessible entrance (west)", dur: 0 },
  { id: "entrance_exhibition", name: "Exhibition Road Entrance", zone: "entrance", floor: "G", x: 950, y: 295, desc: "Accessible entrance (east)", dur: 0 },
  { id: "lift_hintze",         name: "Lift (near Hintze Hall)",  zone: "facility", floor: "G", x: 556, y: 422, desc: "Access to Floors 1, 2 and lower ground", dur: 0 },

  // FACILITIES
  { id: "central_cafe", name: "Central Café",        zone: "facility", floor: "G", x: 340, y: 142, desc: "Café near dinosaurs gallery", dur: 0 },
  { id: "trex_grill",   name: "T. rex Grill",        zone: "facility", floor: "G", x: 480, y: 142, desc: "Restaurant", dur: 0 },
  { id: "dino_store",   name: "Dino Store",          zone: "facility", floor: "G", x: 296, y: 310, desc: "Dinosaur-themed shop", dur: 0 },
  { id: "museum_shop",  name: "Museum Shop",         zone: "facility", floor: "G", x: 542, y: 455, desc: "Main museum shop", dur: 0 },
  { id: "darwin_cafe",  name: "Darwin Centre Café",  zone: "facility", floor: "G", x: 175, y: 380, desc: "Café in Darwin Centre", dur: 0 },
];

export const EDGES = [
  // Orange internal
  ["zoology_spirit", "attenborough", 2], ["attenborough", "cocoon", 2], ["zoology_spirit", "cocoon", 2],
  ["cocoon", "darwin_centre", 3], ["attenborough", "darwin_centre", 2], ["darwin_centre", "wildlife_garden", 4],
  // Orange → Blue
  ["cocoon", "dinosaurs", 3], ["darwin_centre", "jerwood", 4],
  // Blue internal
  ["dinosaurs", "fishes", 2], ["dinosaurs", "human_biology", 3], ["fishes", "human_biology", 2],
  ["fishes", "images_of_nature", 2], ["human_biology", "images_of_nature", 2], ["human_biology", "mammals", 2],
  ["images_of_nature", "mammals", 2], ["images_of_nature", "jerwood", 2], ["mammals", "hintze_hall", 3],
  ["jerwood", "hintze_hall", 2], ["hintze_hall", "marine_inverts", 2], ["jerwood", "marine_inverts", 2],
  // Blue → Green
  ["dinosaurs", "birds", 4], ["human_biology", "birds", 4], ["mammals", "fossil_marine", 3],
  ["hintze_hall", "waterhouse", 4],
  // Green internal (ground)
  ["birds", "creepy_crawlies", 2], ["creepy_crawlies", "fossil_marine", 2], ["fossil_marine", "waterhouse", 2],
  ["fossil_marine", "east_pavilion", 2], ["waterhouse", "east_pavilion", 2],
  // Green upper/lower via lift
  ["lift_hintze", "minerals", 3], ["lift_hintze", "treasures", 3], ["lift_hintze", "the_vault", 3],
  ["lift_hintze", "giant_sequoia", 4], ["lift_hintze", "investigate", 3],
  ["minerals", "treasures", 1], ["minerals", "the_vault", 1], ["treasures", "the_vault", 1],
  ["treasures", "giant_sequoia", 2],
  // Green → Red
  ["waterhouse", "earth_hall", 3], ["east_pavilion", "human_evolution", 3],
  // Red internal (ground)
  ["earth_hall", "human_evolution", 2], ["earth_hall", "lasting_imp", 2], ["human_evolution", "lasting_imp", 3],
  // Red upper via escalator from Earth Hall
  ["earth_hall", "earths_treasury", 3], ["earth_hall", "from_beginning", 3],
  ["earths_treasury", "from_beginning", 2], ["earth_hall", "volcanoes", 4], ["earth_hall", "restless_surface", 4],
  ["volcanoes", "restless_surface", 3], ["from_beginning", "volcanoes", 2], ["from_beginning", "restless_surface", 2],
  // Entrances
  ["entrance_cromwell", "hintze_hall", 2], ["entrance_cromwell", "marine_inverts", 2],
  ["entrance_queens", "attenborough", 2], ["entrance_queens", "darwin_centre", 2],
  ["entrance_exhibition", "earth_hall", 2], ["entrance_exhibition", "lasting_imp", 2],
  // Lift
  ["hintze_hall", "lift_hintze", 1],
  // Facilities
  ["dinosaurs", "central_cafe", 1], ["dinosaurs", "trex_grill", 1],
  ["fishes", "dino_store", 1], ["hintze_hall", "museum_shop", 1], ["darwin_centre", "darwin_cafe", 1],
];

export const ZONE_COLORS = {
  orange: "#C67A1E", blue: "#1B6FA0", green: "#358535", red: "#B03028",
  entrance: "#555", facility: "#888",
};

export const ZONE_LABELS = {
  orange: "Orange zone", blue: "Blue zone", green: "Green zone", red: "Red zone",
  entrance: "Entrance", facility: "Facility",
};

export const FLOOR_ORDER = ["G", "LG", "F1", "F2", "Out"];

export const FLOOR_LABELS = {
  G: "Ground", LG: "Lower ground", F1: "Floor 1", F2: "Floor 2", Out: "Outside",
};
