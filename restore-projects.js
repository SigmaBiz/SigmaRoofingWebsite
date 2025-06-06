// Restore projects from the earlier debug data
const projects = [
  {
    id: 1,
    title: "GAF Timberline HDZ Pewter Gray",
    description: "The GAF Timberline HDZ pewter gray shingles look great with this home's brick veneer - the cool gray really makes those warm brick tones stand out in the best way. It's one of those color combos that just works, giving the house a clean, updated look that'll stay sharp for years to come. Sometimes the right shingle choice makes all the difference in how a home feels from the curb.",
    imageUrl: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372972/sigma-roofing/projects/gkfyybvob6ew3fqavaaz.jpg",
    category: "Storm Damage",
    location: "NW Oklahoma City"
  },
  {
    id: 2,
    title: "GAF Timberline HDZ Charcoal",
    description: "The GAF Timberline HDZ charcoal shingles create a perfect transition to this home's metal carport extension - the dark charcoal color flows seamlessly from the main roof to the metal addition, keeping everything looking coordinated and intentional. It's smart design when your carport doesn't look like an afterthought, and these charcoal shingles tie it all together beautifully. You get the protection and style of quality shingles on the house with a metal extension that actually complements rather than clashes.",
    imageUrl: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372969/sigma-roofing/projects/nxwhjnvbnbmp1wfx1s1v.jpg",
    category: "Residential",
    location: "S Oklahoma City"
  },
  {
    id: 3,
    title: "GAF ArmorShield II Weathered Wood",
    description: "The GAF ArmorShield 2 Class 4 shingles give this home the ultimate protection against hail damage - these bad boys are literally designed to take a beating and keep on protecting. With Class 4 impact resistance, they're the toughest shingles you can get, which means fewer worries during storm season and potential insurance savings too. It's peace of mind you can see from the curb, knowing your roof is built to handle whatever Mother Nature throws at it.",
    imageUrl: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372968/sigma-roofing/projects/gziqtquyapwsunfesojn.jpg",
    category: "Storm Damage",
    location: "NW Oklahoma City"
  },
  {
    id: 4,
    title: "Certainteed Landmark Colonial Slate",
    description: "The Certainteed Landmark Colonial Slate shingles work beautifully with this home's ridge ventilation system - the varied gray tones in the shingles blend seamlessly with the ridge vents, making them practically disappear into the roofline. It's smart when your ventilation doesn't stick out like a sore thumb, and these slate-colored shingles do exactly that while keeping the roof looking clean and uniform. You get all the benefits of proper ventilation without sacrificing the sleek appearance of your roofline.",
    imageUrl: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372967/sigma-roofing/projects/vzmkyoilfhychhxwluin.jpg",
    category: "Residential",
    location: "S Oklahoma City"
  },
  {
    id: 5,
    title: "GAF Timberline HDZ Charcoal",
    description: "The GAF Timberline HDZ charcoal shingles are a perfect match for this home's rich red brick veneer - the deep, dark gray creates a striking contrast that really makes those warm brick tones pop. It's a classic combo that gives the house a solid, grounded look while keeping things modern and clean. You can't go wrong with charcoal and red brick - it's one of those pairings that just makes a home look put-together from day one.",
    imageUrl: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371608/sigma-roofing/projects/c9ip8kujkvrzpkfry2ah.jpg",
    category: "Residential",
    location: "Oklahoma City"
  },
  {
    id: 6,
    title: "GAF Armorshield II Weathered Wood",
    description: "Once again the classic Weathered Wood Class 4 shingle perfectly compliments the light brick veneer of this Edmond home with an elegant armor against the elements while keeping the overall curb appeal of the home intact. The Class 4 system includes impact resistant hip and ridge cap shingles.",
    imageUrl: "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371606/sigma-roofing/projects/md8oh6pqosm188ihtcqx.jpg",
    category: "Residential",
    location: "Edmond"
  }
];

// Paste this in your browser console on the admin page
localStorage.setItem('adminProjects', JSON.stringify(projects));

// Also save through API if available
fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projects })
}).then(r => r.json()).then(console.log);

console.log('Projects restored! Refresh the page to see them.');