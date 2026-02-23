import ApparatusModel from '../../models/Apparatus';
import GroupModel from '../../models/Group';
import PassageModel from '../../models/Passage';
import StreamModel from '../../models/Stream';
import SubscriptionModel from '../../models/Subscription';

// --- MAPPING VILLES -> CANTONS SUISSES ---
const CITY_TO_CANTON: Record<string, string> = {
  // Canton de Vaud (VD)
  'Lausanne': 'VD', 'Lausanne-Ville': 'VD', 'Lausanne Amis-Gym': 'VD', 'Lausanne Amis Gym': 'VD',
  'Morges': 'VD', 'Pully': 'VD', 'Yverdon': 'VD', 'Yverdon-Ancienne': 'VD', 'Amis-Gyms Yverdon': 'VD',
  'Ecublens': 'VD', 'Prilly': 'VD', 'Bussigny': 'VD', 'Nyon': 'VD', 'Aubonne': 'VD',
  'Rolle': 'VD', 'Gym-Rolle': 'VD', 'Gym Rolle': 'VD', 'Saint-Prex': 'VD', 'Gym Saint-Prex': 'VD', 'St-Prex': 'VD',
  'Cossonay': 'VD', 'Echallens': 'VD', 'Echallens FSG': 'VD', 'Vallorbe': 'VD',
  'Grandson': 'VD', 'Yvonand': 'VD', 'Lucens': 'VD', 'Cully-Lutry': 'VD', 'Lutry La Riveraine': 'VD',
  'Chavornay': 'VD', 'Baulmes': 'VD', 'Le Lieu - Vallée de Joux': 'VD', 'Chexbres': 'VD',
  'Corcelles-le-Jorat': 'VD', 'Le Mont-sur-Lausanne': 'VD', 'Chailly-Lausanne': 'VD',
  
  // Canton de Genève (GE)
  'Genève': 'GE', 'Lancy': 'GE', 'Veyrier': 'GE',
  
  // Canton de Fribourg (FR)
  'Fribourg': 'FR', 'Bulle': 'FR', 'Romont': 'FR', 'Romont gym': 'FR', 'Romont Gym': 'FR',
  'Domdidier': 'FR', 'Ursy': 'FR', 'Gym Ursy': 'FR', 'Charmey': 'FR', 'Marly': 'FR',
  'Courtepin': 'FR', 'Attalens': 'FR', 'Gym Attalens': 'FR', 'Payerne': 'FR',
  'La Tour-de-Trême': 'FR',
  
  // Canton de Neuchâtel (NE)
  'Neuchâtel': 'NE', 'La Coudre': 'NE', 'Gym La Coudre': 'NE',
  'Peseux': 'NE', 'Gym Peseux': 'NE', 'Serrières': 'NE', 'Gym Serrières': 'NE',
  'Chézard-st-Martin': 'NE', 'Gym Chézard-st-Martin': 'NE', 'Gym Chézard-St-Martin': 'NE',
  'Chézard-St-Martin': 'NE',
  
  // Canton du Valais (VS)
  'Sion': 'VS', 'Agrès Gym 13 étoiles Sion': 'VS', 'Sion Fémina': 'VS',
  'Martigny': 'VS', 'Martigny-Aurore': 'VS', 'Martigny Octoduria': 'VS',
  'Fully': 'VS', 'Amis Gym Fully': 'VS', 'Monthey': 'VS', 'Monthey-gym': 'VS',
  'Massongex': 'VS',
  
  // Canton de Berne (BE)
  'Berne': 'BE', 'Kirchberg': 'BE', 'Niederscherli': 'BE',
  
  // Canton d'Argovie (AG)
  'Neuenhof': 'AG', 'Wettingen': 'AG',
  
  // Canton de Lucerne (LU)
  'Luzern': 'LU', 'Lucerne': 'LU',
  
  // Canton de Soleure (SO)
  'Sins-Oberrüti': 'AG', // En fait Argovie
  'Rain': 'LU', // En fait Lucerne
  
  // Canton du Tessin (TI)
  'Mendrisio': 'TI',
  
  // Canton du Jura (JU)
  'Vicques': 'JU', 'Fémina Vicques': 'JU',
  
  // Région lémanique - Canton de Vaud
  'Vevey': 'VD', 'Vevey-Ancienne': 'VD', 'Vevey Jeunes-Patriotes': 'VD',
  'Montreux': 'VD', 'Chailly-Montreux': 'VD', 'Chernex': 'VD',
  'Blonay': 'VD', 'Corsier-Corseaux': 'VD', 'Corsier - Corseaux': 'VD',
  'Chardonne-Jongny': 'VD', 'Villeneuve': 'VD', 'Gym Villeneuve': 'VD',
  'Aigle-Alliance': 'VD', 'Bex': 'VD', 'Ollon/St-Triphon': 'VD',
  'Roche': 'VD', 'La Tour': 'VD', 'Gym La Tour': 'VD',
  
  // Canton de Vaud - autres
  'Avenches': 'VD', 'Forel-Savigny': 'VD', 'Amis-Gym Forel-Savigny': 'VD',
};

// Fonction pour extraire le canton à partir du nom complet du groupe
const extractCanton = (groupName: string): string | undefined => {
  // Extrait la partie avant le ":" (nom de la ville/société)
  const cityPart = groupName.includes(':') ? groupName.split(':')[0]?.trim() : groupName.trim();
  
  if (!cityPart) return undefined;
  
  // Recherche directe dans le mapping
  if (CITY_TO_CANTON[cityPart]) {
    return CITY_TO_CANTON[cityPart];
  }
  
  // Recherche fuzzy - cherche si cityPart contient une clé du mapping
  for (const [city, canton] of Object.entries(CITY_TO_CANTON)) {
    if (cityPart.includes(city) || city.includes(cityPart)) {
      return canton;
    }
  }
  
  // Par défaut, retourne VD (Vaud) car c'est le canton principal de la compétition
  return 'VD';
};

