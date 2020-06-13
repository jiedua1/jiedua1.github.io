/* Contains basic helper functions for fancy animations
   Like particle system and wavy tentacle thingies
   dependencies: p5.js
*/

function createExplosion(x, y, particles, gravity = 30, max_vel = 20) {
    let max_particles = max_vel / 3; // scales to force of explosion...
    let max_size = 60;
    let prob = 0.5;
    for (let i = 0; i < max_particles; i++) {
        if (Math.random() < prob) {
            let part = new Particle(x, y, max_size * Math.random());
            part.setGravity(gravity).randomVelocity(max_vel);
            particles.push(part);
        }
    }
    
}

class Particle {
    constructor(x, y, size) {
        this.color = color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
        this.x = x;
        this.y = y;
        this.lifespan = random(30, 80); // Frames
        this.frmult = 1/60
        this.size = size;
        this.gravity = 0;
    }

    setGravity(dy) {
        this.gravity = dy; 
        return this;
    }

    setVelocity(dx, dy) {
        this.dx = dx;
        this.dy = dy;
        return this;
    }

    randomVelocity(n) {
        this.dx = random(-n, n);
        this.dy = random(-n, n);
        return this;
    }
    
    draw() {
        push();
        this.color.setAlpha(map(this.lifespan, 0, 80, 0, 255));
        fill(this.color);
        ellipse(this.x, this.y, this.size, this.size);
        pop();
        this.lifespan -= 1;
        this.x += this.dx;
        this.y += this.dy;
        this.dy += this.gravity * this.frmult;
    }
}

/* Draws particles; destroys ones that should be dead */
function drawParticles(particles) {
    for(let i = 0; i < particles.length; i++) {
        particles[i].draw();
        // Remove dead particles
        if (particles[i].lifespan < 0) {
            particles.splice(i, 1);
            i -= 1;
        }
    }
}

/*
    Algorithmicly generated mYOUsic:

    A first name says so much about a person and can be a reflection of their
    whole personality; just mentioned a person's first name can bring up so many
    aspects of their personality and positive/negative emotions; the melody 
    and some parts of the rhythm will be determined by the first name

    Last name signifies a person's heritage. The baseline of the piece which 
    serves as the harmony and gives it a distinctive underlying flavor is
    determined by the last name.

    Age parameter:
    Age will determine tempo of piece according to a piecewise linear interpolation between
    the points (0, 80), (20, 160), (80, 60); this is to roughly match your general 
    energy levels :) 

    The bio of a person describes extra elements of their personality and serve
    as additions to the harmony and ornamental features; they're the cherry on 
    top
    
    If you don't put an age, we'll just guess you have 12 year old energy levels.

    Volume:
    will be scaled slightly louder for older people to compensate for hearing loss!

    And of course, the mYOUsic would not be complete without YOU. We can't force
    you to participate though or guarantee that you have a webcam; you might just be a robot

    Music algo is pretty basic right now; probably going to add more in the future after
    this class is over; this project is pretty fun.
*/

const major = [0, 2, 4, 5, 7 , 9, 11, 12]
const minor = [0, 2, 3, 5, 7, 8, 10, 12]
const pentatonic = [0, 2, 4, 7, 9]

const A4 = 440 // Start on A major
const rel_shifts = [0, 5, 7, 9] // gold old simple pop I-IV-V-VI chords :)

const base_arpeg = [0, 4, 7, 12] // Basic arpeggio that will build all of the music!
const OCTAVE = 12
var global_vol = 0 // Decibel adjustment for age!

base_shift = 0; // Can go either an octave lower or higher, so -12 to +12
rel_shift = 0; // current relative shift

var arpeg = base_arpeg;
var f_id = 0; // index in first name
var l_id = 0; // index in last name

var fname = " ";
var lname = " ";

// To invert arpeggio, do arpeggio.reverse() since it's just a list.

