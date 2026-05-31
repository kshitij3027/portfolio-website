const fs = require('fs');
const html = fs.readFileSync('./index.html', 'utf8');

// Find the template script tag
const templateMatch = html.match(/<script type="__bundler\/template">\n"(.+)"\n  <\/script>/s);
if (templateMatch) {
  // Parse the JSON string and decode it
  const templateJson = '"' + templateMatch[1] + '"';
  const decoded = JSON.parse(templateJson);
  
  // Find LinkedIn and Email patterns
  console.log('[v0] Looking for LinkedIn and Email links...');
  
  const linkedinMatch = decoded.match(/href="[^"]*"[^>]*>LinkedIn/gi);
  const emailMatch = decoded.match(/href="[^"]*"[^>]*>Email/gi);
  
  console.log('[v0] LinkedIn patterns:', linkedinMatch);
  console.log('[v0] Email patterns:', emailMatch);
  
  // Also search for cta class around LinkedIn
  const ctaLinkedin = decoded.match(/.{100}LinkedIn.{50}/gi);
  console.log('[v0] Context around LinkedIn:', ctaLinkedin);
  
  const ctaEmail = decoded.match(/.{100}Email.{50}/gi);
  console.log('[v0] Context around Email:', ctaEmail);
}
