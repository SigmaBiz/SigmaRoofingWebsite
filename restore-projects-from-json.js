// Restore projects from your JSON export file
const projects = [
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372972/sigma-roofing/projects/gkfyybvob6ew3fqavaaz.jpg",
    "title": "GAF Pewter Gray Laminate Roof w/ High Profile Z Ridge",
    "description": "This beautiful new roof features rich charcoal gray shingles that perfectly complement the home's stone and wood exterior details. The clean installation and classic color choice create a timeless look that enhances the overall curb appeal of this home.",
    "category": "Residential",
    "location": "NW Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372969/sigma-roofing/projects/nxwhjnvbnbmp1wfx1s1v.jpg",
    "title": "GAF Charcoal Laminate Roof w/ High Profile Z Ridge",
    "description": "This new charcoal roof installation delivers a bold, sophisticated appearance with precise shingle alignment and expert flashing work. The deep gray tones create a striking contrast against the lighter elements, giving this home a fresh, classic look.",
    "category": "Storm Damage",
    "location": "South Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748372967/sigma-roofing/projects/vzmkyoilfhychhxwluin.jpg",
    "title": "Certainteed Colonial Slate w/ Ridge Vent",
    "description": "This Colonial Slate shingle roof replacement features beautiful multi-toned gray shingles that create an elegant weathered slate appearance. The varied gray tones and textured pattern give this home a distinguished, upscale look while providing long-lasting protection.",
    "category": "Residential",
    "location": "South Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371608/sigma-roofing/projects/c9ip8kujkvrzpkfry2ah.jpg",
    "title": "GAF Charcoal Laminate Roof w/ Redeck",
    "description": "This stunning brick home received a complete roof replacement including new decking and classic charcoal shingles that beautifully complement the red brick exterior. The timeless charcoal color creates a perfect contrast against the warm brick tones, transforming the home's entire aesthetic.",
    "category": "Storm Damage",
    "location": "SW Oklahoma City"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371606/sigma-roofing/projects/md8oh6pqosm188ihtcqx.jpg",
    "title": "GAF ArmorShield II WeatheredWood Impact Resistant System",
    "description": "This home features a new hail impact resistant roofing system with beautiful Weatherwood shingles that provide both superior storm protection and classic appeal. The natural weathered wood tones create a timeless look that blends seamlessly with any neighborhood while offering peace of mind against severe weather damage.",
    "category": "Storm Damage",
    "location": "Edmond"
  },
  {
    "image": "https://res.cloudinary.com/dkcmw0iji/image/upload/v1748371609/sigma-roofing/projects/jwx9k6khrtfg0zjgemxv.jpg",
    "title": "GAF Charcoal Laminate Roof w/ High Profile Ridge",
    "description": "This charcoal roof installation showcases professional craftsmanship with sleek valley metal and high-profile ridge cap detailing that adds both function and visual appeal. The classic charcoal shingles paired with the premium finishing touches create a sophisticated look that stands out in the neighborhood.",
    "category": "Residential",
    "location": "The Village"
  }
];

// Save to localStorage
console.log('=== RESTORING PROJECTS ===');
localStorage.setItem('adminProjects', JSON.stringify(projects));
console.log(`✓ Saved ${projects.length} projects to localStorage`);

// Also save through API if available
fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projects })
}).then(response => {
  if (response.ok) {
    console.log('✓ Projects saved to API');
  } else {
    console.log('⚠️ API save failed, but localStorage updated');
  }
}).catch(error => {
  console.log('⚠️ API error:', error.message);
});

// Run trademark compliance
console.log('\n=== APPLYING TRADEMARK COMPLIANCE ===');
const updatedProjects = projects.map(project => {
  // Apply trademark rules
  let title = project.title;
  let description = project.description;
  
  // Title replacements
  title = title.replace(/GAF(?!®)/g, 'GAF®');
  title = title.replace(/Certainteed/gi, 'CertainTeed');
  title = title.replace(/CertainTeed(?!®)/g, 'CertainTeed®');
  
  // Description replacements
  description = description.replace(/GAF(?!®)/g, 'GAF®');
  
  return { ...project, title, description };
});

// Save the trademark-compliant version
localStorage.setItem('adminProjects', JSON.stringify(updatedProjects));

console.log('\n✅ Projects restored with trademark compliance!');
console.log('Refresh the page to see them in the Projects section.');