// These functions assume arpeggio is 4 notes long. we can keep composing arpeggios and subarpeggios??
// Right now there will be very minimal rhythmic complexity; just arpeggios

// frequency of base note offsetted by a given amount. Equal temperament
function freq(base, offset) {
    return base * 2 ** (offset/12)
}

function swapFront(arpeggio) {
    let temp = arpeggio[0];
    arpeggio[0] = arpeggio[1];
    arpeggio[1] = temp;
}

function swapBack(arpeggio) {
    let temp = arpeggio[arpeggio.length-1];
    arpeggio[arpeggio.length-1] = arpeggio[arpeggio.length-2];
    arpeggio[arpeggio.length-2] = temp;
}

function swapMid(arpeggio) {
    let temp = arpeggio[1]
    arpeggio[1] = arpeggio[2];
    arpeggio[2] = temp;
}

function sanitize_age(age, def_age = 12) {
    age = parseInt(age);
    if (isNaN(age)) {
        return def_age;
    } else {
        MAX_AGE = 100
        return constrain(age, 0, MAX_AGE);
    }
}

function startMusic() {
    // Stop previous music if playing. Glitchy; should probably refresh page for now
    Tone.Transport.cancel(0);

    bio = document.querySelector('textarea').value;
    // Say the whole bio once in a DEEP voice
    var voices = window.speechSynthesis.getVoices();
    var voice = voices[random(0, voices.length-1)];

    msg = new SpeechSynthesisUtterance(bio);
    msg.pitch = 1.5;
    msg.rate = 0.7;
    msg.voice = voice;
    msg.volume = 1;

    window.speechSynthesis.speak(msg);
    
    // Input: raw age string; output, number
    fname = document.querySelector('#fname').value;
    lname = document.querySelector('#lname').value;
    age = sanitize_age(document.querySelector('#age').value);

    words = bio.split(" ");

    console.log(calcBPM(age));
    Tone.Transport.bpm.value = calcBPM(age);

    // Global volume adjustment! add this to synths
    // TODO: Debug. Global volume adjustment doesn't seem to be working..
    global_vol = map(age, 0, 100, -15, 5);
    Tone.Master.volume = global_vol;

    console.log(global_vol);

    random_word_loop(words);
    /* TODO: modulo character codes of the letters by some prime number or whatever number
     * that will correspond to different chord progressions and/or shifts between chord progressions!
     * for the last name
     * 
     */

    // Loops a 4/4 measure where the base note moves based on lastname
    // and arpeggios swap based on firstname cycling.
    // base note change is random! so there is a random element to this, but
    // the core melody and harmony should stay the same for a given name scheme

    // Default music generated if user is stupid and doesn't prove fname/lname...
    // Avoids indexing issues and punishes user for giving no input
    if (fname.length == 0) {
        fname = ' ';
    }
    if (lname.length == 0) {
        lname = ' ';
    }

    // Tone.js is wonky... weird delay + callbacks don't work properly
    // So just using a global variable hack
    Tone.Transport.schedule(function(time){
        play_arpeggio();
        loop_measure();
    }, '0');

    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = '1m';
    Tone.Transport.start(0);
}

/* Shittyish algorithm v1; should generate *eh* and *generic* music lol

   Loops through letters of last name and first name. 

   For each letter in the first name, apply a given operation (const, swapfront, swapmid, swapback)
   based on the value mod 4 of the ascii value of the char. Cycle through the first name modulo
   f. 

   For each letter in the last name, switch to the corresponding chord mod 4. Move letters 
   every measure just like with firstnames. Every time we cycle through the last name, shift the base
   chord by +- [-3, 3] randomly, but floor base_note to [-12, 12] so it doesn't get out of hand

   Tempo and volume should be adjusted by the age parameter already.
*/