// --- DONNÉES BRUTES (Générées à partir de tes fichiers Excel) ---
const RAW_SCHEDULE = {
  "actifs": [{"location": "Iles 1-2", "time": "07:30:00", "code": "CE", "group": "Grandson : Actifs-actives"}, {"location": "Iles 1-2", "time": "07:44:00", "code": "CE", "group": "Chavornay : Actifs-Actives"}, {"location": "Iles 1-2", "time": "07:58:00", "code": "CE", "group": "Gym Serrières : Actifs-Actives"}, {"location": "Iles 1-2", "time": "08:12:00", "code": "CE", "group": "Yverdon-Ancienne : Actifs-Actives"}, {"location": "Iles 1-2", "time": "08:26:00", "code": "CE", "group": "Echallens FSG : Agrès Actifs Plaisir"}, {"location": "Iles 1-2", "time": "08:40:00", "code": "CE", "group": "Gym Peseux : Actifs mixtes"}, {"location": "Iles 1-2", "time": "08:54:00", "code": "CE", "group": "Amis-Gyms Yverdon : VT-mixtes"}, {"location": "Iles 1-2", "time": "09:08:00", "code": "CE", "group": "Amis Gym Fully : Actifs"}, {"location": "Iles 1-2", "time": "09:22:00", "code": "CE", "group": "Chernex : Actifs-Mixtes"}, {"location": "Iles 1-2", "time": "09:36:00", "code": "CE", "group": "Vevey-Ancienne : Agrès Mixte"}, {"location": "Iles 1-2", "time": "09:50:00", "code": "CE", "group": "Chexbres : Actifs - Actives"}, {"location": "Iles 1-2", "time": "10:04:00", "code": "CE", "group": "Le Lieu - Vallée de Joux : Actifs"}, {"location": "Iles 1-2", "time": "10:18:00", "code": "CE", "group": "Aigle-Alliance : Actifs-Actives"}, {"location": "Iles 1-2", "time": "10:32:00", "code": "CE", "group": "Vevey Jeunes-Patriotes : Actifs-Actives"}, {"location": "Iles 1-2", "time": "10:46:00", "code": "CE", "group": "Montreux : Actifs Mixtes"}, {"location": "Iles 1-2", "time": "11:00:00", "code": "CE", "group": "Gym Chézard-st-Martin : Actif"}, {"location": "Iles 1-2", "time": "11:14:00", "code": "CE", "group": "Kirchberg : Aktive"}, {"location": "Iles 1-2", "time": "11:28:00", "code": "CE", "group": "Yvonand : Actifs-Actives"}, {"location": "Iles 1-2", "time": "11:42:00", "code": "CE", "group": "Agrès Gym 13 étoiles Sion : société"}, {"location": "Iles 1-2", "time": "11:56:00", "code": "CE", "group": "Neuenhof : Aktive"}, {"location": "Iles 1-2", "time": "12:10:00", "code": "CE", "group": "Gym La Coudre : Actifs"}, {"location": "Iles 1-2", "time": "12:24:00", "code": "CE", "group": "Mendrisio : Actifs-Actives"}, {"location": "Iles 1-2", "time": "12:31:00", "code": "BAS", "group": "Blonay : Actifs-Actives"}, {"location": "Iles 1-2", "time": "12:45:00", "code": "BP", "group": "Yvonand : Actifs-Actives"}, {"location": "Iles 1-2", "time": "12:59:00", "code": "BP", "group": "Fribourg : Actifs - actives"}, {"location": "Iles 1-2", "time": "13:13:00", "code": "BP", "group": "Corsier-Corseaux : Actifs-Actives"}, {"location": "Iles 1-2", "time": "13:27:00", "code": "BP", "group": "Ursy : Actifs"}, {"location": "Iles 1-2", "time": "13:41:00", "code": "BP", "group": "Lancy : Actifs-actives"}, {"location": "Iles 1-2", "time": "13:55:00", "code": "BP", "group": "Chardonne-Jongny : Actifs-Actives"}, {"location": "Iles 1-2", "time": "14:09:00", "code": "BP", "group": "Le Lieu - Vallée de Joux : Actifs"}, {"location": "Iles 1-2", "time": "14:23:00", "code": "BP", "group": "Gym Chézard-st-Martin : Actif"}, {"location": "Iles 1-2", "time": "14:37:00", "code": "BP", "group": "Gym La Coudre : Actifs"}, {"location": "Iles 1-2", "time": "14:51:00", "code": "BP", "group": "Montreux : Actifs Mixtes"}, {"location": "Iles 1-2", "time": "15:05:00", "code": "BP", "group": "Rain : Aktive"}, {"location": "Iles 1-2", "time": "15:19:00", "code": "BP", "group": "Luzern : Turn Leistungs-Zentrum"}, {"location": "Iles 1-2", "time": "15:47:00", "code": "BF", "group": "Agrès Gym 13 étoiles Sion : société"}, {"location": "Iles 1-2", "time": "16:01:00", "code": "BF", "group": "Le Lieu - Vallée de Joux : Actifs"}, {"location": "Iles 1-2", "time": "16:15:00", "code": "BF", "group": "Lausanne Amis Gym : Actifs"}, {"location": "Iles 1-2", "time": "16:29:00", "code": "BF", "group": "Vevey-Ancienne : Agrès Filles"}, {"location": "Iles 2-3", "time": "07:37:00", "code": "AB", "group": "Pully : Actifs-Actives"}, {"location": "Iles 2-3", "time": "07:51:00", "code": "AB", "group": "Avenches : Actifs"}, {"location": "Iles 2-3", "time": "08:05:00", "code": "AB", "group": "Morges : Actifs-Actives"}, {"location": "Iles 2-3", "time": "08:19:00", "code": "AB", "group": "Gym La Coudre : Actifs-Actives"}, {"location": "Iles 2-3", "time": "08:33:00", "code": "AB", "group": "Romont gym : Actifs-Actives"}, {"location": "Iles 2-3", "time": "08:47:00", "code": "AB", "group": "Domdidier : Actifs-Actives"}, {"location": "Iles 2-3", "time": "09:01:00", "code": "AB", "group": "Lancy : Actifs-actives"}, {"location": "Iles 2-3", "time": "09:15:00", "code": "AB", "group": "Fribourg : Actifs - actives"}, {"location": "Iles 2-3", "time": "09:29:00", "code": "AB", "group": "Ursy : Actifs"}, {"location": "Iles 2-3", "time": "09:43:00", "code": "AB", "group": "Nyon : Actifs-actives"}, {"location": "Iles 2-3", "time": "09:57:00", "code": "AB", "group": "Kirchberg : Aktive"}, {"location": "Iles 2-3", "time": "10:11:00", "code": "AB", "group": "Wettingen : Aktive"}, {"location": "Iles 2-3", "time": "10:25:00", "code": "AB", "group": "Luzern : Turn Leistungs-Zentrum"}, {"location": "Iles 2-3", "time": "10:39:00", "code": "AB", "group": "Vevey : Team Vevey"}, {"location": "Iles 2-3", "time": "11:07:00", "code": "AB", "group": "Finales"}, {"location": "Iles 2-3", "time": "11:21:00", "code": "AB", "group": "Finales"}, {"location": "Iles 2-3", "time": "11:35:00", "code": "AB", "group": "Finales"}, {"location": "Iles 2-3", "time": "12:38:00", "code": "ST", "group": "Charmey : Actifs"}, {"location": "Iles 2-3", "time": "12:52:00", "code": "ST", "group": "Avenches : Actifs"}, {"location": "Iles 2-3", "time": "13:06:00", "code": "ST", "group": "Chavornay : Actifs-Actives"}, {"location": "Iles 2-3", "time": "13:20:00", "code": "ST", "group": "Domdidier : Actifs-Actives"}, {"location": "Iles 2-3", "time": "13:34:00", "code": "ST", "group": "Gym La Coudre : Actifs-Actives"}, {"location": "Iles 2-3", "time": "13:48:00", "code": "ST", "group": "Gym Serrières : Actifs-Actives"}, {"location": "Iles 2-3", "time": "14:02:00", "code": "ST", "group": "Neuenhof : Aktive"}, {"location": "Iles 2-3", "time": "14:16:00", "code": "ST", "group": "Luzern : Turn Leistungs-Zentrum"}, {"location": "Iles 2-3", "time": "14:30:00", "code": "ST", "group": "Yvonand : Actifs-Actives"}, {"location": "Iles 2-3", "time": "14:44:00", "code": "ST", "group": "Wettingen : Aktive"}, {"location": "Iles 2-3", "time": "14:58:00", "code": "ST", "group": "Amis-Gyms Yverdon : Actifs-Actives"}, {"location": "Iles 2-3", "time": "15:12:00", "code": "ST", "group": "Bulle : Juniors mixtes"}, {"location": "Iles 2-3", "time": "15:26:00", "code": "ST", "group": "Gym Chézard-st-Martin : Actif"}, {"location": "Iles 2-3", "time": "15:54:00", "code": "GYAE", "group": "Aubonne : Gym & Danse Actives"}, {"location": "Iles 2-3", "time": "16:08:00", "code": "GYAE", "group": "Bex : Actives"}, {"location": "Iles 2-3", "time": "16:22:00", "code": "GYAE", "group": "Echallens : Gym Danse actives"}, {"location": "Iles 2-3", "time": "16:34:00", "code": "GYAE", "group": "Gym-Rolle : Actives Gymnastique"}, {"location": "Iles 2-3", "time": "16:40:00", "code": "GYAE", "group": "Prilly : Actives"}, {"location": "Iles 2-3", "time": "16:46:00", "code": "GYAE", "group": "Lausanne-Ville : Actives"}, {"location": "Iles 2-3", "time": "16:52:00", "code": "GYAE", "group": "Vallorbe : Gym-danse actives"}, {"location": "Iles 2-3", "time": "16:58:00", "code": "GYAE", "group": "Amis-Gyms Yverdon : Gym Active 35+"}, {"location": "Iles 2-3", "time": "17:04:00", "code": "GYAE", "group": "Morges : GD Actives"}, {"location": "Iles 2-3", "time": "17:10:00", "code": "GYAE", "group": "Lausanne Amis-Gym : G-Dance"}, {"location": "Iles 2-3", "time": "17:16:00", "code": "GYAE", "group": "Lucens : Actives"}, {"location": "Léon-Michaud", "time": "08:00:00", "code": "SO", "group": "Bussigny : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "08:14:00", "code": "SO", "group": "Amis Gym Fully : Actifs"}, {"location": "Léon-Michaud", "time": "08:28:00", "code": "SO", "group": "Ecublens : Actif"}, {"location": "Léon-Michaud", "time": "08:42:00", "code": "SO", "group": "Pully : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "08:56:00", "code": "SO", "group": "Avenches : Actifs"}, {"location": "Léon-Michaud", "time": "09:10:00", "code": "SO", "group": "Aigle-Alliance : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "09:24:00", "code": "SO", "group": "Morges : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "09:38:00", "code": "SO", "group": "Chardonne-Jongny : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "09:52:00", "code": "SO", "group": "Gym Peseux : Actifs mixtes"}, {"location": "Léon-Michaud", "time": "10:06:00", "code": "SO", "group": "Lausanne : Lausanne Team Agrès"}, {"location": "Léon-Michaud", "time": "10:20:00", "code": "SO", "group": "Domdidier : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "10:34:00", "code": "SO", "group": "Fribourg : Actifs - actives"}, {"location": "Léon-Michaud", "time": "10:48:00", "code": "SO", "group": "Romont gym : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "11:02:00", "code": "SO", "group": "Lancy : Actifs-actives"}, {"location": "Léon-Michaud", "time": "11:16:00", "code": "SO", "group": "Ursy : Actifs"}, {"location": "Léon-Michaud", "time": "11:30:00", "code": "SO", "group": "Charmey : Actifs"}, {"location": "Léon-Michaud", "time": "11:44:00", "code": "SO", "group": "Gym Saint-Prex : actifs-actives"}, {"location": "Léon-Michaud", "time": "11:58:00", "code": "SO", "group": "Montreux : Actifs Mixtes"}, {"location": "Léon-Michaud", "time": "12:12:00", "code": "SO", "group": "Rain : Aktive"}, {"location": "Léon-Michaud", "time": "14:00:00", "code": "SO", "group": "Bulle : Juniors mixtes"}, {"location": "Léon-Michaud", "time": "14:14:00", "code": "SO", "group": "Blonay : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "14:28:00", "code": "SO", "group": "Gym Villeneuve : Rétroactifs"}, {"location": "Léon-Michaud", "time": "14:42:00", "code": "SO", "group": "Corsier-Corseaux : Actifs-Actives"}, {"location": "Léon-Michaud", "time": "14:56:00", "code": "SO", "group": "Niederscherli : Boden"}, {"location": "Léon-Michaud", "time": "15:10:00", "code": "SO", "group": "Vevey : Team Vevey"}, {"location": "Léon-Michaud", "time": "15:24:00", "code": "SO", "group": "Neuenhof : Aktive"}, {"location": "Léon-Michaud", "time": "15:38:00", "code": "SO", "group": "Nyon : Actifs-actives"}, {"location": "Léon-Michaud", "time": "15:52:00", "code": "SO", "group": "Wettingen : Aktive"}, {"location": "Léon-Michaud", "time": "16:06:00", "code": "SO", "group": "Amis-Gyms Yverdon : Actifs-Actives"}],
  "jeunesse": [{"location": "Iles 1-2", "time": "08:00:00", "code": "AB", "group": "Gym Ursy : Groupe mixte"}, {"location": "Iles 1-2", "time": "08:14:00", "code": "AB", "group": "Pully : TeamGym"}, {"location": "Iles 1-2", "time": "08:28:00", "code": "AB", "group": "Vevey-Ancienne : Groupe Mixte Jeunesse"}, {"location": "Iles 1-2", "time": "08:42:00", "code": "AB", "group": "Vevey Jeunes-Patriotes : Groupe Mixte A"}, {"location": "Iles 1-2", "time": "08:56:00", "code": "AB", "group": "Lutry La Riveraine : Team anneaux Lutry M12"}, {"location": "Iles 1-2", "time": "09:24:00", "code": "BF", "group": "Agrès Gym 13 étoiles Sion : société"}, {"location": "Iles 1-2", "time": "09:38:00", "code": "BF", "group": "Yvonand : Agrès-Mixtes"}, {"location": "Iles 1-2", "time": "09:52:00", "code": "BF", "group": "Team Agrès Lausanne : jeunesse"}, {"location": "Iles 1-2", "time": "10:06:00", "code": "BF", "group": "Chernex : Agrès Mixtes"}, {"location": "Iles 1-2", "time": "10:20:00", "code": "BF", "group": "Agrès Gym 13 étoiles Sion : société"}, {"location": "Iles 1-2", "time": "10:34:00", "code": "BF", "group": "Corcelles-le-Jorat : Agrès MD13"}, {"location": "Iles 1-2", "time": "10:48:00", "code": "BF", "group": "Baulmes : Team Agrès"}, {"location": "Iles 1-2", "time": "11:02:00", "code": "CE", "group": "Team Agrès Lausanne : jeunesse"}, {"location": "Iles 1-2", "time": "11:16:00", "code": "ST", "group": "Romont Gym : Agrès société 1"}, {"location": "Iles 1-2", "time": "11:30:00", "code": "CE", "group": "Gym Attalens : agrès société-12ans"}, {"location": "Iles 1-2", "time": "11:44:00", "code": "CE", "group": "Gym Chézard-St-Martin : M13"}, {"location": "Iles 1-2", "time": "11:58:00", "code": "CE", "group": "Amis Gym Fully : Jeunesse B"}, {"location": "Iles 1-2", "time": "12:12:00", "code": "CE", "group": "Amis-Gyms Yverdon : Mini-Mixtes"}, {"location": "Iles 1-2", "time": "12:26:00", "code": "CE", "group": "Grandson : Mixtes 7-12 ans"}, {"location": "Iles 1-2", "time": "12:40:00", "code": "CE", "group": "Chernex : Agrès Mixtes"}, {"location": "Iles 1-2", "time": "12:54:00", "code": "CE", "group": "Lutry La Riveraine : Agrès production"}, {"location": "Iles 1-2", "time": "13:08:00", "code": "CE", "group": "Chexbres : Maxi-Mixtes"}, {"location": "Iles 1-2", "time": "13:22:00", "code": "CE", "group": "Pully : Mini-TeamGym"}, {"location": "Iles 1-2", "time": "13:36:00", "code": "CE", "group": "Baulmes : Team Agrès"}, {"location": "Iles 1-2", "time": "13:50:00", "code": "CE", "group": "Corcelles-le-Jorat : Agès-mixte MD17"}, {"location": "Iles 1-2", "time": "14:04:00", "code": "CE", "group": "Cully-Lutry : Team Agrès Cully-Lutry"}, {"location": "Iles 1-2", "time": "14:18:00", "code": "CE", "group": "Blonay : Agrès 2"}, {"location": "Iles 1-2", "time": "14:32:00", "code": "CE", "group": "Gym Peseux : Jeunesse M17"}, {"location": "Iles 1-2", "time": "14:46:00", "code": "CE", "group": "Chernex : Grands-Mixtes"}, {"location": "Iles 1-2", "time": "15:00:00", "code": "CE", "group": "Yvonand : Agrès-Mixtes"}, {"location": "Iles 1-2", "time": "15:14:00", "code": "CE", "group": "Amis Gym Fully : Juniors"}, {"location": "Iles 1-2", "time": "15:28:00", "code": "CE", "group": "Grandson : Agrès 12-16ans"}, {"location": "Iles 1-2", "time": "15:42:00", "code": "CE", "group": "Gym La Tour : -16ans"}, {"location": "Iles 1-2", "time": "15:56:00", "code": "CE", "group": "Gym Rolle : Agrès Mixte 12-16 ans"}, {"location": "Iles 1-2", "time": "16:10:00", "code": "CE", "group": "Yverdon-Ancienne : Mixtes"}, {"location": "Iles 1-2", "time": "16:24:00", "code": "CE", "group": "Le Lieu - Vallée de Joux : Junior Mixtes"}, {"location": "Iles 1-2", "time": "16:38:00", "code": "CE", "group": "Chézard-St-Martin : Jeunesse M17"}, {"location": "Iles 1-2", "time": "16:52:00", "code": "CE", "group": "Sins-Oberrüti : Jugend"}, {"location": "Iles 1-2", "time": "17:06:00", "code": "CE", "group": "Corsier-Corseaux : Agrès-mixte"}, {"location": "Iles 1-2", "time": "17:20:00", "code": "CE", "group": "Kirchberg : Jugend"}, {"location": "Iles 2-3", "time": "08:07:00", "code": "BAS", "group": "Blonay : Agrès 2"}, {"location": "Iles 2-3", "time": "08:21:00", "code": "BAS", "group": "Chernex : Grands-Mixtes"}, {"location": "Iles 2-3", "time": "08:35:00", "code": "BAS", "group": "Corsier - Corseaux : Jeunesses mixte"}, {"location": "Iles 2-3", "time": "08:49:00", "code": "BAS", "group": "Monthey-gym : Jeunes Gym A"}, {"location": "Iles 2-3", "time": "09:03:00", "code": "BAS", "group": "Sins-Oberrüti : Jugend"}, {"location": "Iles 2-3", "time": "09:17:00", "code": "CE", "group": "Chernex : Filles 9-12ans"}, {"location": "Iles 2-3", "time": "09:31:00", "code": "BAS", "group": "Sins-Oberrüti : Jugend"}, {"location": "Iles 2-3", "time": "09:59:00", "code": "SO", "group": "Grandson : Agrès 7-11 ans"}, {"location": "Iles 2-3", "time": "10:13:00", "code": "SO", "group": "Vevey Jeunes-Patriotes : Groupe Mixte B"}, {"location": "Iles 2-3", "time": "10:27:00", "code": "SO", "group": "Gym La Tour : 7-12 compète"}, {"location": "Iles 2-3", "time": "10:41:00", "code": "SO", "group": "Martigny-Aurore : Grand Mixte"}, {"location": "Iles 2-3", "time": "10:55:00", "code": "SO", "group": "Blonay : Agrès 1"}, {"location": "Iles 2-3", "time": "11:09:00", "code": "SO", "group": "Marly : Marly M-12"}, {"location": "Iles 2-3", "time": "11:23:00", "code": "SO", "group": "Agrès Gym 13 étoiles Sion : société"}, {"location": "Iles 2-3", "time": "11:37:00", "code": "SO", "group": "Chardonne-Jongny : Jeunesse M12"}, {"location": "Iles 2-3", "time": "11:51:00", "code": "SO", "group": "Amis-Gym Forel-Savigny : Jeunesse M13"}, {"location": "Iles 2-3", "time": "12:19:00", "code": "SO", "group": "Gym Peseux : Jeunesse M17"}, {"location": "Iles 2-3", "time": "12:33:00", "code": "SO", "group": "Agrès Gym 13 étoiles Sion : société"}, {"location": "Iles 2-3", "time": "12:47:00", "code": "SO", "group": "Corsier - Corseaux : Jeunesses mixte"}, {"location": "Iles 2-3", "time": "13:01:00", "code": "SO", "group": "Gym Ursy : Groupe mixte"}, {"location": "Iles 2-3", "time": "13:15:00", "code": "SO", "group": "Fribourg : Jeunesse"}, {"location": "Iles 2-3", "time": "13:29:00", "code": "SO", "group": "Bussigny : Agrès Jeunesse"}, {"location": "Iles 2-3", "time": "13:43:00", "code": "SO", "group": "Pully : TeamGym"}, {"location": "Iles 2-3", "time": "13:57:00", "code": "SO", "group": "Romont Gym : Agrès société 2"}, {"location": "Iles 2-3", "time": "14:11:00", "code": "SO", "group": "Bulle : Agrès Mixtes"}, {"location": "Iles 2-3", "time": "14:25:00", "code": "SO", "group": "Lausanne-Ville : Agrès"}, {"location": "Iles 2-3", "time": "14:39:00", "code": "SO", "group": "Aigle-Alliance : Agrès-mixtes"}, {"location": "Iles 2-3", "time": "14:53:00", "code": "SO", "group": "Vevey-Ancienne : Groupe Mixte Jeunesse"}, {"location": "Iles 2-3", "time": "15:07:00", "code": "SO", "group": "Chézard-St-Martin : Jeunesse M17"}, {"location": "Iles 2-3", "time": "15:21:00", "code": "SO", "group": "Vevey Jeunes-Patriotes : Groupe Mixte A"}, {"location": "Iles 2-3", "time": "15:35:00", "code": "SO", "group": "Chardonne-Jongny : Jeunesse M16"}, {"location": "Iles 2-3", "time": "15:49:00", "code": "SO", "group": "Corsier-Corseaux : Agrès-mixte"}, {"location": "Iles 2-3", "time": "16:03:00", "code": "SO", "group": "Niederscherli : Groupe Jeuesse"}, {"location": "Iles 2-3", "time": "16:17:00", "code": "SO", "group": "Prilly : Agrès Jeunesse"}, {"location": "Iles 2-3", "time": "16:31:00", "code": "SO", "group": "Morges : Jeunesse"}, {"location": "Iles 2-3", "time": "16:45:00", "code": "SO", "group": "Payerne : Agrès Société Jeunesse"}, {"location": "Iles 2-3", "time": "16:59:00", "code": "SO", "group": "St-Prex : Agrès Production"}, {"location": "Iles 2-3", "time": "17:13:00", "code": "SO", "group": "Vevey Jeunes-Patriotes : Jeunesses-Mixtes"}, {"location": "Iles 2-3", "time": "17:27:00", "code": "SO", "group": "Amis-Gyms Yverdon : Agrès mixtes"}, {"location": "Léon-Michaud 1", "time": "08:00:00", "code": "GYSE", "group": "Lausanne-Ville : Juniors"}, {"location": "Léon-Michaud 1", "time": "08:12:00", "code": "GYSE", "group": "Lucens : Gym-Danse M17"}, {"location": "Léon-Michaud 1", "time": "08:24:00", "code": "GYSE", "group": "Morges : GD jeunesse"}, {"location": "Léon-Michaud 1", "time": "08:36:00", "code": "GYSE", "group": "Prilly : Moyennes"}, {"location": "Léon-Michaud 1", "time": "08:48:00", "code": "GYSE", "group": "Roche : Concours M16"}, {"location": "Léon-Michaud 1", "time": "09:00:00", "code": "GYSE", "group": "Cossonay : Jeunesse"}, {"location": "Léon-Michaud 1", "time": "09:12:00", "code": "GYSE", "group": "Rolle : gym danse mixte 12-15"}, {"location": "Léon-Michaud 1", "time": "09:24:00", "code": "GYSE", "group": "Ollon/St-Triphon : Gym et Danse"}, {"location": "Léon-Michaud 1", "time": "09:36:00", "code": "GYSE", "group": "Vallorbe : Mini-gym Danse"}, {"location": "Léon-Michaud 1", "time": "09:48:00", "code": "GYSE", "group": "Chailly-Montreux : Gym & danse 13-16 ans"}, {"location": "Léon-Michaud 1", "time": "10:00:00", "code": "GYSE", "group": "Martigny Octoduria : Jeunesse A"}, {"location": "Léon-Michaud 1", "time": "10:12:00", "code": "GYSE", "group": "Chailly-Lausanne : Gymnastique et Danse Team"}, {"location": "Léon-Michaud 1", "time": "10:59:00", "code": "ST", "group": "Sins-Oberrüti : Jugend"}, {"location": "Léon-Michaud 1", "time": "11:13:00", "code": "ST", "group": "Gym Peseux : Jeunesse M17"}, {"location": "Léon-Michaud 1", "time": "11:27:00", "code": "ST", "group": "Bussigny : Agrès Jeunesse"}, {"location": "Léon-Michaud 1", "time": "11:41:00", "code": "ST", "group": "Chernex : Agrès Mixtes"}, {"location": "Léon-Michaud 1", "time": "11:55:00", "code": "ST", "group": "Romont Gym : Agrès société 2"}, {"location": "Léon-Michaud 1", "time": "12:09:00", "code": "ST", "group": "Bulle : Agrès Mixtes"}, {"location": "Léon-Michaud 1", "time": "12:23:00", "code": "ST", "group": "Yvonand : Agrès-Mixtes"}, {"location": "Léon-Michaud 1", "time": "12:37:00", "code": "ST", "group": "Aigle-Alliance : Agrès-mixtes"}, {"location": "Léon-Michaud 1", "time": "12:51:00", "code": "ST", "group": "Kirchberg : Jugend"}, {"location": "Léon-Michaud 1", "time": "13:05:00", "code": "ST", "group": "Amis-Gyms Yverdon : Agrès mixtes"}, {"location": "Léon-Michaud 1", "time": "13:19:00", "code": "ST", "group": "Yverdon-Ancienne : Mixtes"}, {"location": "Léon-Michaud 1", "time": "13:33:00", "code": "ST", "group": "Chézard-St-Martin : Jeunesse M17"}, {"location": "Léon-Michaud 1", "time": "13:42:00", "code": "GYSE", "group": "Amis Gym Fully : Juniors"}, {"location": "Léon-Michaud 1", "time": "13:54:00", "code": "GYSE", "group": "Chardonne-Jongny : Jeunesse M16"}, {"location": "Léon-Michaud 1", "time": "14:06:00", "code": "GYSE", "group": "Courtepin : Danse 2"}, {"location": "Léon-Michaud 1", "time": "14:18:00", "code": "GYSE", "group": "Sins-Oberrüti : Jugend"}, {"location": "Léon-Michaud 1", "time": "14:30:00", "code": "GYSE", "group": "Vallorbe : Gym-Danse"}, {"location": "Léon-Michaud 1", "time": "14:42:00", "code": "GYSE", "group": "Sion Fémina : Gym Danse jeunesse A"}, {"location": "Léon-Michaud 1", "time": "14:54:00", "code": "GYSE", "group": "La Tour-de-Trême : Jeunesse -16ans"}, {"location": "Léon-Michaud 1", "time": "15:06:00", "code": "GYSE", "group": "Aubonne : Gym & Danse 13-16 ans"}, {"location": "Léon-Michaud 1", "time": "15:18:00", "code": "GYSE", "group": "Sins-Oberrüti : Jugend"}, {"location": "Léon-Michaud 1", "time": "15:30:00", "code": "GYSE", "group": "Corcelles-le-Jorat : Gym-Danse"}, {"location": "Léon-Michaud 1", "time": "15:42:00", "code": "GYSE", "group": "Aubonne : Gym & Danse 8-12 2"}, {"location": "Léon-Michaud 1", "time": "15:54:00", "code": "GYSE", "group": "Rolle : gym danse mixte 7-12 ans"}, {"location": "Léon-Michaud 1", "time": "16:06:00", "code": "GYSE", "group": "Martigny Octoduria : Jeunesse B Minis"}, {"location": "Léon-Michaud 1", "time": "16:18:00", "code": "GYSE", "group": "Le Mont-sur-Lausanne : Gym Danse 10-12 ans"}, {"location": "Léon-Michaud 1", "time": "16:30:00", "code": "GYSE", "group": "Aubonne : Gym & Danse 8-12 1"}, {"location": "Léon-Michaud 2", "time": "08:06:00", "code": "GYAE", "group": "Cossonay : Pupillettes"}, {"location": "Léon-Michaud 2", "time": "08:18:00", "code": "GYAE", "group": "Echallens : Gym-danse 7-12 ans"}, {"location": "Léon-Michaud 2", "time": "08:30:00", "code": "GYAE", "group": "Grandson : Gym & Danse"}, {"location": "Léon-Michaud 2", "time": "08:42:00", "code": "GYAE", "group": "Massongex : Jeunesse"}, {"location": "Léon-Michaud 2", "time": "08:54:00", "code": "GYAE", "group": "Martigny Octoduria : Jeunesse B - Moyenne"}, {"location": "Léon-Michaud 2", "time": "09:06:00", "code": "GYAE", "group": "Amis Gym Fully : Jeunesse B"}, {"location": "Léon-Michaud 2", "time": "09:18:00", "code": "GYAE", "group": "Sion Fémina : Gym Danse jeunesse B engins"}, {"location": "Léon-Michaud 2", "time": "09:30:00", "code": "GYAE", "group": "Prilly : Petites"}, {"location": "Léon-Michaud 2", "time": "09:42:00", "code": "GYAE", "group": "Fémina Vicques : Minis"}, {"location": "Léon-Michaud 2", "time": "09:54:00", "code": "GYAE", "group": "Aubonne : Gym & Danse 8-12 2"}, {"location": "Léon-Michaud 2", "time": "10:06:00", "code": "GYAE", "group": "Gym-Rolle : Gymnastique 8 - 12 ans"}, {"location": "Léon-Michaud 2", "time": "10:18:00", "code": "GYAE", "group": "Lausanne-Ville : Jeunesse"}, {"location": "Léon-Michaud 2", "time": "11:06:00", "code": "GYAE", "group": "Courtepin : Danse 1"}, {"location": "Léon-Michaud 2", "time": "11:18:00", "code": "GYAE", "group": "Veyrier : Jeunesse"}, {"location": "Léon-Michaud 2", "time": "11:32:00", "code": "GYAE", "group": "Baulmes : Gym-Danse Jeunesse"}, {"location": "Léon-Michaud 2", "time": "11:46:00", "code": "GYAE", "group": "Lucens : Gym-Danse M13"}, {"location": "Léon-Michaud 2", "time": "12:00:00", "code": "GYAE", "group": "Chailly-Montreux : Gym & danse 7-12 ans"}, {"location": "Léon-Michaud 2", "time": "12:14:00", "code": "GYAE", "group": "Ollon/St-Triphon : Gym et Danse"}, {"location": "Léon-Michaud 2", "time": "12:28:00", "code": "GYAE", "group": "Yverdon-Ancienne : Jeunesses 1"}, {"location": "Léon-Michaud 2", "time": "12:42:00", "code": "GYAE", "group": "Chailly-Lausanne : Gymnastique et Danse Team"}, {"location": "Léon-Michaud 2", "time": "12:56:00", "code": "GYAE", "group": "Corcelles-le-Jorat : Gym-Danse"}, {"location": "Léon-Michaud 2", "time": "13:36:00", "code": "GYAE", "group": "Sins-Oberrüti : Jugend"}, {"location": "Léon-Michaud 2", "time": "13:48:00", "code": "GYAE", "group": "Lausanne Amis-Gym : Junior GGD"}, {"location": "Léon-Michaud 2", "time": "14:00:00", "code": "GYAE", "group": "Vicques : Cracks"}, {"location": "Léon-Michaud 2", "time": "14:12:00", "code": "GYAE", "group": "Cossonay : Jeunesse"}, {"location": "Léon-Michaud 2", "time": "14:24:00", "code": "GYAE", "group": "Lausanne Amis-Gym : Junior GGD"}, {"location": "Léon-Michaud 2", "time": "14:36:00", "code": "GYAE", "group": "Ollon/St-Triphon : Gym et Danse"}, {"location": "Léon-Michaud 2", "time": "14:48:00", "code": "GYAE", "group": "Aubonne : Gym & Danse 13-16 ans"}, {"location": "Léon-Michaud 2", "time": "15:00:00", "code": "GYAE", "group": "Vicques : Cracks"}, {"location": "Léon-Michaud 2", "time": "15:12:00", "code": "GYAE", "group": "Cossonay : Jeunesse"}, {"location": "Léon-Michaud 2", "time": "15:24:00", "code": "GYAE", "group": "Lausanne Amis-Gym : Junior GGD"}, {"location": "Léon-Michaud 2", "time": "15:36:00", "code": "GYAE", "group": "Ollon/St-Triphon : Gym et Danse"}, {"location": "Léon-Michaud 2", "time": "15:48:00", "code": "GYAE", "group": "Aubonne : Gym & Danse 13-16 ans"}]
};

