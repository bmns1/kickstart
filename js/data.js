// ============================================================
// SVA Kickstart — static content (supply lists, uniform, bands)
// Source: 2026-2027 Student Supplies List & Uniform Policy
// ============================================================

// Map a roster grade value → supply band
function gradeBand(grade) {
  const g = String(grade).trim().toLowerCase();
  if (g === 'prek' || g === 'pre-k' || g === 'pk' || g === 'tk') return 'prek';
  if (g === 'k' || g === 'kg' || g === '0' || g === '1') return 'kg1';
  if (g === '2' || g === '3') return 'g23';
  if (g === '4' || g === '5') return 'g45';
  return 'ms'; // 6-8
}

function gradeLabel(grade) {
  const g = String(grade).trim().toLowerCase();
  if (g === 'prek' || g === 'pre-k' || g === 'pk') return 'PreK';
  if (g === 'k' || g === 'kg') return 'Kindergarten';
  const n = parseInt(g, 10);
  if (!isNaN(n)) return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th') + ' Grade';
  return grade;
}

function isPreK(grade) { return gradeBand(grade) === 'prek'; }
function isK8(grade) { return !isPreK(grade); }

const SUPPLY_LISTS = {
  prek: {
    label: 'PreK Supplies List',
    groups: [
      { title: '👕 Change of clothes (in case of an accident)', items: [
        { name: 'Pants' }, { name: 'Shirt' }, { name: 'Underwear' }, { name: 'Socks' }, { name: 'Shoes' },
      ]},
      { title: '😴 Nap time', items: [
        { name: 'Small pillow' }, { name: 'Sheet' }, { name: 'Blanket' },
      ]},
      { title: '🍎 Lunch', items: [
        { name: 'Daily lunch' }, { name: 'Water bottle' },
      ]},
    ],
  },
  kg1: {
    label: 'KG / 1st Grade Supplies List',
    groups: [{ title: '🛒 Purchase & bring to school', items: [
      { name: 'Pencil pouch for 3-ring binder (no pencil boxes please)', qty: '1' },
      { name: '12-ct box of No. 2 pencils (pre-sharpened preferred)', qty: '2' },
      { name: 'Erasers (pink only)', qty: '4' },
      { name: 'Glue sticks', qty: '8' },
      { name: 'Scotch tape', qty: '2 rolls' },
      { name: '12-ct Crayola colored pencils', qty: '2' },
      { name: '12-ct Crayola crayons', qty: '4' },
      { name: '12-ct thin Crayola markers', qty: '2' },
      { name: 'Plastic/poly blue folder with prongs', qty: '1' },
      { name: 'Plastic/poly green folder with prongs', qty: '1' },
      { name: 'Plastic/poly yellow folder with prongs', qty: '1' },
      { name: '1½-inch binder with outer clear pocket and inner pockets', qty: '1' },
      { name: '2-pocket plastic/poly purple folder with 3 holes', qty: '1' },
      { name: 'Mead Primary Composition Notebook (full page, no blank part), wide-ruled, Grades K-2', qty: '2' },
      { name: 'Mead Primary Composition Notebook (top half blank), wide-ruled dotted, Grades K-2', qty: '2' },
      { name: 'Paper towel roll', qty: '1' },
      { name: 'Tissue boxes', qty: '4' },
      { name: 'Unscented baby wipes', qty: '1 pack' },
    ]}],
  },
  g23: {
    label: '2nd / 3rd Grade Supplies List',
    groups: [{ title: '🛒 Purchase & bring to school', items: [
      { name: 'Pencil box (labeled with student name)', qty: '1' },
      { name: 'No. 2 pencils (Ticonderoga)', qty: '24' },
      { name: 'Small pencil sharpener', qty: '2' },
      { name: 'Highlighters', qty: '3' },
      { name: 'Erasers', qty: '2' },
      { name: 'Glue sticks', qty: '4' },
      { name: 'Safety scissors', qty: '1' },
      { name: 'Wooden ruler', qty: '1' },
      { name: 'Pack of Crayola colored pencils', qty: '1' },
      { name: 'Pack of Crayola crayons', qty: '1' },
      { name: 'Pack of thin Crayola colored markers', qty: '1' },
      { name: 'Crayola watercolor with brush set (8-color)', qty: '1' },
      { name: 'Pentel Arts oil pastels, 12 or 16 color set', qty: '1' },
      { name: '1-inch binder with pockets (Arabic & Quran)', qty: '1' },
      { name: 'Wide-ruled composition notebooks, labeled with student name (NO spiral notebooks!)', qty: '3' },
      { name: 'Green notebook (Arabic)', qty: '1' },
      { name: 'Plastic/poly green folder with prongs (Unit)', qty: '1' },
      { name: 'Plastic/poly red folder with prongs (Language Arts)', qty: '1' },
      { name: 'Plastic/poly purple folder with prongs (Homework)', qty: '1' },
      { name: 'Plastic/poly blue folder with prongs (Islamic Studies)', qty: '1' },
      { name: 'Box of tissues (no lotion)', qty: '1' },
      { name: 'Lysol wipes', qty: '1 only' },
      { name: 'Hand sanitizer', qty: '1 bottle' },
    ]}],
  },
  g45: {
    label: '4th / 5th Grade Supplies List',
    note: "Please label the folders, pencil box, and notebooks with your child's name. Other supplies do not need to be labeled.",
    groups: [{ title: '🛒 Purchase & bring to school', items: [
      { name: 'Pencil box/case', qty: '1' },
      { name: 'No. 2 pencils', qty: '48' },
      { name: 'Small pencil sharpener', qty: '1' },
      { name: 'Highlighters (different colors)', qty: '3' },
      { name: 'Erasable blue or black pens', qty: '3' },
      { name: 'Erasers', qty: '3' },
      { name: 'Glue sticks', qty: '3' },
      { name: 'Safety scissors', qty: '1' },
      { name: 'Pack of Crayola colored pencils', qty: '1' },
      { name: 'Pack of Crayola thin markers', qty: '1' },
      { name: 'Pack of wide-ruled lined paper', qty: '1' },
      { name: 'Spiral notebooks (labeled with student name)', qty: '10' },
      { name: "Hardcover composition book (Writer's Notebook)", qty: '3' },
      { name: '1-inch binder with pockets (Arabic & Quran)', qty: '1' },
      { name: 'Green notebook (Arabic)', qty: '1' },
      { name: 'Pack of 25 sheet protectors', qty: '1' },
      { name: 'Pack of index cards', qty: '1' },
      { name: 'Plastic/poly yellow folder with prongs (Math)', qty: '1' },
      { name: 'Plastic/poly purple folder with prongs (Reading Workshop)', qty: '1' },
      { name: "Plastic/poly red folder with prongs (Writer's Workshop)", qty: '1' },
      { name: 'Plastic/poly black folder with prongs (SS/NGS Unit)', qty: '1' },
      { name: 'Plastic/poly blue folder with prongs (Islamic Studies)', qty: '1' },
      { name: 'Plastic/poly orange folder with prongs (Art)', qty: '1' },
      { name: 'Plastic/poly green folder with prongs (Cursive)', qty: '1' },
      { name: 'Protractor', qty: '1' },
      { name: 'Compass', qty: '1' },
      { name: 'Ruler (no flexible rulers)', qty: '1' },
      { name: 'Pack of various sized post-it notes', qty: '1' },
      { name: 'Box of tissues (no lotion)', qty: '4' },
      { name: 'Clorox/Lysol wipes', qty: '1' },
    ]}],
  },
  ms: {
    label: 'Middle School (6th–8th) Supplies List',
    groups: [{ title: '🛒 Purchase & bring to school', items: [
      { name: 'Pencil box (labeled with student name)', qty: '1' },
      { name: 'Mechanical pencils w/ lead refills (5-8) OR No. 2 pencils (24)', qty: '' },
      { name: 'Highlighters', qty: '6' },
      { name: 'Erasable blue pens', qty: '3' },
      { name: 'Erasers', qty: '3' },
      { name: 'Glue sticks', qty: '4' },
      { name: 'White glue bottle', qty: '1' },
      { name: 'Small safety scissors', qty: '1' },
      { name: 'Ruler (preferably 6-inch to fit in pencil box, no flexible rulers)', qty: '1' },
      { name: 'Pack of Crayola colored pencils', qty: '1' },
      { name: 'Pack of thin Crayola markers', qty: '1' },
      { name: 'Pack of lined paper', qty: '2' },
      { name: '1-inch binder with interior pockets (Arabic & Quran)', qty: '1' },
      { name: '1-inch binder (English)', qty: '1' },
      { name: 'Binder dividers w/ tabs, pack of 5', qty: '1' },
      { name: 'Plastic/poly blue folder with prongs (Islamic Studies)', qty: '1' },
      { name: 'Plastic/poly red folder with prongs (English)', qty: '1' },
      { name: 'Plastic/poly green folder with prongs (Science)', qty: '1' },
      { name: 'Plastic/poly orange folder with prongs (History)', qty: '1' },
      { name: 'Plastic/poly purple folder with prongs (Art/Makerspace)', qty: '1' },
      { name: 'Plastic/poly yellow folder with prongs (Math)', qty: '1' },
      { name: 'Red spiral notebook (English)', qty: '2' },
      { name: 'Orange spiral notebook (History)', qty: '1' },
      { name: 'Yellow spiral notebooks (Math)', qty: '3' },
      { name: 'Blue spiral notebooks (Math)', qty: '6' },
      { name: 'Black notebook (Arabic)', qty: '1' },
      { name: '8.5" × 11" spiral-bound sketchbook, 50+ pages (returning students may reuse last year\'s)', qty: '1' },
      { name: 'Basic sketch & drawing pencil set (sketch pencils, charcoal, sticks, sharpener, blender & erasers)', qty: '1' },
      { name: 'Protractor and compass (M76, M87, Algebra 2 students only)', qty: '1' },
      { name: 'Box of tissues (no lotion)', qty: '6' },
      { name: 'Clorox/Lysol wipes', qty: '1' },
    ]}],
  },
};

