// scripts/photo-sync.config.mjs
// -----------------------------------------------------------------------------
// Ties each Photos-repo activity folder to its project activity (by name).
// Edit this file to add/fix a tie. Keys = folder names under Photos/<dir>/,
// values = the catalogue activity name (sync-photo-images.mjs normalizes minor
// trailing-punctuation/whitespace drift, so a trimmed name is fine here).
// -----------------------------------------------------------------------------
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// my-nextjs-app/scripts -> WORKING-ON/Photos
export const PHOTO_ROOT =
  process.env.PHOTO_ROOT || path.resolve(HERE, "..", "..", "..", "Photos");

export const TIES = {
  amsterdam: { dir: "amsterdam", map: {
    "Amstelpark": "Amstelpark",
    "Amsterdamse Bos": "Amsterdamse Bos",
    "Pancake Boat": "Pancake Boat (Pannenkoekenboot)",
    "Rijksmuseum": "Rijksmuseum",
    "Van Gogh Museum": "Van Gogh Museum",
  } },
  barcelona: { dir: "Barcelona", map: {
    "Casa Milà": "Casa Milà (La Pedrera)",
    "Park Güell": "Park Güell",
    "Picasso Museum": "Picasso Museum",
  } },
  berlin: { dir: "Berlin", map: {
    "Extavium Potsdam": "Extavium Potsdam (nano)",
    "FEZ Berlin": "FEZ Berlin",
    "Garten der Welt": "Garten der Welt",
    "Labyrinth Kindermuseum": "Labyrinth Kindermuseum",
    "MACHmit! Museum for Children": "MACHmit! Museum for Children",
    "Tiergarten": "Tiergarten",
    "Zoologischer Garten + Aquarium Berlin": "Zoologischer Garten + Aquarium Berlin",
    "Zoologischer Garten Berlin": "Zoologischer Garten Berlin",
  } },
  budapest: { dir: "Boudapest", map: {
    "Daytime Sightseeing Cruise": "Daytime Sightseeing Cruise",
    "Gellért Hill": "Παιδική Χαρά με τις Τσουλήθρες (Gellért Hill)",
    "Gyermekvasút": "Το Τρένο των Παιδιών (Gyermekvasút)",
    "Margitsziget": "Margaret Island (Margitsziget) - Playgrounds",
    "Nagyjátszótér": "Η Μεγάλη Παιδική Χαρά στο Városliget (Nagyjátszótér)",
    "Sir Lancelot Knights' Restaurant": "Sir Lancelot Knights' Restaurant",
  } },
  bucharest: { dir: "Boukourest", map: {
    "Admiral Vasile Urseanu": "Αστεροσκοπείο Admiral Vasile Urseanu",
    "Carturesti Carusel": "Carturesti Carusel",
    "Children's Town Bucharest – Orășelul Copiilor": "Children's Town Bucharest – Orășelul Copiilor (Parcul Tineretului)",
    "Cișmigiu": "Κήπος Cișmigiu",
    "Destiny Park boukourest": "Destiny Park",
    "Edenland Park": "Edenland Park",
    "Izvor Park": "Izvor Park (παιδική χαρά)",
    "Muzeul Micul Paris": "Muzeul Micul Paris",
    "Pasajul Macca-Vilacrosse": "Pasajul Macca-Vilacrosse",
    "Pasajul Victoriei": "Pasajul Victoriei",
    "Romanian Athenaeum (Ateneul Român)": "Romanian Athenaeum (Ateneul Român)",
    "Therme Bucharest": "Therme Bucharest (4.5 ώρες)",
    "boukourest Lipscani": "Παλιά Πόλη Lipscani",
    "boukourest Piata Unirii": "Σιντριβάνια της Piata Unirii (Symphony of Water)",
    "Παλάτι του Κοινοβουλίου": "Παλάτι του Κοινοβουλίου (Σπίτι του Λαού)",
  } },
  istanbul: { dir: "Constantinople", map: {
    "KidZania Istanbul": "KidZania Istanbul",
    "Αγία Σοφία": "Αγία Σοφία",
    "Αρχαιολογικό Μουσείο Κωνσταντινούπολης": "Αρχαιολογικό Μουσείο Κωνσταντινούπολης",
    "Βασιλική Κινστέρνα": "Βασιλική Κινστέρνα",
    "Κρουαζιέρα στα Πριγκηπονήσια": "Κρουαζιέρα στα Πριγκηπονήσια",
    "Κρουαζιέρα στον Βόσπορο": "Κρουαζιέρα στον Βόσπορο",
    "Μπλε Τζαμί (Σουλταν Αχμέτ)": "Μπλε Τζαμί (Σουλταν Αχμέτ)",
    "Πάρκο Γκιουλχανέ": "Πάρκο Γκιουλχανέ",
    "Πάρκο Μινιατούρων (Miniatürk)": "Πάρκο Μινιατούρων (Miniatürk)",
    "Πατριαρχείο": "Πατριαρχείο",
    "Πύργος του Γαλατά": "Πύργος του Γαλατά",
    "Τοπ Καπί (Αυτοκρατορικό Παλάτι)": "Τοπ Καπί (Αυτοκρατορικό Παλάτι)",
  } },
  krakow: { dir: "Krakow", map: {
    "Aquapark": "Aquapark",
    "Krakow Pinball Museum": "Krakow Pinball Museum",
    "Museum of Illusions": "Museum of Illusions",
    "Underground Rynek Museum": "Underground Rynek Museum",
    "Zakopane": "Zakopane",
  } },
  lisbon: { dir: "Lisbon", map: {
    "Museu da Marioneta": "Museu da Marioneta",
    "Palácio da Pena": "Palácio da Pena",
    "Pavilhão do Conhecimento": "Pavilhão do Conhecimento",
    "Μνημείο των Ανακαλύψεων": "Μνημείο των Ανακαλύψεων",
    "Μοναστήρι των Ιερονομιτών": "Μοναστήρι των Ιερονομιτών",
    "Πύργος του Μπελέμ": "Πύργος του Μπελέμ",
  } },
  madrid: { dir: "Madrid", map: {
    "IKONO (Διαδραστική & Φωτογραφική Εμπειρία)": "IKONO (Διαδραστική & Φωτογραφική Εμπειρία)",
    "MUNCYT Alcobendas (Μουσείο Επιστήμης & Τεχνολογίας)": "MUNCYT Alcobendas (Μουσείο Επιστήμης & Τεχνολογίας)",
    "Micropolix (Παιδική Πόλη Επαγγελμάτων)": "Micropolix (Παιδική Πόλη Επαγγελμάτων)",
    "Museo Naval (Ναυτικό Μουσείο)": "Museo Naval (Ναυτικό Μουσείο)",
    "Planetario de Madrid (Πλανητάριο)": "Planetario de Madrid (Πλανητάριο)",
    "Santiago Bernabéu Tour (Tour Γηπέδου Ρεάλ Μαδρίτης)": "Santiago Bernabéu Tour (Tour Γηπέδου Ρεάλ Μαδρίτης)",
    "Teleférico de Madrid": "Teleférico de Madrid",
    "Urban Planet Las Rejas": "Urban Planet Las Rejas",
  } },
  paris: { dir: "Paris", map: {
    "Latin Quarter food walk": "Latin Quarter food walk",
    "Le Marais café & falafel": "Le Marais café & falafel",
    "Luxembourg Gardens": "Luxembourg Gardens",
    "Macaron & pâtisserie tasting": "Macaron & pâtisserie tasting",
  } },
  prague: { dir: "Prague", map: {
    "Illusion Art Museum Prague": "Illusion Art Museum Prague",
    "Sea World (Mořský svět)": "Sea World (Mořský svět)",
    "Γέφυρα του Καρόλου": "Γέφυρα του Καρόλου",
    "Ζωολογικός Κήπος (Zoo Praha)": "Ζωολογικός Κήπος (Zoo Praha)",
    "Κάστρο της Πράγας": "Κάστρο της Πράγας",
    "Κρουαζιέρα στον Μολδάβα": "Κρουαζιέρα στον Μολδάβα",
    "Μουσείο LEGO": "Μουσείο LEGO",
    "Μουσείο Αισθήσεων (Sense Museum)": "Μουσείο Αισθήσεων (Sense Museum)",
  } },
  rome: { dir: "Rome", map: {
    "Explora": "Explora",
  } },
  vienna: { dir: "Vienna", map: {
    "Classic Pass": "Classic Pass (καλοκαιρινή περίοδος)",
    "Classic Pass Plus (πλήρες πακέτο)": "Classic Pass Plus (πλήρες πακέτο)",
    "Sisi Pass": "Sisi Pass (3 αυτοκρατορικά αξιοθέατα)",
    "Sisi's Amazing Journey (VR Experience)": "Sisi's Amazing Journey (VR Experience)",
    "Winter Pass (χειμερινή περίοδος)": "Winter Pass (χειμερινή περίοδος)",
    "Zoo + Palm House + Desert House Combo Schönbrunn": "Zoo + Palm House + Desert House Combo Schönbrunn",
  } },
  warsaw: { dir: "Warsow", map: {
    "Hangar 646 Goclaw": "Hangar 646 στο Gocław",
    "Majaland Warsaw": "Majaland Warsaw",
    "Museum of Illusions": "Museum of Illusions",
    "Smart Kids Planet": "Smart Kids Planet",
    "Łazienki Park": "Łazienki Park",
  } },
};
