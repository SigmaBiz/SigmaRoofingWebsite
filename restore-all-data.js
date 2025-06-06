// Complete data restoration script
console.log('=== RESTORING ALL WEBSITE DATA ===\n');

// 1. Restore all images
console.log('1. RESTORING IMAGES...');
const imageData = {
  "heroBackground": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748734928/sigma-roofing/projects/ojrrai753uqfnzlknbv1.jpg",
  "residentialRoofingImage": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379460/sigma-roofing/projects/afuczeaaeow6y7iwexzx.jpg",
  "roofRepairImage": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748388891/sigma-roofing/projects/uryhdz9sdu9tahumtjgx.jpg",
  "roofInspectionImage": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379453/sigma-roofing/projects/fhxuxcy7qc5falugqjxu.jpg",
  "gutterServiceImage": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748388893/sigma-roofing/projects/nwdrsyjnsxmyml4vteof.jpg",
  "stormDamageImage": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379454/sigma-roofing/projects/tjthdiocyevopn6lpl6i.jpg",
  "paintingServiceImage": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748388890/sigma-roofing/projects/fqmpnsw0yuib7p44vzjt.jpg",
  "teamPhoto": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748389526/sigma-roofing/projects/rfwxm4ysfg1nsi9yumde.jpg",
  "visionImage": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748379461/sigma-roofing/projects/cc9tl1zez7eibeog2uvt.png",
  "stormReportBackground": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748734928/sigma-roofing/projects/ojrrai753uqfnzlknbv1.jpg"
};

Object.entries(imageData).forEach(([key, value]) => {
  localStorage.setItem(key, value);
  console.log(`✓ Set ${key}`);
});

// 2. Restore projects
console.log('\n2. RESTORING PROJECTS...');
const projects = [
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372972/sigma-roofing/projects/gkfyybvob6ew3fqavaaz.jpg",
    "title": "GAF® Pewter Gray Laminate Roof w/ High Profile Z Ridge",
    "description": "This beautiful new roof features rich charcoal gray shingles that perfectly complement the home's stone and wood exterior details. The clean installation and classic color choice create a timeless look that enhances the overall curb appeal of this home.",
    "category": "Residential",
    "location": "NW Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372969/sigma-roofing/projects/nxwhjnvbnbmp1wfx1s1v.jpg",
    "title": "GAF® Charcoal Laminate Roof w/ High Profile Z Ridge",
    "description": "This new charcoal roof installation delivers a bold, sophisticated appearance with precise shingle alignment and expert flashing work. The deep gray tones create a striking contrast against the lighter elements, giving this home a fresh, classic look.",
    "category": "Storm Damage",
    "location": "South Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372967/sigma-roofing/projects/vzmkyoilfhychhxwluin.jpg",
    "title": "CertainTeed® Colonial Slate w/ Ridge Vent",
    "description": "This Colonial Slate shingle roof replacement features beautiful multi-toned gray shingles that create an elegant weathered slate appearance. The varied gray tones and textured pattern give this home a distinguished, upscale look while providing long-lasting protection.",
    "category": "Residential",
    "location": "South Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371608/sigma-roofing/projects/c9ip8kujkvrzpkfry2ah.jpg",
    "title": "GAF® Charcoal Laminate Roof w/ Redeck",
    "description": "This stunning brick home received a complete roof replacement including new decking and classic charcoal shingles that beautifully complement the red brick exterior. The timeless charcoal color creates a perfect contrast against the warm brick tones, transforming the home's entire aesthetic.",
    "category": "Storm Damage",
    "location": "SW Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371606/sigma-roofing/projects/md8oh6pqosm188ihtcqx.jpg",
    "title": "GAF ArmorShield™ II WeatheredWood Impact Resistant System",
    "description": "This home features a new hail impact resistant roofing system with beautiful Weatherwood shingles that provide both superior storm protection and classic appeal. The natural weathered wood tones create a timeless look that blends seamlessly with any neighborhood while offering peace of mind against severe weather damage.",
    "category": "Storm Damage",
    "location": "Edmond"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371609/sigma-roofing/projects/jwx9k6khrtfg0zjgemxv.jpg",
    "title": "GAF® Charcoal Laminate Roof w/ High Profile Ridge",
    "description": "This charcoal roof installation showcases professional craftsmanship with sleek valley metal and high-profile ridge cap detailing that adds both function and visual appeal. The classic charcoal shingles paired with the premium finishing touches create a sophisticated look that stands out in the neighborhood.",
    "category": "Residential",
    "location": "The Village"
  }
];

localStorage.setItem('adminProjects', JSON.stringify(projects));
console.log(`✓ Saved ${projects.length} projects`);

// 3. Save through API
console.log('\n3. SYNCING TO API...');
Promise.all([
  // Save images
  fetch('/api/website-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(imageData)
  }),
  // Save projects
  fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects })
  })
]).then(responses => {
  const allOk = responses.every(r => r.ok);
  if (allOk) {
    console.log('✓ All data synced to API');
  } else {
    console.log('⚠️ Some API calls failed, but localStorage is updated');
  }
  
  console.log('\n✅ ALL DATA RESTORED!');
  console.log('Refreshing page in 2 seconds...');
  setTimeout(() => location.reload(), 2000);
}).catch(error => {
  console.log('⚠️ API sync failed:', error.message);
  console.log('✓ But localStorage is updated');
  console.log('\n✅ Data restored locally!');
  console.log('Refreshing page in 2 seconds...');
  setTimeout(() => location.reload(), 2000);
});