export default defineEventHandler(async (event) => {
  try {
    console.log("[seed] Starting DB seed — clearing collections...");

    await Promise.all([
      ApparatusModel.deleteMany({}),
      GroupModel.deleteMany({}),
      PassageModel.deleteMany({}),
      StreamModel.deleteMany({}),
      SubscriptionModel.deleteMany({}),
    ]);

    console.log("[seed] Collections cleared");

    // 1. APPARATUS
    const apparatusList = [
      { code: "SS", name: "Sol", icon: "fluent:grid-dots-24-regular" },
      { code: "BA", name: "Barres Parallèles", icon: "fluent:table-simple-24-regular" },
      { code: "AB", name: "Anneaux Balançants", icon: "fluent:circle-24-regular" },
      { code: "SA", name: "Saut", icon: "fluent:arrow-up-24-regular" },
      { code: "RE", name: "Reck", icon: "fluent:arrow-rotate-clockwise-24-regular" },
      { code: "BAS", name: "Barres Asymétriques", icon: "fluent:align-space-evenly-vertical-20-regular" },
      { code: "CE", name: "Combinaison d'engins", icon: "fluent:puzzle-piece-24-regular" },
      { code: "SO", name: "Sol", icon: "fluent:grid-dots-24-regular" },
      { code: "BP", name: "Barres Parallèles", icon: "fluent:table-simple-24-regular" },
      { code: "BF", name: "Barre Fixe", icon: "fluent:arrow-rotate-clockwise-24-regular" },
      { code: "GYAE", name: "Gymnastique avec engins", icon: "fluent:ribbon-24-regular" },
      { code: "GYSE", name: "Gymnastique sans engins", icon: "fluent:people-24-regular" },
      { code: "ST", name: "Saut", icon: "fluent:arrow-up-24-regular" }
    ];

    const insertedApparatus = await ApparatusModel.insertMany(apparatusList);
    const appMap = new Map<string, unknown>();
    for (const a of insertedApparatus) {
      appMap.set(a.code, a._id);
    }

    // Fonction pour générer un score réaliste (entre 7.5 et 9.8)
    const generateScore = () => {
      return Math.round((7.5 + Math.random() * 2.3) * 100) / 100;
    };

    // Fonction pour générer un historique de 7 années de notes pour un passage
    // (scores des éditions précédentes du concours pour ce groupe sur cet engin)
    const generatePassageHistory = () => {
      const history: { year: number; score: number }[] = [];
      const currentYear = new Date().getFullYear();
      
      // Génère 7 entrées d'historique (7 années précédentes)
      for (let i = 1; i <= 7; i++) {
        history.push({
          year: currentYear - i,
          score: generateScore()
        });
      }
      
      // Trie par année décroissante (plus récent en premier)
      return history.sort((a, b) => b.year - a.year);
    };

    // 2. GROUPS
    const uniqueGroups = new Set<string>();
    [...RAW_SCHEDULE.actifs, ...RAW_SCHEDULE.jeunesse].forEach(p => uniqueGroups.add(p.group));

    const groupDocs = Array.from(uniqueGroups).map(name => {
        // Utilise la fonction d'extraction du canton
        const canton = extractCanton(name);
        
        // Génère un nombre de gymnastes réaliste (6 à 16)
        const gymnastsCount = Math.floor(Math.random() * 11) + 6;
        
        return {
            name,
            category: name.toLowerCase().includes("mixte") ? 'MIXTE' : 'ACTIFS',
            gymnastsCount,
            canton
        };
    });

    const insertedGroups = await GroupModel.insertMany(groupDocs);
    const groupMap = new Map<string, unknown>();
    for (const g of insertedGroups) {
      groupMap.set(g.name, g._id);
    }

    // 3. PROCESS PASSAGES (Calculation Logic)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Helper to convert HH:MM:SS to Date object
    const getTimeDate = (timeStr: string, baseDate: Date) => {
        const parts = timeStr.split(':');
        const d = new Date(baseDate);
        d.setHours(
          parseInt(parts[0] || '0', 10),
          parseInt(parts[1] || '0', 10),
          parseInt(parts[2] || '0', 10)
        );
        return d;
    };

    // Prepare objects with dates
    const rawPassagesWithDates = [
        ...RAW_SCHEDULE.actifs.map(p => ({ ...p, startTime: getTimeDate(p.time, today) })),
        ...RAW_SCHEDULE.jeunesse.map(p => ({ ...p, startTime: getTimeDate(p.time, tomorrow) }))
    ];

    // GROUP BY BIG HALL ("Iles" vs "Léon") to calculate interleaved duration
    const bigHalls = new Map<string, any[]>();
    
    rawPassagesWithDates.forEach(p => {
        let key = "";
        if (p.location.startsWith("Iles")) key = "Iles";
        else if (p.location.startsWith("Léon")) key = "Léon";
        else key = "Autre";

        // Separate by Day as well (don't mix today and tomorrow)
        const dayKey = key + "_" + p.startTime.getDate();
        
        if (!bigHalls.has(dayKey)) bigHalls.set(dayKey, []);
        bigHalls.get(dayKey)?.push(p);
    });

    const finalPassages: any[] = [];
    const now = new Date();

    // Iterate over each "Big Hall Schedule"
    bigHalls.forEach((passages) => {
        // Sort purely by time
        passages.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        // Calculate End Times
        for (let i = 0; i < passages.length; i++) {
            const current = passages[i];
            let endTime;

            if (i < passages.length - 1) {
                // End time is Start time of NEXT passage in the big hall
                endTime = new Date(passages[i+1].startTime);
            } else {
                // Last passage gets fixed 7 minutes
                endTime = new Date(current.startTime.getTime() + 7 * 60000);
            }

            // Determine Status
            let status = 'SCHEDULED';
            if (now >= endTime) {
                status = 'FINISHED';
            } else if (now >= current.startTime && now < endTime) {
                status = 'LIVE';
            }

            const grpId = groupMap.get(current.group);
            const appId = appMap.get(current.code);

            // Génère des moniteurs fictifs pour le passage
            const MONITOR_NAMES = [
                'Marie Dupont', 'Jean Martin', 'Sophie Bernard', 'Pierre Durand',
                'Isabelle Petit', 'François Moreau', 'Claire Laurent', 'Michel Roux',
                'Nathalie Simon', 'Christophe Blanc', 'Anne Favre', 'Philippe Meyer'
            ];
            
            // Sélectionne 1 à 3 moniteurs aléatoires
            const numMonitors = Math.floor(Math.random() * 3) + 1;
            const shuffled = [...MONITOR_NAMES].sort(() => 0.5 - Math.random());
            const passageMonitors = shuffled.slice(0, numMonitors);

            if (grpId && appId) {
                finalPassages.push({
                    group: grpId,
                    apparatus: appId,
                    startTime: current.startTime,
                    endTime: endTime,
                    location: current.location,
                    status: status,
                    // Les passages terminés ont une note et mets isPublished à true, les autres non
                    score: status === 'FINISHED' ? generateScore() : null,
                    isPublished: status === 'FINISHED',
                    monitors: passageMonitors,
                    // Historique des 7 années précédentes pour ce passage
                    history: generatePassageHistory()
                });
            }
        }
    });

    const insertedPassages = await PassageModel.insertMany(finalPassages);
    console.log(`[seed] Created ${insertedPassages.length} Passages`);

    // 4. STREAMS
    // On force la création des 5 caméras possibles pour correspondre à toutes les configurations
    // Iles 1-2, Iles 2-3, Léon-Michaud (Actifs), Léon-Michaud 1 (Jeunesse), Léon-Michaud 2 (Jeunesse)
    
    const definedCameras = [
        { loc: "Iles 1-2", name: "Iles 1-2", url: "https://www.youtube.com/embed/jfKfPfyJRdk" },
        { loc: "Iles 2-3", name: "Iles 2-3", url: "https://www.youtube.com/embed/36YnV9STBqc?si=ns2_QOjchVwyyqUL" },
        // Configuration Samedi
        { loc: "Léon-Michaud", name: "Léon-Michaud (Global)", url: "https://www.youtube.com/embed/mKCieTImjvU?si=mCOGyTE4VSpU8WVV" },
        // Configuration Dimanche
        { loc: "Léon-Michaud 1", name: "Léon-Michaud 1", url: "https://www.youtube.com/embed/fO9e9jnhYK8?si=kl4F7UKi4I3-cA7R" },
        { loc: "Léon-Michaud 2", name: "Léon-Michaud 2", url: "https://www.youtube.com/embed/AJmaVPfyudQ?si=gkESlR5mbTwNYLaz" }
    ];

    const streamsData = [];

    for (const cam of definedCameras) {
        // On cherche s'il y a un passage EN DIRECT dans cette salle pour l'associer
        const liveP = insertedPassages.find((p: { location?: string; status?: string }) => p.location === cam.loc && p.status === 'LIVE');
        
        streamsData.push({
            name: cam.name,
            url: cam.url, 
            location: cam.loc,
            isLive: true,
            currentPassage: liveP ? liveP._id : null
        });
    }

    const insertedStreams = await StreamModel.insertMany(streamsData);
    console.log(`[seed] Created ${insertedStreams.length} Streams (Caméras)`);

    // Invalidate Nitro server-side cache so that the next requests to /api/schedule
    // and /api/results return fresh data instead of the stale SWR-cached responses.
    try {
      const cacheStorage = useStorage('cache')
      const allCacheKeys = await cacheStorage.getKeys()
      if (allCacheKeys.length > 0) {
        await Promise.all(allCacheKeys.map(key => cacheStorage.removeItem(key)))
        console.log(`[seed] Cleared ${allCacheKeys.length} Nitro cache entries`)
      }
    } catch (cacheErr) {
      console.warn('[seed] Could not clear Nitro cache:', cacheErr)
    }

    return { 
      success: true, 
      summary: { 
        passages: insertedPassages.length, 
        streams: insertedStreams.length 
      } 
    };
  } catch (err) {
    console.error("[seed] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
});