const UNIFORM = {
  elementary: {
    title: 'Elementary (KG–5th) Uniform',
    intro: 'All elementary students, KG–5th, need to come to school in uniform starting the first day of school.',
    sections: [
      { title: 'Boys', items: [
        'Navy blue pants (no jeans)',
        'Plain short/long sleeve dark green, heather gray, or white collared shirt (no t-shirts)',
        'Closed-toe shoes proper for PE',
      ]},
      { title: 'Girls — Option 1', items: [
        "'Belair' plaid jumper dress or skirt",
        'Navy blue leggings or pants (no jeans)',
        'Plain short/long sleeve dark green, heather gray, or white collared shirt (no t-shirts)',
        'Closed-toe shoes proper for PE',
        'A scarf for daily Dhuhr prayer, starting in 2nd grade',
      ]},
      { title: 'Girls — Option 2', items: [
        'Navy blue pants (no jeans)',
        'Plain short/long sleeve dark green, heather gray, or white collared shirt (no t-shirts)',
        'Closed-toe shoes proper for PE',
        'A scarf for daily Dhuhr prayer, starting in 2nd grade',
      ]},
    ],
  },
  middle: {
    title: 'Middle School (6th–8th) Guidelines',
    intro: "All middle school students need to come to school dressed per SVA's middle school guidelines, starting the first day of school.",
    sections: [
      { title: 'Boys', items: [
        'Respectful clothing according to Sunnah guidelines',
        'No tight-fitting or transparent pants or shirts',
        'No inappropriate images or logos',
        'Pants worn at the waist, no baggy pants',
        'Closed-toe shoes proper for PE',
      ]},
      { title: 'Girls', items: [
        'Respectful clothing according to Sunnah guidelines',
        'Clothing never transparent or tight-fitting',
        'Long sleeve shirts',
        'No inappropriate images or logos',
        'Loose pants or long skirts with no revealing slits',
        'A scarf is strongly recommended to be worn',
        'All girls must have a scarf with them for daily prayer',
        'Closed-toe shoes proper for PE',
      ]},
    ],
  },
};

// WhatsApp link key for a grade
function whatsappKey(grade) {
  const g = String(grade).trim().toLowerCase();
  if (isPreK(grade)) return 'whatsapp_prek';
  if (g === 'k' || g === 'kg') return 'whatsapp_k';
  return 'whatsapp_' + parseInt(g, 10);
}
