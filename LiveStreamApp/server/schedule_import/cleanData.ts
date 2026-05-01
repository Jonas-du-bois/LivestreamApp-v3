import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers les fichiers
const RAW_FILE_PATH = path.join(__dirname, 'exportResultats.json');
const CLEANED_FILE_PATH = path.join(__dirname, 'cleanedResultats.json');

// Dictionnaire pour corriger l'encodage brisé
const ENCODING_FIXES: Record<string, string> = {
    'Fmina': 'Fémina',
    'La Tour-de-Trme': 'La Tour-de-Trême',
    'Chzard-St-Martin': 'Chézard-St-Martin',
    'Chzard-st-Martin': 'Chézard-st-Martin',
    'La Grnarde': 'La Grônarde',
    'Ddingen': 'Düdingen',
    'Agrs': 'Agrès',
    'comptition': 'compétition',
    'Socit': 'Société',
    'Valle': 'Vallée',
    'Serrires': 'Serrières',
    'asymtrique': 'asymétrique',
    'parallles': 'parallèles'
};

// Dictionnaire de mapping pour les disciplines (engins)
const APPARATUS_MAP: Record<string, string> = {
    '12x12 m': '12x12',
    '12x12m': '12x12',
    '12x18 m': '12x18',
    '12x24 m': '12x24',
    'Anneaux balançants': 'AB',
    'Barre asymétrique scolaires': 'BAS',
    'Barre fixe': 'BF',
    'Barres parallèles': 'BP',
    'Combinaison d\'engins': 'CE',
    'Saut': 'ST',
    'Sol': 'SO'
};

// Dictionnaire de mapping pour les catégories
const CATEGORY_MAP: Record<string, string> = {
    'Actifs-Actives': 'ACTIFS',
    'Actifs- Actives': 'ACTIFS',
    'Jeunesse A -16 ans': 'JEUNESSE_A',
    'Jeunesse A-16 ans': 'JEUNESSE_A',
    'JeunesseA -16 ans': 'JEUNESSE_A',
    'Jeunesse B -12 ans': 'JEUNESSE_B',
    'Jeunesse B-12 ans': 'JEUNESSE_B',
    'Jeunesse B -12ans': 'JEUNESSE_B'
};

// --- MAPPING VILLES -> CANTONS SUISSES ---
const CITY_TO_CANTON: Record<string, string> = {
  // Vaud (VD)
  'Lausanne': 'VD', 'Morges': 'VD', 'Lucens': 'VD', 'Blonay': 'VD', 'Rolle': 'VD', 'Aubonne': 'VD', 'Prilly': 'VD', 'Cossonay': 'VD', 'Chailly-Montreux': 'VD', 'Vallorbe': 'VD', 'Bex': 'VD', 'Ollon': 'VD', 'Chardonne-Jongny': 'VD', 'Echallens': 'VD', 'Le Mont-sur-Lausanne': 'VD', 'Avenches': 'VD', 'Vevey': 'VD', 'Domdidier': 'VD', 'Corsier-Corseaux': 'VD', 'Granges-Marnand': 'VD', 'Bussigny': 'VD', 'St-Prex': 'VD', 'Pully': 'VD', 'Grandson': 'VD', 'Chexbres': 'VD', 'Ependes': 'VD', 'Corcelles': 'VD', 'St-Cierges': 'VD', 'Yvonand': 'VD', 'Baulmes': 'VD', 'Chernex': 'VD', 'Lutry': 'VD', 'Le Lieu': 'VD', 'Yverdon': 'VD', 'Nyon': 'VD',
  // Fribourg (FR)
  'Attalens': 'FR', 'Courtepin': 'FR', 'La Tour-de-Trême': 'FR', 'Charmey': 'FR', 'Ursy': 'FR', 'Bulle': 'FR', 'Fribourg': 'FR', 'Romont': 'FR', 'Düdingen': 'FR',
  // Neuchâtel (NE)
  'Hauterive': 'NE', 'Peseux': 'NE', 'Chézard-St-Martin': 'NE', 'La Coudre': 'NE', 'Serrières': 'NE',
  // Valais (VS)
  'Fully': 'VS', 'Sion': 'VS', 'Roche': 'VS', 'Martigny': 'VS',
  // Berne (BE)
  'Niederscherli': 'BE',
  // Jura (JU)
  'Vicques': 'JU', 'Courroux': 'JU', 'Develier': 'JU',
  // Genève (GE)
  'Lancy': 'GE',
  // Argovie (AG)
  'Neuenhof': 'AG', 'Wettingen': 'AG', 'Sins-Oberrüti': 'AG',
  // Tessin (TI)
  'Mendrisio': 'TI', 'Biasca': 'TI',
  // Lucerne (LU)
  'Luzern': 'LU'
};

const extractCanton = (groupName: string): string => {
    for (const [city, canton] of Object.entries(CITY_TO_CANTON)) {
        if (groupName.includes(city)) {
            return canton;
        }
    }
    return 'VD'; // Default
};

const fixEncoding = (str: string): string => {
    let fixed = str;
    for (const [broken, correct] of Object.entries(ENCODING_FIXES)) {
        fixed = fixed.replace(new RegExp(broken, 'g'), correct);
    }
    return fixed;
};

// Fonction principale de nettoyage
const cleanData = () => {
    console.log('Reading raw JSON data...');
    const rawData = fs.readFileSync(RAW_FILE_PATH, 'utf-8');
    const json = JSON.parse(rawData);

    const cleanedInscriptions = json.inscriptions.map((item: any) => {
        // 1. Correction d'encodage
        const societe = fixEncoding(item.Societe || '').trim();
        const groupe = fixEncoding(item.Groupe || '').trim();
        const rawCategorie = fixEncoding(item.Categorie || '').trim();
        const rawDiscipline = fixEncoding(item.Discipline || '').trim();

        // 2. Mapping
        const apparatusCode = APPARATUS_MAP[rawDiscipline] || rawDiscipline;
        let category = CATEGORY_MAP[rawCategorie] || 'ACTIFS';
        let subCategory = category;
        
        // La catégorie mixte englobe Jeunesse A et Jeunesse B
        if (category === 'JEUNESSE_A' || category === 'JEUNESSE_B') {
            subCategory = category;
            category = 'MIXTE';
        }

        const canton = extractCanton(societe);
        const location = `${item.Lieu1} ${item.Lieu2}`.trim();

        // 3. Attribution des dates (9 mai ou 10 mai)
        // Le samedi est réservé aux ACTIFS uniquement. 
        // Le dimanche est pour les catégories Jeunesse (A, B) qui sont devenues MIXTE.
        const isSaturday = category === 'ACTIFS';
        const dateStr = isSaturday ? '2026-05-09' : '2026-05-10';
        
        const timeStr = item.Horaire.trim().replace(' ', ''); // "14: 15" -> "14:15"
        const startTimeStr = `${dateStr}T${timeStr}:00.000Z`;

        return {
            groupName: `${societe} : ${groupe}`,
            societe,
            groupe,
            category,
            subCategory,
            canton,
            apparatusCode,
            location,
            startTime: startTimeStr,
        };
    });

    console.log(`Cleaned ${cleanedInscriptions.length} inscriptions.`);
    fs.writeFileSync(CLEANED_FILE_PATH, JSON.stringify({ passages: cleanedInscriptions }, null, 2));
    console.log(`Saved cleaned data to ${CLEANED_FILE_PATH}`);
};

cleanData();