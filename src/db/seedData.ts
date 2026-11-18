import bcrypt from 'bcryptjs';
import { count, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { admins, diseaseLibrary, farmingTips, users } from './schema.ts';

export const VERIFIED_DISEASE_LIBRARY = [
  {
    diseaseName: 'Early Blight',
    scientificName: 'Alternaria solani',
    affectedCrop: 'Tomato',
    severityDefault: 'Medium',
    symptoms:
      'Dark brown to black circular spots with distinct concentric rings ("target board" pattern) starting on older lower leaves, surrounded by yellowing tissue. Severe infection causes leaf drop and sunscald on exposed fruits.',
    causes:
      'Fungal pathogen surviving in infected crop debris and soil. Favored by warm temperatures (24–29°C), high humidity, heavy dew, and alternating wet and dry weather.',
    preventionMethods:
      'Use certified disease-free seeds, practice 2–3 year crop rotation away from solanaceous crops, mulch soil to stop rain splash, stake plants for airflow, and water at the base instead of overhead.',
    treatmentApproaches:
      'Remove and destroy heavily infected lower leaves away from the field. Improve plant nutrition with balanced potassium and compost. Consult local Krishi Vigyan Kendra (KVK) for approved protective copper-based or bio-fungicide sprays such as Trichoderma or neem-based preventive sprays.',
  },
  {
    diseaseName: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    affectedCrop: 'Tomato',
    severityDefault: 'High',
    symptoms:
      'Irregular water-soaked pale green to dark brown blotches on leaves and stems, often with white cottony mold growth on leaf undersides during humid mornings. Fruits develop firm, greasy brown patches.',
    causes:
      'Oomycete pathogen spreading rapidly via wind-borne sporangia during cool, wet, overcast weather (15–22°C with high relative humidity).',
    preventionMethods:
      'Plant tolerant varieties, avoid dense planting, provide good field drainage, avoid evening overhead irrigation, and destroy volunteer tomato or potato plants nearby.',
    treatmentApproaches:
      'Act immediately upon first sighting because late blight spreads rapidly. Prune and safely dispose of affected foliage in dry weather. Seek urgent guidance from an agricultural extension officer for recommended protective and systemic oomycete-targeted management.',
  },
  {
    diseaseName: 'Rice Blast',
    scientificName: 'Magnaporthe oryzae',
    affectedCrop: 'Rice',
    severityDefault: 'High',
    symptoms:
      'Spindle-shaped or diamond-shaped lesions on leaves with whitish-gray centers and dark brown margins. Neck blast causes blackening and breakage at the panicle base, resulting in chaffy grains.',
    causes:
      'Fungal infection favored by excessive nitrogen fertilizer, prolonged leaf wetness, cool nights, high humidity, and cloudy skies.',
    preventionMethods:
      'Grow blast-resistant paddy cultivars, apply split doses of nitrogen rather than heavy single applications, maintain proper field water levels, and treat seeds prior to sowing as advised by agricultural universities.',
    treatmentApproaches:
      'Avoid additional urea top-dressing during outbreaks. Use biological control agents like Pseudomonas fluorescens where recommended locally, and consult your district agriculture officer for stage-specific protective fungicide schedules before heading.',
  },
  {
    diseaseName: 'Bacterial Leaf Blight',
    scientificName: 'Xanthomonas oryzae pv. oryzae',
    affectedCrop: 'Rice',
    severityDefault: 'High',
    symptoms:
      'Water-soaked yellowish stripes starting along leaf margins and tips that turn straw-yellow with wavy edges. Early morning milky bacterial ooze may appear on young lesions and dry into small yellow beads.',
    causes:
      'Bacterium entering through hydathodes or wind/insect wounds, spreading quickly through irrigation water, typhoons, heavy rain, and infected stubble.',
    preventionMethods:
      'Use resistant varieties, ensure clean nursery beds, maintain proper spacing, drain excess standing water, keep bunds weed-free, and balance nitrogen with adequate potash.',
    treatmentApproaches:
      'Stop nitrogen top-dressing immediately and drain stagnant water from affected plots where feasible. Prevent water runoff from infected plots into healthy fields. Consult local agricultural specialists for approved copper-based or botanical preventive management.',
  },
  {
    diseaseName: 'Potato Late Blight',
    scientificName: 'Phytophthora infestans',
    affectedCrop: 'Potato',
    severityDefault: 'High',
    symptoms:
      'Dark, water-soaked patches at leaf tips and edges that expand quickly into brown-black blighted areas with pale green halos. Tubers show reddish-brown granular dry rot beneath the skin.',
    causes:
      'Survives in infected seed tubers and cull piles; spreads rapidly in cool, foggy, rainy periods with sustained high humidity.',
    preventionMethods:
      'Plant certified healthy seed tubers, hill soil well over developing tubers to shield them from spores, remove cull piles completely, and monitor fields closely during cool damp weather.',
    treatmentApproaches:
      'Remove early infection foci carefully. If foliage is heavily blighted near harvest, kill vines 10–14 days before digging so spores do not contaminate tubers. Follow regional agricultural extension spray advisories.',
  },
  {
    diseaseName: 'Common Scab',
    scientificName: 'Streptomyces scabies',
    affectedCrop: 'Potato',
    severityDefault: 'Low',
    symptoms:
      'Rough, corky, raised or slightly pitted brown lesions on the surface of potato tubers. Mostly affects market quality rather than killing the foliage.',
    causes:
      'Soil-borne filamentous bacterium thriving in dry, alkaline soils (pH above 5.5–6.0) during early tuber initiation.',
    preventionMethods:
      'Maintain consistent soil moisture during tuber formation (4–6 weeks after emergence), avoid fresh undecomposed animal manure or heavy liming before potatoes, and rotate with cereal or legume crops.',
    treatmentApproaches:
      'Use clean disease-free seed tubers and tolerant varieties in future seasons. Incorporate green manure crops and maintain slightly acidic soil pH (5.2–5.5) based on a soil health card test.',
  },
  {
    diseaseName: 'Chilli Leaf Curl Virus',
    scientificName: 'Chilli leaf curl virus (Begomovirus)',
    affectedCrop: 'Chilli',
    severityDefault: 'High',
    symptoms:
      'Upward curling and puckering of leaves, thickened veins, severe stunting of shoots, reduced leaf size, and heavy flower drop leading to poor fruit set.',
    causes:
      'Viral disease transmitted primarily by whiteflies (Bemisia tabaci) and aggravated by thrips and mites in warm, dry conditions.',
    preventionMethods:
      'Raise seedlings under insect-proof 40-mesh nylon nets, plant tolerant hybrids, install yellow sticky traps (10–12 per acre) to monitor whiteflies, and maintain border barrier crops like maize or sorghum.',
    treatmentApproaches:
      'There is no chemical cure for viral infections once plants are infected. Uproot and destroy severely infected plants early to stop whiteflies from spreading the virus. Manage vector populations using neem oil sprays and expert-recommended integrated pest management.',
  },
  {
    diseaseName: 'Anthracnose / Fruit Rot',
    scientificName: 'Colletotrichum capsici',
    affectedCrop: 'Chilli',
    severityDefault: 'Medium',
    symptoms:
      'Sunken, circular water-soaked spots on ripe and unripe chilli pods that develop concentric rings of tiny black fruiting bodies. Die-back of tender twigs may also occur.',
    causes:
      'Seed-borne and debris-borne fungus favored by high humidity, frequent rains, and warm temperatures (25–30°C).',
    preventionMethods:
      'Use disease-free seeds, follow seed treatment protocols recommended by KVK, ensure good field drainage, avoid overhead watering, and collect and destroy fallen infected fruits.',
    treatmentApproaches:
      'Harvest and separate infected pods promptly to reduce inoculum spread. Improve canopy ventilation and consult a local agronomist for appropriate protective bio-control or approved fungicidal sprays.',
  },
  {
    diseaseName: 'Cotton Leaf Curl Disease',
    scientificName: 'Cotton leaf curl virus (Begomovirus)',
    affectedCrop: 'Cotton',
    severityDefault: 'High',
    symptoms:
      'Upward or downward leaf cupping, pronounced vein thickening on leaf undersides, leaf-like outgrowths (enations) beneath veins, and stunted boll development.',
    causes:
      'Transmitted persistently by silverleaf whitefly (Bemisia tabaci), surviving on alternate weed hosts between cropping seasons.',
    preventionMethods:
      'Sow tolerant varieties recommended for your zone, complete timely sowing within the regional window, eliminate alternate weeds along bunds, and avoid excessive nitrogen fertilization that attracts whiteflies.',
    treatmentApproaches:
      'Rogue out early affected seedlings. Conserve natural predators like ladybird beetles and lacewings, deploy yellow sticky traps, and follow state agriculture university advisories for whitefly management.',
  },
  {
    diseaseName: 'Bacterial Blight of Cotton',
    scientificName: 'Xanthomonas citri pv. malvacearum',
    affectedCrop: 'Cotton',
    severityDefault: 'Medium',
    symptoms:
      'Angular water-soaked leaf spots bounded by small veins that turn dark brown to black ("angular leaf spot"). Severe infections extend along leaf veins ("black arm") and cause sunken dark boll lesions.',
    causes:
      'Seed-borne and stubble-borne bacterium spread by wind-driven rain and high humidity during warm weather.',
    preventionMethods:
      'Use acid-delinted certified seeds, remove and compost or deep-plow old cotton stalks after harvest, and practice crop rotation.',
    treatmentApproaches:
      'Avoid entering fields when foliage is wet to limit mechanical spread. Maintain balanced soil potash and consult local extension officers for approved copper-based protective interventions.',
  },
  {
    diseaseName: 'Northern Corn Leaf Blight',
    scientificName: 'Exserohilum turcicum',
    affectedCrop: 'Maize',
    severityDefault: 'Medium',
    symptoms:
      'Long, cigar-shaped gray-green to tan necrotic lesions (3–15 cm) running parallel to leaf edges, starting on lower leaves and moving upward toward the ear leaf.',
    causes:
      'Fungal spores overwintering in maize residue; favored by moderate temperatures (18–27°C), heavy dew, and extended leaf wetness.',
    preventionMethods:
      'Select resistant maize hybrids, rotate maize with non-host crops like pulses or oilseeds, and incorporate crop residue into soil to accelerate decomposition.',
    treatmentApproaches:
      'Monitor fields prior to tasseling. Protecting the ear leaf and upper canopy is most critical for yield; consult an agricultural officer if lesions progress rapidly before silking.',
  },
  {
    diseaseName: 'Wheat Leaf Rust (Brown Rust)',
    scientificName: 'Puccinia triticina',
    affectedCrop: 'Wheat',
    severityDefault: 'Medium',
    symptoms:
      'Small, round to oval orange-brown dusty pustules scattered primarily on upper leaf surfaces. Rubbing the leaf leaves a rust-colored powder on fingers.',
    causes:
      'Wind-dispersed fungal urediniospores arriving from regional inoculum sources, thriving in mild temperatures (15–22°C) with morning dew.',
    preventionMethods:
      'Cultivate rust-resistant wheat varieties recommended by ICAR/state universities, avoid late sowing, and balance nitrogen and potassium applications.',
    treatmentApproaches:
      'Inspect fields regularly from tillering to flag-leaf stage. If rust appears early on susceptible cultivars, contact local agricultural extension services promptly for approved rust management guidance.',
  },
  {
    diseaseName: 'Red Rot of Sugarcane',
    scientificName: 'Colletotrichum falcatum',
    affectedCrop: 'Sugarcane',
    severityDefault: 'High',
    symptoms:
      'Yellowing and drying of the 3rd and 4th leaves from top downward. Splitting an infected stalk lengthwise reveals dull red internal tissue interrupted by characteristic white transverse patches and an alcoholic odor.',
    causes:
      'Fungal pathogen spread predominantly through infected planting setts and moving irrigation water in waterlogged fields.',
    preventionMethods:
      'Plant strictly disease-free setts from healthy nurseries, choose resistant varieties, avoid ratooning severely affected fields, ensure proper field drainage, and rotate with paddy or legumes.',
    treatmentApproaches:
      'Uproot and destroy affected clumps immediately and avoid letting irrigation water pass from diseased rows to healthy rows. Follow recommended sett treatment (such as moist hot air treatment) before planting new crops.',
  },
  {
    diseaseName: 'Panama Wilt (Fusarium Wilt)',
    scientificName: 'Fusarium oxysporum f. sp. cubense',
    affectedCrop: 'Banana',
    severityDefault: 'High',
    symptoms:
      'Progressive yellowing of older outer leaves from margins inward, collapsing petiole bases forming a "skirt" of dead leaves around the pseudostem, and reddish-brown discoloration of internal vascular strands.',
    causes:
      'Soil-borne fungus persisting for many years in infested soil, spread via infected suckers, contaminated soil on tools, footwear, and floodwater.',
    preventionMethods:
      'Plant certified tissue-culture banana plantlets, practice strict farm biosecurity (clean tools and footwear), maintain good drainage, and apply organic matter enriched with Trichoderma viride to soil.',
    treatmentApproaches:
      'Infected plants cannot be cured; carefully isolate and destroy affected mats without dragging soil across healthy blocks. Avoid replanting susceptible varieties in infested plots and seek local horticultural department advice for tolerant cultivars.',
  },
  {
    diseaseName: 'Tikka Leaf Spot (Early & Late)',
    scientificName: 'Cercospora arachidicola & Cercosporidium personatum',
    affectedCrop: 'Groundnut',
    severityDefault: 'Medium',
    symptoms:
      'Early leaf spot forms reddish-brown circular spots surrounded by a bright yellow halo; late leaf spot forms darker brown-black spots mostly on lower leaf surfaces, leading to heavy premature defoliation.',
    causes:
      'Fungal pathogens surviving in infected plant debris and volunteer groundnut plants, promoted by warm humid weather and frequent rainfall.',
    preventionMethods:
      'Practice crop rotation with cereals, remove volunteer groundnut plants, use tolerant varieties, maintain recommended spacing, and treat seeds prior to sowing.',
    treatmentApproaches:
      'Scout fields starting 30 days after sowing. Botanical sprays like neem seed kernel extract (NSKE) or expert-recommended protective sprays help limit leaf drop during pod filling.',
  },
];

export const VERIFIED_FARMING_TIPS = [
  {
    title: 'Early Morning Field Scouting Routine',
    category: 'Crop protection',
    season: 'All Seasons',
    summary: 'Inspect undersides of leaves twice a week during cool morning hours to catch blight, rust, and sucking pests before they spread.',
    content:
      'Walk your field in a W-pattern at least twice weekly, checking 10–15 random plants across corners and center rows. Look carefully underneath lower leaves where fungal spores, whiteflies, and aphids appear first. Catching infections at under 5% leaf incidence saves crop yield and drastically lowers management costs.',
  },
  {
    title: 'Field Sanitation and Crop Residue Management',
    category: 'Crop protection',
    season: 'Post-Harvest',
    summary: 'Remove diseased plant debris and volunteer weeds between seasons to break fungal and viral disease cycles.',
    content:
      'Many major pathogens—including Early Blight, Rice Blast, and Bacterial Blight—survive from one season to the next on left-over stems, fallen leaves, and bund weeds. Deep-compost healthy residue and safely dispose of severely diseased material away from irrigation channels so next season’s seedlings start clean.',
  },
  {
    title: 'Neem Seed Kernel Extract & Bio-Agent Protection',
    category: 'Organic farming',
    season: 'Kharif & Rabi',
    summary: 'Use Trichoderma-enriched compost and gentle neem botanical sprays to protect crops while preserving helpful pollinators.',
    content:
      'Enriching well-decomposed farmyard manure (FYM) with Trichoderma viride or Pseudomonas fluorescens builds beneficial root-zone microbes that outcompete soil-borne wilt fungi. For early sucking pest deterrence, apply properly filtered neem-based preparations during late afternoon so bees and beneficial ladybird beetles remain protected.',
  },
  {
    title: 'Mulching with Crop Straw for Cooler Roots',
    category: 'Organic farming',
    season: 'Summer & Kharif',
    summary: 'Spread dry paddy straw or dried leaves around crop rows to conserve moisture, suppress weeds, and prevent soil splash diseases.',
    content:
      'A 5–7 cm layer of organic mulch around vegetable crops like tomato, chilli, and banana lowers topsoil temperature, cuts evaporation by up to 30%, suppresses competing weeds, and stops rain droplets from splashing soil-borne fungal spores onto lower foliage. Keep mulch 3–5 cm away from the main stem collar.',
  },
  {
    title: 'Base Watering Over Overhead Sprinkling',
    category: 'Irrigation management',
    season: 'All Seasons',
    summary: 'Irrigate near the root zone in the early morning instead of wetting foliage at night to prevent fungal blights.',
    content:
      'Prolonged leaf wetness overnight is one of the fastest triggers for late blight, anthracnose, and downy mildew. Use drip irrigation or furrow watering at the plant base during morning hours so any moisture on leaves dries quickly in sunlight.',
  },
  {
    title: 'Preventing Waterlogging and Root Rot',
    category: 'Irrigation management',
    season: 'Monsoon / Kharif',
    summary: 'Maintain raised beds and open field drainage channels before heavy rains to protect roots from oxygen starvation.',
    content:
      'Standing water for more than 24–48 hours deprives roots of oxygen and creates ideal conditions for Phytophthora and Fusarium root rots in chilli, tomato, cotton, and banana. Prepare raised planting ridges and keep perimeter drainage furrows clear prior to monsoon showers.',
  },
  {
    title: 'Soil Testing Before Fertilizer Application',
    category: 'Soil health',
    season: 'Pre-Sowing',
    summary: 'Test soil pH and NPK levels every 2 years through a Soil Health Card lab to avoid excess urea that invites pests and blast.',
    content:
      'Excessive nitrogen makes leaves overly lush and soft, making rice prone to Blast and cotton/chilli highly attractive to whiteflies and aphids. Collect composite topsoil samples (15 cm depth) from multiple spots in your plot and follow balanced NPK plus micronutrient (zinc, boron) guidance from your soil report.',
  },
  {
    title: 'Legume Crop Rotation for Natural Nitrogen',
    category: 'Soil health',
    season: 'Seasonal Rotation',
    summary: 'Alternate heavy-feeding cereals or vegetables with pulses like green gram, chickpea, or groundnut to restore soil fertility.',
    content:
      'Continuous monocropping depletes specific nutrients and builds up host-specific nematodes and wilt pathogens. Rotating tomatoes or rice with leguminous crops naturally fixes atmospheric nitrogen through root nodules, breaks soil pathogen lifecycles, and improves organic soil structure.',
  },
  {
    title: 'Sticky Traps and Border Crops for Virus Control',
    category: 'Pest prevention',
    season: 'Kharif & Summer',
    summary: 'Install yellow and blue sticky traps and plant tall maize or sorghum border rows to block virus-carrying whiteflies and thrips.',
    content:
      'Viral diseases such as Chilli Leaf Curl and Cotton Leaf Curl cannot be cured once plants are infected—stopping the insect vector early is key. Place yellow sticky traps just above the crop canopy for whiteflies and blue traps for thrips, and sow 2–3 rows of maize or bajra along field borders 2 weeks ahead of transplanting.',
  },
  {
    title: 'Protecting Natural Beneficial Insects',
    category: 'Pest prevention',
    season: 'All Seasons',
    summary: 'Conserve ladybird beetles, spiders, and lacewings by avoiding unnecessary broad-spectrum chemical sprays.',
    content:
      'A single ladybird beetle larva consumes dozens of aphids and whitefly nymphs daily. Avoid routine calendar spraying when pest counts are below economic thresholds; plant flowering marigold or coriander strips along bunds to shelter natural predators.',
  },
  {
    title: 'Kharif Monsoon Preparedness Checklist',
    category: 'Seasonal farming tips',
    season: 'Kharif (June–October)',
    summary: 'Select certified treated seeds, verify drainage channels, and stagger nursery sowing ahead of monsoon onset.',
    content:
      'Before monsoon arrival, test seed germination rate using a damp cloth test (aim for >85%), deep-plow fields during summer to expose soil pupae and fungal sclerotia to sunlight, clean bunds of alternate weed hosts, and choose disease-tolerant varieties suited to your district rainfall pattern.',
  },
  {
    title: 'Rabi Winter Dew & Rust Monitoring',
    category: 'Seasonal farming tips',
    season: 'Rabi (November–March)',
    summary: 'Watch for morning dew buildup in wheat, potato, and chickpea crops during cool January–February weeks.',
    content:
      'Cool winter nights followed by foggy mornings create high risk for potato late blight and wheat rust. Keep spacing airy, schedule irrigation during sunny midday windows rather than late evenings, and monitor lower leaves closely after cold overcast spells.',
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureReferenceDataSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        // 1. Seed disease library if empty
        const [{ value: libCount }] = await db
          .select({ value: count() })
          .from(diseaseLibrary);
        if (libCount === 0) {
          await db.insert(diseaseLibrary).values(VERIFIED_DISEASE_LIBRARY);
        }

        // 2. Seed farming tips if empty
        const [{ value: tipCount }] = await db
          .select({ value: count() })
          .from(farmingTips);
        if (tipCount === 0) {
          await db.insert(farmingTips).values(VERIFIED_FARMING_TIPS);
        }

        // 3. Seed default admin account if missing
        const adminEmail = 'admin@agricare.ai';
        const existingAdmin = await db
          .select()
          .from(admins)
          .where(eq(admins.email, adminEmail))
          .limit(1);

        if (existingAdmin.length === 0) {
          const passwordHash = await bcrypt.hash('Admin@123', 10);
          const [adminUser] = await db
            .insert(users)
            .values({
              uid: 'admin_default_agricare',
              fullName: 'AgriCare Administrator',
              email: adminEmail,
              mobileNumber: '+91 9800000001',
              passwordHash,
              state: 'Karnataka',
              district: 'Bengaluru',
              preferredLanguage: 'en',
              role: 'admin',
            })
            .onConflictDoUpdate({
              target: users.email,
              set: { role: 'admin', passwordHash },
            })
            .returning();

          await db
            .insert(admins)
            .values({
              userId: adminUser.id,
              email: adminEmail,
              fullName: 'AgriCare Administrator',
              passwordHash,
              permissions: 'full',
            })
            .onConflictDoNothing();
        }
      } catch (err) {
        // Reset promise so subsequent request can retry if DB was momentarily cold
        seedPromise = null;
        console.error('Reference data seeding error:', err);
        throw new Error('Failed to initialize reference agricultural data.', { cause: err });
      }
    })();
  }
  return seedPromise;
}