function loop_measure() {
    l_id = (l_id + 1) % lname.length;
    var synth_harmony = new Tone.PolySynth(3, Tone.Synth, {
        // additional args here for the synth
    }).toMaster();

    var reg_synth = new Tone.Synth().toMaster();

    //var synth_harmony = new Tone.Synth().toMaster();
    rel_shift = rel_shifts[lname.charCodeAt(l_id) % rel_shifts.length]
    // console.log("RELATIVE SHIFT " + rel_shift);

    // Hold whole note and then play note octave higher 
    Tone.Transport.scheduleOnce(function(time){
        // Standard major chord
        let baseNote = freq(A4, base_shift + rel_shift - OCTAVE)
        // Adjust triads based on scale note we're on... only vi is affected b/c minor triad
        let mid, hi;
        if ([0, 5, 7].includes(rel_shift)) {
            mid = freq(baseNote, 4);
            hi = freq(baseNote, 7);
        } else if ([9].includes(rel_shift)) {
            mid = freq(baseNote, 3);
            hi = freq(baseNote, 7);
        }
        // console.log(baseNote, mid, hi)
        synth_harmony.triggerAttackRelease([baseNote, mid, hi], '1n');
    }, '0');
    
    Tone.Transport.scheduleOnce(function(time){
        // Standard major chord
        let baseNote = freq(A4, base_shift + rel_shift)
        let mid = freq(baseNote, 4)
        let hi = (baseNote, 7)
        reg_synth.triggerAttackRelease(baseNote, '2n');
    }, '2n');

    // Switch keys randomly!
    if (l_id == 0) {
        base_shift += random(-7, 7);
        base_shift = constrain(base_shift, -OCTAVE, OCTAVE);
    }
}

// Arpeggio lasts a half measure; plays it twice
function play_arpeggio() {
    
    console.log("Current unadjusted arpeggio pattern: " + arpeg);
    
    let synth = new Tone.Synth().toMaster();

    // Arpeggio is different depending on what our base note is
    // the vi chord base note (9) needs slight modification to arpeggio
    var temp_arpeg;
    if ([0, 5, 7].includes(rel_shift)) {
        temp_arpeg = arpeg
    } else if ([9].includes(rel_shift)) {
        let i = arpeg.indexOf(4);
        temp_arpeg = arpeg.slice(0); // Clones the array
        temp_arpeg[i] = 3
    }
    for(let i = 0; i < 8; i++) {
        Tone.Transport.scheduleOnce(function(time){
            synth.triggerAttackRelease(freq(A4, temp_arpeg[i%4] + base_shift + rel_shift), '8t');
        }, Tone.Time('8n') * i);
    }

    f_id = (f_id + 1) % fname.length;
    if (fname.charCodeAt(f_id) % 5 == 0) {
        swapFront(arpeg);
    } else if (fname.charCodeAt(f_id) % 5 == 1) {
        swapBack(arpeg);
    } else if (fname.charCodeAt(f_id) % 5 == 2) {
        swapMid(arpeg);
    } else if (fname.charCodeAt(f_id) % 5 == 3) {
        arpeg.reverse()
    } // Otherwise do nothing
}

// Says a random word among the words in a random voice
function random_word_loop(words) {
    if (words.length > 0) {
        var voices = window.speechSynthesis.getVoices();
        var voice = voices[random(0, voices.length-1)];
        var word = words[Math.floor(Math.random() * words.length)]
        msg = new SpeechSynthesisUtterance(word);
        msg.voice = voice;
        // some variation to pitch since it's inherently random but conditioned upon
        // words in the bio!
        msg.pitch = map(base_shift, -12, 12, 0.2, 1.4) + Math.random() * 0.4; 
        msg.tempo = Tone.Transport.bpm.value / 120
        msg.volume = 1;
        window.speechSynthesis.speak(msg);
    }
    // Configure delays for random words
    low_delay = 600;
    high_delay = 3000;
    delay = random(low_delay, high_delay);
    setTimeout(() => random_word_loop(words), delay); 
}

function changeBG() {
    curBG =[Math.random() * 255, Math.random() * 255, Math.random() * 255]
    background(curBG[0], curBG[1], curBG[2], 64);
}