// The crew — reused brand content. `img` resolves under public/images/crew/ when added;
// until then a gold-monogram frame (initials) is shown.
export interface Crew {
  name: string;
  role: string;
  initials: string;
  slug: string;
  bio: string;
}

export const crew: Crew[] = [
  {
    name: 'Cpt. Old Salt', role: 'Creator · Executive Producer', initials: 'OS', slug: 'old-salt',
    bio: 'The heart and original creator of Aye Maties. A highly experienced USCG 500-Ton Captain, he brings authentic maritime expertise, leadership and the true spirit of adventure — the visionary who first set the course and continues to guide the journey from idea to reality.',
  },
  {
    name: 'Pia Alice Sekulic', role: 'Head of Marketing', initials: 'PS', slug: 'pia-sekulic',
    bio: 'Pia leads the marketing of Aye Maties with strategy, creativity and a deep understanding of audience behaviour. With a background in Neuromarketing and Business Psychology from Vienna, she turns stories into meaningful connections and carries the mission far beyond the horizon.',
  },
  {
    name: 'Dino Stelzl', role: 'Film Director · Producer', initials: 'DS', slug: 'dino-stelzl',
    bio: 'The film director and producer behind the cinematic world of Aye Maties. With years in television and visual storytelling, he transforms the adventurous vision into powerful images — combining classic filmmaking with modern creative technology.',
  },
  {
    name: 'Anita “Niddl” Stelzl', role: 'Presenter · Singer · Sea Soul', initials: 'AN', slug: 'niddl-stelzl',
    bio: 'The multi-faceted ‘Niddl’ joins as a powerful singer, charismatic presenter and true soul of the sea. Known from her success on Starmania, she brings unique energy and voice — a passionate advocate for the ocean.',
  },
  {
    name: 'Natascha Zenig', role: 'Makeup · SFX · Body Painter', initials: 'NZ', slug: 'natascha-zenig',
    bio: 'Natascha brings the characters of Aye Maties to life through makeup, special effects and body art. Based between Vienna, Los Angeles and Cancún, she blends professional artistry with a passion for expressive Dark Art.',
  },
  {
    name: 'Silas Pross', role: 'Director of Photography · CGI', initials: 'SP', slug: 'silas-pross',
    bio: 'Silas shapes the visual world through cinematography, camera work and digital creativity. As DP he captures the cinematic atmosphere, while his CGI expertise extends the world beyond the camera.',
  },
  {
    name: 'Michael Schumpelt', role: 'Cameraman · Visual AI Expert', initials: 'MS', slug: 'michael-schumpelt',
    bio: 'Michael combines cinematography with the creative possibilities of AI — capturing authentic moments while developing innovative imagery and visual concepts that expand the cinematic world of Aye Maties.',
  },
  {
    name: 'Michael Lehner', role: 'Set Photographer', initials: 'ML', slug: 'michael-lehner',
    bio: 'Michael documents the atmosphere, characters and unforgettable moments behind the adventure — creating powerful stills that preserve the spirit of the production for storytelling and lasting memories.',
  },
  {
    name: 'Matthias Hauser', role: 'Set Hand · First Assistant · Driver', initials: 'MH', slug: 'matthias-hauser',
    bio: 'A reliable, versatile member of the production crew. As Set Hand, First Assistant and Driver, Matthias keeps the adventure moving — on set and on the road — with commitment, flexibility and positive energy.',
  },
  {
    name: 'Koray Schober', role: 'Second Assistant · Driver', initials: 'KS', slug: 'koray-schober',
    bio: 'Koray supports the production as Second Assistant and Driver — ensuring people, equipment and essentials are in the right place at the right time, keeping the voyage organised and moving forward.',
  },
];
